import React, { useState, useEffect } from 'react';
import {
  UserRole,
  Candidate,
  ZonalHrDashboardData,
  ZonalReportData,
  User,
  Branch
} from '../../../types';
import { Modal } from '../shared/Modal';
import {
  Globe2,
  GitBranch,
  Users2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Briefcase,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  Send,
  Zap
} from 'lucide-react';

interface ZonalHrPortalProps {
  userRole: UserRole;
  currentUserName: string;
}

type ZonalTab = 'dashboard' | 'candidates' | 'staff' | 'reports';

export const ZonalHrPortal: React.FC<ZonalHrPortalProps> = ({ userRole, currentUserName }) => {
  const [activeTab, setActiveTab] = useState<ZonalTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<ZonalHrDashboardData | null>(null);
  const [reportsData, setReportsData] = useState<ZonalReportData | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Filtering
  const [candidateSearch, setCandidateSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [onlyDelayed, setOnlyDelayed] = useState(false);

  // Modals
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedCandidateForReassign, setSelectedCandidateForReassign] = useState<Candidate | null>(null);
  const [targetHrId, setTargetHrId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const [isStepInOpen, setIsStepInOpen] = useState(false);
  const [selectedCandidateForStepIn, setSelectedCandidateForStepIn] = useState<Candidate | null>(null);
  const [stepInAction, setStepInAction] = useState('EXPEDITE');
  const [stepInNotes, setStepInNotes] = useState('');

  const [isAssignBmOpen, setIsAssignBmOpen] = useState(false);
  const [selectedBranchForBm, setSelectedBranchForBm] = useState<Branch | null>(null);
  const [selectedBmUserId, setSelectedBmUserId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchZonalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashRes, candRes, staffRes, repRes, branchRes] = await Promise.all([
        fetch('/api/zonal-hr/dashboard'),
        fetch('/api/zonal-hr/candidates'),
        fetch('/api/zonal-hr/staff'),
        fetch('/api/zonal-hr/reports'),
        fetch('/api/organization/branches')
      ]);

      if (!dashRes.ok) {
        const dErr = await dashRes.json();
        throw new Error(dErr.error || 'Failed to load Zonal HR Dashboard');
      }

      setDashboardData(await dashRes.json());
      if (candRes.ok) setCandidates(await candRes.json());
      if (staffRes.ok) setStaffUsers(await staffRes.json());
      if (repRes.ok) setReportsData(await repRes.json());
      if (branchRes.ok) setBranches(await branchRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZonalData();
  }, []);

  // Reassign candidate handler
  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateForReassign || !targetHrId) return;
    if (!reassignReason.trim()) {
      setError('A mandatory reassignment reason is required.');
      return;
    }
    try {
      const res = await fetch(`/api/zonal-hr/candidates/${selectedCandidateForReassign.id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newHrId: targetHrId,
          reason: reassignReason.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reassignment failed');

      setIsReassignOpen(false);
      setSelectedCandidateForReassign(null);
      setReassignReason('');
      setActionSuccess(`Candidate ${data.joiningId} successfully reassigned.`);
      fetchZonalData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Step-In handler
  const handleStepIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateForStepIn) return;
    if (!stepInNotes.trim()) {
      setError('Mandatory directive notes are required for stepping in.');
      return;
    }
    try {
      const res = await fetch(`/api/zonal-hr/candidates/${selectedCandidateForStepIn.id}/step-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: stepInAction,
          notes: stepInNotes.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Step-in directive failed');

      setIsStepInOpen(false);
      setSelectedCandidateForStepIn(null);
      setStepInNotes('');
      setActionSuccess(`Executive directive [${stepInAction}] applied to candidate ${data.joiningId}.`);
      fetchZonalData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Assign BM handler
  const handleAssignBm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchForBm || !selectedBmUserId) return;
    try {
      const res = await fetch(`/api/zonal-hr/branches/${selectedBranchForBm.id}/assign-bm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedBmUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'BM assignment failed');

      setIsAssignBmOpen(false);
      setSelectedBranchForBm(null);
      setActionSuccess(`Branch Manager assigned to ${data.branchName}.`);
      fetchZonalData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filtered Candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchSearch =
      !candidateSearch ||
      c.personalInfo.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.personalInfo.cnic.includes(candidateSearch) ||
      c.joiningId.toLowerCase().includes(candidateSearch.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchBranch = !branchFilter || c.branchId === branchFilter;
    const matchTrack = !trackFilter || c.track === trackFilter;
    const matchDelayed = !onlyDelayed || c.isDelayed;

    return matchSearch && matchStatus && matchBranch && matchTrack && matchDelayed;
  });

  const centralHrStaff = staffUsers.filter((u) => u.role === 'CENTRAL_HR');
  const bmStaff = staffUsers.filter((u) => u.role === 'BRANCH_MANAGER');

  return (
    <div id="zonal-hr-portal" className="space-y-6">
      {/* Scope Context Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
                <Globe2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Zonal HR Governance Portal
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {dashboardData?.zoneName || 'Assigned Zone'} ({dashboardData?.zoneCode || 'ZONE'})
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Regional Workforce Oversight, Bottleneck Resolution, Branch Compliance &amp; Candidate Flow Acceleration
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
              <span className="text-slate-400">Scope Isolation: </span>
              <strong className="text-emerald-400 font-mono">ENFORCED</strong>
            </div>
            <button
              onClick={fetchZonalData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title="Refresh Zonal State"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Security Isolation Notice */}
        <div className="mt-4 p-2.5 bg-purple-950/60 border border-purple-800/50 rounded-lg flex items-center gap-2 text-[11px] text-purple-200">
          <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong>Zonal Policy Boundary:</strong> Read/write authority is restricted to candidates, branches, and staff within <strong>{dashboardData?.zoneName}</strong>. Cross-zone operations, zone/branch creation, system configuration, and audit logs are strictly restricted to Super Admin.
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-800 mt-5 pt-4 text-xs font-medium">
          {[
            { id: 'dashboard', label: 'Zonal Dashboard & Bottlenecks', icon: Clock },
            { id: 'candidates', label: `Candidate Workflows (${candidates.length})`, icon: Users2 },
            { id: 'staff', label: `Zone Staff (${staffUsers.length}) & Branches`, icon: GitBranch },
            { id: 'reports', label: 'Zonal Analytics & Reports', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`zonal-hr-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as ZonalTab)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Feedback */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between text-emerald-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center justify-between text-rose-800 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            Dismiss
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 1: ZONAL DASHBOARD */}
      {/* ==================================================== */}
      {activeTab === 'dashboard' && dashboardData && (
        <div className="space-y-6">
          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total In Zone', value: dashboardData.overview.totalCandidatesInZone, color: 'text-slate-900', bg: 'bg-slate-50' },
              { label: 'Submitted / New', value: dashboardData.overview.submitted, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Under BM Verif.', value: dashboardData.overview.underBranchVerification, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'BM Verified', value: dashboardData.overview.branchVerified, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Central HR Review', value: dashboardData.overview.underCentralHrReview, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Approved & Enroled', value: dashboardData.overview.approved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Returned (Correction)', value: dashboardData.overview.returnedForCorrection, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Rejected', value: dashboardData.overview.rejected, color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'Converted Employees', value: dashboardData.overview.convertedToEmployees, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Delayed (>48h)', value: dashboardData.overview.delayedApplications, color: 'text-rose-600', bg: 'bg-rose-100 font-black' }
            ].map((metric, i) => (
              <div key={i} className={`p-4 rounded-xl border border-slate-200 bg-white shadow-2xs`}>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{metric.label}</div>
                <div className={`text-2xl font-black mt-1 ${metric.color}`}>{metric.value}</div>
              </div>
            ))}
          </div>

          {/* DELAYED APPLICATIONS QUEUE (Step-In Center) */}
          <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Delayed Applications Attention Queue ({dashboardData.delayedQueue.length})
                </h2>
              </div>
              <span className="text-xs text-slate-500">Applications exceeding the 48-hour regional SLA</span>
            </div>

            {dashboardData.delayedQueue.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                No applications currently exceed regional turnaround thresholds.
              </div>
            ) : (
              <div className="space-y-2">
                {dashboardData.delayedQueue.map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {app.joiningId}
                        </span>
                        <span className="font-bold text-slate-900">{app.candidateName}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{app.cnic}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Branch: <strong>{app.branchName}</strong> &bull; Assigned HR: <strong>{app.assignedHrName}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                          {app.hoursPending}h / {app.daysPending}d Pending
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5 italic">{app.delayReason}</div>
                      </div>

                      {/* Step-In & Reassign Buttons */}
                      <button
                        onClick={() => {
                          const c = candidates.find((cand) => cand.id === app.id);
                          if (c) {
                            setSelectedCandidateForStepIn(c);
                            setIsStepInOpen(true);
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md shadow-xs flex items-center gap-1 text-xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Step In</span>
                      </button>

                      <button
                        onClick={() => {
                          const c = candidates.find((cand) => cand.id === app.id);
                          if (c) {
                            setSelectedCandidateForReassign(c);
                            setIsReassignOpen(true);
                          }
                        }}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-semibold rounded-md flex items-center gap-1 text-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reassign</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TWO COLUMN GRID: HR Workload & Branch Status Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Central HR Workload Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-purple-600" />
                  Central HR Officer Workload
                </h3>
                <span className="text-xs text-slate-500">Assigned to {dashboardData.zoneName}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">Officer Name</th>
                      <th className="p-2.5 text-center">Assigned</th>
                      <th className="p-2.5 text-center">Pending Review</th>
                      <th className="p-2.5 text-center">Completed</th>
                      <th className="p-2.5 text-right">Avg Turnaround</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                    {dashboardData.hrWorkload.map((hr) => (
                      <tr key={hr.hrId} className="hover:bg-slate-50/70">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{hr.hrName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{hr.email}</div>
                        </td>
                        <td className="p-2.5 text-center font-bold">{hr.assignedCount}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            hr.pendingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {hr.pendingCount}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">{hr.completedCount}</td>
                        <td className="p-2.5 text-right font-mono font-semibold">{hr.avgTurnaroundHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Branch Status Matrix */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-600" />
                  Branch Verification Matrix
                </h3>
                <span className="text-xs text-slate-500">{dashboardData.branchStatus.length} Facilities</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5">Branch Facility</th>
                      <th className="p-2.5">Branch Manager</th>
                      <th className="p-2.5 text-center">Pending Verif.</th>
                      <th className="p-2.5 text-center">Verified</th>
                      <th className="p-2.5 text-right">Avg Speed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                    {dashboardData.branchStatus.map((b) => (
                      <tr key={b.branchId} className="hover:bg-slate-50/70">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{b.branchName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{b.branchCode}</div>
                        </td>
                        <td className="p-2.5">
                          {b.bmName ? (
                            <div>
                              <div className="font-semibold text-slate-900">{b.bmName}</div>
                              <div className="text-[11px] text-slate-500">{b.bmPhone || '—'}</div>
                            </div>
                          ) : (
                            <span className="text-rose-600 font-semibold">Unassigned</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            b.pendingVerification > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {b.pendingVerification}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">{b.verified}</td>
                        <td className="p-2.5 text-right font-mono font-semibold">{b.avgVerificationHours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: CANDIDATE MANAGEMENT & REASSIGNMENT */}
      {/* ==================================================== */}
      {activeTab === 'candidates' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users2 className="w-5 h-5 text-purple-600" />
                Zonal Candidate Pipeline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full visibility of all candidate workflows in {dashboardData?.zoneName}. Reassign officers or issue priority directives.
              </p>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, CNIC, Joining ID..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="UNDER_BRANCH_VERIFICATION">UNDER_BRANCH_VERIFICATION</option>
                <option value="BRANCH_VERIFIED">BRANCH_VERIFIED</option>
                <option value="UNDER_CENTRAL_HR_REVIEW">UNDER_CENTRAL_HR_REVIEW</option>
                <option value="APPROVED_AND_ENROLED">APPROVED_AND_ENROLED</option>
                <option value="RETURNED_FOR_CORRECTION">RETURNED_FOR_CORRECTION</option>
                <option value="REJECTED">REJECTED</option>
              </select>

              <button
                onClick={() => setOnlyDelayed(!onlyDelayed)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  onlyDelayed
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {onlyDelayed ? 'Showing Delayed Only' : 'Filter Delayed'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Joining ID</th>
                  <th className="p-3.5">Candidate Details</th>
                  <th className="p-3.5">Track & Branch</th>
                  <th className="p-3.5">Assigned HR</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {filteredCandidates.map((c) => (
                  <tr key={c.id} className={`hover:bg-slate-50/70 ${c.isDelayed ? 'bg-rose-50/30' : ''}`}>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {c.joiningId}
                      {c.isDelayed && (
                        <span className="block text-[10px] text-rose-600 font-bold uppercase mt-0.5">
                          Delayed SLA
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{c.personalInfo.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.personalInfo.cnic} &bull; {c.personalInfo.mobileNumber}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">{c.track}</span>
                      <div className="text-[11px] text-slate-500">{c.branchName}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-semibold">
                      {c.assignedToHrName || 'Unassigned'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        c.status === 'APPROVED_AND_ENROLED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : c.status === 'RETURNED_FOR_CORRECTION'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCandidateForStepIn(c);
                          setIsStepInOpen(true);
                        }}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-semibold text-[11px]"
                      >
                        Step In
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCandidateForReassign(c);
                          setIsReassignOpen(true);
                        }}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md font-semibold text-[11px]"
                      >
                        Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: ZONE STAFF & BRANCH ASSIGNMENT */}
      {/* ==================================================== */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Branch Facilities & Manager Assignment */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-600" />
                  Branch Facilities in {dashboardData?.zoneName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign Branch Managers to designated physical facilities.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Branch Code</th>
                    <th className="p-3.5">Branch Name</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Designated Branch Manager</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {branches.filter((b) => b.zoneId === dashboardData?.zoneId).map((b) => {
                    const bm = bmStaff.find((u) => u.zoneAssignments?.some((za) => za.branchId === b.id));
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70">
                        <td className="p-3.5 font-mono font-bold text-slate-900">{b.code}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{b.name}</td>
                        <td className="p-3.5 text-slate-500">{b.city} &bull; {b.address}</td>
                        <td className="p-3.5">
                          {bm ? (
                            <div>
                              <div className="font-bold text-slate-900">{bm.firstName} {bm.lastName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{bm.email}</div>
                            </div>
                          ) : (
                            <span className="text-rose-600 font-semibold">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedBranchForBm(b);
                              setIsAssignBmOpen(true);
                            }}
                            className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md font-semibold text-xs"
                          >
                            Assign BM
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Central HR Staff in Zone */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-purple-600" />
                  Central HR Officers in {dashboardData?.zoneName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Officers handling candidate review and dossier approval in this zone.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {centralHrStaff.map((hr) => (
                <div key={hr.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{hr.firstName} {hr.lastName}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{hr.email}</div>
                    <div className="text-slate-500 mt-1">Phone: {hr.phone || '—'}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                    Central HR
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: ZONAL ANALYTICS & REPORTS */}
      {/* ==================================================== */}
      {activeTab === 'reports' && reportsData && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Regional Performance &amp; Compliance Audit Report
              </h2>
              <p className="text-xs text-slate-500">
                Aggregated metrics for {reportsData.zoneName} &bull; Generated {new Date(reportsData.generatedAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300"
              >
                <Printer className="w-4 h-4" />
                <span>Print Dossier</span>
              </button>
              <button
                onClick={() => {
                  setActionSuccess('Zonal Performance Report exported to CSV.');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Turnaround Time Analysis */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Turnaround Time Metrics
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-lg">
                <div className="text-xs font-semibold text-purple-900">Avg Total Days to Enrol</div>
                <div className="text-2xl font-black text-purple-950 mt-1">{reportsData.turnaroundSummary.avgTotalDays} Days</div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-semibold text-slate-700">BM Verification Stage</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{reportsData.turnaroundSummary.avgBranchHours} Hours</div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-semibold text-slate-700">Central HR Review Stage</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{reportsData.turnaroundSummary.avgCentralHrHours} Hours</div>
              </div>
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <div className="text-xs font-semibold text-emerald-900">Fastest Branch</div>
                <div className="text-sm font-bold text-emerald-950 mt-1">{reportsData.turnaroundSummary.fastestBranch}</div>
              </div>
            </div>
          </div>

          {/* Rejection & Correction Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rejection Analysis */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Rejection Analysis ({reportsData.rejectionAnalysis.ratePercent}% Rate)
                </h3>
                <span className="text-xs font-bold text-red-700">{reportsData.rejectionAnalysis.totalRejections} Total Rejections</span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600">Top Root Cause Reasons:</div>
                {reportsData.rejectionAnalysis.topReasons.map((item, i) => (
                  <div key={i} className="p-2.5 bg-red-50/40 border border-red-200 rounded-lg text-xs text-red-950 font-medium flex items-center justify-between">
                    <span>&bull; {item.reason}</span>
                    <span className="font-bold">{item.count} cases</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Correction Analysis */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  Correction Analysis ({reportsData.correctionAnalysis.ratePercent}% Rate)
                </h3>
                <span className="text-xs font-bold text-amber-700">{reportsData.correctionAnalysis.totalCorrections} Total Corrections</span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600">Top Document Bottlenecks:</div>
                {reportsData.correctionAnalysis.topDocumentBottlenecks.map((item, i) => (
                  <div key={i} className="p-2.5 bg-amber-50/40 border border-amber-200 rounded-lg text-xs text-amber-950 font-medium flex items-center justify-between">
                    <span>&bull; {item.docType}</span>
                    <span className="font-bold">{item.count} cases</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Branch Performance Rankings */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Branch Efficiency &amp; Conversion Rankings
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Branch Facility</th>
                    <th className="p-3.5 text-center">Total Processed</th>
                    <th className="p-3.5 text-center">Avg Speed</th>
                    <th className="p-3.5 text-right">Approval Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {reportsData.branchPerformance.map((bp) => (
                    <tr key={bp.branchId} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-bold text-slate-900">{bp.branchName}</td>
                      <td className="p-3.5 text-center font-bold">{bp.totalProcessed}</td>
                      <td className="p-3.5 text-center font-mono font-semibold">{bp.avgSpeedHours} Hours</td>
                      <td className="p-3.5 text-right">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                          {bp.approvalRatePercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODALS */}
      {/* ==================================================== */}

      {/* REASSIGN CANDIDATE MODAL */}
      <Modal
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        title={`Reassign Candidate ${selectedCandidateForReassign?.joiningId}`}
      >
        <form onSubmit={handleReassign} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div>
              <strong>Candidate:</strong> {selectedCandidateForReassign?.personalInfo.fullName}
            </div>
            <div>
              <strong>Current Assigned HR:</strong> {selectedCandidateForReassign?.assignedToHrName || 'Unassigned'}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">Select New Central HR Officer *</label>
            <select
              required
              value={targetHrId}
              onChange={(e) => setTargetHrId(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs font-semibold"
            >
              <option value="">Select Officer in {dashboardData?.zoneName}</option>
              {centralHrStaff.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Mandatory Reassignment Reason *
            </label>
            <textarea
              required
              rows={3}
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              placeholder="e.g. Redistribution due to officer medical leave."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsReassignOpen(false)}
              className="px-4 py-2 border rounded-md font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700"
            >
              Confirm Reassignment
            </button>
          </div>
        </form>
      </Modal>

      {/* STEP-IN CAPABILITY MODAL */}
      <Modal
        isOpen={isStepInOpen}
        onClose={() => setIsStepInOpen(false)}
        title={`Executive Step-In: ${selectedCandidateForStepIn?.joiningId}`}
      >
        <form onSubmit={handleStepIn} className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1 text-rose-950">
            <div>
              <strong>Candidate:</strong> {selectedCandidateForStepIn?.personalInfo.fullName}
            </div>
            <div>
              <strong>Current Status:</strong> {selectedCandidateForStepIn?.status.replace(/_/g, ' ')}
            </div>
            <div className="text-[11px] text-rose-700">
              Applying a step-in directive will accelerate or override the current bottleneck with executive audit logging.
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">Executive Directive *</label>
            <select
              value={stepInAction}
              onChange={(e) => setStepInAction(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs font-semibold"
            >
              <option value="EXPEDITE">EXPEDITE (Flag as Immediate 2-Hour SLA Priority)</option>
              <option value="FORCE_FORWARD">FORCE FORWARD (Bypass Bottleneck to Central HR Review)</option>
              <option value="PRIORITIZE">PRIORITIZE (Move to Top of Officer Review Queue)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">Mandatory Directive Notes / Justification *</label>
            <textarea
              required
              rows={3}
              value={stepInNotes}
              onChange={(e) => setStepInNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              placeholder="e.g. Critical rider vacancy at Lahore Hub; fast-tracking verification."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsStepInOpen(false)}
              className="px-4 py-2 border rounded-md font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700"
            >
              Execute Directive
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN BM MODAL */}
      <Modal
        isOpen={isAssignBmOpen}
        onClose={() => setIsAssignBmOpen(false)}
        title={`Assign Branch Manager to ${selectedBranchForBm?.name}`}
      >
        <form onSubmit={handleAssignBm} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Branch Manager *</label>
            <select
              required
              value={selectedBmUserId}
              onChange={(e) => setSelectedBmUserId(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs font-semibold"
            >
              <option value="">Select Staff User</option>
              {bmStaff.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsAssignBmOpen(false)}
              className="px-4 py-2 border rounded-md font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700"
            >
              Assign Branch Manager
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
