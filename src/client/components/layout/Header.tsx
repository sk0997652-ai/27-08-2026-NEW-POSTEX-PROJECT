import React, { useState } from 'react';
import { User, UserRole } from '../../../types';
import { ShieldCheck, UserCheck, KeyRound, Lock, LogIn } from 'lucide-react';
import { StaffLoginModal } from '../auth/StaffLoginModal';
import { PasswordResetModal } from '../auth/PasswordResetModal';

interface HeaderProps {
  currentUser: User;
  availableUsers: { id: string; name: string; email: string; role: UserRole; isActive: boolean }[];
  onSwitchUser: (userId: string) => void;
  onRefreshSession?: () => void;
}

const roleBadgeColor: Record<UserRole, { bg: string; text: string; border: string }> = {
  SUPER_ADMIN: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  ZONAL_HR_MANAGER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  CENTRAL_HR: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  BRANCH_MANAGER: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  EMPLOYEE_CANDIDATE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
};

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  availableUsers,
  onSwitchUser,
  onRefreshSession
}) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const badge = roleBadgeColor[currentUser.role] || roleBadgeColor.SUPER_ADMIN;

  const handleLoginSuccess = (session: any) => {
    if (session.user) {
      onSwitchUser(session.user.id);
    }
    if (onRefreshSession) onRefreshSession();
  };

  return (
    <>
      <header
        id="main-header"
        className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs"
      >
        {/* Brand & Context */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-xs">
            PX
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900 tracking-tight">PostEx</span>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">HR Portal</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Enterprise Onboarding & Zonal Governance</p>
          </div>
        </div>

        {/* Action Controls & Session Bar */}
        <div className="flex items-center space-x-3">
          {/* Direct Staff Password Login Button */}
          <button
            id="btn-open-staff-login"
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            <span>Staff Sign-In</span>
          </button>

          {/* Quick Role Switcher for Phase 2 Verification */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 space-x-2">
            <span className="text-xs font-medium text-slate-500 pl-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              Active Role:
            </span>
            <select
              id="role-switch-selector"
              value={currentUser.id}
              onChange={e => onSwitchUser(e.target.value)}
              className="bg-white border border-slate-300 text-xs font-semibold text-slate-800 rounded-md px-2.5 py-1 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Current Active User Profile Badge */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <span
                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border} mt-0.5`}
              >
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100">
              {currentUser.firstName[0]}
              {currentUser.lastName[0]}
            </div>
          </div>
        </div>
      </header>

      {/* Staff Login Modal */}
      <StaffLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onOpenResetPassword={() => setIsResetModalOpen(true)}
      />

      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onBackToLogin={() => {
          setIsResetModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </>
  );
};
