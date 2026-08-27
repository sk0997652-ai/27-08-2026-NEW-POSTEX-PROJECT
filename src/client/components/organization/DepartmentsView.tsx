import React, { useState, useEffect } from 'react';
import { Department, Designation, UserRole } from '../../../types';
import { Modal } from '../shared/Modal';
import { Building2, Plus, Briefcase, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DepartmentsViewProps {
  userRole: UserRole;
  effectivePermissions: string[];
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({ userRole, effectivePermissions }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);

  // Dept Form
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');

  // Desig Form
  const [targetDeptId, setTargetDeptId] = useState('');
  const [desigCode, setDesigCode] = useState('');
  const [desigTitle, setDesigTitle] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const canManage = userRole === 'SUPER_ADMIN' || effectivePermissions.includes('org:manage_departments');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, desRes] = await Promise.all([
        fetch('/api/organization/departments'),
        fetch('/api/organization/designations')
      ]);

      if (!dRes.ok || !desRes.ok) throw new Error('Failed to load departments');

      const dData = await dRes.json();
      const desData = await desRes.json();

      setDepartments(dData);
      setDesignations(desData);
      if (dData.length > 0) setTargetDeptId(dData[0].id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/organization/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: deptCode, name: deptName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create department');

      setIsDeptModalOpen(false);
      setDeptCode('');
      setDeptName('');
      setActionSuccess(`Department ${data.name} created`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateDesig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/organization/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: targetDeptId, code: desigCode, title: desigTitle })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create designation');

      setIsDesigModalOpen(false);
      setDesigCode('');
      setDesigTitle('');
      setActionSuccess(`Designation ${data.title} created`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div id="departments-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-rose-600" />
            Departments & Designations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Corporate functional departments and job title classifications for onboarding candidates.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              id="add-dept-btn"
              onClick={() => setIsDeptModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Department
            </button>
            <button
              id="add-desig-btn"
              onClick={() => setIsDesigModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Designation
            </button>
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

      {/* Department Cards with Nested Designations */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">Loading organizational departments...</div>
      ) : (
        <div className="space-y-4">
          {departments.map((dept) => {
            const deptDesignations = designations.filter((d) => d.departmentId === dept.id);
            return (
              <div key={dept.id} id={`dept-card-${dept.id}`} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {dept.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    {deptDesignations.length} Active Positions
                  </span>
                </div>

                {deptDesignations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No designations created under this department yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {deptDesignations.map((desig) => (
                      <div
                        key={desig.id}
                        id={`desig-card-${desig.id}`}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 truncate">{desig.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{desig.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Create Department"
        subtitle="Establish a new company department."
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code</label>
            <input
              type="text"
              required
              placeholder="e.g. DEPT-LEGAL"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 uppercase font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Legal, Compliance & Regulatory Affairs"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Designation Modal */}
      <Modal
        isOpen={isDesigModalOpen}
        onClose={() => setIsDesigModalOpen(false)}
        title="Create Designation"
        subtitle="Define a job title under a specific department."
      >
        <form onSubmit={handleCreateDesig} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Department</label>
            <select
              required
              value={targetDeptId}
              onChange={(e) => setTargetDeptId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation Code</label>
              <input
                type="text"
                required
                placeholder="e.g. DESIG-LEGAL-OFC"
                value={desigCode}
                onChange={(e) => setDesigCode(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 uppercase font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Legal Compliance Officer"
                value={desigTitle}
                onChange={(e) => setDesigTitle(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDesigModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
            >
              Save Designation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
