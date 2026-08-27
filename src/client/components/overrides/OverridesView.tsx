import React, { useState, useEffect } from 'react';
import { User, Permission, Role, UserPermissionOverride, UserRole } from '../../../types';
import { Modal } from '../shared/Modal';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  Info,
  Clock,
  User as UserIcon
} from 'lucide-react';

interface OverridesViewProps {
  userRole: UserRole;
  effectivePermissions: string[];
}

export const OverridesView: React.FC<OverridesViewProps> = ({ userRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [overrides, setOverrides] = useState<UserPermissionOverride[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Override Form Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [targetPermissionCode, setTargetPermissionCode] = useState('');
  const [isGranted, setIsGranted] = useState(true);
  const [reason, setReason] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, pRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/permissions')
      ]);

      if (!uRes.ok || !pRes.ok) throw new Error('Failed to load permission matrix');

      const uData = await uRes.json();
      const pData = await pRes.json();

      setUsers(uData.filter((u: User) => u.role !== 'SUPER_ADMIN')); // Overrides applied to non-superadmin
      setPermissions(pData.permissions);
      setRoles(pData.roles);
      setOverrides(pData.overrides);

      if (uData.length > 0 && !selectedUserId) {
        const nonAdmin = uData.find((u: User) => u.role !== 'SUPER_ADMIN');
        if (nonAdmin) setSelectedUserId(nonAdmin.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const selectedUserRoleDef = roles.find((r) => r.name === selectedUser?.role);
  const userOverrides = overrides.filter((o) => o.userId === selectedUserId);

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory business justification reason is required for every permission override.');
      return;
    }
    setError(null);
    try {
      const res = await fetch('/api/permissions/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          permissionCode: targetPermissionCode,
          isGranted,
          reason: reason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save override');

      setIsOverrideModalOpen(false);
      setReason('');
      setActionSuccess(`Permission override saved and recorded in audit log.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetOverride = async (overrideId: string) => {
    try {
      const res = await fetch(`/api/permissions/overrides/${overrideId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset override');
      setActionSuccess('Override reset back to role default.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openConfigModal = (permCode: string, initialGrant: boolean) => {
    setTargetPermissionCode(permCode);
    setIsGranted(initialGrant);
    setReason('');
    setIsOverrideModalOpen(true);
  };

  return (
    <div id="overrides-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-rose-600" />
            Custom Permission Override System
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Layer 2 Governance: Super Admin explicit grant/revocation per staff user with mandatory audit tracking.
          </p>
        </div>

        {/* User Picker */}
        {users.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
            <UserIcon className="w-4 h-4 text-slate-500 ml-1.5" />
            <span className="text-xs font-semibold text-slate-700">Target User:</span>
            <select
              id="override-target-user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-md px-2.5 py-1 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Target User Summary Card */}
      {selectedUser && (
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                {selectedUser.role.replace(/_/g, ' ')}
              </span>
              <h3 className="text-base font-bold">
                {selectedUser.firstName} {selectedUser.lastName}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">{selectedUser.email}</p>
            <p className="text-xs text-slate-300 mt-2">
              <span className="text-slate-400 font-medium">Assigned Boundaries: </span>
              {selectedUser.zoneAssignments && selectedUser.zoneAssignments.length > 0
                ? selectedUser.zoneAssignments.map((za) => `${za.zoneName} (${za.branchName || 'All Branches'})`).join(', ')
                : 'Nationwide (Central)'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs">
            <div className="text-center px-2">
              <div className="text-lg font-bold text-emerald-400">
                {selectedUserRoleDef?.defaultPermissions.length || 0}
              </div>
              <div className="text-[10px] text-slate-400">Role Defaults</div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center px-2">
              <div className="text-lg font-bold text-amber-400">{userOverrides.length}</div>
              <div className="text-[10px] text-slate-400">Active Overrides</div>
            </div>
          </div>
        </div>
      )}

      {/* 3-Layer Authorization Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <div className="font-semibold text-slate-800">Layer 1: Role Default</div>
            <div className="text-[11px] text-slate-500">Inherent permission from user's primary role.</div>
          </div>
        </div>
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
          <div>
            <div className="font-semibold text-amber-900">Layer 2: User Override</div>
            <div className="text-[11px] text-amber-700">Super Admin customized grant or revocation.</div>
          </div>
        </div>
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
          <div>
            <div className="font-semibold text-blue-900">Layer 3: Scope Guard</div>
            <div className="text-[11px] text-blue-700">Zone/branch boundaries remain non-bypassable.</div>
          </div>
        </div>
      </div>

      {/* Permissions Table Matrix */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">Loading permission matrix...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Permission Code & Name</th>
                  <th className="px-5 py-3">Module</th>
                  <th className="px-5 py-3 text-center">Layer 1 (Role Default)</th>
                  <th className="px-5 py-3 text-center">Layer 2 (User Override)</th>
                  <th className="px-5 py-3 text-center">Effective Status</th>
                  <th className="px-5 py-3 text-right">Super Admin Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((perm) => {
                  const isRoleDefault = Boolean(selectedUserRoleDef?.defaultPermissions.includes(perm.code));
                  const override = userOverrides.find((o) => o.permissionCode === perm.code);

                  let effectiveAllowed = isRoleDefault;
                  if (override) {
                    effectiveAllowed = override.isGranted;
                  }

                  const isNonOverrideable = perm.code === 'audit:view';

                  return (
                    <tr key={perm.id} id={`perm-row-${perm.code}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold font-mono text-slate-900 text-[11px]">{perm.code}</div>
                        <div className="font-semibold text-slate-800 text-xs">{perm.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{perm.description}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {perm.module}
                        </span>
                      </td>

                      {/* Layer 1 */}
                      <td className="px-5 py-3.5 text-center">
                        {isRoleDefault ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-slate-400" /> Denied
                          </span>
                        )}
                      </td>

                      {/* Layer 2 */}
                      <td className="px-5 py-3.5 text-center">
                        {override ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                override.isGranted
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {override.isGranted ? 'OVERRIDE: GRANTED' : 'OVERRIDE: REVOKED'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 max-w-[140px] truncate" title={override.reason}>
                              "{override.reason}"
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">— None —</span>
                        )}
                      </td>

                      {/* Effective Status */}
                      <td className="px-5 py-3.5 text-center">
                        {effectiveAllowed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ALLOWED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-md border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> BLOCKED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {isNonOverrideable ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200" title="Audit logs are strictly non-overrideable by specification">
                            <Lock className="w-3 h-3 text-slate-400" /> Super-Admin Immutable
                          </span>
                        ) : !isSuperAdmin ? (
                          <span className="text-xs text-slate-400 italic">Super Admin Only</span>
                        ) : override ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openConfigModal(perm.code, !override.isGranted)}
                              className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleResetOverride(override.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Reset to role default"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {!isRoleDefault && (
                              <button
                                onClick={() => openConfigModal(perm.code, true)}
                                className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                              >
                                + Grant
                              </button>
                            )}
                            {isRoleDefault && (
                              <button
                                onClick={() => openConfigModal(perm.code, false)}
                                className="px-2 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                              >
                                - Revoke
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Override Configuration Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Configure Permission Override"
        subtitle={`Apply explicit permission grant/revocation for ${selectedUser?.email}.`}
      >
        <form onSubmit={handleSaveOverride} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="text-slate-500 font-semibold">Target Permission:</div>
            <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{targetPermissionCode}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Override Action</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer text-xs font-bold transition-all ${
                  isGranted
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="grant_state"
                  checked={isGranted}
                  onChange={() => setIsGranted(true)}
                  className="sr-only"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Explicitly GRANT
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer text-xs font-bold transition-all ${
                  !isGranted
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="grant_state"
                  checked={!isGranted}
                  onChange={() => setIsGranted(false)}
                  className="sr-only"
                />
                <XCircle className="w-4 h-4 text-rose-600" />
                Explicitly REVOKE
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Mandatory Business Justification Reason
              </label>
              <span className="text-[10px] text-rose-600 font-bold">* Required for Audit Trail</span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Provide a detailed administrative reason (e.g. Special candidate onboarding wave delegation approved by VP HR)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Notice:</strong> This override modifies Layer 2 authorization. Layer 3 Geographic Data Scopes
              (Zone/Branch boundaries) will still be enforced strictly at database level.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOverrideModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
            >
              Apply & Write Audit Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
