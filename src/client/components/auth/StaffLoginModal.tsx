import React, { useState } from 'react';
import { X, Lock, Mail, ShieldAlert, KeyRound, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';
import { UserRole } from '../../../types';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: any) => void;
  onOpenResetPassword: () => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenResetPassword
}) => {
  const [email, setEmail] = useState('superadmin@postex.pk');
  const [password, setPassword] = useState('PostEx@2026!');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedForSeconds, setLockedForSeconds] = useState<number | null>(null);

  if (!isOpen) return null;

  const quickPresets = [
    { label: 'Super Admin', email: 'superadmin@postex.pk', role: 'SUPER_ADMIN' },
    { label: 'Zonal HR (North)', email: 'zonal.north@postex.pk', role: 'ZONAL_HR_MANAGER' },
    { label: 'Central HR', email: 'central.hr@postex.pk', role: 'CENTRAL_HR' },
    { label: 'BM (Lahore)', email: 'bm.lhr@postex.pk', role: 'BRANCH_MANAGER' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed');
        if (data.remainingAttempts !== undefined) setRemainingAttempts(data.remainingAttempts);
        if (data.lockedForSeconds) setLockedForSeconds(data.lockedForSeconds);
        return;
      }

      onLoginSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Staff Authentication Portal</h3>
              <p className="text-[11px] text-slate-400">PostEx Enterprise Session Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Quick Preset Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Quick-Fill Staff Account Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickPresets.map(preset => (
                <button
                  key={preset.email}
                  type="button"
                  onClick={() => {
                    setEmail(preset.email);
                    setPassword('PostEx@2026!');
                    setErrorMessage('');
                  }}
                  className={`text-left p-2 rounded-lg border text-xs transition-all ${
                    email === preset.email
                      ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-semibold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block font-bold">{preset.label}</span>
                  <span className="text-[10px] text-slate-500 truncate block">{preset.email}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="input-staff-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="name@postex.pk"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenResetPassword();
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="input-staff-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="••••••••••••"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Default demo password: PostEx@2026!</p>
            </div>

            {/* Error & Rate Limit Warning */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-semibold">{errorMessage}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="text-[11px] text-rose-600 mt-0.5">
                      {remainingAttempts} attempt(s) remaining before automatic 15-minute account lock.
                    </p>
                  )}
                  {lockedForSeconds && (
                    <p className="text-[11px] text-rose-700 font-bold mt-0.5">
                      Account locked. Cooldown timer active ({lockedForSeconds}s).
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              id="btn-submit-staff-login"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Authenticate & Issue Session
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
