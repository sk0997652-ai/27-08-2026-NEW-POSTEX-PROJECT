import React, { useState, useEffect } from 'react';
import { Zone, UserRole } from '../../../types';
import { Modal } from '../shared/Modal';
import { Globe2, Plus, CheckCircle2, XCircle, MapPin, Building, ShieldAlert } from 'lucide-react';

interface ZonesViewProps {
  userRole: UserRole;
  effectivePermissions: string[];
}

export const ZonesView: React.FC<ZonesViewProps> = ({ userRole, effectivePermissions }) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const canManage = userRole === 'SUPER_ADMIN' || effectivePermissions.includes('org:manage_zones');

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organization/zones');
      if (!res.ok) throw new Error('Failed to fetch zones');
      const data = await res.json();
      setZones(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/organization/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create zone');

      setIsCreateOpen(false);
      setCode('');
      setName('');
      setDescription('');
      setActionSuccess(`Zone ${data.code} created successfully`);
      fetchZones();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleZone = async (zoneId: string) => {
    try {
      const res = await fetch(`/api/organization/zones/${zoneId}/toggle`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');
      fetchZones();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div id="zones-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-rose-600" />
            Operational Zones
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Top-level organizational territories governing regional branch allocations and candidate isolation.
          </p>
        </div>

        {canManage && (
          <button
            id="add-zone-btn"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Zone
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

      {/* Grid of Zones */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">Loading operational zones...</div>
      ) : zones.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
          No operational zones found in current scope.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              id={`zone-card-${zone.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 mb-1.5">
                      {zone.code}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900">{zone.name}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      zone.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {zone.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {zone.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{zone.branchCount || 0} Facilities / Hubs</span>
                </div>

                {canManage && (
                  <button
                    id={`toggle-zone-${zone.id}`}
                    onClick={() => handleToggleZone(zone.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                  >
                    {zone.isActive ? 'Deactivate Zone' : 'Activate Zone'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Zone Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Operational Zone"
        subtitle="Define a new geographic jurisdiction for PostEx operations."
      >
        <form onSubmit={handleCreateZone} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Zone Code</label>
            <input
              type="text"
              required
              placeholder="e.g. ZONE-CENTRAL"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 uppercase font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Zone Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Zone Central (Multan, Faisalabad, Sahiwal)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Territory notes, operational coverage, regional notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              Save Zone
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
