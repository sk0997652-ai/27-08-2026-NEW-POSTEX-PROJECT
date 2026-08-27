import React, { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Zone,
  Branch,
  Department,
  Designation,
  SuperAdminDashboardData,
  Permission,
  Role,
  UserPermissionOverride,
  AuditLog,
  PermissionCategory
} from '../../../types';
import { Modal } from '../shared/Modal';
import {
  LayoutDashboard,
  Building2,
  Users2,
  KeyRound,
  FileSearch,
  FlaskConical,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Briefcase,
  GitBranch,
  Globe2,
  RefreshCw,
  Search,
  Filter,
  Lock
} from 'lucide-react';

interface SuperAdminPortalProps {
  userRole: UserRole;
  currentUserName: string;
}

type SuperAdminTab = 'dashboard' | 'organization' | 'users' | 'permissions' | 'audit' | 'tests';

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ userRole, currentUserName }) => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<SuperAdminDashboardData | null>(null);

  // Org Data
  const [zones, setZones] = useState<Zone[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [orgSubTab, setOrgSubTab] = useState<'zones' | 'branches' | 'departments' | 'designations'>('zones');

  // Staff & Permissions
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [overrides, setOverrides] = useState<UserPermissionOverride[]>([]);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<string>('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditRoleFilter, setAuditRoleFilter] = useState('');

  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [editingOrgItem, setEditingOrgItem] = useState<any>(null);

  // Assign Modals
  const [isAssignManagerOpen, setIsAssignManagerOpen] = useState(false);
  const [targetZoneForManager, setTargetZoneForManager] = useState<Zone | null>(null);
  const [selectedManagerUserId, setSelectedManagerUserId] = useState('');

  const [isAssignBmOpen, setIsAssignBmOpen] = useState(false);
  const [targetBranchForBm, setTargetBranchForBm] = useState<Branch | null>(null);
  const [selectedBmUserId, setSelectedBmUserId] = useState('');

  // Custom Override Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [targetPermCode, setTargetPermCode] = useState('');
  const [targetIsGranted, setTargetIsGranted] = useState(true);
  const [overrideReason, setOverrideReason] = useState('');

  // Test Suite State
  const [testResults, setTestResults] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);

  // Form fields for User
  const [userEmail, setUserEmail] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRoleSelect, setUserRoleSelect] = useState<UserRole>('CENTRAL_HR');
  const [userZoneSelect, setUserZoneSelect] = useState('');
  const [userBranchSelect, setUserBranchSelect] = useState('');

  // Form fields for Org
  const [orgCode, setOrgCode] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgCity, setOrgCity] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgParentId, setOrgParentId] = useState('');

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, zonesRes, branchesRes, deptsRes, desigsRes, usersRes, permsRes, logsRes] = await Promise.all([
        fetch('/api/super-admin/metrics'),
        fetch('/api/organization/zones'),
        fetch('/api/organization/branches'),
        fetch('/api/organization/departments'),
        fetch('/api/organization/designations'),
        fetch('/api/users'),
        fetch('/api/permissions'),
        fetch('/api/audit-logs')
      ]);

      if (metricsRes.ok) setDashboardData(await metricsRes.json());
      if (zonesRes.ok) setZones(await zonesRes.json());
      if (branchesRes.ok) setBranches(await branchesRes.json());
      if (deptsRes.ok) setDepartments(await deptsRes.json());
      if (desigsRes.ok) setDesignations(await desigsRes.json());
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u);
        if (u.length > 0 && !selectedUserForPerms) {
          const nonAdmin = u.find((item: User) => item.role !== 'SUPER_ADMIN');
          if (nonAdmin) setSelectedUserForPerms(nonAdmin.id);
        }
      }
      if (permsRes.ok) {
        const p = await permsRes.json();
        setPermissions(p.permissions);
        setRoles(p.roles);
        setOverrides(p.overrides);
      }
      if (logsRes.ok) setAuditLogs(await logsRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const runPhase6Tests = async () => {
    try {
      setRunningTests(true);
      const res = await fetch('/api/diagnostic/test-phase6-suite', { method: 'POST' });
      const data = await res.json();
      setTestResults(data);
      setActionSuccess('Phase 6 Automated Security & Boundary Test Suite Executed Successfully');
    } catch (err: any) {
      setError('Test execution failed: ' + err.message);
    } finally {
      setRunningTests(false);
    }
  };

  // ====================================================
  // USER ACTIONS
  // ====================================================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          firstName: userFirstName,
          lastName: userLastName,
          phone: userPhone,
          role: userRoleSelect,
          zoneId: userZoneSelect || null,
          branchId: userBranchSelect || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setIsCreateUserOpen(false);
      setUserEmail('');
      setUserFirstName('');
      setUserLastName('');
      setUserPhone('');
      setActionSuccess(`Staff user ${data.email} successfully created.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: userFirstName,
          lastName: userLastName,
          phone: userPhone,
          role: userRoleSelect,
          zoneId: userZoneSelect || null,
          branchId: userBranchSelect || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setIsEditUserOpen(false);
      setEditingUser(null);
      setActionSuccess(`User ${data.email} updated successfully.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/toggle`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle user status');
      setActionSuccess(`User status updated.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditUserModal = (u: User) => {
    setEditingUser(u);
    setUserFirstName(u.firstName);
    setUserLastName(u.lastName);
    setUserPhone(u.phone || '');
    setUserRoleSelect(u.role);
    const za = u.zoneAssignments?.[0];
    setUserZoneSelect(za?.zoneId || '');
    setUserBranchSelect(za?.branchId || '');
    setIsEditUserOpen(true);
  };

  // ====================================================
  // ORG CRUD ACTIONS
  // ====================================================
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let endpoint = '/api/organization/zones';
      let payload: any = { code: orgCode, name: orgName };

      if (orgSubTab === 'zones') {
        endpoint = '/api/organization/zones';
        payload = { code: orgCode, name: orgName, description: orgDesc };
      } else if (orgSubTab === 'branches') {
        endpoint = '/api/organization/branches';
        payload = { zoneId: orgParentId, code: orgCode, name: orgName, city: orgCity, address: orgAddress };
      } else if (orgSubTab === 'departments') {
        endpoint = '/api/organization/departments';
        payload = { code: orgCode, name: orgName };
      } else if (orgSubTab === 'designations') {
        endpoint = '/api/organization/designations';
        payload = { departmentId: orgParentId, code: orgCode, title: orgName };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Creation failed');

      setIsCreateOrgOpen(false);
      setOrgCode('');
      setOrgName('');
      setOrgDesc('');
      setOrgCity('');
      setOrgAddress('');
      setActionSuccess(`Created ${orgSubTab.slice(0, -1)} item successfully.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrgItem) return;
    try {
      let endpoint = `/api/organization/${orgSubTab}/${editingOrgItem.id}`;
      let payload: any = { code: orgCode, name: orgName };

      if (orgSubTab === 'zones') {
        payload = { code: orgCode, name: orgName, description: orgDesc };
      } else if (orgSubTab === 'branches') {
        payload = { zoneId: orgParentId, code: orgCode, name: orgName, city: orgCity, address: orgAddress };
      } else if (orgSubTab === 'departments') {
        payload = { code: orgCode, name: orgName };
      } else if (orgSubTab === 'designations') {
        payload = { departmentId: orgParentId, code: orgCode, title: orgName };
      }

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setIsEditOrgOpen(false);
      setEditingOrgItem(null);
      setActionSuccess(`Updated item successfully.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteOrg = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${orgSubTab.slice(0, -1)}?`)) return;
    try {
      const res = await fetch(`/api/organization/${orgSubTab}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');
      setActionSuccess(`Deleted successfully.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditOrgModal = (item: any) => {
    setEditingOrgItem(item);
    setOrgCode(item.code || '');
    setOrgName(item.name || item.title || '');
    setOrgDesc(item.description || '');
    setOrgCity(item.city || '');
    setOrgAddress(item.address || '');
    setOrgParentId(item.zoneId || item.departmentId || '');
    setIsEditOrgOpen(true);
  };

  // Assign Zonal HR Manager
  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetZoneForManager || !selectedManagerUserId) return;
    try {
      const res = await fetch(`/api/admin/zones/${targetZoneForManager.id}/assign-manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedManagerUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign Zonal Manager');
      setIsAssignManagerOpen(false);
      setTargetZoneForManager(null);
      setActionSuccess(`Zonal Manager assigned to ${data.zoneName}.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Assign Branch Manager
  const handleAssignBm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBranchForBm || !selectedBmUserId) return;
    try {
      const res = await fetch(`/api/admin/branches/${targetBranchForBm.id}/assign-bm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedBmUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign Branch Manager');
      setIsAssignBmOpen(false);
      setTargetBranchForBm(null);
      setActionSuccess(`Branch Manager assigned to ${data.branchName}.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ====================================================
  // CUSTOM PERMISSIONS ACTIONS
  // ====================================================
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      setError('A mandatory business justification reason is required for every permission override (min 5 chars).');
      return;
    }
    try {
      const res = await fetch('/api/permissions/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForPerms,
          permissionCode: targetPermCode,
          isGranted: targetIsGranted,
          reason: overrideReason.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save override');

      setIsOverrideModalOpen(false);
      setOverrideReason('');
      setActionSuccess('Custom permission override saved and logged to audit trail.');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetOverride = async (overrideId: string) => {
    try {
      const res = await fetch(`/api/permissions/overrides/${overrideId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset override');
      setActionSuccess('Override reset back to role default.');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openOverrideDialog = (code: string, granted: boolean) => {
    setTargetPermCode(code);
    setTargetIsGranted(granted);
    setOverrideReason('');
    setIsOverrideModalOpen(true);
  };

  const selectedPermUser = users.find((u) => u.id === selectedUserForPerms);
  const selectedUserRoleDef = roles.find((r) => r.name === selectedPermUser?.role);
  const selectedUserOverrides = overrides.filter((o) => o.userId === selectedUserForPerms);

  // Grouped Permissions
  const groupedPermissions: Record<PermissionCategory, Permission[]> = {
    ACCOUNT_MANAGEMENT: permissions.filter((p) => p.category === 'ACCOUNT_MANAGEMENT'),
    CANDIDATE_ACTIONS: permissions.filter((p) => p.category === 'CANDIDATE_ACTIONS'),
    VERIFICATION: permissions.filter((p) => p.category === 'VERIFICATION'),
    VISIBILITY_REPORTING: permissions.filter((p) => p.category === 'VISIBILITY_REPORTING'),
    SYSTEM: permissions.filter((p) => p.category === 'SYSTEM')
  };

  const categoryLabels: Record<PermissionCategory, string> = {
    ACCOUNT_MANAGEMENT: 'Account Management',
    CANDIDATE_ACTIONS: 'Candidate & Application Actions',
    VERIFICATION: 'Verification & Physical Inspection',
    VISIBILITY_REPORTING: 'Visibility & Operational Reporting',
    SYSTEM: 'System & Security Governance'
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchRole = !auditRoleFilter || log.actorRole === auditRoleFilter;
    const matchSearch =
      !auditSearch ||
      log.actorEmail.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(auditSearch.toLowerCase()));
    return matchRole && matchSearch;
  });

  return (
    <div id="super-admin-portal" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Super Admin Executive Portal
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Phase 6 Super Admin
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Global Organization Management, 5-Category RBAC Matrix, User Administration & Non-Overrideable Audit Trails
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="run-phase6-tests-btn"
              onClick={runPhase6Tests}
              disabled={runningTests}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              {runningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
              <span>Run Phase 6 Boundary Tests</span>
            </button>
            <button
              onClick={fetchAllData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-800 mt-6 pt-4 text-xs font-medium">
          {[
            { id: 'dashboard', label: 'Company Overview', icon: LayoutDashboard },
            { id: 'organization', label: 'Organization CRUD', icon: Building2 },
            { id: 'users', label: 'User Administration', icon: Users2 },
            { id: 'permissions', label: 'Custom Access Matrix', icon: KeyRound },
            { id: 'audit', label: 'Audit Trail Logs', icon: FileSearch },
            { id: 'tests', label: 'Security Boundary Lab', icon: FlaskConical }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`super-admin-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as SuperAdminTab)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
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

      {/* Notifications */}
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
      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {/* ==================================================== */}
      {activeTab === 'dashboard' && dashboardData && (
        <div className="space-y-6">
          {/* ATTENTION SUMMARY FIRST (Mandate) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wider">
                Attention Summary (Immediate Action Required)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-2xs">
                <div className="text-xs font-medium text-amber-700">Delayed / Stuck Applications</div>
                <div className="text-2xl font-black text-amber-950 mt-1">
                  {dashboardData.attentionSummary.delayedApplicationsCount}
                </div>
                <div className="text-xs text-amber-600 mt-1">Exceeding standard SLA (&gt; 48h)</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-2xs">
                <div className="text-xs font-medium text-amber-700">Non-Default Permission Users</div>
                <div className="text-2xl font-black text-amber-950 mt-1">
                  {dashboardData.attentionSummary.nonDefaultPermissionUsers.length}
                </div>
                <div className="text-xs text-amber-600 mt-1">Users with active Layer 2 overrides</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-2xs">
                <div className="text-xs font-medium text-amber-700">Unassigned Branches</div>
                <div className="text-2xl font-black text-amber-950 mt-1">
                  {dashboardData.attentionSummary.unassignedBranchesCount}
                </div>
                <div className="text-xs text-amber-600 mt-1">Missing designated Branch Manager</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-2xs">
                <div className="text-xs font-medium text-amber-700">Inactive Staff Accounts</div>
                <div className="text-2xl font-black text-amber-950 mt-1">
                  {dashboardData.attentionSummary.inactiveStaffCount}
                </div>
                <div className="text-xs text-amber-600 mt-1">Deactivated portal staff users</div>
              </div>
            </div>

            {/* Stuck Applications Drill-Down */}
            {dashboardData.attentionSummary.stuckApplications.length > 0 && (
              <div className="mt-5 border-t border-amber-200 pt-4">
                <h3 className="text-xs font-bold text-amber-900 mb-2">Stuck Applications Breakdown</h3>
                <div className="space-y-2">
                  {dashboardData.attentionSummary.stuckApplications.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-amber-900">{app.joiningId}</span>
                        <span className="font-semibold text-slate-800">{app.candidateName}</span>
                        <span className="text-slate-500">
                          {app.zoneName} &bull; {app.branchName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-[11px]">
                          Pending {app.daysPending}d
                        </span>
                        <span className="text-slate-500 italic truncate max-w-xs">{app.delayReason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Company-Wide Metrics Grid */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Company-Wide Infrastructure Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Candidates', value: dashboardData.companyMetrics.totalCandidates, icon: Users2, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Active Employees', value: dashboardData.companyMetrics.totalEmployees, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Staff Users', value: dashboardData.companyMetrics.totalStaffUsers, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Operational Zones', value: dashboardData.companyMetrics.totalZones, icon: Globe2, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Branch Facilities', value: dashboardData.companyMetrics.totalBranches, icon: GitBranch, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'Departments', value: dashboardData.companyMetrics.totalDepartments, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Designations', value: dashboardData.companyMetrics.totalDesignations, icon: Briefcase, color: 'text-teal-600', bg: 'bg-teal-50' },
                { label: 'Pending BM Verification', value: dashboardData.companyMetrics.pendingBranchVerifications, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Pending Central HR Review', value: dashboardData.companyMetrics.pendingCentralHrReviews, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'Active Overrides', value: dashboardData.companyMetrics.totalActiveOverrides, icon: KeyRound, color: 'text-indigo-600', bg: 'bg-indigo-50' }
              ].map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">{metric.label}</span>
                      <div className={`p-1.5 rounded-lg ${metric.bg} ${metric.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{metric.value}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Drill-Down Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Non-Default Permission Summary Widget */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-rose-600" />
                  Staff With Non-Default Access Overrides
                </h3>
                <button
                  onClick={() => setActiveTab('permissions')}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Manage All &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {dashboardData.attentionSummary.nonDefaultPermissionUsers.length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center">
                    All staff users are adhering to standard role defaults.
                  </div>
                ) : (
                  dashboardData.attentionSummary.nonDefaultPermissionUsers.map((u) => (
                    <div
                      key={u.userId}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{u.userName}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                        <div className="text-slate-500 mt-1">Role: {u.role.replace(/_/g, ' ')}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                          {u.overridesCount} Overrides
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">
                          +{u.grantedCodes.length} / -{u.revokedCodes.length}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-600" />
                Quick Management Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setActiveTab('organization');
                    setOrgSubTab('zones');
                    setIsCreateOrgOpen(true);
                  }}
                  className="p-3 text-left border border-slate-200 rounded-lg hover:border-rose-400 hover:bg-rose-50/40 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="text-rose-600 font-bold">+ Create Zone</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Add geographic territory</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('organization');
                    setOrgSubTab('branches');
                    setIsCreateOrgOpen(true);
                  }}
                  className="p-3 text-left border border-slate-200 rounded-lg hover:border-rose-400 hover:bg-rose-50/40 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="text-rose-600 font-bold">+ Create Branch</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Add hub facility</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('users');
                    setIsCreateUserOpen(true);
                  }}
                  className="p-3 text-left border border-slate-200 rounded-lg hover:border-rose-400 hover:bg-rose-50/40 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="text-rose-600 font-bold">+ Register Staff</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Add Central HR or BM</div>
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className="p-3 text-left border border-slate-200 rounded-lg hover:border-rose-400 hover:bg-rose-50/40 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="text-rose-600 font-bold">Inspect Audit Logs</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Immutable activity stream</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: ORGANIZATION CRUD */}
      {/* ==================================================== */}
      {activeTab === 'organization' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-rose-600" />
                Organizational Hierarchy CRUD
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage operational zones, branch facilities, corporate departments, and job designations.
              </p>
            </div>

            <button
              id="create-org-item-btn"
              onClick={() => {
                setOrgCode('');
                setOrgName('');
                setOrgDesc('');
                setOrgCity('');
                setOrgAddress('');
                setOrgParentId('');
                setIsCreateOrgOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create {orgSubTab.slice(0, -1).toUpperCase()}</span>
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
            {[
              { id: 'zones', label: `Zones (${zones.length})` },
              { id: 'branches', label: `Branches (${branches.length})` },
              { id: 'departments', label: `Departments (${departments.length})` },
              { id: 'designations', label: `Designations (${designations.length})` }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setOrgSubTab(sub.id as any)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  orgSubTab === sub.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* ZONES TABLE */}
          {orgSubTab === 'zones' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Zone Code</th>
                    <th className="p-3.5">Zone Name</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Branches</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {zones.map((z) => (
                    <tr key={z.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{z.code}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{z.name}</td>
                      <td className="p-3.5 text-slate-500">{z.description || '—'}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                          {branches.filter((b) => b.zoneId === z.id).length} Hubs
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${z.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {z.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setTargetZoneForManager(z);
                            setIsAssignManagerOpen(true);
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md font-semibold text-[11px] border border-purple-200"
                        >
                          Assign Manager
                        </button>
                        <button
                          onClick={() => openEditOrgModal(z)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrg(z.id)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* BRANCHES TABLE */}
          {orgSubTab === 'branches' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Branch Code</th>
                    <th className="p-3.5">Branch Name</th>
                    <th className="p-3.5">Zone</th>
                    <th className="p-3.5">City & Address</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {branches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{b.code}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{b.name}</td>
                      <td className="p-3.5 text-slate-600">{b.zoneName || 'Zone North'}</td>
                      <td className="p-3.5 text-slate-500">{b.city} &bull; {b.address}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${b.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setTargetBranchForBm(b);
                            setIsAssignBmOpen(true);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-semibold text-[11px] border border-blue-200"
                        >
                          Assign BM
                        </button>
                        <button
                          onClick={() => openEditOrgModal(b)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrg(b.id)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DEPARTMENTS TABLE */}
          {orgSubTab === 'departments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Department Name</th>
                    <th className="p-3.5">Designations Count</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {departments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{d.code}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{d.name}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                          {designations.filter((dg) => dg.departmentId === d.id).length} Roles
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${d.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {d.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditOrgModal(d)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrg(d.id)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DESIGNATIONS TABLE */}
          {orgSubTab === 'designations' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Designation Title</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {designations.map((dg) => (
                    <tr key={dg.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{dg.code}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{dg.title}</td>
                      <td className="p-3.5 text-slate-600">{dg.departmentName}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${dg.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {dg.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditOrgModal(dg)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrg(dg.id)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: USER ADMINISTRATION */}
      {/* ==================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Users2 className="w-5 h-5 text-rose-600" />
                Staff User Administration & Geographic Allocation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create staff accounts, assign role archetypes, allocate to zones/branches, and toggle account activation.
              </p>
            </div>

            <button
              id="register-user-btn"
              onClick={() => {
                setUserEmail('');
                setUserFirstName('');
                setUserLastName('');
                setUserPhone('');
                setUserRoleSelect('CENTRAL_HR');
                setUserZoneSelect(zones[0]?.id || '');
                setUserBranchSelect('');
                setIsCreateUserOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Staff User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Staff Name & Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Assigned Zone & Branch</th>
                  <th className="p-3.5">Custom Overrides</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {users.map((u) => {
                  const za = u.zoneAssignments?.[0];
                  const userOvs = overrides.filter((o) => o.userId === u.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{u.firstName} {u.lastName}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'ZONAL_HR_MANAGER'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'CENTRAL_HR'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {za ? (
                          <div>
                            <div className="font-semibold text-slate-900">{za.zoneName}</div>
                            <div className="text-[11px] text-slate-500">{za.branchName}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned (Nationwide)</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {userOvs.length > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedUserForPerms(u.id);
                              setActiveTab('permissions');
                            }}
                            className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] hover:underline"
                          >
                            {userOvs.length} Non-Default
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Role Default</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                            u.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                        </button>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUserForPerms(u.id);
                            setActiveTab('permissions');
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px]"
                          title="Custom Permissions"
                        >
                          <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                          Custom Access
                        </button>
                        <button
                          onClick={() => openEditUserModal(u)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: CUSTOM PERMISSIONS UI (5 CATEGORIES) */}
      {/* ==================================================== */}
      {activeTab === 'permissions' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-rose-600" />
                Custom Access Matrix (5 Permission Categories)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-checked by role defaults. Grant or revoke individual permissions with mandatory business justification.
              </p>
            </div>

            {/* Target User Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
              <span className="text-xs font-semibold text-slate-700 ml-1">Staff Member:</span>
              <select
                id="superadmin-perm-user-select"
                value={selectedUserForPerms}
                onChange={(e) => setSelectedUserForPerms(e.target.value)}
                className="text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-md px-2.5 py-1 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.role.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedPermUser && (
            <div className="space-y-6">
              {/* Profile Card & Overrides Summary */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-900">{selectedPermUser.firstName} {selectedPermUser.lastName}</div>
                  <div className="text-xs text-slate-500 font-mono">{selectedPermUser.email}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Base Archetype: <span className="font-semibold text-slate-900">{selectedPermUser.role.replace(/_/g, ' ')}</span> &bull; Scope: {selectedPermUser.zoneAssignments?.[0]?.zoneName || 'Nationwide'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Active Custom Overrides</div>
                    <div className="text-lg font-black text-rose-600">
                      {selectedUserOverrides.length}
                    </div>
                  </div>
                  {selectedUserOverrides.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                      Non-Default Access
                    </span>
                  )}
                </div>
              </div>

              {/* 5 CATEGORIES OF PERMISSIONS */}
              {(Object.keys(groupedPermissions) as PermissionCategory[]).map((categoryKey) => {
                const permsInCategory = groupedPermissions[categoryKey];
                if (!permsInCategory || permsInCategory.length === 0) return null;

                return (
                  <div key={categoryKey} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-900 text-white px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                      <span>{categoryLabels[categoryKey]}</span>
                      <span className="text-[11px] font-normal text-slate-400 font-mono">
                        {permsInCategory.length} Permissions
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200 bg-white">
                      {permsInCategory.map((perm) => {
                        const isRoleDefault = Boolean(selectedUserRoleDef?.defaultPermissions.includes(perm.code));
                        const override = selectedUserOverrides.find((o) => o.permissionCode === perm.code);
                        const isOverridden = Boolean(override);
                        const isEffective = override ? override.isGranted : isRoleDefault;

                        const isAuditView = perm.code === 'audit:view';
                        const isSuperAdminUser = selectedPermUser.role === 'SUPER_ADMIN';

                        return (
                          <div
                            key={perm.code}
                            className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                              isOverridden ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="space-y-1 max-w-xl">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-900">{perm.code}</span>
                                {isOverridden && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    override.isGranted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    OVERRIDE: {override.isGranted ? 'GRANTED' : 'REVOKED'}
                                  </span>
                                )}
                                {isAuditView && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 uppercase flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Non-Overrideable (Super Admin Only)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-semibold text-slate-800">{perm.name}</div>
                              <div className="text-xs text-slate-500">{perm.description}</div>
                              {override && (
                                <div className="text-[11px] text-amber-800 bg-amber-100/60 rounded px-2 py-1 mt-1">
                                  <strong>Reason:</strong> {override.reason} &bull; <span className="text-slate-500">By {override.grantedByName}</span>
                                </div>
                              )}
                            </div>

                            {/* Control Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-xs font-semibold text-slate-500">Effective:</span>
                                {isEffective ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> ALLOWED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                    <XCircle className="w-3.5 h-3.5" /> DENIED
                                  </span>
                                )}
                              </div>

                              {!isAuditView && !isSuperAdminUser && (
                                <>
                                  {isEffective ? (
                                    <button
                                      onClick={() => openOverrideDialog(perm.code, false)}
                                      className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                                    >
                                      Revoke
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => openOverrideDialog(perm.code, true)}
                                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                                    >
                                      Grant
                                    </button>
                                  )}

                                  {isOverridden && (
                                    <button
                                      onClick={() => handleResetOverride(override.id)}
                                      className="p-1 text-slate-400 hover:text-slate-700"
                                      title="Reset back to role default"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: AUDIT TRAIL LOGS */}
      {/* ==================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-rose-600" />
                Immutable Governance Audit Trail
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Super Admin Strictly Restricted
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full cryptographic history of administrative operations, permission overrides, and candidate decisions.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by actor or action..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <select
                value={auditRoleFilter}
                onChange={(e) => setAuditRoleFilter(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="ZONAL_HR_MANAGER">ZONAL_HR_MANAGER</option>
                <option value="CENTRAL_HR">CENTRAL_HR</option>
                <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor & Role</th>
                  <th className="p-3.5">Action Executed</th>
                  <th className="p-3.5">Entity & ID</th>
                  <th className="p-3.5">Mandatory Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{log.actorEmail}</div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{log.actorRole}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {log.entityType} &bull; {log.entityId ? log.entityId.substring(0, 16) : 'N/A'}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-sm">
                      {log.reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 6: SECURITY BOUNDARY TEST LAB */}
      {/* ==================================================== */}
      {activeTab === 'tests' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-rose-600" />
                Phase 6 Automated Security & Boundary Test Suite
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rigorous testing of Super Admin global access, Zonal HR isolation, branch prohibitions, and audit restrictions.
              </p>
            </div>

            <button
              id="execute-tests-tab-btn"
              onClick={runPhase6Tests}
              disabled={runningTests}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {runningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
              <span>Execute 6 Boundary Tests</span>
            </button>
          </div>

          {testResults ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                testResults.allPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-3">
                  {testResults.allPassed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600" />
                  )}
                  <div>
                    <div className="text-sm font-bold">
                      {testResults.allPassed ? 'ALL PHASE 6 BOUNDARY TESTS PASSED' : 'SECURITY BOUNDARY TESTS FAILED'}
                    </div>
                    <div className="text-xs opacity-80">
                      {testResults.passedSteps} / {testResults.totalSteps} verification steps satisfied
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs font-bold">
                  {new Date(testResults.executedAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="space-y-3">
                {testResults.testRuns.map((run: any) => (
                  <div
                    key={run.step}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      run.passed ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px]">
                          STEP {run.step}
                        </span>
                        <span className="text-slate-900">{run.name}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        run.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {run.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div className="text-slate-600">{run.description}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-400">Expected:</span> <span className="text-slate-800">{run.expected}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Actual:</span> <span className="text-slate-900 font-semibold">{run.actual}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Click &quot;Execute 6 Boundary Tests&quot; to run real-time policy evaluation checks.
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODALS */}
      {/* ==================================================== */}

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        title="Register Portal Staff User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={userFirstName}
                onChange={(e) => setUserFirstName(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
                placeholder="e.g. Tariq"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={userLastName}
                onChange={(e) => setUserLastName(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
                placeholder="e.g. Mansoor"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Corporate Email *</label>
            <input
              type="email"
              required
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs"
              placeholder="name@postex.pk"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile Phone</label>
            <input
              type="text"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs"
              placeholder="+92-300-1234567"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role Archetype *</label>
            <select
              value={userRoleSelect}
              onChange={(e) => setUserRoleSelect(e.target.value as UserRole)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs font-semibold"
            >
              <option value="CENTRAL_HR">Central HR Staff</option>
              <option value="ZONAL_HR_MANAGER">Zonal HR Manager</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Zone</label>
              <select
                value={userZoneSelect}
                onChange={(e) => {
                  setUserZoneSelect(e.target.value);
                  setUserBranchSelect('');
                }}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
              >
                <option value="">None (Nationwide Scope)</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Branch (for BM)</label>
              <select
                value={userBranchSelect}
                onChange={(e) => setUserBranchSelect(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
              >
                <option value="">All Branches in Zone</option>
                {branches
                  .filter((b) => !userZoneSelect || b.zoneId === userZoneSelect)
                  .map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsCreateUserOpen(false)}
              className="px-4 py-2 border rounded-md font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700"
            >
              Create Staff User
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
        title={`Edit Staff User (${editingUser?.email})`}
      >
        <form onSubmit={handleEditUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={userFirstName}
                onChange={(e) => setUserFirstName(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={userLastName}
                onChange={(e) => setUserLastName(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile Phone</label>
            <input
              type="text"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role Archetype *</label>
            <select
              value={userRoleSelect}
              onChange={(e) => setUserRoleSelect(e.target.value as UserRole)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs font-semibold"
            >
              <option value="CENTRAL_HR">Central HR Staff</option>
              <option value="ZONAL_HR_MANAGER">Zonal HR Manager</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Zone</label>
              <select
                value={userZoneSelect}
                onChange={(e) => {
                  setUserZoneSelect(e.target.value);
                  setUserBranchSelect('');
                }}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
              >
                <option value="">None (Nationwide Scope)</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Branch</label>
              <select
                value={userBranchSelect}
                onChange={(e) => setUserBranchSelect(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
              >
                <option value="">All Branches in Zone</option>
                {branches
                  .filter((b) => !userZoneSelect || b.zoneId === userZoneSelect)
                  .map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsEditUserOpen(false)}
              className="px-4 py-2 border rounded-md font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700"
            >
              Save User Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE ORG ITEM MODAL */}
      <Modal
        isOpen={isCreateOrgOpen}
        onClose={() => setIsCreateOrgOpen(false)}
        title={`Create New ${orgSubTab.slice(0, -1).toUpperCase()}`}
      >
        <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Code *</label>
            <input
              type="text"
              required
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs font-mono"
              placeholder="e.g. ZONE-EAST or BRANCH-FSD"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Name / Title *</label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs"
              placeholder="e.g. Faisalabad Regional Mega Depot"
            />
          </div>

          {orgSubTab === 'zones' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Territory Description</label>
              <textarea
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
                rows={3}
                placeholder="Territory coverage and operational scope..."
              />
            </div>
          )}

          {orgSubTab === 'branches' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Zone *</label>
                <select
                  required
                  value={orgParentId}
                  onChange={(e) => setOrgParentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs font-semibold"
                >
                  <option value="">Select Parent Zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={orgCity}
                    onChange={(e) => setOrgCity(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 text-xs"
                    placeholder="e.g. Faisalabad"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Physical Address *</label>
                  <input
                    type="text"
                    required
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 text-xs"
                    placeholder="e.g. Main Jaranwala Road"
                  />
                </div>
              </div>
            </>
          )}

          {orgSubTab === 'designations' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent Department *</label>
              <select
                required
                value={orgParentId}
                onChange={(e) => setOrgParentId(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs font-semibold"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsCreateOrgOpen(false)}
              className="px-4 py-2 border rounded-md font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700"
            >
              Create Item
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT ORG ITEM MODAL */}
      <Modal
        isOpen={isEditOrgOpen}
        onClose={() => setIsEditOrgOpen(false)}
        title={`Edit ${orgSubTab.slice(0, -1).toUpperCase()}`}
      >
        <form onSubmit={handleEditOrg} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Code *</label>
            <input
              type="text"
              required
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Name / Title *</label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs"
            />
          </div>

          {orgSubTab === 'zones' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Territory Description</label>
              <textarea
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs"
                rows={3}
              />
            </div>
          )}

          {orgSubTab === 'branches' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Zone *</label>
                <select
                  required
                  value={orgParentId}
                  onChange={(e) => setOrgParentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs font-semibold"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={orgCity}
                    onChange={(e) => setOrgCity(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {orgSubTab === 'designations' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent Department *</label>
              <select
                required
                value={orgParentId}
                onChange={(e) => setOrgParentId(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-xs font-semibold"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsEditOrgOpen(false)}
              className="px-4 py-2 border rounded-md font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN ZONAL MANAGER MODAL */}
      <Modal
        isOpen={isAssignManagerOpen}
        onClose={() => setIsAssignManagerOpen(false)}
        title={`Assign Zonal HR Manager to ${targetZoneForManager?.name}`}
      >
        <form onSubmit={handleAssignManager} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Zonal HR Manager *</label>
            <select
              required
              value={selectedManagerUserId}
              onChange={(e) => setSelectedManagerUserId(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-xs font-semibold"
            >
              <option value="">Select Staff User</option>
              {users
                .filter((u) => u.role === 'ZONAL_HR_MANAGER' || u.role === 'CENTRAL_HR')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email}) — Role: {u.role}
                  </option>
                ))}
            </select>
          </div>

          <div className="p-3 bg-purple-50 text-purple-900 border border-purple-200 rounded-lg text-xs">
            The selected staff member will be granted governance authority over all branch operations and onboarding queues within <strong>{targetZoneForManager?.name}</strong>.
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsAssignManagerOpen(false)}
              className="px-4 py-2 border rounded-md font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700"
            >
              Assign Zone Manager
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN BRANCH MANAGER MODAL */}
      <Modal
        isOpen={isAssignBmOpen}
        onClose={() => setIsAssignBmOpen(false)}
        title={`Assign Branch Manager to ${targetBranchForBm?.name}`}
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
              {users
                .filter((u) => u.role === 'BRANCH_MANAGER' || u.role === 'CENTRAL_HR')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
            </select>
          </div>

          <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs">
            The designated Branch Manager will be assigned to physically verify candidate documents and conduct in-person inspections at <strong>{targetBranchForBm?.name}</strong>.
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
            >
              Assign Branch Manager
            </button>
          </div>
        </form>
      </Modal>

      {/* OVERRIDE FORM MODAL (Mandatory Reason Requirement) */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title={`${targetIsGranted ? 'Grant' : 'Revoke'} Permission Override`}
      >
        <form onSubmit={handleSaveOverride} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div>
              <strong>Target Staff:</strong> {selectedPermUser?.firstName} {selectedPermUser?.lastName} ({selectedPermUser?.email})
            </div>
            <div>
              <strong>Permission:</strong> <code className="font-bold text-rose-600">{targetPermCode}</code>
            </div>
            <div>
              <strong>Action:</strong>{' '}
              <span className={`font-bold ${targetIsGranted ? 'text-emerald-700' : 'text-rose-700'}`}>
                {targetIsGranted ? 'EXPLICIT GRANT' : 'EXPLICIT REVOCATION'}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Mandatory Business Justification Reason *
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5">
              Strict governance compliance: State the operational reason, approval reference, or policy justification (min 5 characters).
            </p>
            <textarea
              required
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              placeholder="e.g. Approved by Head of HR for temporary workload redistribution during Q3 hiring surge."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsOverrideModalOpen(false)}
              className="px-4 py-2 border rounded-md font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700"
            >
              Confirm Override &amp; Record Audit Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
