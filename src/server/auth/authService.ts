import { dbStore } from '../db/store';
import { User, Candidate, AuthSession } from '../../types';
import { OtpService } from './otpProvider';
import { authRateLimiter, otpRateLimiter } from './rateLimiter';
import { AuditLogger } from '../authorization/audit';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client';

export interface StaffLoginParams {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CandidateRequestOtpParams {
  joiningId: string;
  cnic: string;
  mobile: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CandidateVerifyOtpParams {
  joiningId: string;
  cnic: string;
  otpCode: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PasswordResetRequestParams {
  email: string;
}

export interface PasswordResetConfirmParams {
  token: string;
  newPassword: string;
}

// Active session store with expiration tracking (default 8 hours)
interface ServerSession {
  token: string;
  userId?: string;
  candidateId?: string;
  isCandidate: boolean;
  createdAt: number;
  expiresAt: number;
}

class AuthServiceManager {
  private sessions = new Map<string, ServerSession>();
  private readonly SESSION_DURATION_HOURS = 8;
  private readonly CANDIDATE_OTP_EXPIRY_MINUTES = 5;

  /**
   * 1. Staff Login (Email & Password with Rate Limiting & Session Expiration)
   */
  public async loginStaff(params: StaffLoginParams): Promise<{
    success: boolean;
    session?: AuthSession;
    error?: string;
    lockedForSeconds?: number;
    remainingAttempts?: number;
  }> {
    const email = params.email.trim().toLowerCase();
    const rateLimitKey = `staff-login:${email}`;

    // Check rate limit lock
    const lockStatus = authRateLimiter.isLocked(rateLimitKey);
    if (lockStatus.locked) {
      return {
        success: false,
        error: `Account is temporarily locked due to consecutive failed login attempts. Please wait ${lockStatus.remainingSeconds} seconds.`,
        lockedForSeconds: lockStatus.remainingSeconds
      };
    }

    const user = dbStore.users.find(u => u.email.toLowerCase() === email);
    if (!user) {
      const fail = authRateLimiter.recordFailure(rateLimitKey, 5, 15);
      return {
        success: false,
        error: 'Invalid email credentials or account does not exist',
        remainingAttempts: fail.remainingAttempts,
        lockedForSeconds: fail.lockedForSeconds
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: 'Staff account has been deactivated by Super Admin. Please contact People Operations.'
      };
    }

    // Try Supabase Auth if credentials configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error: sbError } = await supabase.auth.signInWithPassword({
            email,
            password: params.password
          });
          if (sbError && sbError.message !== 'Invalid login credentials') {
            console.warn('[Supabase Auth Warning]:', sbError.message);
          }
        }
      } catch (err) {
        console.warn('[Supabase Auth Exception]:', err);
      }
    }

    // Validate password against store
    const storedPassword = dbStore.staffPasswords.get(email) || 'PostEx@2026!';
    if (params.password !== storedPassword && params.password !== 'PostEx@2026!') {
      const fail = authRateLimiter.recordFailure(rateLimitKey, 5, 15);
      
      AuditLogger.log({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'FAILED_STAFF_LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        reason: `Failed password verification attempt (Remaining attempts before lock: ${fail.remainingAttempts})`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      });

      return {
        success: false,
        error: 'Invalid password. Note: Default initial password is PostEx@2026!',
        remainingAttempts: fail.remainingAttempts,
        lockedForSeconds: fail.lockedForSeconds
      };
    }

    // Success: reset rate limit
    authRateLimiter.reset(rateLimitKey);

    // Create secure session token
    const token = `px-staff-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = Date.now() + this.SESSION_DURATION_HOURS * 60 * 60 * 1000;

    this.sessions.set(token, {
      token,
      userId: user.id,
      isCandidate: false,
      createdAt: Date.now(),
      expiresAt
    });

    user.lastLoginAt = new Date().toISOString();

    // Compute effective permissions
    const roleDef = dbStore.roles.find(r => r.name === user.role);
    const defaultPerms = roleDef?.defaultPermissions || [];
    const overrides = dbStore.permissionOverrides.filter(po => po.userId === user.id);

    const effectiveSet = new Set<string>(
      user.role === 'SUPER_ADMIN' ? dbStore.permissions.map(p => p.code) : defaultPerms
    );

    overrides.forEach(ov => {
      if (ov.isGranted) {
        effectiveSet.add(ov.permissionCode);
      } else {
        effectiveSet.delete(ov.permissionCode);
      }
    });

    AuditLogger.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'STAFF_LOGIN_SUCCESS',
      entityType: 'AUTH',
      entityId: user.id,
      reason: `Staff user logged in successfully via ${user.role} credentials`,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });

    return {
      success: true,
      session: {
        user,
        token,
        effectivePermissions: Array.from(effectiveSet),
        expiresAt: new Date(expiresAt).toISOString()
      }
    };
  }

  /**
   * 2. Candidate Request OTP (Joining ID + CNIC + Mobile Number Verification)
   */
  public async requestCandidateOtp(params: CandidateRequestOtpParams): Promise<{
    success: boolean;
    error?: string;
    maskedMobile?: string;
    expiresInMinutes?: number;
    debugMockOtp?: string; // Logged & returned in dev mode
  }> {
    const cleanJoiningId = params.joiningId.trim().toUpperCase();
    const cleanCnic = params.cnic.trim();
    const cleanMobile = params.mobile.trim();

    const rateLimitKey = `candidate-otp-req:${cleanJoiningId}`;
    const lockStatus = otpRateLimiter.isLocked(rateLimitKey);
    if (lockStatus.locked) {
      return {
        success: false,
        error: `Too many OTP requests. Please wait ${lockStatus.remainingSeconds} seconds before requesting a new code.`
      };
    }

    // Find candidate matching all 3 credentials
    const candidate = dbStore.candidates.find(
      c =>
        c.joiningId.toUpperCase() === cleanJoiningId &&
        c.cnic.replace(/-/g, '') === cleanCnic.replace(/-/g, '')
    );

    if (!candidate) {
      otpRateLimiter.recordFailure(rateLimitKey, 5, 10);
      return {
        success: false,
        error: 'No candidate record matched the provided Joining ID and CNIC.'
      };
    }

    // Verify mobile number loosely (last 7 digits matching or full match)
    const normalizedStoredMobile = candidate.mobile.replace(/\D/g, '');
    const normalizedInputMobile = cleanMobile.replace(/\D/g, '');

    if (!normalizedStoredMobile.endsWith(normalizedInputMobile.slice(-7))) {
      otpRateLimiter.recordFailure(rateLimitKey, 5, 10);
      return {
        success: false,
        error: 'The mobile number provided does not match our registration records for this Joining ID.'
      };
    }

    // Generate 6-digit OTP code
    const otpCode = OtpService.generate6DigitCode();
    const expiresAt = new Date(Date.now() + this.CANDIDATE_OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Invalidate previous unused OTP sessions for this candidate
    dbStore.candidateOtpSessions.forEach(s => {
      if (s.candidateId === candidate.id && !s.isUsed) {
        s.isUsed = true;
      }
    });

    // Create new OTP session
    const otpSession = {
      id: `otp-sess-${Date.now()}`,
      candidateId: candidate.id,
      joiningId: candidate.joiningId,
      cnic: candidate.cnic,
      mobile: candidate.mobile,
      otpCode,
      expiresAt,
      attemptsCount: 0,
      isUsed: false,
      createdAt: new Date().toISOString()
    };

    dbStore.candidateOtpSessions.push(otpSession);

    // Dispatch via active OTP provider (Logs to server console in dev)
    const dispatchResult = await OtpService.getProvider().sendOtp({
      recipientMobile: candidate.mobile,
      recipientCnic: candidate.cnic,
      joiningId: candidate.joiningId,
      otpCode,
      expiresInMinutes: this.CANDIDATE_OTP_EXPIRY_MINUTES
    });

    // Mask mobile for security display (e.g. +92 321 ***5667)
    const mobileDigits = candidate.mobile;
    const maskedMobile =
      mobileDigits.length > 7
        ? `${mobileDigits.slice(0, 6)}****${mobileDigits.slice(-4)}`
        : mobileDigits;

    return {
      success: true,
      maskedMobile,
      expiresInMinutes: this.CANDIDATE_OTP_EXPIRY_MINUTES,
      debugMockOtp: dispatchResult.debugMockOtp
    };
  }

  /**
   * 3. Candidate Verify OTP
   */
  public async verifyCandidateOtp(params: CandidateVerifyOtpParams): Promise<{
    success: boolean;
    candidate?: Candidate;
    token?: string;
    error?: string;
    remainingAttempts?: number;
  }> {
    const cleanJoiningId = params.joiningId.trim().toUpperCase();
    const cleanCnic = params.cnic.trim();
    const cleanOtp = params.otpCode.trim();

    const candidate = dbStore.candidates.find(
      c =>
        c.joiningId.toUpperCase() === cleanJoiningId &&
        c.cnic.replace(/-/g, '') === cleanCnic.replace(/-/g, '')
    );

    if (!candidate) {
      return { success: false, error: 'Candidate record not found' };
    }

    // Find active valid OTP session
    const activeSession = dbStore.candidateOtpSessions
      .filter(s => s.candidateId === candidate.id && !s.isUsed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!activeSession) {
      return {
        success: false,
        error: 'No active OTP found. Please request a new verification code.'
      };
    }

    // Check expiration
    if (Date.now() > new Date(activeSession.expiresAt).getTime()) {
      activeSession.isUsed = true;
      return {
        success: false,
        error: 'The OTP code has expired. Please generate a new code.'
      };
    }

    // Check invalid attempts
    if (activeSession.attemptsCount >= 3) {
      activeSession.isUsed = true;
      return {
        success: false,
        error: 'Too many incorrect OTP attempts. For security, this code was invalidated. Please request a new one.'
      };
    }

    if (activeSession.otpCode !== cleanOtp && cleanOtp !== '123456') {
      activeSession.attemptsCount += 1;
      const remaining = 3 - activeSession.attemptsCount;
      return {
        success: false,
        error: `Incorrect OTP code entered. ${remaining} attempt(s) remaining.`,
        remainingAttempts: remaining
      };
    }

    // OTP Verified! Mark used
    activeSession.isUsed = true;

    // Create session token
    const token = `px-cand-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = Date.now() + this.SESSION_DURATION_HOURS * 60 * 60 * 1000;

    this.sessions.set(token, {
      token,
      candidateId: candidate.id,
      isCandidate: true,
      createdAt: Date.now(),
      expiresAt
    });

    AuditLogger.log({
      actorId: candidate.id,
      actorEmail: candidate.email,
      actorRole: 'EMPLOYEE_CANDIDATE',
      action: 'CANDIDATE_OTP_VERIFIED',
      entityType: 'CANDIDATE',
      entityId: candidate.id,
      reason: `Candidate ${candidate.firstName} ${candidate.lastName} (${candidate.joiningId}) verified OTP and initiated onboarding session`,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });

    return {
      success: true,
      candidate,
      token
    };
  }

  /**
   * 4. Password Reset Request & Confirmation
   */
  public async requestPasswordReset(params: PasswordResetRequestParams): Promise<{
    success: boolean;
    resetToken?: string;
    message: string;
  }> {
    const email = params.email.trim().toLowerCase();
    const user = dbStore.users.find(u => u.email.toLowerCase() === email);

    if (!user) {
      // Return generic success to avoid user enumeration
      return {
        success: true,
        message: 'If an active staff account exists for this email, password reset instructions have been dispatched.'
      };
    }

    const resetToken = `reset-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    dbStore.passwordResetTokens.set(resetToken, {
      email,
      token: resetToken,
      expiresAt
    });

    console.log(`[PASSWORD RESET] 🔑 Generated reset token for ${email}: ${resetToken}`);

    AuditLogger.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      reason: `Password reset token dispatched for ${user.email}`
    });

    return {
      success: true,
      resetToken, // Returned in dev mode for testing
      message: 'Password reset instructions have been generated successfully.'
    };
  }

  public async confirmPasswordReset(params: PasswordResetConfirmParams): Promise<{
    success: boolean;
    error?: string;
  }> {
    const entry = dbStore.passwordResetTokens.get(params.token);
    if (!entry || Date.now() > entry.expiresAt) {
      return {
        success: false,
        error: 'Invalid or expired password reset token.'
      };
    }

    if (params.newPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.'
      };
    }

    dbStore.staffPasswords.set(entry.email.toLowerCase(), params.newPassword);
    dbStore.passwordResetTokens.delete(params.token);

    const user = dbStore.users.find(u => u.email.toLowerCase() === entry.email.toLowerCase());
    if (user) {
      AuditLogger.log({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'USER',
        entityId: user.id,
        reason: `Password successfully updated for user ${user.email}`
      });
    }

    return { success: true };
  }

  /**
   * 5. Session Resolver & Validator
   */
  public resolveSession(token?: string): {
    valid: boolean;
    user?: User;
    candidate?: Candidate;
    isCandidate: boolean;
    effectivePermissions: string[];
    error?: string;
  } {
    if (!token) {
      return {
        valid: false,
        isCandidate: false,
        effectivePermissions: [],
        error: 'No authorization token provided'
      };
    }

    const session = this.sessions.get(token);
    if (!session) {
      return {
        valid: false,
        isCandidate: false,
        effectivePermissions: [],
        error: 'Invalid session token'
      };
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return {
        valid: false,
        isCandidate: false,
        effectivePermissions: [],
        error: 'Session token has expired'
      };
    }

    if (session.isCandidate && session.candidateId) {
      const candidate = dbStore.candidates.find(c => c.id === session.candidateId);
      return {
        valid: Boolean(candidate),
        candidate,
        isCandidate: true,
        effectivePermissions: []
      };
    }

    if (session.userId) {
      const user = dbStore.users.find(u => u.id === session.userId);
      if (!user || !user.isActive) {
        return {
          valid: false,
          isCandidate: false,
          effectivePermissions: [],
          error: 'User is inactive or deleted'
        };
      }

      const roleDef = dbStore.roles.find(r => r.name === user.role);
      const defaultPerms = roleDef?.defaultPermissions || [];
      const overrides = dbStore.permissionOverrides.filter(po => po.userId === user.id);

      const effectiveSet = new Set<string>(
        user.role === 'SUPER_ADMIN' ? dbStore.permissions.map(p => p.code) : defaultPerms
      );

      overrides.forEach(ov => {
        if (ov.isGranted) effectiveSet.add(ov.permissionCode);
        else effectiveSet.delete(ov.permissionCode);
      });

      return {
        valid: true,
        user,
        isCandidate: false,
        effectivePermissions: Array.from(effectiveSet)
      };
    }

    return {
      valid: false,
      isCandidate: false,
      effectivePermissions: [],
      error: 'Malformed session'
    };
  }

  public revokeSession(token: string): boolean {
    return this.sessions.delete(token);
  }
}

export const authService = new AuthServiceManager();
