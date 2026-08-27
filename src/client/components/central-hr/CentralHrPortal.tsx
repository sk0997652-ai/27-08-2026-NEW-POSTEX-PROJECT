import React, { useState, useEffect } from 'react';
import {
  Users2,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  Building2,
  GitBranch,
  FileText,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Download,
  Award,
  Layers,
  FlaskConical,
  Eye,
  SlidersHorizontal,
  XCircle
} from 'lucide-react';
import { UserRole, CandidateTrack, CentralHrMetrics } from '../../../types';
import { CandidateCreationModal } from './CandidateCreationModal';
import { CandidateDetailModal } from './CandidateDetailModal';
import { JoiningDossierModal } from './JoiningDossierModal';
import { Phase5TestLabModal } from './Phase5TestLabModal';

interface CentralHrPortalProps {
  userRole: UserRole;
  currentUserName: string;
}

export type QueueTab = 'ALL' | 'NEW' | 'PENDING_BM' | 'PENDING_HR' | 'APPROVED';

export const CentralHrPortal: React.FC<CentralHrPortalProps> = ({
  userRole,
  currentUserName
}) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<CentralHrMetrics | null>(null);
  const [metaInfo, setMetaInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Queue State
  const [activeQueue, setActiveQueue] = useState<QueueTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Lookups for filters
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Modals
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<any>(null);
  const [showTestLab, setShowTestLab] = useState(false);

  const fetchMetricsAndLookups = async () => {
    try {
      const [mRes, bRes, dRes] = await Promise.all([
        fetch('/api/central-hr/metrics'),
        fetch('/api/organization/branches'),
        fetch('/api/organization/departments')
      ]);

      const [mData, bData, dData] = await Promise.all([
        mRes.json(),
        bRes.json(),
        dRes.json()
      ]);

      setMetrics(mData.metrics);
      setMetaInfo({
        totalEmployees: mData.totalEmployees,
        assignedZoneId: mData.assignedZoneId,
        assignedZoneName: mData.assignedZoneName,
        userRole: mData.userRole
      });
      setBranches(bData || []);
      setDepartments(dData || []);
    } catch (err) {
      console.error('Failed to load metrics', err);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeQueue !== 'ALL') params.append('queue', activeQueue);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedTrack !== 'ALL') params.append('track', selectedTrack);
      if (selectedBranch !== 'ALL') params.append('branchId', selectedBranch);
      if (selectedDept !== 'ALL') params.append('departmentId', selectedDept);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

      const res = await fetch(`/api/central-hr/candidates?${params.toString()}`);
      const data = await res.json();
      setCandidates(data || []);
    } catch (err) {
      console.error('Failed to fetch candidates', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetricsAndLookups();
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [activeQueue, searchQuery, selectedTrack, selectedBranch, selectedDept, selectedStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetricsAndLookups();
    fetchCandidates();
  };

  const handleCandidateCreated = (newCand: any) => {
    setShowCreationModal(false);
    handleRefresh();
    setSelectedCandidateId(newCand.id);
  };

  const handleViewDossier = async (candidateId: string, employeeId?: string) => {
    try {
      const id = employeeId || candidateId;
      const res = await fetch(`/api/central-hr/employees/${id}/dossier`);
      const data = await res.json();
      if (res.ok) {
        setSelectedDossier(data);
      } else {
        alert(data.error || 'Failed to load dossier');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Central HR Operations & Enrolment</h1>
              <p className="text-xs text-slate-500 font-medium">Candidate Track Governance, Lifecycle Decisions & Joining Dossier Generation</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTestLab(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5 text-rose-400" />
            <span>Phase 5 Diagnostic Lab</span>
          </button>

          <button
            onClick={() => setShowCreationModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create Candidate</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
            title="Refresh candidates and metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Zone Isolation Notice Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-600/20 text-rose-400 rounded-lg border border-rose-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Strict Zone Isolation Enforcement</span>
              <span className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] font-mono text-slate-300">Layer 3 RLS</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {metaInfo.assignedZoneName ? (
                <>Operating within <strong>{metaInfo.assignedZoneName}</strong>. Candidates outside your assigned zone are inaccessible.</>
              ) : (
                <>Super Admin Multi-Zone View Active. Nationwide scope unrestricted.</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span>Active Employees:</span>
          <strong className="text-emerald-400">{metaInfo.totalEmployees ?? 0}</strong>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        
        <button
          onClick={() => setActiveQueue('ALL')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeQueue === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pipeline</div>
          <div className="text-xl font-black mt-1">{metrics?.totalCandidates ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All Candidates</div>
        </button>

        <button
          onClick={() => setActiveQueue('NEW')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeQueue === 'NEW'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">New / Submitted</div>
          <div className="text-xl font-black mt-1">{metrics?.newCandidates ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting BM</div>
        </button>

        <button
          onClick={() => setActiveQueue('PENDING_BM')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeQueue === 'PENDING_BM'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending BM</div>
          <div className="text-xl font-black mt-1">{metrics?.pendingBm ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Physical Check</div>
        </button>

        <button
          onClick={() => setActiveQueue('PENDING_HR')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeQueue === 'PENDING_HR'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Pending HR</div>
          <div className="text-xl font-black mt-1">{metrics?.pendingHr ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Decision Required</div>
        </button>

        <button
          onClick={() => setActiveQueue('APPROVED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeQueue === 'APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Approved & Enrolled</div>
          <div className="text-xl font-black mt-1">{metrics?.approved ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active Dossiers</div>
        </button>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Needs Correction</div>
          <div className="text-xl font-black mt-1 text-amber-600">{metrics?.returnedForCorrection ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Returned</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Rejected</div>
          <div className="text-xl font-black mt-1 text-rose-600">{metrics?.rejected ?? 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Archived</div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Full-Text Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, CNIC, Joining ID, or Email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          {/* Track Filter */}
          <div>
            <select
              value={selectedTrack}
              onChange={e => setSelectedTrack(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              <option value="ALL">All Tracks</option>
              <option value="EXECUTIVE">Executive Track</option>
              <option value="NON_EXECUTIVE">Non-Executive Track</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              <option value="ALL">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Candidates List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900">
              Candidate Enrolment Queue ({candidates.length})
            </h3>
            {activeQueue !== 'ALL' && (
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-full uppercase">
                Filter: {activeQueue}
              </span>
            )}
          </div>
          
          <div className="text-xs text-slate-500">
            Showing all scoped applications
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
            <p className="text-xs font-semibold">Loading candidates from zone database...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users2 className="w-10 h-10 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-700">No Candidates Found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or register a new candidate using the button above.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-4 py-3">CNIC & Joining ID</th>
                  <th className="px-4 py-3">Track & Role</th>
                  <th className="px-4 py-3">Branch / Zone</th>
                  <th className="px-4 py-3">BM Docs Verification</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map(c => {
                  const isEnrolled = c.status === 'CONVERTED_TO_EMPLOYEE' || Boolean(c.employee);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Candidate Name & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {c.firstName?.[0]}{c.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{c.firstName} {c.lastName}</div>
                            <div className="text-[11px] text-slate-400">{c.email || c.mobile}</div>
                          </div>
                        </div>
                      </td>

                      {/* CNIC & Joining ID */}
                      <td className="px-4 py-4">
                        <div className="font-mono font-semibold text-slate-800">{c.cnic}</div>
                        <div className="font-mono text-[10px] text-rose-600 font-bold">{c.joiningId}</div>
                      </td>

                      {/* Track & Role */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-sm uppercase tracking-wider mb-1 ${
                          c.track === 'EXECUTIVE'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {c.track || 'NON_EXECUTIVE'}
                        </span>
                        <div className="font-bold text-slate-800">{c.designationTitle}</div>
                        <div className="text-[10px] text-slate-400">{c.departmentName}</div>
                      </td>

                      {/* Branch & Zone */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800">{c.branchName}</div>
                        <div className="text-[10px] text-slate-400">{c.zoneName}</div>
                      </td>

                      {/* BM Verification Progress */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <span className="font-bold text-emerald-600">{c.documentSummary?.verified || 0}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-600">{c.documentSummary?.total || 0} docs</span>
                          </div>
                          {c.documentSummary?.needsCorrection > 0 && (
                            <div className="text-[10px] text-rose-600 font-semibold">
                              {c.documentSummary.needsCorrection} needs re-upload
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.status === 'CONVERTED_TO_EMPLOYEE' || c.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : (c.status === 'BRANCH_VERIFIED' || c.status === 'CENTRAL_HR_REVIEW'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : (c.status === 'UNDER_BRANCH_VERIFICATION'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : (c.status === 'RETURNED_FOR_CORRECTION'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200')))
                        }`}>
                          {c.status === 'CONVERTED_TO_EMPLOYEE' ? 'ENROLLED EMPLOYEE' : c.status.replace(/_/g, ' ')}
                        </span>
                        {c.employee && (
                          <div className="font-mono text-[10px] text-emerald-700 font-bold mt-1">
                            {c.employee.employeeId}
                          </div>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isEnrolled && (
                            <button
                              onClick={() => handleViewDossier(c.id, c.employee?.id)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 flex items-center space-x-1"
                              title="Print Joining Dossier"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Dossier</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedCandidateId(c.id)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center space-x-1"
                          >
                            <span>Review</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Candidate Creation Modal */}
      {showCreationModal && (
        <CandidateCreationModal
          onClose={() => setShowCreationModal(false)}
          onSuccess={handleCandidateCreated}
          currentUserRole={userRole}
        />
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidateId && (
        <CandidateDetailModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
          onRefresh={handleRefresh}
          userRole={userRole}
        />
      )}

      {/* Joining Dossier PDF Modal */}
      {selectedDossier && (
        <JoiningDossierModal
          dossier={selectedDossier}
          onClose={() => setSelectedDossier(null)}
        />
      )}

      {/* Phase 5 Test Lab Modal */}
      {showTestLab && (
        <Phase5TestLabModal
          onClose={() => setShowTestLab(false)}
          onRefreshData={handleRefresh}
        />
      )}

    </div>
  );
};
