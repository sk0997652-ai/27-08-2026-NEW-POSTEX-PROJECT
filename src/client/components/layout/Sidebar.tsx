import React from 'react';
import {
  Globe2,
  GitBranch,
  Building2,
  Users2,
  KeyRound,
  FileSearch,
  FlaskConical,
  UserSquare2,
  Layers,
  ShieldCheck,
  Award,
  Smartphone,
  FileCheck2,
  Sliders
} from 'lucide-react';
import { UserRole } from '../../../types';

export type NavTab =
  | 'super_admin'
  | 'zonal_hr'
  | 'central_hr'
  | 'branch_manager'
  | 'integrations'
  | 'zones'
  | 'branches'
  | 'departments'
  | 'users'
  | 'overrides'
  | 'audit'
  | 'diagnostics'
  | 'candidate_portal'
  | 'workflow_preview';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  effectivePermissions: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  effectivePermissions
}) => {
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const navItems = [
    {
      id: 'super_admin' as NavTab,
      label: 'Super Admin Portal',
      icon: ShieldCheck,
      visible: isSuperAdmin,
      badge: 'Phase 6'
    },
    {
      id: 'integrations' as NavTab,
      label: 'Production Integrations',
      icon: Sliders,
      visible: isSuperAdmin || userRole === 'CENTRAL_HR',
      badge: 'Phase 7'
    },
    {
      id: 'zonal_hr' as NavTab,
      label: 'Zonal HR Governance',
      icon: Globe2,
      visible: isSuperAdmin || userRole === 'ZONAL_HR_MANAGER',
      badge: 'Phase 6'
    },
    {
      id: 'central_hr' as NavTab,
      label: 'Central HR Enrolment',
      icon: Users2,
      visible: isSuperAdmin || userRole === 'CENTRAL_HR' || userRole === 'ZONAL_HR_MANAGER',
      badge: 'Phase 5'
    },
    {
      id: 'branch_manager' as NavTab,
      label: 'BM Verification Portal',
      icon: FileCheck2,
      visible: isSuperAdmin || userRole === 'BRANCH_MANAGER' || userRole === 'CENTRAL_HR',
      badge: 'Phase 4'
    },
    {
      id: 'diagnostics' as NavTab,
      label: 'Phase 2 Security Test Lab',
      icon: FlaskConical,
      visible: true,
      badge: '5 Tests'
    },
    {
      id: 'candidate_portal' as NavTab,
      label: 'Candidate OTP Portal',
      icon: Smartphone,
      visible: true,
      badge: 'Phase 2 Auth'
    },
    {
      id: 'zones' as NavTab,
      label: 'Operational Zones',
      icon: Globe2,
      visible: isSuperAdmin || userRole === 'ZONAL_HR_MANAGER',
      badge: 'Org'
    },
    {
      id: 'branches' as NavTab,
      label: 'Branch Facilities',
      icon: GitBranch,
      visible: isSuperAdmin || userRole === 'ZONAL_HR_MANAGER' || userRole === 'BRANCH_MANAGER',
      badge: 'Org'
    },
    {
      id: 'departments' as NavTab,
      label: 'Depts & Designations',
      icon: Building2,
      visible: isSuperAdmin || userRole === 'CENTRAL_HR',
      badge: 'Org'
    },
    {
      id: 'users' as NavTab,
      label: 'Staff & Zone Allocations',
      icon: Users2,
      visible: isSuperAdmin || effectivePermissions.includes('users:manage_staff'),
      badge: 'Security'
    },
    {
      id: 'overrides' as NavTab,
      label: '3-Layer Override Matrix',
      icon: KeyRound,
      visible: isSuperAdmin || effectivePermissions.includes('users:override_permissions'),
      badge: 'RBAC'
    },
    {
      id: 'audit' as NavTab,
      label: 'Audit Trail Logs',
      icon: FileSearch,
      visible: isSuperAdmin, // STRICTLY Super Admin Only
      badge: 'Super Admin',
      lock: !isSuperAdmin
    },
    {
      id: 'workflow_preview' as NavTab,
      label: 'Candidate Workflow Hub',
      icon: Layers,
      visible: true,
      badge: 'Phase 2-9'
    }
  ];

  return (
    <aside id="main-sidebar" className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-rose-500" />
          <span>Governance & RBAC</span>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {navItems
          .filter(item => item.visible)
          .map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? 'bg-rose-700 text-rose-100'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* Security Scope Status Box */}
      <div className="p-4 m-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400 mb-1 font-semibold">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Active Data Scope</span>
        </div>
        <p className="text-slate-300 text-[11px] font-medium leading-relaxed">
          {userRole === 'SUPER_ADMIN' && 'Nationwide Unrestricted Super-Admin Boundary.'}
          {userRole === 'ZONAL_HR_MANAGER' && 'Zone North (Punjab & KPK) Scoped Boundary.'}
          {userRole === 'CENTRAL_HR' && 'Nationwide Central HR Operational Boundary.'}
          {userRole === 'BRANCH_MANAGER' && 'Lahore Central Hub Physical Verification Boundary.'}
          {userRole === 'EMPLOYEE_CANDIDATE' && 'Candidate Self-Service Boundary.'}
        </p>
      </div>
    </aside>
  );
};
