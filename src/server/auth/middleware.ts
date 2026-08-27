import { Request, Response, NextFunction } from 'express';
import { authService } from './authService';
import { AuthorizationEngine } from '../authorization/engine';
import { User, Candidate, UserRole } from '../../types';

// Extend Express Request to carry authenticated user or candidate
export interface AuthenticatedRequest extends Request {
  user?: User;
  candidate?: Candidate;
  isCandidate?: boolean;
  effectivePermissions?: string[];
}

/**
 * Middleware: Extracts session from Authorization header (Bearer <token>) or fallback to active user
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  if (token) {
    const session = authService.resolveSession(token);
    if (!session.valid) {
      return res.status(401).json({
        error: session.error || 'Invalid or expired authentication session. Please login again.'
      });
    }
    req.user = session.user;
    req.candidate = session.candidate;
    req.isCandidate = session.isCandidate;
    req.effectivePermissions = session.effectivePermissions;
    return next();
  }

  // If no Bearer header provided, proceed (handlers can check req.user or use requireAuth)
  next();
}

/**
 * Middleware: Requires a valid staff session
 */
export function requireStaffAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.isCandidate) {
    return res.status(401).json({
      error: 'Authentication required. Valid staff session not found.'
    });
  }
  next();
}

/**
 * Middleware: Requires a valid candidate session
 */
export function requireCandidateAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.candidate || !req.isCandidate) {
    return res.status(401).json({
      error: 'Candidate authentication required. Please verify your OTP.'
    });
  }
  next();
}

/**
 * Middleware: Requires Super Admin role
 */
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'CRITICAL SECURITY: This operation is strictly restricted to Super Admin.'
    });
  }
  next();
}

/**
 * Middleware: 3-Layer Authorization Route Guard
 * Checks Layer 1 (Role Default) + Layer 2 (User Override) + Layer 3 (Geographic Scope)
 */
export function requirePermission(
  permissionCode: string,
  scopeExtractor?: (req: Request) => { targetZoneId?: string | null; targetBranchId?: string | null }
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const scope = scopeExtractor ? scopeExtractor(req) : {};
    const evalResult = AuthorizationEngine.evaluate({
      userId: req.user.id,
      permissionCode,
      targetZoneId: scope.targetZoneId,
      targetBranchId: scope.targetBranchId
    });

    if (!evalResult.allowed) {
      return res.status(403).json({
        error: evalResult.reason,
        authorizationTrace: evalResult
      });
    }

    next();
  };
}
