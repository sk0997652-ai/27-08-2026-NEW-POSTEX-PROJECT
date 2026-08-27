import { dbStore } from '../db/store';
import {
  User,
  UserRole,
  AuthorizationCheckRequest,
  AuthorizationCheckResult
} from '../../types';

export class AuthorizationEngine {
  /**
   * Evaluates the full 3-Layer Authorization policy
   * Layer 1: Role Default
   * Layer 2: User-specific Override
   * Layer 3: Zone/Branch Scoping
   */
  public static evaluate(req: AuthorizationCheckRequest): AuthorizationCheckResult {
    const user = dbStore.users.find(u => u.id === req.userId);
    if (!user) {
      return {
        allowed: false,
        reason: 'User not found in system',
        layer1RoleDefault: false,
        layer2OverrideState: 'NO_OVERRIDE',
        effectivePermission: false,
        layer3ScopeEvaluation: {
          passed: false,
          userScope: 'NONE',
          requestedZone: req.targetZoneId,
          requestedBranch: req.targetBranchId,
          message: 'User does not exist or has been deactivated'
        }
      };
    }

    if (!user.isActive) {
      return {
        allowed: false,
        reason: 'User account is deactivated',
        layer1RoleDefault: false,
        layer2OverrideState: 'NO_OVERRIDE',
        effectivePermission: false,
        layer3ScopeEvaluation: {
          passed: false,
          userScope: 'NONE',
          message: 'Account inactive'
        }
      };
    }

    // Super Admin has global bypass for all administrative and operational operations
    if (user.role === 'SUPER_ADMIN') {
      return {
        allowed: true,
        reason: 'SUPER_ADMIN role grants unrestricted global access across all organizational scopes',
        layer1RoleDefault: true,
        layer2OverrideState: 'NO_OVERRIDE',
        effectivePermission: true,
        layer3ScopeEvaluation: {
          passed: true,
          userScope: 'NATIONWIDE',
          requestedZone: req.targetZoneId,
          requestedBranch: req.targetBranchId,
          message: 'Super Admin operates nationwide with zero geographic boundary restriction'
        }
      };
    }

    // Strict Rule: Audit Logs are Super-Admin ONLY and strictly non-overrideable
    if (req.permissionCode === 'audit:view') {
      return {
        allowed: false,
        reason: 'CRITICAL SECURITY: Audit logs are strictly immutable and restricted exclusively to Super Admin. Overrides are prohibited on audit logs.',
        layer1RoleDefault: false,
        layer2OverrideState: 'NO_OVERRIDE',
        effectivePermission: false,
        layer3ScopeEvaluation: {
          passed: false,
          userScope: 'NONE',
          message: 'Audit logs restricted to Super Admin'
        }
      };
    }

    // LAYER 1: Role Default Permission
    const roleDef = dbStore.roles.find(r => r.name === user.role);
    const layer1RoleDefault = Boolean(roleDef?.defaultPermissions.includes(req.permissionCode));

    // LAYER 2: User Permission Override
    const override = dbStore.permissionOverrides.find(
      o => o.userId === user.id && o.permissionCode === req.permissionCode
    );

    let effectivePermission = layer1RoleDefault;
    let layer2OverrideState: 'GRANTED' | 'REVOKED' | 'NO_OVERRIDE' = 'NO_OVERRIDE';

    if (override) {
      effectivePermission = override.isGranted;
      layer2OverrideState = override.isGranted ? 'GRANTED' : 'REVOKED';
    }

    if (!effectivePermission) {
      return {
        allowed: false,
        reason: override
          ? `Permission '${req.permissionCode}' was explicitly REVOKED for this user by Super Admin (Reason: ${override.reason})`
          : `Role '${user.role}' lacks permission '${req.permissionCode}' by default`,
        layer1RoleDefault,
        layer2OverrideState,
        effectivePermission: false,
        layer3ScopeEvaluation: {
          passed: false,
          userScope: user.role === 'CENTRAL_HR' ? 'NATIONWIDE' : 'ZONAL',
          requestedZone: req.targetZoneId,
          requestedBranch: req.targetBranchId,
          message: 'Permission check failed at Layer 1/2'
        }
      };
    }

    // LAYER 3: Zone & Branch Data Scope Evaluation
    const scopeResult = this.evaluateScope(user, req.targetZoneId, req.targetBranchId);

    if (!scopeResult.passed) {
      return {
        allowed: false,
        reason: `SECURITY SCOPE VIOLATION: User has effective permission '${req.permissionCode}', but target resource (${scopeResult.requestedZone || 'N/A'}/${scopeResult.requestedBranch || 'N/A'}) falls outside assigned data scope. Permission overrides CANNOT bypass zonal/branch isolation.`,
        layer1RoleDefault,
        layer2OverrideState,
        effectivePermission: true,
        layer3ScopeEvaluation: scopeResult
      };
    }

    return {
      allowed: true,
      reason: `Authorized: Passed Layer 1 (${layer1RoleDefault ? 'Role Default' : 'No Role Default'}), Layer 2 (${layer2OverrideState}), and Layer 3 (Within ${scopeResult.userScope} Scope)`,
      layer1RoleDefault,
      layer2OverrideState,
      effectivePermission: true,
      layer3ScopeEvaluation: scopeResult
    };
  }

