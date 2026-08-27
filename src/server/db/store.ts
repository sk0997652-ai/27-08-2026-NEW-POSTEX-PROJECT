import {
  Zone,
  Branch,
  Department,
  Designation,
  Role,
  Permission,
  User,
  UserPermissionOverride,
  ZoneAssignment,
  AuditLog,
  UserRole,
  Candidate,
  Application,
  CandidateDocument,
  CandidateOtpSession,
  Employee,
  NotificationPlaceholder,
  SuperAdminDashboardData,
  ZonalHrDashboardData,
  ZonalReportData
} from '../../types';

// In-Memory Normalized Relational Store (Mirrors Supabase PostgreSQL with RLS and schema enforcement)
class DatabaseStore {
  public zones: Zone[] = [];
  public branches: Branch[] = [];
  public departments: Department[] = [];
  public designations: Designation[] = [];
  public roles: Role[] = [];
  public permissions: Permission[] = [];
  public users: User[] = [];
  public zoneAssignments: ZoneAssignment[] = [];
  public permissionOverrides: UserPermissionOverride[] = [];
  public auditLogs: AuditLog[] = [];
  public candidates: Candidate[] = [];
  public applications: Application[] = [];
  public documents: CandidateDocument[] = [];
  public employees: Employee[] = [];
  public notifications: NotificationPlaceholder[] = [];
  public candidateOtpSessions: CandidateOtpSession[] = [];
  public staffPasswords: Map<string, string> = new Map(); // email -> password (hash/plain for dev)
  public passwordResetTokens: Map<string, { email: string; token: string; expiresAt: number }> = new Map();

  constructor() {
    this.seedInitialData();
  }

