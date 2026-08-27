export type UserRole =
  | 'SUPER_ADMIN'
  | 'ZONAL_HR_MANAGER'
  | 'CENTRAL_HR'
  | 'BRANCH_MANAGER'
  | 'EMPLOYEE_CANDIDATE';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_BRANCH_VERIFICATION'
  | 'BRANCH_VERIFIED'
  | 'BRANCH_REJECTED'
  | 'CENTRAL_HR_REVIEW'
  | 'RETURNED_FOR_CORRECTION'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED_TO_EMPLOYEE'
  | 'ARCHIVED';

export type DocumentType =
  | 'CNIC_FRONT'
  | 'CNIC_BACK'
  | 'PASSPORT_PHOTO'
  | 'EDUCATIONAL_DEGREE'
  | 'EXPERIENCE_LETTER'
  | 'DRIVING_LICENSE'
  | 'POLICE_VERIFICATION'
  | 'FAMILY_REGISTRATION_CERTIFICATE'
  | 'BANK_CHECK_LEAF'
  | 'SIGNATURE';

export type VerificationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REQUIRES_REUPLOAD';

export interface Zone {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branchCount?: number;
}

export interface Branch {
  id: string;
  zoneId: string;
  zoneName?: string;
  code: string;
  name: string;
  city: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  designationCount?: number;
}

export interface Designation {
  id: string;
  departmentId: string;
  departmentName?: string;
  code: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PermissionCategory =
  | 'ACCOUNT_MANAGEMENT'
  | 'CANDIDATE_ACTIONS'
  | 'VERIFICATION'
  | 'VISIBILITY_REPORTING'
  | 'SYSTEM';

export interface Permission {
  id: string;
  code: string;
  category: PermissionCategory;
  module: 'ORGANIZATION' | 'USER_MANAGEMENT' | 'CANDIDATE' | 'VERIFICATION' | 'AUDIT' | 'SECURITY';
  name: string;
  description: string;
  isSuperAdminOnly?: boolean;
}

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  defaultPermissions: string[]; // Permission codes
}