  /**
   * Checks whether the user's geographic assignment allows access to target zone and/or branch
   */
  private static evaluateScope(
    user: User,
    targetZoneId?: string | null,
    targetBranchId?: string | null
  ): AuthorizationCheckResult['layer3ScopeEvaluation'] {
    // Central HR belongs to exactly one assigned zone (Zone isolation strictly enforced)
    if (user.role === 'CENTRAL_HR') {
      const assignments = dbStore.zoneAssignments.filter(za => za.userId === user.id);
      if (assignments.length > 0) {
        const assignedZoneId = assignments[0].zoneId;
        const assignedZoneName = assignments[0].zoneName || 'Assigned Zone';

        if (targetZoneId && targetZoneId !== assignedZoneId) {
          return {
            passed: false,
            userScope: 'ZONAL',
            requestedZone: targetZoneId,
            requestedBranch: targetBranchId,
            message: `Cross-zone access denied. Central HR (${user.email}) is assigned to ${assignedZoneName} and cannot access candidates or resources in other zones.`
          };
        }
        return {
          passed: true,
          userScope: 'ZONAL',
          requestedZone: targetZoneId,
          requestedBranch: targetBranchId,
          message: `Access permitted within Central HR assigned zone (${assignedZoneName})`
        };
      }
      return {
        passed: true,
        userScope: 'NATIONWIDE',
        requestedZone: targetZoneId,
        requestedBranch: targetBranchId,
        message: 'Central HR nationwide operational scope'
      };
    }

    const assignments = dbStore.zoneAssignments.filter(za => za.userId === user.id);

    if (assignments.length === 0) {
      // If user has no specific zone assignment (e.g. general candidate or unassigned staff)
      if (!targetZoneId && !targetBranchId) {
        return {
          passed: true,
          userScope: 'NONE',
          message: 'Global non-zonal resource'
        };
      }
      return {
        passed: false,
        userScope: 'NONE',
        requestedZone: targetZoneId,
        requestedBranch: targetBranchId,
        message: 'User has no assigned zone or branch boundaries'
      };
    }

    // Zonal HR Manager Check
    if (user.role === 'ZONAL_HR_MANAGER') {
      // Must match assigned zone
      if (targetZoneId) {
        const hasZone = assignments.some(a => a.zoneId === targetZoneId);
        if (!hasZone) {
          return {
            passed: false,
            userScope: 'ZONAL',
            requestedZone: targetZoneId,
            requestedBranch: targetBranchId,
            message: `Cross-zone access denied. User is assigned to other zones.`
          };
        }
      }
      return {
        passed: true,
        userScope: 'ZONAL',
        requestedZone: targetZoneId,
        requestedBranch: targetBranchId,
        message: 'Access permitted within assigned zonal boundary'
      };
    }

    // Branch Manager Check
    if (user.role === 'BRANCH_MANAGER') {
      if (targetBranchId) {
        const hasBranch = assignments.some(
          a => a.branchId === targetBranchId || (a.zoneId === targetZoneId && !a.branchId)
        );
        if (!hasBranch) {
          return {
            passed: false,
            userScope: 'BRANCH',
            requestedZone: targetZoneId,
            requestedBranch: targetBranchId,
            message: `Cross-branch access denied. Branch Manager is strictly bound to assigned branch.`
          };
        }
      } else if (targetZoneId) {
        const hasZone = assignments.some(a => a.zoneId === targetZoneId);
        if (!hasZone) {
          return {
            passed: false,
            userScope: 'BRANCH',
            requestedZone: targetZoneId,
            requestedBranch: targetBranchId,
            message: `Cross-zone access denied.`
          };
        }
      }
      return {
        passed: true,
        userScope: 'BRANCH',
        requestedZone: targetZoneId,
        requestedBranch: targetBranchId,
        message: 'Access permitted within assigned branch boundary'
      };
    }

    return {
      passed: true,
      userScope: 'NONE',
      message: 'Self / unconstrained scope'
    };
  }
}