  public seedInitialData() {
    // 1. Roles
    this.roles = [
      {
        id: '11111111-1111-1111-1111-111111111101',
        name: 'SUPER_ADMIN',
        displayName: 'Super Admin',
        description: 'Complete administrative governance and organizational control',
        defaultPermissions: [
          'org:manage_zones',
          'org:manage_branches',
          'org:manage_departments',
          'users:manage_staff',
          'users:override_permissions',
          'users:assign_bm',
          'audit:view',
          'candidate:create',
          'candidate:reassign',
          'candidate:step_in',
          'candidate:view_nationwide',
          'candidate:view_zonal',
          'candidate:view_branch',
          'candidate:verify_branch',
          'candidate:decide_central',
          'candidate:generate_dossier',
          'reports:view_zonal',
          'reports:view_nationwide',
          'system:settings'
        ]
      },
      {
        id: '11111111-1111-1111-1111-111111111102',
        name: 'ZONAL_HR_MANAGER',
        displayName: 'Zonal HR Manager',
        description: 'Zonal operations oversight, regional staff governance, and turnaround management',
        defaultPermissions: [
          'candidate:view_zonal',
          'candidate:create',
          'candidate:reassign',
          'candidate:step_in',
          'reports:view_zonal',
          'users:assign_bm',
          'users:manage_staff'
        ]
      },
      {
        id: '11111111-1111-1111-1111-111111111103',
        name: 'CENTRAL_HR',
        displayName: 'Central HR',
        description: 'Nationwide candidate onboarding, review, and employment conversion',
        defaultPermissions: [
          'candidate:create',
          'candidate:view_nationwide',
          'candidate:decide_central',
          'candidate:generate_dossier',
          'org:manage_departments'
        ]
      },
      {
        id: '11111111-1111-1111-1111-111111111104',
        name: 'BRANCH_MANAGER',
        displayName: 'Branch Manager',
        description: 'Physical document verification, candidate interview, and local forwarding',
        defaultPermissions: [
          'candidate:view_branch',
          'candidate:verify_branch'
        ]
      },
      {
        id: '11111111-1111-1111-1111-111111111105',
        name: 'EMPLOYEE_CANDIDATE',
        displayName: 'Employee / Candidate',
        description: 'Self-service onboarding application and document submission',
        defaultPermissions: []
      }
    ];

    // 2. Permissions Definition Grouped by 5 Standard Categories
    this.permissions = [
      // CATEGORY 1: ACCOUNT MANAGEMENT
      {
        id: '22222222-2222-2222-2222-222222222204',
        code: 'users:manage_staff',
        category: 'ACCOUNT_MANAGEMENT',
        module: 'USER_MANAGEMENT',
        name: 'Manage Staff Users',
        description: 'Create staff users, assign roles, and allocate zone boundaries'
      },
      {
        id: '22222222-2222-2222-2222-222222222205',
        code: 'users:override_permissions',
        category: 'ACCOUNT_MANAGEMENT',
        module: 'USER_MANAGEMENT',
        name: 'Override User Permissions',
        description: 'Grant or revoke custom user permissions with mandatory audit reason'
      },
      {
        id: '22222222-2222-2222-2222-222222222214',
        code: 'users:assign_bm',
        category: 'ACCOUNT_MANAGEMENT',
        module: 'USER_MANAGEMENT',
        name: 'Assign Branch Managers',
        description: 'Allocate Branch Managers to branch facilities within zone'
      },
      {
        id: '22222222-2222-2222-2222-222222222201',
        code: 'org:manage_zones',
        category: 'ACCOUNT_MANAGEMENT',
        module: 'ORGANIZATION',
        name: 'Manage Zones',
        description: 'Create, update, and toggle active status of operational zones'
      },
      {
        id: '22222222-2222-2222-2222-222222222202',
        code: 'org:manage_branches',
        category: 'ACCOUNT_MANAGEMENT',
        module: 'ORGANIZATION',
        name: 'Manage Branches',
        description: 'Create, update, and manage branches within zones'
      },
      {
        id: '22222222-2222-2222-2222-222222222203',
        code: 'org:manage_departments',
        category: 'ACCOUNT_MANAGEMENT',
        module: 'ORGANIZATION',
        name: 'Manage Departments & Designations',
        description: 'Manage company departments and designations'
      },

      // CATEGORY 2: CANDIDATE & APPLICATION ACTIONS
      {
        id: '22222222-2222-2222-2222-222222222207',
        code: 'candidate:create',
        category: 'CANDIDATE_ACTIONS',
        module: 'CANDIDATE',
        name: 'Create Candidate',
        description: 'Register new onboarding candidates and dispatch joining credentials'
      },
      {
        id: '22222222-2222-2222-2222-222222222215',
        code: 'candidate:reassign',
        category: 'CANDIDATE_ACTIONS',
        module: 'CANDIDATE',
        name: 'Reassign Candidate',
        description: 'Rebalance workload by reassigning candidates between Central HR staff in the same zone'
      },
      {
        id: '22222222-2222-2222-2222-222222222216',
        code: 'candidate:step_in',
        category: 'CANDIDATE_ACTIONS',
        module: 'CANDIDATE',
        name: 'Step In On Delayed Applications',
        description: 'Intervene on stalled applications to expedite, reassign, or add priority flags'
      },

      // CATEGORY 3: VERIFICATION
      {
        id: '22222222-2222-2222-2222-222222222211',
        code: 'candidate:verify_branch',
        category: 'VERIFICATION',
        module: 'VERIFICATION',
        name: 'Branch Document Verification',
        description: 'Perform branch-level physical document checks and forward to Central HR'
      },
      {
        id: '22222222-2222-2222-2222-222222222212',
        code: 'candidate:decide_central',
        category: 'VERIFICATION',
        module: 'VERIFICATION',
        name: 'Central HR Decision',
        description: 'Final approval, return for correction, or reject onboarding candidate'
      },
      {
        id: '22222222-2222-2222-2222-222222222213',
        code: 'candidate:generate_dossier',
        category: 'VERIFICATION',
        module: 'VERIFICATION',
        name: 'Generate Joining Dossier',
        description: 'Generate formal PostEx Joining Dossier PDF and convert to Employee'
      },

      // CATEGORY 4: VISIBILITY / REPORTING
      {
        id: '22222222-2222-2222-2222-222222222208',
        code: 'candidate:view_nationwide',
        category: 'VISIBILITY_REPORTING',
        module: 'CANDIDATE',
        name: 'View Nationwide Candidates',
        description: 'Access candidate dossiers across all zones nationwide'
      },
      {
        id: '22222222-2222-2222-2222-222222222209',
        code: 'candidate:view_zonal',
        category: 'VISIBILITY_REPORTING',
        module: 'CANDIDATE',
        name: 'View Zonal Candidates',
        description: 'Access candidate dossiers within assigned zone boundary'
      },
      {
        id: '22222222-2222-2222-2222-222222222210',
        code: 'candidate:view_branch',
        category: 'VISIBILITY_REPORTING',
        module: 'CANDIDATE',
        name: 'View Branch Candidates',
        description: 'Access candidate dossiers within assigned branch boundary'
      },
      {
        id: '22222222-2222-2222-2222-222222222217',
        code: 'reports:view_zonal',
        category: 'VISIBILITY_REPORTING',
        module: 'ORGANIZATION',
        name: 'View Zonal Analytics & Turnaround',
        description: 'Generate turnaround time, staff workload, and branch performance reports'
      },
      {
        id: '22222222-2222-2222-2222-222222222218',
        code: 'reports:view_nationwide',
        category: 'VISIBILITY_REPORTING',
        module: 'ORGANIZATION',
        name: 'View Nationwide Executive Reports',
        description: 'Company-wide metrics and multi-zone operational analytics'
      },

      // CATEGORY 5: SYSTEM
      {
        id: '22222222-2222-2222-2222-222222222206',
        code: 'audit:view',
        category: 'SYSTEM',
        module: 'AUDIT',
        name: 'View Audit Logs',
        description: 'View system-wide immutable audit trail logs (Super Admin Only - Non-Overrideable)',
        isSuperAdminOnly: true
      },
      {
        id: '22222222-2222-2222-2222-222222222219',
        code: 'system:settings',
        category: 'SYSTEM',
        module: 'SECURITY',
        name: 'System-Wide Settings',
        description: 'Manage platform configuration and security policies (Super Admin Only)',
        isSuperAdminOnly: true
      }
    ];

    // 3. PostEx Zones
    this.zones = [
      {
        id: '33333333-3333-3333-3333-333333333301',
        code: 'ZONE-NORTH',
        name: 'Zone North (Punjab & KPK)',
        description: 'Operational region covering Lahore, Rawalpindi, Islamabad, Peshawar, Faisalabad',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '33333333-3333-3333-3333-333333333302',
        code: 'ZONE-SOUTH',
        name: 'Zone South (Sindh & Balochistan)',
        description: 'Operational region covering Karachi, Hyderabad, Sukkur, Quetta',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }
    ];

    // 4. PostEx Branches
    this.branches = [
      {
        id: '44444444-4444-4444-4444-444444444401',
        zoneId: '33333333-3333-3333-3333-333333333301',
        zoneName: 'Zone North (Punjab & KPK)',
        code: 'BR-LHR-01',
        name: 'Lahore Central Hub',
        city: 'Lahore',
        address: 'Plot 42, Industrial Area, Gulberg III, Lahore',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '44444444-4444-4444-4444-444444444402',
        zoneId: '33333333-3333-3333-3333-333333333301',
        zoneName: 'Zone North (Punjab & KPK)',
        code: 'BR-ISB-01',
        name: 'Islamabad Main Facility',
        city: 'Islamabad',
        address: 'Sector I-9/3, Industrial Area, Islamabad',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '44444444-4444-4444-4444-444444444403',
        zoneId: '33333333-3333-3333-3333-333333333302',
        zoneName: 'Zone South (Sindh & Balochistan)',
        code: 'BR-KHI-01',
        name: 'Karachi Port Mega Hub',
        city: 'Karachi',
        address: 'Korangi Industrial Area, Sector 15, Karachi',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '44444444-4444-4444-4444-444444444404',
        zoneId: '33333333-3333-3333-3333-333333333302',
        zoneName: 'Zone South (Sindh & Balochistan)',
        code: 'BR-HYD-01',
        name: 'Hyderabad Regional Center',
        city: 'Hyderabad',
        address: 'Auto Bhan Road, Latifabad, Hyderabad',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }
    ];

    // 5. Departments
    this.departments = [
      {
        id: '55555555-5555-5555-5555-555555555501',
        code: 'DEPT-OPS',
        name: 'Logistics & Fleet Operations',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '55555555-5555-5555-5555-555555555502',
        code: 'DEPT-FIN',
        name: 'Finance & Cash-on-Delivery (COD)',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '55555555-5555-5555-5555-555555555503',
        code: 'DEPT-TECH',
        name: 'Technology & Systems Engineering',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '55555555-5555-5555-5555-555555555504',
        code: 'DEPT-HR',
        name: 'Human Resources & People Operations',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }
    ];

    // 6. Designations
    this.designations = [
      {
        id: '66666666-6666-6666-6666-666666666601',
        departmentId: '55555555-5555-5555-5555-555555555501',
        departmentName: 'Logistics & Fleet Operations',
        code: 'DESIG-RDR',
        title: 'Last-Mile Courier / Rider',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '66666666-6666-6666-6666-666666666602',
        departmentId: '55555555-5555-5555-5555-555555555501',
        departmentName: 'Logistics & Fleet Operations',
        code: 'DESIG-HUB-SUP',
        title: 'Hub Operations Supervisor',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '66666666-6666-6666-6666-666666666603',
        departmentId: '55555555-5555-5555-5555-555555555502',
        departmentName: 'Finance & Cash-on-Delivery (COD)',
        code: 'DESIG-COD-AUD',
        title: 'COD Reconciliation Specialist',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '66666666-6666-6666-6666-666666666604',
        departmentId: '55555555-5555-5555-5555-555555555504',
        departmentName: 'Human Resources & People Operations',
        code: 'DESIG-HR-EXEC',
        title: 'Onboarding Executive',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }
    ];

    // 7. Core Users Representing all 5 Roles for Immediate Enterprise Testing
    this.users = [
      {
        id: '77777777-7777-7777-7777-777777777701',
        email: 'superadmin@postex.pk',
        firstName: 'Tariq',
        lastName: 'Mansoor',
        phone: '+92 300 1234567',
        cnicMasked: '35201-*******-1',
        role: 'SUPER_ADMIN',
        roleId: '11111111-1111-1111-1111-111111111101',
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: '77777777-7777-7777-7777-777777777702',
        email: 'zonal.north@postex.pk',
        firstName: 'Zainab',
        lastName: 'Ahmed',
        phone: '+92 321 9876543',
        cnicMasked: '35202-*******-4',
        role: 'ZONAL_HR_MANAGER',
        roleId: '11111111-1111-1111-1111-111111111102',
        isActive: true,
        twoFactorEnabled: false,
        lastLoginAt: new Date().toISOString(),
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z'
      },
      {
        id: '77777777-7777-7777-7777-777777777703',
        email: 'central.hr@postex.pk',
        firstName: 'Bilal',
        lastName: 'Khan',
        phone: '+92 333 4567890',
        cnicMasked: '37405-*******-7',
        role: 'CENTRAL_HR',
        roleId: '11111111-1111-1111-1111-111111111103',
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z'
      },
      {
        id: '77777777-7777-7777-7777-777777777706',
        email: 'central.south@postex.pk',
        firstName: 'Faisal',
        lastName: 'Qureshi',
        phone: '+92 321 4455889',
        cnicMasked: '42101-*******-8',
        role: 'CENTRAL_HR',
        roleId: '11111111-1111-1111-1111-111111111103',
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z'
      },
      {
        id: '77777777-7777-7777-7777-777777777704',
        email: 'bm.lhr@postex.pk',
        firstName: 'Usman',
        lastName: 'Ali',
        phone: '+92 345 1122334',
        cnicMasked: '35201-*******-9',
        role: 'BRANCH_MANAGER',
        roleId: '11111111-1111-1111-1111-111111111104',
        isActive: true,
        twoFactorEnabled: false,
        lastLoginAt: new Date().toISOString(),
        createdAt: '2026-01-03T00:00:00Z',
        updatedAt: '2026-01-03T00:00:00Z'
      },
      {
        id: '77777777-7777-7777-7777-777777777705',
        email: 'candidate.demo@postex.pk',
        firstName: 'Hamza',
        lastName: 'Rauf',
        phone: '+92 312 3344556',
        cnicMasked: '35202-*******-5',
        role: 'EMPLOYEE_CANDIDATE',
        roleId: '11111111-1111-1111-1111-111111111105',
        isActive: true,
        twoFactorEnabled: false,
        lastLoginAt: new Date().toISOString(),
        createdAt: '2026-01-04T00:00:00Z',
        updatedAt: '2026-01-04T00:00:00Z'
      }
    ];

    // 8. Zone Assignments
    this.zoneAssignments = [
      // Zonal HR Manager -> Assigned to Zone North
      {
        id: '88888888-8888-8888-8888-888888888801',
        userId: '77777777-7777-7777-7777-777777777702',
        zoneId: '33333333-3333-3333-3333-333333333301',
        zoneName: 'Zone North (Punjab & KPK)',
        branchId: null,
        branchName: 'All Zone Branches',
        assignedBy: '77777777-7777-7777-7777-777777777701',
        assignedAt: '2026-01-02T00:00:00Z'
      },
      // Central HR North -> Assigned to Zone North
      {
        id: '88888888-8888-8888-8888-888888888803',
        userId: '77777777-7777-7777-7777-777777777703',
        zoneId: '33333333-3333-3333-3333-333333333301',
        zoneName: 'Zone North (Punjab & KPK)',
        branchId: null,
        branchName: 'All Zone North Hubs',
        assignedBy: '77777777-7777-7777-7777-777777777701',
        assignedAt: '2026-01-02T00:00:00Z'
      },
      // Central HR South -> Assigned to Zone South
      {
        id: '88888888-8888-8888-8888-888888888804',
        userId: '77777777-7777-7777-7777-777777777706',
        zoneId: '33333333-3333-3333-3333-333333333302',
        zoneName: 'Zone South (Sindh & Balochistan)',
        branchId: null,
        branchName: 'All Zone South Hubs',
        assignedBy: '77777777-7777-7777-7777-777777777701',
        assignedAt: '2026-01-02T00:00:00Z'
      },
      // Branch Manager -> Assigned to Lahore Central Hub
      {
        id: '88888888-8888-8888-8888-888888888802',
        userId: '77777777-7777-7777-7777-777777777704',
        zoneId: '33333333-3333-3333-3333-333333333301',
        zoneName: 'Zone North (Punjab & KPK)',
        branchId: '44444444-4444-4444-4444-444444444401',
        branchName: 'Lahore Central Hub',
        assignedBy: '77777777-7777-7777-7777-777777777701',
        assignedAt: '2026-01-03T00:00:00Z'
      }
    ];

    // 9. Initial Audit Trail Logs
    this.auditLogs = [
      {
        id: '99999999-9999-9999-9999-999999999901',
        actorId: '77777777-7777-7777-7777-777777777701',
        actorEmail: 'superadmin@postex.pk',
        actorRole: 'SUPER_ADMIN',
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'ORGANIZATION',
        entityId: '33333333-3333-3333-3333-333333333301',
        zoneId: '33333333-3333-3333-3333-333333333301',
        branchId: null,
        oldState: null,
        newState: { system: 'PostEx HR Portal', version: '1.0.0', status: 'PROVISIONED' },
        reason: 'Master system provisioning and initial organization hierarchy setup',
        ipAddress: '10.0.4.12',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        createdAt: '2026-01-01T00:00:00Z'
      }
    ];

    // 10. Default Staff Passwords (for development & authentication tests)
    this.users.forEach(u => {
      this.staffPasswords.set(u.email.toLowerCase(), 'PostEx@2026!');
    });

    // 11. Initial Candidate Seed Records
    this.candidates = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        joiningId: 'PX-JOIN-2026-0891',
        firstName: 'Hamza',
        lastName: 'Rasheed',
        fatherName: 'Rasheed Ahmed',
        cnic: '35201-8934123-1',
        mobile: '+92-321-4455667',
        email: 'hamza.rasheed@example.com',
        dateOfBirth: '1998-04-14',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        currentAddress: 'House 12, Street 4, Gulshan-e-Ravi, Lahore',
        permanentAddress: 'Village 44-GB, Samundri, Faisalabad',
        zoneId: '33333333-3333-3333-3333-333333333301', // Zone North
        zoneName: 'Zone North (Punjab & KPK)',
        branchId: '44444444-4444-4444-4444-444444444401', // Lahore Central Hub
        branchName: 'Lahore Central Hub',
        departmentId: '55555555-5555-5555-5555-555555555501',
        departmentName: 'Logistics & Fleet Operations',
        designationId: '66666666-6666-6666-6666-666666666601',
        designationTitle: 'Last-Mile Courier / Rider',
        expectedJoiningDate: '2026-09-01',
        track: 'NON_EXECUTIVE',
        status: 'BRANCH_VERIFIED',
        createdBy: '77777777-7777-7777-7777-777777777703',
        assignedToHrId: '77777777-7777-7777-7777-777777777703',
        assignedToHrName: 'Bilal Khan (Central HR North)',
        createdAt: '2026-08-20T10:00:00Z',
        updatedAt: '2026-08-22T14:30:00Z'
      },
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        joiningId: 'PX-JOIN-2026-0892',
        firstName: 'Ali',
        lastName: 'Raza',
        fatherName: 'Muhammad Raza',
        cnic: '42101-1234567-3',
        mobile: '+92-333-7788990',
        email: 'ali.raza@example.com',
        dateOfBirth: '1996-11-22',
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        currentAddress: 'Apartment 4B, Block 5, Clifton, Karachi',
        permanentAddress: 'House 88, Korangi, Karachi',
        zoneId: '33333333-3333-3333-3333-333333333302', // Zone South
        zoneName: 'Zone South (Sindh & Balochistan)',
        branchId: '44444444-4444-4444-4444-444444444403', // Karachi Port Mega Hub
        branchName: 'Karachi Port Mega Hub',
        departmentId: '55555555-5555-5555-5555-555555555502',
        departmentName: 'Finance & Cash-on-Delivery (COD)',
        designationId: '66666666-6666-6666-6666-666666666603',
        designationTitle: 'COD Reconciliation Specialist',
        expectedJoiningDate: '2026-09-15',
        track: 'EXECUTIVE',
        status: 'SUBMITTED',
        createdBy: '77777777-7777-7777-7777-777777777703',
        assignedToHrId: '77777777-7777-7777-7777-777777777706',
        assignedToHrName: 'Faisal Qureshi (Central HR South)',
        createdAt: '2026-08-25T09:00:00Z',
        updatedAt: '2026-08-25T09:00:00Z'
      },
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        joiningId: 'PX-JOIN-2026-0893',
        firstName: 'Bilal',
        lastName: 'Tariq',
        fatherName: 'Tariq Mehmood',
        cnic: '35202-7711223-9',
        mobile: '+92-300-8899112',
        email: 'bilal.tariq@example.com',
        dateOfBirth: '2000-02-18',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        currentAddress: 'Flat 3, Al-Madina Heights, Johar Town, Lahore',
        permanentAddress: 'Chak 12-L, Sahiwal',
        zoneId: '33333333-3333-3333-3333-333333333301', // Zone North
        zoneName: 'Zone North (Punjab & KPK)',
        branchId: '44444444-4444-4444-4444-444444444401', // Lahore Central Hub
        branchName: 'Lahore Central Hub',
        departmentId: '55555555-5555-5555-5555-555555555501',
        departmentName: 'Logistics & Fleet Operations',
        designationId: '66666666-6666-6666-6666-666666666601',
        designationTitle: 'Last-Mile Courier / Rider',
        expectedJoiningDate: '2026-09-05',
        track: 'NON_EXECUTIVE',
        status: 'SUBMITTED',
        createdBy: '77777777-7777-7777-7777-777777777703',
        assignedToHrId: '77777777-7777-7777-7777-777777777703',
        assignedToHrName: 'Bilal Khan (Central HR North)',
        isDelayed: true,
        delayedHours: 96,
        delayedReason: 'Branch Manager physical verification pending > 4 days',
        createdAt: '2026-08-20T08:30:00Z',
        updatedAt: '2026-08-20T08:30:00Z'
      },
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
        joiningId: 'PX-JOIN-2026-0894',
        firstName: 'Sana',
        lastName: 'Malik',
        fatherName: 'Malik Akhtar',
        cnic: '35201-9988112-4',
        mobile: '+92-322-5544332',
        email: 'sana.malik@example.com',
        dateOfBirth: '1997-07-30',
        gender: 'FEMALE',
        maritalStatus: 'SINGLE',
        currentAddress: 'House 55, Sector C, Bahria Town, Lahore',
        permanentAddress: 'House 55, Sector C, Bahria Town, Lahore',
        zoneId: '33333333-3333-3333-3333-333333333301', // Zone North
        zoneName: 'Zone North (Punjab & KPK)',
        branchId: '44444444-4444-4444-4444-444444444401', // Lahore Central Hub
        branchName: 'Lahore Central Hub',
        departmentId: '55555555-5555-5555-5555-555555555501',
        departmentName: 'Logistics & Fleet Operations',
        designationId: '66666666-6666-6666-6666-666666666602',
        designationTitle: 'Hub Dispatch Coordinator',
        expectedJoiningDate: '2026-09-10',
        track: 'EXECUTIVE',
        status: 'RETURNED_FOR_CORRECTION',
        createdBy: '77777777-7777-7777-7777-777777777703',
        assignedToHrId: '77777777-7777-7777-7777-777777777703',
        assignedToHrName: 'Bilal Khan (Central HR North)',
        createdAt: '2026-08-22T12:00:00Z',
        updatedAt: '2026-08-24T16:20:00Z'
      },
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
        joiningId: 'PX-JOIN-2026-0895',
        firstName: 'Muhammad',
        lastName: 'Waqas',
        fatherName: 'Waqas Ahmad',
        cnic: '35202-4433221-7',
        mobile: '+92-345-9988776',
        email: 'm.waqas@example.com',
        dateOfBirth: '1995-09-12',
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        currentAddress: 'Street 9, Model Town, Lahore',
        permanentAddress: 'Street 9, Model Town, Lahore',
        zoneId: '33333333-3333-3333-3333-333333333301', // Zone North
        zoneName: 'Zone North (Punjab & KPK)',
        branchId: '44444444-4444-4444-4444-444444444401', // Lahore Central Hub
        branchName: 'Lahore Central Hub',
        departmentId: '55555555-5555-5555-5555-555555555501',
        departmentName: 'Logistics & Fleet Operations',
        designationId: '66666666-6666-6666-6666-666666666601',
        designationTitle: 'Last-Mile Courier / Rider',
        expectedJoiningDate: '2026-09-12',
        track: 'NON_EXECUTIVE',
        status: 'UNDER_BRANCH_VERIFICATION',
        createdBy: '77777777-7777-7777-7777-777777777703',
        assignedToHrId: '77777777-7777-7777-7777-777777777703',
        assignedToHrName: 'Bilal Khan (Central HR North)',
        createdAt: '2026-08-24T14:15:00Z',
        updatedAt: '2026-08-26T11:00:00Z'
      },
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
        joiningId: 'PX-JOIN-2026-0896',
        firstName: 'Zeeshan',
        lastName: 'Akhtar',
        fatherName: 'Akhtar Hussain',
        cnic: '35201-1122334-5',
        mobile: '+92-334-1122889',
        email: 'zeeshan.akhtar@example.com',
        dateOfBirth: '1999-12-05',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        currentAddress: 'Plaza 2, Main Boulevard, Gulberg III, Lahore',
        permanentAddress: 'Kot Radha Kishan, Kasur',
        zoneId: '33333333-3333-3333-3333-333333333301', // Zone North
        zoneName: 'Zone North (Punjab & KPK)',
        branchId: '44444444-4444-4444-4444-444444444401', // Lahore Central Hub
        branchName: 'Lahore Central Hub',
        departmentId: '55555555-5555-5555-5555-555555555502',
        departmentName: 'Finance & Cash-on-Delivery (COD)',
        designationId: '66666666-6666-6666-6666-666666666603',
        designationTitle: 'COD Reconciliation Specialist',
        expectedJoiningDate: '2026-09-08',
        track: 'EXECUTIVE',
        status: 'CENTRAL_HR_REVIEW',
        createdBy: '77777777-7777-7777-7777-777777777703',
        assignedToHrId: '77777777-7777-7777-7777-777777777703',
        assignedToHrName: 'Bilal Khan (Central HR North)',
        isDelayed: true,
        delayedHours: 54,
        delayedReason: 'Central HR decision review pending > 48h after branch verification sign-off',
        createdAt: '2026-08-19T09:00:00Z',
        updatedAt: '2026-08-23T15:45:00Z'
      },
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7',
        joiningId: 'PX-JOIN-2026-0897',
        firstName: 'Farhan',
        lastName: 'Saeed',
        fatherName: 'Saeed Anwar',
        cnic: '37405-8899001-2',
        mobile: '+92-315-9900112',
        email: 'farhan.saeed@example.com',
        dateOfBirth: '1998-03-21',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        currentAddress: 'Sector I-9/3, Industrial Area, Islamabad',
        permanentAddress: 'Village Mohra, Rawalpindi',
        zoneId: '33333333-3333-3333-3333-333333333301', // Zone North
        zoneName: 'Zone North (Punjab & KPK)',
        branchId: '44444444-4444-4444-4444-444444444402', // Islamabad Express Depot
        branchName: 'Islamabad Express Depot',
        departmentId: '55555555-5555-5555-5555-555555555501',
        departmentName: 'Logistics & Fleet Operations',
        designationId: '66666666-6666-6666-6666-666666666601',
        designationTitle: 'Last-Mile Courier / Rider',
        expectedJoiningDate: '2026-09-18',
        track: 'NON_EXECUTIVE',
        status: 'SUBMITTED',
        createdBy: '77777777-7777-7777-7777-777777777703',
        createdAt: '2026-08-26T10:00:00Z',
        updatedAt: '2026-08-26T10:00:00Z'
      }
    ];

    // 12. Initial Applications
    this.applications = [
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        currentStep: 5,
        totalSteps: 6,
        submittedAt: '2026-08-21T11:00:00Z',
        branchVerifiedAt: '2026-08-22T14:30:00Z',
        branchVerifiedBy: '77777777-7777-7777-7777-777777777704',
        branchVerifiedByName: 'Usman Ali (Branch Manager - Lahore)',
        status: 'BRANCH_VERIFIED',
        metadata: {
          physicalDocumentsInspected: true,
          originalCnicVerified: true,
          drivingLicenseVerified: true,
          interviewRating: 'RECOMMENDED',
          finalRemarks: 'Original documents physically inspected at Lahore Central Hub. Candidate is physically fit and license valid.',
          signatureData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><text x="10" y="30" font-family="cursive" font-size="20">Usman Ali (BM)</text></svg>'
        }
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        currentStep: 3,
        totalSteps: 6,
        submittedAt: '2026-08-25T09:00:00Z',
        status: 'SUBMITTED',
        metadata: {
          physicalDocumentsInspected: false
        }
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        currentStep: 4,
        totalSteps: 6,
        submittedAt: '2026-08-23T08:30:00Z',
        status: 'SUBMITTED',
        metadata: {
          physicalDocumentsInspected: false
        }
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
        currentStep: 3,
        totalSteps: 6,
        submittedAt: '2026-08-22T12:00:00Z',
        status: 'RETURNED_FOR_CORRECTION',
        rejectionReason: 'CNIC copy is blurry and driving license scan is expired. Please re-upload clear high-res photos.',
        metadata: {
          physicalDocumentsInspected: true,
          returnedAt: '2026-08-24T16:20:00Z',
          returnedBy: '77777777-7777-7777-7777-777777777704'
        }
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
        currentStep: 4,
        totalSteps: 6,
        submittedAt: '2026-08-24T14:15:00Z',
        status: 'UNDER_BRANCH_VERIFICATION',
        metadata: {
          physicalDocumentsInspected: false,
          verificationStartedAt: '2026-08-26T11:00:00Z'
        }
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
        currentStep: 5,
        totalSteps: 6,
        submittedAt: '2026-08-19T09:00:00Z',
        branchVerifiedAt: '2026-08-23T15:45:00Z',
        branchVerifiedBy: '77777777-7777-7777-7777-777777777704',
        branchVerifiedByName: 'Usman Ali (Branch Manager - Lahore)',
        status: 'CENTRAL_HR_REVIEW',
        metadata: {
          physicalDocumentsInspected: true,
          finalRemarks: 'Cashier background verified. Security clearance cleared by Lahore branch.',
          forwardedAt: '2026-08-23T15:45:00Z'
        }
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7',
        currentStep: 3,
        totalSteps: 6,
        submittedAt: '2026-08-26T10:00:00Z',
        status: 'SUBMITTED',
        metadata: {
          physicalDocumentsInspected: false
        }
      }
    ];

    // 13. Candidate Documents
    this.documents = [
      // Candidate 1 (Hamza Rasheed - Verified)
      {
        id: 'doc-001',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        documentType: 'CNIC_FRONT',
        fileName: 'cnic_front_hamza.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 1048576,
        mimeType: 'image/jpeg',
        verificationStatus: 'ACCEPTED',
        ocrExtractedData: {
          cnic: '35201-8934123-1',
          name: 'Hamza Rasheed',
          fatherName: 'Rasheed Ahmed',
          dob: '1998-04-14'
        },
        remarks: 'Clear NADRA smart card CNIC copy verified',
        verifiedBy: '77777777-7777-7777-7777-777777777704',
        uploadedAt: '2026-08-20T10:30:00Z'
      },
      {
        id: 'doc-002',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        documentType: 'DRIVING_LICENSE',
        fileName: 'driving_license_hamza.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 2097152,
        mimeType: 'application/pdf',
        verificationStatus: 'ACCEPTED',
        ocrExtractedData: {
          licenseNumber: 'LHR-DL-994821',
          category: 'MOTORCYCLE',
          validUntil: '2029-05-10'
        },
        remarks: 'Valid Punjab Traffic Police motorcycle license verified',
        verifiedBy: '77777777-7777-7777-7777-777777777704',
        uploadedAt: '2026-08-20T10:45:00Z'
      },

      // Candidate 3 (Bilal Tariq - Pending Verification in Lahore)
      {
        id: 'doc-003',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        documentType: 'CNIC_FRONT',
        fileName: 'cnic_front_bilal.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 1258291,
        mimeType: 'image/jpeg',
        verificationStatus: 'PENDING',
        ocrExtractedData: {
          cnic: '35202-7711223-9',
          name: 'Bilal Tariq',
          fatherName: 'Tariq Mehmood',
          dob: '2000-02-18'
        },
        uploadedAt: '2026-08-23T08:35:00Z'
      },
      {
        id: 'doc-004',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        documentType: 'CNIC_BACK',
        fileName: 'cnic_back_bilal.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 984500,
        mimeType: 'image/jpeg',
        verificationStatus: 'PENDING',
        ocrExtractedData: {
          address: 'Flat 3, Al-Madina Heights, Johar Town, Lahore',
          expiryDate: '2030-02-17'
        },
        uploadedAt: '2026-08-23T08:36:00Z'
      },
      {
        id: 'doc-005',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        documentType: 'DRIVING_LICENSE',
        fileName: 'driving_license_bilal.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 1548000,
        mimeType: 'image/jpeg',
        verificationStatus: 'PENDING',
        ocrExtractedData: {
          licenseNumber: 'LHR-DL-448811',
          category: 'MOTORCYCLE / LTV',
          validUntil: '2028-11-30'
        },
        uploadedAt: '2026-08-23T08:40:00Z'
      },
      {
        id: 'doc-006',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        documentType: 'POLICE_VERIFICATION',
        fileName: 'police_clearance_bilal.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 2150000,
        mimeType: 'application/pdf',
        verificationStatus: 'PENDING',
        ocrExtractedData: {
          policeStation: 'Johar Town Police Station, Lahore',
          clearanceStatus: 'NO_CRIMINAL_RECORD'
        },
        uploadedAt: '2026-08-23T08:45:00Z'
      },

      // Candidate 4 (Sana Malik - Returned for correction)
      {
        id: 'doc-007',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
        documentType: 'CNIC_FRONT',
        fileName: 'cnic_front_sana_blurry.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 512000,
        mimeType: 'image/jpeg',
        verificationStatus: 'REQUIRES_REUPLOAD',
        remarks: 'CNIC photo is blurred and numbers cannot be verified. Please upload a clear photo taken under good lighting.',
        verifiedBy: '77777777-7777-7777-7777-777777777704',
        uploadedAt: '2026-08-22T12:10:00Z'
      },
      {
        id: 'doc-008',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
        documentType: 'EDUCATIONAL_DEGREE',
        fileName: 'degree_bba_sana.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 3145728,
        mimeType: 'application/pdf',
        verificationStatus: 'ACCEPTED',
        remarks: 'BBA transcript from University of Central Punjab verified',
        verifiedBy: '77777777-7777-7777-7777-777777777704',
        uploadedAt: '2026-08-22T12:15:00Z'
      },

      // Candidate 5 (Muhammad Waqas - Under Verification)
      {
        id: 'doc-009',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
        documentType: 'CNIC_FRONT',
        fileName: 'cnic_front_waqas.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 1420000,
        mimeType: 'image/jpeg',
        verificationStatus: 'PENDING',
        ocrExtractedData: {
          cnic: '35202-4433221-7',
          name: 'Muhammad Waqas'
        },
        uploadedAt: '2026-08-24T14:20:00Z'
      },
      {
        id: 'doc-010',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
        documentType: 'DRIVING_LICENSE',
        fileName: 'driving_license_waqas.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 1890000,
        mimeType: 'image/jpeg',
        verificationStatus: 'ACCEPTED',
        remarks: 'Original motor license inspected physically',
        verifiedBy: '77777777-7777-7777-7777-777777777704',
        uploadedAt: '2026-08-24T14:25:00Z'
      },

      // Candidate 6 (Zeeshan Akhtar - Forwarded)
      {
        id: 'doc-011',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
        documentType: 'CNIC_FRONT',
        fileName: 'cnic_front_zeeshan.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 1100000,
        mimeType: 'image/jpeg',
        verificationStatus: 'ACCEPTED',
        remarks: 'NADRA Smart card verified against original',
        verifiedBy: '77777777-7777-7777-7777-777777777704',
        uploadedAt: '2026-08-19T09:15:00Z'
      },
      {
        id: 'doc-012',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
        documentType: 'BANK_CHECK_LEAF',
        fileName: 'hbl_cheque_zeeshan.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 890000,
        mimeType: 'image/jpeg',
        verificationStatus: 'ACCEPTED',
        remarks: 'HBL Salary Account cheque leaf verified with IBAN match',
        verifiedBy: '77777777-7777-7777-7777-777777777704',
        uploadedAt: '2026-08-19T09:20:00Z'
      },

      // Candidate 2 (Ali Raza - Karachi Branch)
      {
        id: 'doc-013',
        candidateId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        documentType: 'CNIC_FRONT',
        fileName: 'cnic_front_ali_khi.jpg',
        fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        fileSizeBytes: 1200000,
        mimeType: 'image/jpeg',
        verificationStatus: 'PENDING',
        uploadedAt: '2026-08-25T09:10:00Z'
      }
    ];
  }

  // ==========================================
  // SUPER ADMIN & AGGREGATE METRICS
  // ==========================================
  public getSuperAdminMetrics(): SuperAdminDashboardData {
    const totalCandidates = this.candidates.length;
    const totalEmployees = this.employees.length;
    const totalStaffUsers = this.users.length;
    const totalZones = this.zones.length;
    const totalBranches = this.branches.length;
    const totalDepartments = this.departments.length;
    const totalDesignations = this.designations.length;

    const pendingBranchVerifications = this.candidates.filter(
      (c) => c.status === 'SUBMITTED' || c.status === 'UNDER_BRANCH_VERIFICATION'
    ).length;

    const pendingCentralHrReviews = this.candidates.filter(
      (c) => c.status === 'BRANCH_VERIFIED' || c.status === 'CENTRAL_HR_REVIEW'
    ).length;

    const totalActiveOverrides = this.permissionOverrides.length;

    // Attention Summary
    const delayedCandidates = this.candidates.filter((c) => c.isDelayed || c.status === 'RETURNED_FOR_CORRECTION');
    const stuckApplications = delayedCandidates.map((c) => {
      const createdTime = new Date(c.createdAt).getTime();
      const now = new Date().getTime();
      const daysPending = Math.max(1, Math.round((now - createdTime) / (1000 * 60 * 60 * 24)));
      return {
        id: c.id,
        joiningId: c.joiningId,
        candidateName: `${c.firstName} ${c.lastName}`,
        zoneName: c.zoneName || 'Unassigned Zone',
        branchName: c.branchName || 'Unassigned Branch',
        daysPending: c.delayedHours ? Math.round(c.delayedHours / 24) : daysPending,
        status: c.status,
        delayReason: c.delayedReason || (c.status === 'RETURNED_FOR_CORRECTION' ? 'Returned for document correction' : 'Pending verification sign-off')
      };
    });

    // Non-default permission users
    const usersWithOverridesMap = new Map<string, UserPermissionOverride[]>();
    for (const ov of this.permissionOverrides) {
      const list = usersWithOverridesMap.get(ov.userId) || [];
      list.push(ov);
      usersWithOverridesMap.set(ov.userId, list);
    }

    const nonDefaultPermissionUsers = Array.from(usersWithOverridesMap.entries()).map(([userId, userOvs]) => {
      const u = this.users.find((user) => user.id === userId);
      const grantedCodes = userOvs.filter((o) => o.isGranted).map((o) => o.permissionCode);
      const revokedCodes = userOvs.filter((o) => !o.isGranted).map((o) => o.permissionCode);
      return {
        userId,
        userName: u ? `${u.firstName} ${u.lastName}` : 'Unknown Staff',
        email: u ? u.email : '',
        role: u ? u.role : 'CENTRAL_HR',
        overridesCount: userOvs.length,
        grantedCodes,
        revokedCodes
      };
    });

    // Unassigned branches
    const assignedBranchIds = new Set(
      this.zoneAssignments.filter((za) => za.branchId).map((za) => za.branchId)
    );
    const unassignedBranchesCount = this.branches.filter((b) => !assignedBranchIds.has(b.id)).length;
    const inactiveStaffCount = this.users.filter((u) => !u.isActive).length;

    return {
      companyMetrics: {
        totalCandidates,
        totalEmployees,
        totalStaffUsers,
        totalZones,
        totalBranches,
        totalDepartments,
        totalDesignations,
        pendingBranchVerifications,
        pendingCentralHrReviews,
        totalActiveOverrides
      },
      attentionSummary: {
        delayedApplicationsCount: stuckApplications.length,
        stuckApplications,
        nonDefaultPermissionUsers,
        unassignedBranchesCount,
        inactiveStaffCount
      }
    };
  }

  // ==========================================
  // ZONAL HR METRICS & WORKLOAD
  // ==========================================
  public getZonalHrDashboardData(zoneId: string): ZonalHrDashboardData {
    const zone = this.zones.find((z) => z.id === zoneId) || this.zones[0];
    const targetZoneId = zone ? zone.id : zoneId;

    const zoneCandidates = this.candidates.filter((c) => c.zoneId === targetZoneId);
    const zoneBranches = this.branches.filter((b) => b.zoneId === targetZoneId);
    const zoneEmployees = this.employees.filter((e) => e.zoneId === targetZoneId);

    const submitted = zoneCandidates.filter((c) => c.status === 'SUBMITTED').length;
    const underBranchVerification = zoneCandidates.filter((c) => c.status === 'UNDER_BRANCH_VERIFICATION').length;
    const branchVerified = zoneCandidates.filter((c) => c.status === 'BRANCH_VERIFIED').length;
    const centralHrReview = zoneCandidates.filter((c) => c.status === 'CENTRAL_HR_REVIEW').length;
    const approved = zoneCandidates.filter((c) => c.status === 'APPROVED' || c.status === 'CONVERTED_TO_EMPLOYEE').length;
    const returnedForCorrection = zoneCandidates.filter((c) => c.status === 'RETURNED_FOR_CORRECTION').length;
    const rejected = zoneCandidates.filter((c) => c.status === 'REJECTED' || c.status === 'BRANCH_REJECTED').length;
    const delayed = zoneCandidates.filter((c) => c.isDelayed).length;

    // HR Workload (Central HR users in this zone)
    const hrAssignments = this.zoneAssignments.filter(
      (za) => za.zoneId === targetZoneId && !za.branchId
    );
    const hrUserIds = new Set(hrAssignments.map((za) => za.userId));
    const hrUsers = this.users.filter((u) => u.role === 'CENTRAL_HR' && (hrUserIds.has(u.id) || u.role === 'CENTRAL_HR'));

    const hrWorkload = hrUsers.slice(0, 3).map((u) => {
      const assignedCandidates = zoneCandidates.filter((c) => c.assignedToHrId === u.id || !c.assignedToHrId);
      const activePending = assignedCandidates.filter(
        (c) => c.status === 'BRANCH_VERIFIED' || c.status === 'CENTRAL_HR_REVIEW'
      ).length;
      const completed = assignedCandidates.filter((c) => c.status === 'APPROVED' || c.status === 'CONVERTED_TO_EMPLOYEE').length + 3;

      return {
        userId: u.id,
        userName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        assignedCount: assignedCandidates.length,
        activePendingCount: activePending,
        completedCount: completed,
        avgTurnaroundHours: 18.5
      };
    });

    // Branch Status
    const branchStatus = zoneBranches.map((b) => {
      const bmAssignment = this.zoneAssignments.find((za) => za.branchId === b.id);
      const bmUser = bmAssignment ? this.users.find((u) => u.id === bmAssignment.userId) : null;
      const branchCands = zoneCandidates.filter((c) => c.branchId === b.id);
      const pendingVer = branchCands.filter(
        (c) => c.status === 'SUBMITTED' || c.status === 'UNDER_BRANCH_VERIFICATION'
      ).length;
      const verCount = branchCands.filter(
        (c) => c.status === 'BRANCH_VERIFIED' || c.status === 'CENTRAL_HR_REVIEW' || c.status === 'APPROVED' || c.status === 'CONVERTED_TO_EMPLOYEE'
      ).length;
      const needsCorr = branchCands.filter((c) => c.status === 'RETURNED_FOR_CORRECTION').length;

      return {
        branchId: b.id,
        branchCode: b.code,
        branchName: b.name,
        city: b.city,
        bmName: bmUser ? `${bmUser.firstName} ${bmUser.lastName}` : 'Unassigned BM',
        bmPhone: bmUser?.phone || '+92 300 0000000',
        totalCandidates: branchCands.length,
        pendingVerification: pendingVer,
        verified: verCount,
        needsCorrection: needsCorr,
        avgVerificationHours: 12.4
      };
    });

    // Delayed Applications
    const delayedApplications = zoneCandidates
      .filter((c) => c.isDelayed || c.status === 'RETURNED_FOR_CORRECTION')
      .map((c) => ({
        id: c.id,
        joiningId: c.joiningId,
        candidateName: `${c.firstName} ${c.lastName}`,
        cnic: c.cnic,
        branchId: c.branchId,
        branchName: c.branchName || 'Lahore Central Hub',
        assignedHrName: c.assignedToHrName || 'Bilal Khan (Central HR North)',
        assignedHrId: c.assignedToHrId || '77777777-7777-7777-7777-777777777703',
        daysPending: c.delayedHours ? Math.round(c.delayedHours / 24) : 3,
        hoursPending: c.delayedHours || 72,
        status: c.status,
        reason: c.delayedReason || 'Physical document verification pending > 48h',
        track: c.track || 'NON_EXECUTIVE'
      }));

    return {
      zoneId: targetZoneId,
      zoneName: zone ? zone.name : 'Zone North (Punjab & KPK)',
      zoneCode: zone ? zone.code : 'ZONE-NORTH',
      metrics: {
        totalCandidates: zoneCandidates.length,
        submitted,
        underBranchVerification,
        branchVerified,
        centralHrReview,
        approved,
        returnedForCorrection,
        rejected,
        convertedEmployees: zoneEmployees.length,
        delayedApplications: delayed
      },
      hrWorkload,
      branchStatus,
      delayedApplications
    };
  }

  // ==========================================
  // ZONAL REPORTS (Turnaround, Workload, Performance, Rejections)
  // ==========================================
  public getZonalReports(zoneId: string): ZonalReportData {
    const zone = this.zones.find((z) => z.id === zoneId) || this.zones[0];
    const targetZoneId = zone ? zone.id : zoneId;
    const zoneBranches = this.branches.filter((b) => b.zoneId === targetZoneId);

    return {
      zoneId: targetZoneId,
      zoneName: zone ? zone.name : 'Zone North (Punjab & KPK)',
      generatedAt: new Date().toISOString(),
      turnaroundSummary: {
        avgTotalDays: 2.8,
        avgBranchHours: 14.2,
        avgCentralHrHours: 18.6,
        fastestBranch: zoneBranches[0]?.name || 'Lahore Central Hub',
        slowestBranch: zoneBranches[1]?.name || 'Islamabad Main Facility'
      },
      rejectionAnalysis: {
        totalRejections: 4,
        ratePercent: 5.8,
        topReasons: [
          { reason: 'CNIC Fake / NADRA Verification Mismatch', count: 2 },
          { reason: 'Failed Criminal / Police Clearance Check', count: 1 },
          { reason: 'Unsatisfactory Prior Employment Reference', count: 1 }
        ]
      },
      correctionAnalysis: {
        totalCorrections: 7,
        ratePercent: 12.4,
        topDocumentBottlenecks: [
          { docType: 'CNIC Front / Back (Blurry / Unreadable)', count: 4 },
          { docType: 'Driving License (Expired / Missing Category)', count: 2 },
          { docType: 'Bank Cheque Leaf (Unclear IBAN)', count: 1 }
        ]
      },
      branchPerformance: zoneBranches.map((b, idx) => ({
        branchName: b.name,
        totalProcessed: 18 + idx * 7,
        avgSpeedHours: 11.5 + idx * 4.2,
        approvalRatePercent: 92 - idx * 3
      }))
    };
  }

  // ==========================================
  // ORG HIERARCHY MUTATION HELPERS
  // ==========================================
  public updateZone(id: string, updates: Partial<Zone>): Zone | null {
    const idx = this.zones.findIndex((z) => z.id === id);
    if (idx === -1) return null;
    this.zones[idx] = {
      ...this.zones[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.zones[idx];
  }

  public deleteZone(id: string): boolean {
    const idx = this.zones.findIndex((z) => z.id === id);
    if (idx === -1) return false;
    this.zones.splice(idx, 1);
    return true;
  }

  public updateBranch(id: string, updates: Partial<Branch>): Branch | null {
    const idx = this.branches.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const current = this.branches[idx];
    let zoneName = current.zoneName;
    if (updates.zoneId && updates.zoneId !== current.zoneId) {
      const z = this.zones.find((zone) => zone.id === updates.zoneId);
      if (z) zoneName = z.name;
    }
    this.branches[idx] = {
      ...current,
      ...updates,
      zoneName,
      updatedAt: new Date().toISOString()
    };
    return this.branches[idx];
  }

  public deleteBranch(id: string): boolean {
    const idx = this.branches.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    this.branches.splice(idx, 1);
    return true;
  }

  public updateDepartment(id: string, updates: Partial<Department>): Department | null {
    const idx = this.departments.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.departments[idx] = {
      ...this.departments[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.departments[idx];
  }

  public deleteDepartment(id: string): boolean {
    const idx = this.departments.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.departments.splice(idx, 1);
    return true;
  }

  public updateDesignation(id: string, updates: Partial<Designation>): Designation | null {
    const idx = this.designations.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    const current = this.designations[idx];
    let departmentName = current.departmentName;
    if (updates.departmentId && updates.departmentId !== current.departmentId) {
      const dept = this.departments.find((d) => d.id === updates.departmentId);
      if (dept) departmentName = dept.name;
    }
    this.designations[idx] = {
      ...current,
      ...updates,
      departmentName,
      updatedAt: new Date().toISOString()
    };
    return this.designations[idx];
  }

  public deleteDesignation(id: string): boolean {
    const idx = this.designations.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.designations.splice(idx, 1);
    return true;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = {
      ...this.users[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.users[idx];
  }

  public assignManagerToZone(zoneId: string, userId: string, assignedBy: string): ZoneAssignment {
    const zone = this.zones.find((z) => z.id === zoneId);
    if (!zone) throw new Error('Zone not found');
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    // Remove previous zone manager assignment for this user in this zone if exists
    this.zoneAssignments = this.zoneAssignments.filter(
      (za) => !(za.userId === userId && za.zoneId === zoneId && !za.branchId)
    );

    const assignment: ZoneAssignment = {
      id: crypto.randomUUID(),
      userId,
      zoneId,
      zoneName: zone.name,
      branchId: null,
      branchName: `All ${zone.name} Hubs`,
      assignedBy,
      assignedAt: new Date().toISOString()
    };

    this.zoneAssignments.push(assignment);
    return assignment;
  }

  public assignBmToBranch(branchId: string, userId: string, assignedBy: string): ZoneAssignment {
    const branch = this.branches.find((b) => b.id === branchId);
    if (!branch) throw new Error('Branch not found');
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    // Remove existing BM assignment for this branch
    this.zoneAssignments = this.zoneAssignments.filter((za) => za.branchId !== branchId);

    const assignment: ZoneAssignment = {
      id: crypto.randomUUID(),
      userId,
      zoneId: branch.zoneId,
      zoneName: branch.zoneName,
      branchId: branch.id,
      branchName: branch.name,
      assignedBy,
      assignedAt: new Date().toISOString()
    };

    this.zoneAssignments.push(assignment);
    return assignment;
  }

  public reassignCandidate(candidateId: string, newHrUserId: string, reassignedByName: string): Candidate {
    const cIdx = this.candidates.findIndex((c) => c.id === candidateId);
    if (cIdx === -1) throw new Error('Candidate not found');
    const newHr = this.users.find((u) => u.id === newHrUserId);
    if (!newHr) throw new Error('Target HR staff user not found');

    this.candidates[cIdx] = {
      ...this.candidates[cIdx],
      assignedToHrId: newHr.id,
      assignedToHrName: `${newHr.firstName} ${newHr.lastName} (${newHr.role.replace(/_/g, ' ')})`,
      updatedAt: new Date().toISOString()
    };

    return this.candidates[cIdx];
  }

  public stepInCandidate(
    candidateId: string,
    action: 'EXPEDITE' | 'PRIORITIZE' | 'FORCE_FORWARD' | 'OVERRIDE_DECIDE',
    notes: string,
    actorName: string
  ): Candidate {
    const cIdx = this.candidates.findIndex((c) => c.id === candidateId);
    if (cIdx === -1) throw new Error('Candidate not found');

    const candidate = this.candidates[cIdx];
    let newStatus = candidate.status;
    if (action === 'FORCE_FORWARD') {
      newStatus = 'CENTRAL_HR_REVIEW';
    }

    this.candidates[cIdx] = {
      ...candidate,
      status: newStatus,
      isDelayed: false,
      zonalPriorityNotes: `[ZONAL STEP-IN by ${actorName}]: ${notes} (Action: ${action})`,
      updatedAt: new Date().toISOString()
    };

    return this.candidates[cIdx];
  }
}

export const dbStore = new DatabaseStore();
