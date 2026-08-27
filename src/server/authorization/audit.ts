import { dbStore } from '../db/store';
import { AuditLog, UserRole } from '../../types';

export interface RecordAuditParams {
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
}

export class AuditLogger {
  public static log(params: RecordAuditParams): AuditLog {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      zoneId: params.zoneId || null,
      branchId: params.branchId || null,
      oldState: params.oldState || null,
      newState: params.newState || null,
      reason: params.reason || 'Routine administrative operation',
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'PostEx-Core-Engine/1.0',
      createdAt: new Date().toISOString()
    };

    // Prepend to maintain newest first
    dbStore.auditLogs.unshift(entry);
    return entry;
  }
}
