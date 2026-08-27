import React, { useState, useEffect } from 'react';
import { Branch, Zone, UserRole } from '../../../types';
import { Modal } from '../shared/Modal';
import { GitBranch, Plus, MapPin, Building, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

interface BranchesViewProps {
  userRole: UserRole;
  effectivePermissions: string[];
}

export const BranchesView: React.FC<BranchesViewProps> = ({ userRole, effectivePermissions }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [zoneId, setZoneId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const canManage = userRole === 'SUPER_ADMIN' || effectivePermissions.includes('org:manage_branches');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, zRes] = await Promise.all([
        fetch('/api/organization/branches'),
        fetch('/api/organization/zones')
      ]);

      if (!bRes.ok || !zRes.ok) throw new Error('Failed to load branch data');

      const bData = await bRes.json();
      const zData = await zRes.json();

      setBranches(bData);
      setZones(zData);
      if (zData.length > 0) setZoneId(zData[0].id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/organization/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId, code, name, city, address })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create branch');

      setIsCreateOpen(false);
      setCode('');
      setName('');
      setCity('');
      setAddress('');
      setActionSuccess(`Branch ${data.name} (${data.code}) created successfully`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div id="branches-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-rose-600" />
            Branch Facilities & Hubs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Physical dispatch hubs, verification offices, and regional distribution facilities.
          </p>
        </div>

        {canManage && (
          <button
            id="add-branch-btn"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Branch
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

      {/* Table of Branches */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">Loading branch directory...</div>
      ) : branches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
          No branches accessible within your current geographic assignment.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Facility Name</th>
                  <th className="px-5 py-3">Zone Jurisdiction</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Physical Address</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.map((b) => (
                  <tr key={b.id} id={`branch-row-${b.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{b.code}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{b.name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {b.zoneName}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700 flex items-center gap-1.5 pt-3.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {b.city}
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{b.address}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Branch Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Branch Facility"
        subtitle="Establish a new branch hub linked to an operational zone."
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Operational Zone</label>
            <select
              required
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Code</label>
              <input
                type="text"
                required
                placeholder="e.g. BR-RWP-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 uppercase font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                placeholder="e.g. Rawalpindi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rawalpindi Main Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Street Address</label>
            <textarea
              rows={2}
              required
              placeholder="Full street address and logistics landmark..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-xs"
            >
              Create Branch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