export interface UserPermissionOverride {
  id: string;
  userId: string;
  permissionCode: string;
  isGranted: boolean; // true = granted, false = revoked
  reason: string;
  grantedBy: string;
  grantedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZoneAssignment {
  id: string;
  userId: string;
  zoneId: string;
  zoneName?: string;
  branchId?: string | null;
  branchName?: string | null;
  assignedBy: string;
  assignedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  cnicMasked?: string;
  role: UserRole;
  roleId: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  zoneAssignments?: ZoneAssignment[];
  overrides?: UserPermissionOverride[];
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  zoneId?: string | null;
  branchId?: string | null;
  oldState?: Record<string, any> | null;
  newState?: Record<string, any> | null;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuthorizationCheckRequest {
  userId: string;
  permissionCode: string;
  targetZoneId?: string | null;
  targetBranchId?: string | null;
}

export interface AuthorizationCheckResult {
  allowed: boolean;
  reason: string;
  layer1RoleDefault: boolean;
  layer2OverrideState: 'GRANTED' | 'REVOKED' | 'NO_OVERRIDE';
  effectivePermission: boolean;
  layer3ScopeEvaluation: {
    passed: boolean;
    userScope: 'NATIONWIDE' | 'ZONAL' | 'BRANCH' | 'NONE';
    requestedZone?: string | null;
    requestedBranch?: string | null;
    message: string;
  };
}

export interface AuthSession {
  user: User;
  token: string;
  effectivePermissions: string[];
  expiresAt: string;
}

export type CandidateTrack = 'EXECUTIVE' | 'NON_EXECUTIVE';

export interface Candidate {
  id: string;
  joiningId: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  cnic: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  maritalStatus: 'SINGLE' | 'MARRIED' | 'OTHER';
  currentAddress: string;
  permanentAddress: string;
  zoneId: string;
  zoneName?: string;
  branchId: string;
  branchName?: string;
  departmentId: string;
  departmentName?: string;
  designationId: string;
  designationTitle?: string;
  expectedJoiningDate: string;
  track?: CandidateTrack;
  status: ApplicationStatus;
  createdBy: string;
  assignedToHrId?: string | null;
  assignedToHrName?: string | null;
  isDelayed?: boolean;
  delayedHours?: number;
  delayedReason?: string;
  zonalPriorityNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminDashboardData {
  companyMetrics: {
    totalCandidates: number;
    totalEmployees: number;
    totalStaffUsers: number;
    totalZones: number;
    totalBranches: number;
    totalDepartments: number;
    totalDesignations: number;
    pendingBranchVerifications: number;
    pendingCentralHrReviews: number;
    totalActiveOverrides: number;
  };
  attentionSummary: {
    delayedApplicationsCount: number;
    stuckApplications: {
      id: string;
      joiningId: string;
      candidateName: string;
      zoneName: string;
      branchName: string;
      daysPending: number;
      status: ApplicationStatus;
      delayReason: string;
    }[];
    nonDefaultPermissionUsers: {
      userId: string;
      userName: string;
      email: string;
      role: UserRole;
      overridesCount: number;
      grantedCodes: string[];
      revokedCodes: string[];
    }[];
    unassignedBranchesCount: number;
    inactiveStaffCount: number;
  };
}

export interface ZonalHrDashboardData {
  zoneId: string;
  zoneName: string;
  zoneCode: string;
  metrics: {
    totalCandidates: number;
    submitted: number;
    underBranchVerification: number;
    branchVerified: number;
    centralHrReview: number;
    approved: number;
    returnedForCorrection: number;
    rejected: number;
    convertedEmployees: number;
    delayedApplications: number;
  };
  hrWorkload: {
    userId: string;
    userName: string;
    email: string;
    assignedCount: number;
    activePendingCount: number;
    completedCount: number;
    avgTurnaroundHours: number;
  }[];
  branchStatus: {
    branchId: string;
    branchCode: string;
    branchName: string;
    city: string;
    bmName: string;
    bmPhone: string;
    totalCandidates: number;
    pendingVerification: number;
    verified: number;
    needsCorrection: number;
    avgVerificationHours: number;
  }[];
  delayedApplications: {
    id: string;
    joiningId: string;
    candidateName: string;
    cnic: string;
    branchId: string;
    branchName: string;
    assignedHrName: string;
    assignedHrId?: string;
    daysPending: number;
    hoursPending: number;
    status: ApplicationStatus;
    reason: string;
    track: CandidateTrack;
  }[];
}

export interface ZonalReportData {
  zoneId: string;
  zoneName: string;
  generatedAt: string;
  turnaroundSummary: {
    avgTotalDays: number;
    avgBranchHours: number;
    avgCentralHrHours: number;
    fastestBranch: string;
    slowestBranch: string;
  };
  rejectionAnalysis: {
    totalRejections: number;
    ratePercent: number;
    topReasons: { reason: string; count: number }[];
  };
  correctionAnalysis: {
    totalCorrections: number;
    ratePercent: number;
    topDocumentBottlenecks: { docType: string; count: number }[];
  };
  branchPerformance: {
    branchName: string;
    totalProcessed: number;
    avgSpeedHours: number;
    approvalRatePercent: number;
  }[];
}

export interface Employee {
  id: string;
  employeeId: string; // Unique e.g. "PX-EMP-2026-0891"
  candidateId: string;
  joiningId: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  cnic: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'OTHER';
  currentAddress: string;
  permanentAddress: string;
  zoneId: string;
  zoneName: string;
  branchId: string;
  branchName: string;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationTitle: string;
  track: CandidateTrack;
  expectedJoiningDate?: string;
  joiningDate: string;
  enrolledAt: string;
  enrolledBy: string;
  enrolledByName: string;
  status: 'ACTIVE' | 'ONBOARDED';
  dossierHash: string; // Cryptographic SHA-256 verification hash
}

export interface JoiningDossier {
  id: string;
  candidateId: string;
  employeeId: string;
  joiningId: string;
  candidateName: string;
  fatherName: string;
  cnic: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  currentAddress: string;
  permanentAddress: string;
  track: CandidateTrack;
  departmentName: string;
  designationTitle: string;
  zoneName: string;
  branchName: string;
  joiningDate: string;
  approvalDate: string;
  bmVerifiedBy: string;
  bmVerifiedAt: string;
  bmRemarks: string;
  bmSignatureData?: string;
  centralApprovedBy: string;
  centralApprovedAt: string;
  centralRemarks: string;
  dossierHash: string;
  verifiedDocuments: {
    type: string;
    fileName: string;
    verificationStatus: string;
    verifiedAt: string;
    verifiedBy?: string;
    remarks?: string;
  }[];
}

export interface CentralHrMetrics {
  totalCandidates: number;
  newCandidates: number;
  pendingBm: number;
  pendingHr: number;
  approved: number;
  returnedForCorrection: number;
  rejected: number;
}

export interface NotificationPlaceholder {
  id: string;
  type: 'SMS' | 'EMAIL' | 'BRANCH_ALERT';
  recipient: string;
  title: string;
  content: string;
  templateName: string;
  dispatchedAt: string;
  status: 'SENT' | 'SIMULATED';
  metadata?: Record<string, any>;
}

export interface Application {
  id: string;
  candidateId: string;
  currentStep: number;
  totalSteps: number;
  submittedAt?: string | null;
  branchVerifiedAt?: string | null;
  branchVerifiedBy?: string | null;
  branchVerifiedByName?: string | null;
  centralApprovedAt?: string | null;
  centralApprovedBy?: string | null;
  status: ApplicationStatus;
  rejectionReason?: string | null;
  metadata?: Record<string, any>;
}

export interface CandidateDocument {
  id: string;
  candidateId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  verificationStatus: VerificationStatus;
  ocrExtractedData?: Record<string, any>;
  remarks?: string;
  verifiedBy?: string;
  uploadedAt: string;
}

export interface CandidateOtpSession {
  id: string;
  candidateId: string;
  joiningId: string;
  cnic: string;
  mobile: string;
  otpCode: string; // Dev mock / logged OTP
  expiresAt: string;
  attemptsCount: number;
  isUsed: boolean;
  createdAt: string;
}

export interface RateLimitState {
  key: string;
  attempts: number;
  lockedUntil?: string | null;
  lastAttemptAt: string;
}

export interface Phase2SecurityTestResult {
  id: string;
  name: string;
  description: string;
  testCategory: 'ZONAL_ISOLATION' | 'BRANCH_ISOLATION' | 'PERMISSION_OVERRIDE' | 'OVERRIDE_SCOPE_LIMIT' | 'AUDIT_RESTRICTION';
  passed: boolean;
  expectedVerdict: 'ALLOW' | 'DENY';
  actualVerdict: 'ALLOW' | 'DENY';
  status: number;
  trace: {
    actorEmail: string;
    actorRole: UserRole;
    actionAttempted: string;
    layer1RoleDefault: boolean;
    layer2Override: string;
    layer3ScopeResult: string;
    engineReason: string;
    serverMessage: string;
  };
}

