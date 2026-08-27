import React, { useState, useEffect } from 'react';
import { AuditLog, UserRole } from '../../../types';
import { Modal } from '../shared/Modal';
import {
  FileSearch,
  ShieldCheck,
  Lock,
  Search,
  Filter,
  Calendar,
  User as UserIcon,
  Eye,
  FileCode,
  ShieldAlert
} from 'lucide-react';

interface AuditLogsViewProps {
  userRole: UserRole;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ userRole }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const fetchLogs = async () => {
    if (!isSuperAdmin) {
      setError('CRITICAL SECURITY: Access Denied. Audit Logs are strictly reserved for Super Admin.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedActionFilter) params.append('action', selectedActionFilter);
      if (selectedRoleFilter) params.append('actorRole', selectedRoleFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch audit logs');
      }
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedActionFilter, selectedRoleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-xs max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Privileged Audit Log Restricted</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          System audit logs are strictly immutable and restricted exclusively to the <strong>Super Admin</strong> role.
          By design specification, audit log inspection permissions cannot be overridden or delegated.
        </p>
      </div>
    );
  }

  return (
    <div id="audit-logs-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-rose-600" />
            Immutable Audit Trail Logs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cryptographic, tamper-evident log capturing every administrative override, org mutation, and verification action.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
            Super Admin Exclusive
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor email, action name, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="">All Actor Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ZONAL_HR_MANAGER">Zonal HR Manager</option>
            <option value="CENTRAL_HR">Central HR</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
          </select>

          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">Loading audit events...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
          No audit records found matching search filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Actor / Principal</th>
                  <th className="px-5 py-3">Action Event</th>
                  <th className="px-5 py-3">Target Entity</th>
                  <th className="px-5 py-3">Business Reason</th>
                  <th className="px-5 py-3 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} id={`audit-row-${log.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{log.actorEmail}</div>
                      <span className="inline-block text-[10px] font-mono font-bold text-slate-500">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-slate-800">{log.entityType}</span>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                        {log.entityId}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-700" title={log.reason}>
                      {log.reason || 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
        subtitle={`Immutable Record ID: ${selectedLog?.id}`}
        maxWidth="max-w-3xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">Actor Email</span>
                <span className="font-bold text-slate-900">{selectedLog.actorEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">Actor Role</span>
                <span className="font-mono font-bold text-slate-800">{selectedLog.actorRole}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">IP Address</span>
                <span className="font-mono text-slate-700">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px]">Logged At</span>
                <span className="text-slate-700">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">Reason / Justification:</span>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                {selectedLog.reason || 'No specific justification notes.'}
              </div>
            </div>

            {/* State Diffs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Previous State:</span>
                <pre className="p-3 bg-slate-900 text-slate-300 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                  {selectedLog.oldState ? JSON.stringify(selectedLog.oldState, null, 2) : 'null (New Entity)'}
                </pre>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">New Applied State:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                  {selectedLog.newState ? JSON.stringify(selectedLog.newState, null, 2) : 'null (Deleted Entity)'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold"
              >
                Close Record
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
