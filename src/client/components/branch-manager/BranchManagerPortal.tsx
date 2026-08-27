import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Building2,
  ShieldCheck,
  UserCheck,
  FileText,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { UserRole } from '../../../types';
import { CandidateDetailView } from './CandidateDetailView';
import { Phase4IsolationTestCard } from './Phase4IsolationTestCard';

interface BranchMetrics {
  totalApplications: number;
  pendingVerification: number;
  verified: number;
  needsCorrection: number;
  forwardedToHr: number;
}

interface ApplicationInboxItem {
  id: string;
  candidateId: string;
  candidateName: string;
  joiningId: string;
  position: string;
  department?: string;
  cnic: string;
  mobile: string;
  email: string;
  branchId: string;
  branchName: string;
  zoneName: string;
  daysPending: number;
  status: string;
  submittedAt: string;
  totalDocs: number;
  verifiedDocs: number;
  correctionDocs: number;
  pendingDocs: number;
  allChecked: boolean;
  canForward: boolean;
}

interface BranchManagerPortalProps {
  userRole: UserRole;
  currentUserName?: string;
}

export const BranchManagerPortal: React.FC<BranchManagerPortalProps> = ({
  userRole,
  currentUserName = 'Usman Ali (BM - Lahore)'
}) => {
  const [metrics, setMetrics] = useState<BranchMetrics>({
    totalApplications: 0,
    pendingVerification: 0,
    verified: 0,
    needsCorrection: 0,
    forwardedToHr: 0
  });
  const [branchName, setBranchName] = useState<string>('Lahore Central Hub');
  const [applications, setApplications] = useState<ApplicationInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'daysPending' | 'name' | 'joiningId'>('daysPending');

  // Candidate detail drilldown
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<{
    candidate: any;
    application: any;
    documents: any[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Active view mode
  const [viewTab, setViewTab] = useState<'inbox' | 'tests'>('inbox');

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch metrics
      const metricsRes = await fetch('/api/branch-manager/metrics');
      if (!metricsRes.ok) {
        const err = await metricsRes.json();
        throw new Error(err.error || 'Failed to load branch metrics');
      }
      const metricsData = await metricsRes.json();
      setMetrics(metricsData.metrics);
      setBranchName(metricsData.branchName);

      // Fetch inbox applications
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set('q', searchQuery);
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (positionFilter !== 'ALL') queryParams.set('position', positionFilter);

      const appRes = await fetch(`/api/branch-manager/applications?${queryParams.toString()}`);
      if (!appRes.ok) {
        const err = await appRes.json();
        throw new Error(err.error || 'Failed to load application inbox');
      }
      const appData = await appRes.json();
      setApplications(appData.applications || []);
    } catch (e: any) {
      setError(e.message || 'An error occurred loading Branch Manager data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, statusFilter, positionFilter]);

  // Load detailed dossier when candidate is selected
  const handleSelectCandidate = async (candidateId: string) => {
    try {
      setDetailLoading(true);
      setSelectedCandidateId(candidateId);
      const res = await fetch(`/api/branch-manager/applications/${candidateId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load candidate application dossier');
      }
      const data = await res.json();
      setCandidateDetail(data);
    } catch (e: any) {
      setError(e.message || 'Access restricted');
      setSelectedCandidateId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToInbox = () => {
    setSelectedCandidateId(null);
    setCandidateDetail(null);
    fetchData();
  };

  // Extract distinct positions for filter dropdown
  const uniquePositions = Array.from(new Set(applications.map(a => a.position).filter(Boolean)));

  // Sorted applications list
  const sortedApplications = [...applications].sort((a, b) => {
    if (sortBy === 'daysPending') return b.daysPending - a.daysPending;
    if (sortBy === 'name') return a.candidateName.localeCompare(b.candidateName);
    if (sortBy === 'joiningId') return a.joiningId.localeCompare(b.joiningId);
    return 0;
  });

  return (
    <div id="branch-manager-portal" className="space-y-6">
      
      {/* Top Banner with Branch Context & Navigation Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {branchName}
            </span>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
              Phase 4 BM Verification Portal
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-rose-600" />
            Branch Manager Verification & Onboarding Hub
          </h1>
          <p className="text-xs text-slate-500">
            Physical credential verification, document checklist evaluation, digital signature sign-off, and Central HR dispatch.
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setViewTab('inbox');
                setSelectedCandidateId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewTab === 'inbox'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Application Inbox
            </button>
            <button
              type="button"
              onClick={() => {
                setViewTab('tests');
                setSelectedCandidateId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewTab === 'tests'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" /> Test Branch Isolation (BM A vs B)
            </button>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-bold underline text-rose-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW: Isolation Test Suite */}
      {viewTab === 'tests' && (
        <Phase4IsolationTestCard />
      )}

      {/* VIEW: Candidate Detail View */}
      {viewTab === 'inbox' && selectedCandidateId && candidateDetail && (
        <CandidateDetailView
          candidate={candidateDetail.candidate}
          application={candidateDetail.application}
          documents={candidateDetail.documents}
          onBack={handleBackToInbox}
          onRefresh={async () => {
            await handleSelectCandidate(selectedCandidateId);
            fetchData();
          }}
          currentUserName={currentUserName}
        />
      )}

      {/* VIEW: Main Inbox & Dashboard Metrics */}
      {viewTab === 'inbox' && !selectedCandidateId && (
        <div className="space-y-6">
          
          {/* 5 Required Dashboard Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            
            {/* Metric 1: Total Applications */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Applications</span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics.totalApplications}
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Assigned to this branch</p>
            </div>

            {/* Metric 2: Pending Verification */}
            <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/20 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending Verification</span>
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-900 tracking-tight">
                {metrics.pendingVerification}
              </div>
              <p className="text-[10px] text-amber-600 font-medium">Awaiting physical check</p>
            </div>

            {/* Metric 3: Verified */}
            <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Verified</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-900 tracking-tight">
                {metrics.verified}
              </div>
              <p className="text-[10px] text-emerald-600 font-medium">Approved by BM</p>
            </div>

            {/* Metric 4: Needs Correction */}
            <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/20 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-rose-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Needs Correction</span>
                <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-900 tracking-tight">
                {metrics.needsCorrection}
              </div>
              <p className="text-[10px] text-rose-600 font-medium">Returned to candidate</p>
            </div>

            {/* Metric 5: Forwarded to HR */}
            <div className="bg-white rounded-2xl p-4 border border-blue-200 bg-blue-50/20 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-blue-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Forwarded to HR</span>
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-blue-900 tracking-tight">
                {metrics.forwardedToHr}
              </div>
              <p className="text-[10px] text-blue-600 font-medium">Dispatched to Central HR</p>
            </div>

          </div>

          {/* Application Inbox Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Inbox Search & Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative min-w-[240px] max-w-sm flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by candidate name, joining ID, CNIC..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-800"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Status Filter */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by application status"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium text-slate-700"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_BRANCH_VERIFICATION">Under Verification</option>
                    <option value="BRANCH_VERIFIED">Branch Verified</option>
                    <option value="RETURNED_FOR_CORRECTION">Needs Correction</option>
                    <option value="CENTRAL_HR_REVIEW">Forwarded to HR</option>
                  </select>
                </div>

                {/* Position Filter */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Position:</span>
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    aria-label="Filter by job position"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium text-slate-700"
                  >
                    <option value="ALL">All Positions</option>
                    {uniquePositions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div className="flex items-center gap-1 text-xs">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort applications"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium text-slate-700"
                  >
                    <option value="daysPending">Sort by Days Pending</option>
                    <option value="name">Sort by Candidate Name</option>
                    <option value="joiningId">Sort by Joining ID</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Applications Table */}
            {sortedApplications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No applications match your filter criteria</h4>
                <p className="text-xs text-slate-400">
                  Try clearing your search query or changing status filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setPositionFilter('ALL');
                  }}
                  className="mt-2 text-xs text-rose-600 font-bold hover:underline"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Candidate Name</th>
                      <th className="py-3 px-4">Joining ID</th>
                      <th className="py-3 px-4">Position</th>
                      <th className="py-3 px-4 text-center">Days Pending</th>
                      <th className="py-3 px-4">Document Check Status</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedApplications.map((app) => {
                      const isHighUrgency = app.daysPending >= 3;
                      return (
                        <tr
                          key={app.candidateId}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => handleSelectCandidate(app.candidateId)}
                        >
                          {/* Candidate Name */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                              {app.candidateName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              CNIC: {app.cnic}
                            </div>
                          </td>

                          {/* Joining ID */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                            {app.joiningId}
                          </td>

                          {/* Position */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800">{app.position}</div>
                            <div className="text-[11px] text-slate-400">{app.branchName}</div>
                          </td>

                          {/* Days Pending */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                                isHighUrgency
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isHighUrgency && <Flame className="w-3 h-3 text-rose-600" />}
                              {app.daysPending}d
                            </span>
                          </td>

                          {/* Document Checklist Progress */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-semibold text-slate-800">
                                {app.verifiedDocs + app.correctionDocs}/{app.totalDocs} Checked
                              </div>
                              {app.allChecked ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  Complete
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  {app.pendingDocs} Left
                                </span>
                              )}
                            </div>
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div
                                className="bg-rose-500 h-full rounded-full transition-all"
                                style={{
                                  width: `${( (app.verifiedDocs + app.correctionDocs) / Math.max(app.totalDocs, 1) ) * 100}%`
                                }}
                              />
                            </div>
                          </td>

                          {/* Application Status Badge */}
                          <td className="py-3.5 px-4">
                            {app.status === 'SUBMITTED' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Submitted
                              </span>
                            )}
                            {app.status === 'UNDER_BRANCH_VERIFICATION' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Under Verification
                              </span>
                            )}
                            {app.status === 'BRANCH_VERIFIED' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Branch Verified
                              </span>
                            )}
                            {app.status === 'RETURNED_FOR_CORRECTION' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Needs Correction
                              </span>
                            )}
                            {app.status === 'CENTRAL_HR_REVIEW' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Forwarded to HR
                              </span>
                            )}
                            {app.status === 'APPROVED' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                Approved
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCandidate(app.candidateId);
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1"
                            >
                              <span>Verify Dossier</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Showing {sortedApplications.length} candidate applications in {branchName}</span>
              <span className="font-mono text-slate-400">PostEx RLS Layer: Enforced</span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
