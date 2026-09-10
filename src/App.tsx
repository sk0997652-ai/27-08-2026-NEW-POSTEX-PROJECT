import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Header } from './client/components/layout/Header';
import { Sidebar, NavTab } from './client/components/layout/Sidebar';
import { ZonesView } from './client/components/organization/ZonesView';
import { BranchesView } from './client/components/organization/BranchesView';
import { DepartmentsView } from './client/components/organization/DepartmentsView';
import { UsersView } from './client/components/users/UsersView';
import { OverridesView } from './client/components/overrides/OverridesView';
import { AuditLogsView } from './client/components/audit/AuditLogsView';
import { SecurityTestLab } from './client/components/diagnostics/SecurityTestLab';
import { CandidateLoginPortal } from './client/components/auth/CandidateLoginPortal';
import { BranchManagerPortal } from './client/components/branch-manager/BranchManagerPortal';
import { CentralHrPortal } from './client/components/central-hr/CentralHrPortal';
import { SuperAdminPortal } from './client/components/super-admin/SuperAdminPortal';
import { ZonalHrPortal } from './client/components/zonal-hr/ZonalHrPortal';
import { IntegrationsDashboard } from './client/components/integrations/IntegrationsDashboard';
import { WorkflowPreview } from './client/components/workflow/WorkflowPreview';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>('super_admin'); // Phase 6 default
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Failed to fetch user session');
      const data = await res.json();
      setCurrentUser(data.user);
      setEffectivePermissions(data.effectivePermissions);
      setAvailableUsers(data.availableDemoUsers);

      // Adapt tab if current tab is not accessible
      if (data.user.role === 'SUPER_ADMIN' && activeTab === 'central_hr') {
        setActiveTab('super_admin');
      } else if (data.user.role === 'ZONAL_HR_MANAGER' && (activeTab === 'super_admin' || activeTab === 'audit')) {
        setActiveTab('zonal_hr');
      } else if (data.user.role === 'CENTRAL_HR' && (activeTab === 'super_admin' || activeTab === 'zonal_hr' || activeTab === 'audit')) {
        setActiveTab('central_hr');
      } else if (data.user.role === 'BRANCH_MANAGER' && (activeTab === 'super_admin' || activeTab === 'zonal_hr' || activeTab === 'audit')) {
        setActiveTab('branch_manager');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        await fetchSession();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <div className="text-sm font-semibold tracking-wide">Initializing PostEx Enterprise Portal...</div>
        <div className="text-xs text-slate-400 font-mono">Phase 2: Authentication, 3-Layer RBAC & RLS Engine</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased">
      {/* Top Enterprise Header with Multi-Role Testing Switcher & Staff Sign-In */}
      <Header
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSwitchUser={handleSwitchUser}
        onRefreshSession={fetchSession}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Role-Aware Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={currentUser.role}
          effectivePermissions={effectivePermissions}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'super_admin' && (
              <SuperAdminPortal
                userRole={currentUser.role}
                currentUserName={`${currentUser.firstName} ${currentUser.lastName}`}
              />
            )}

            {activeTab === 'integrations' && (
              <IntegrationsDashboard
                userRole={currentUser.role}
              />
            )}

            {activeTab === 'zonal_hr' && (
              <ZonalHrPortal
                userRole={currentUser.role}
                currentUserName={`${currentUser.firstName} ${currentUser.lastName}`}
              />
            )}

            {activeTab === 'central_hr' && (
              <CentralHrPortal
                userRole={currentUser.role}
                currentUserName={`${currentUser.firstName} ${currentUser.lastName}`}
              />
            )}

            {activeTab === 'branch_manager' && (
              <BranchManagerPortal
                userRole={currentUser.role}
                currentUserName={`${currentUser.firstName} ${currentUser.lastName}`}
              />
            )}

            {activeTab === 'diagnostics' && (
              <SecurityTestLab />
            )}

            {activeTab === 'candidate_portal' && (
              <CandidateLoginPortal />
            )}

            {activeTab === 'zones' && (
              <ZonesView userRole={currentUser.role} effectivePermissions={effectivePermissions} />
            )}

            {activeTab === 'branches' && (
              <BranchesView userRole={currentUser.role} effectivePermissions={effectivePermissions} />
            )}

            {activeTab === 'departments' && (
              <DepartmentsView userRole={currentUser.role} effectivePermissions={effectivePermissions} />
            )}

            {activeTab === 'users' && (
              <UsersView userRole={currentUser.role} effectivePermissions={effectivePermissions} />
            )}

            {activeTab === 'overrides' && (
              <OverridesView userRole={currentUser.role} effectivePermissions={effectivePermissions} />
            )}

            {activeTab === 'audit' && (
              <AuditLogsView userRole={currentUser.role} />
            )}

            {activeTab === 'workflow_preview' && (
              <WorkflowPreview userRole={currentUser.role} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
