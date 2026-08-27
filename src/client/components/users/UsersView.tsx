import React, { useState, useEffect } from 'react';
import { User, UserRole, Zone, Branch } from '../../../types';
import { Modal } from '../shared/Modal';
import {
  Users2,
  Plus,
  Shield,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

interface UsersViewProps {
  userRole: UserRole;
  effectivePermissions: string[];
}

export const UsersView: React.FC<UsersViewProps> = ({ userRole, effectivePermissions }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Staff Form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnicRaw, setCnicRaw] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ZONAL_HR_MANAGER');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const canManage = userRole === 'SUPER_ADMIN' || effectivePermissions.includes('users:manage_staff');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, zRes, bRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/organization/zones'),
        fetch('/api/organization/branches')
      ]);

      if (!uRes.ok) {
        const uErr = await uRes.json();
        throw new Error(uErr.error || 'Failed to load staff users');
      }

      const uData = await uRes.json();
      const zData = await zRes.json();
      const bData = await bRes.json();

      setUsers(uData);
      setZones(zData);
      setBranches(bData);
      if (zData.length > 0) setSelectedZoneId(zData[0].id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBranches = branches.filter((b) => b.zoneId === selectedZoneId);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone,
          cnicRaw,
          role: selectedRole,
          zoneId: selectedZoneId || null,
          branchId: selectedBranchId || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setIsCreateOpen(false);
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setCnicRaw('');
      setActionSuccess(`Staff user ${data.email} created with ${data.role} role`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/toggle`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div id="users-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-5 h-5 text-rose-600" />
            Staff Directory & Zone Allocations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authorized portal users, assigned role permissions, and geographic zone/branch boundaries.
          </p>
        </div>

        {canManage && (
          <button
            id="add-staff-btn"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Staff User
          </button>
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

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">Loading user accounts...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Staff Member</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Masked CNIC</th>
                  <th className="px-5 py-3">Geographic Scope</th>
                  <th className="px-5 py-3">Custom Overrides</th>
                  <th className="px-5 py-3 text-right">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const hasOverrides = u.overrides && u.overrides.length > 0;
                  return (
                    <tr key={u.id} id={`user-row-${u.id}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono font-medium text-slate-700">
                        {u.cnicMasked || '35201-*******-0'}
                      </td>
                      <td className="px-5 py-3">
                        {u.zoneAssignments && u.zoneAssignments.length > 0 ? (
                          <div className="space-y-1">
                            {u.zoneAssignments.map((za) => (
                              <div key={za.id} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{za.zoneName}</span>
                                {za.branchName && (
                                  <span className="text-[10px] text-slate-500">({za.branchName})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            {u.role === 'SUPER_ADMIN' || u.role === 'CENTRAL_HR' ? 'Nationwide (All Zones)' : 'Unassigned'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {hasOverrides ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <KeyRound className="w-3 h-3 text-amber-600" />
                            {u.overrides!.length} Active Override(s)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Role Default</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {u.isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                              </>
                            )}
                          </span>

                          {canManage && u.role !== 'SUPER_ADMIN' && (
                            <button
                              id={`toggle-user-${u.id}`}
                              onClick={() => handleToggleUser(u.id)}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Portal Staff User"
        subtitle="Provision an enterprise staff account with role and geographic boundary."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Tariq"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Mansoor"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                required
                placeholder="e.g. staff.member@postex.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
              <input
                type="text"
                required
                placeholder="+92 300 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">National CNIC (13 Digits)</label>
              <input
                type="text"
                required
                placeholder="3520112345671"
                value={cnicRaw}
                onChange={(e) => setCnicRaw(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">Will be masked automatically across non-privileged views.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Role</label>
              <select
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                <option value="ZONAL_HR_MANAGER">Zonal HR Manager</option>
                <option value="CENTRAL_HR">Central HR</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          </div>

          {/* Geographic Boundaries Allocation */}
          {selectedRole !== 'SUPER_ADMIN' && selectedRole !== 'CENTRAL_HR' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                Geographic Scope Boundary
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Zone</label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => {
                      setSelectedZoneId(e.target.value);
                      setSelectedBranchId('');
                    }}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-hidden"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole === 'BRANCH_MANAGER' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Branch</label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-hidden"
                    >
                      <option value="">Select Branch...</option>
                      {filteredBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
