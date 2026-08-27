import React, { useState } from 'react';
import { X, Mail, KeyRound, CheckCircle2, ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin
}) => {
  const [step, setStep] = useState<'REQUEST' | 'CONFIRM'>('REQUEST');
  const [email, setEmail] = useState('bm.lhr@postex.pk');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('PostEx@2027!');
  const [confirmPassword, setConfirmPassword] = useState('PostEx@2027!');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
      setMessage(data.message);
      setStep('CONFIRM');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch reset request');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update password');
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
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
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Password Reset Recovery</h3>
              <p className="text-[11px] text-slate-400">PostEx Secure Credential Management</p>
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
        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Password Updated Successfully</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your credentials have been securely updated. You may now log in with your new password.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onBackToLogin();
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
              >
                Proceed to Login
              </button>
            </div>
          ) : step === 'REQUEST' ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter your registered PostEx email address to generate a secure password reset token.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="input-reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="bm.lhr@postex.pk"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs flex items-center space-x-2 border border-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBackToLogin();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </button>

                <button
                  id="btn-request-reset-token"
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Dispatch Reset Token
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              {message && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                  {message}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Token</label>
                <input
                  id="input-reset-token"
                  type="text"
                  required
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono bg-slate-50 focus:bg-white"
                  placeholder="reset-token-..."
                />
                <p className="text-[10px] text-slate-400 mt-1">Token generated for development testing</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  id="input-reset-new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-xs"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  id="input-reset-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-xs"
                  placeholder="Re-enter new password"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs flex items-center space-x-2 border border-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('REQUEST')}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  id="btn-confirm-password-reset"
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
