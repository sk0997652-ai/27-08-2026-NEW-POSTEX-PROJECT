import React, { useState } from 'react';
import {
  Smartphone,
  CreditCard,
  Hash,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  User,
  FileText,
  MapPin,
  Clock,
  LogOut,
  Building,
  ArrowRight
} from 'lucide-react';
import { Candidate, Application, CandidateDocument } from '../../../types';

export const CandidateLoginPortal: React.FC = () => {
  // Login Form State
  const [joiningId, setJoiningId] = useState('PX-JOIN-2026-0891');
  const [cnic, setCnic] = useState('35201-8934123-1');
  const [mobile, setMobile] = useState('+92-321-4455667');
  const [otpCode, setOtpCode] = useState('');

  // Flow State: 'CREDENTIALS' -> 'OTP_INPUT' -> 'LOGGED_IN'
  const [authStep, setAuthStep] = useState<'CREDENTIALS' | 'OTP_INPUT' | 'LOGGED_IN'>('CREDENTIALS');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    maskedMobile?: string;
    expiresInMinutes?: number;
    debugMockOtp?: string;
  } | null>(null);

  // Authenticated Candidate State
  const [candidateData, setCandidateData] = useState<{
    candidate: Candidate;
    application?: Application;
    documents: CandidateDocument[];
  } | null>(null);
  const [candidateToken, setCandidateToken] = useState<string | null>(null);

  // Quick Preset Selector
  const candidatePresets = [
    {
      label: 'Hamza Rasheed (Lahore Rider - Verified)',
      joiningId: 'PX-JOIN-2026-0891',
      cnic: '35201-8934123-1',
      mobile: '+92-321-4455667'
    },
    {
      label: 'Ali Raza (Karachi COD - Submitted)',
      joiningId: 'PX-JOIN-2026-0892',
      cnic: '42101-1234567-3',
      mobile: '+92-333-7788990'
    }
  ];

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/candidate/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joiningId, cnic, mobile })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to dispatch verification code');
        return;
      }

      setSuccessInfo(data);
      if (data.debugMockOtp) {
        setOtpCode(data.debugMockOtp); // Auto-fill for developer convenience
      }
      setAuthStep('OTP_INPUT');
    } catch (err: any) {
      setErrorMessage(err.message || 'Network communication failure');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/candidate/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joiningId, cnic, otpCode })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'OTP verification failed');
        return;
      }

      setCandidateToken(data.token);

      // Fetch complete candidate dashboard data
      const meRes = await fetch('/api/candidate/me', {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      const meData = await meRes.json();
      setCandidateData(meData);
      setAuthStep('LOGGED_IN');
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutCandidate = () => {
    setCandidateToken(null);
    setCandidateData(null);
    setAuthStep('CREDENTIALS');
    setOtpCode('');
    setSuccessInfo(null);
  };

  return (
    <div id="candidate-login-portal" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-rose-600" />
            Candidate Self-Service Onboarding Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Secure Candidate Authentication via Joining ID + CNIC + Mobile Number + SMS OTP Gateway.
          </p>
        </div>

        {authStep === 'LOGGED_IN' && (
          <button
            onClick={handleLogoutCandidate}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> End Candidate Session
          </button>
        )}
      </div>

      {authStep === 'LOGGED_IN' && candidateData ? (
        /* Authenticated Candidate Dashboard */
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl bg-rose-600 flex items-center justify-center text-white text-xl font-bold">
                {candidateData.candidate.firstName[0]}
                {candidateData.candidate.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">
                    {candidateData.candidate.firstName} {candidateData.candidate.lastName}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {candidateData.candidate.joiningId}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {candidateData.candidate.designationTitle} &bull; {candidateData.candidate.departmentName}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-300" />
                    {candidateData.candidate.branchName} ({candidateData.candidate.zoneName})
                  </span>
                  <span>&bull;</span>
                  <span>CNIC: {candidateData.candidate.cnic}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Application Status</span>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                  candidateData.candidate.status === 'BRANCH_VERIFIED'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-amber-500 text-slate-950 shadow-xs'
                }`}
              >
                {candidateData.candidate.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* 6-Step Onboarding Progress Tracker */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              6-Step Onboarding Journey
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
              {[
                { step: 1, label: 'Profile Registration', done: true },
                { step: 2, label: 'Emergency Contact', done: true },
                { step: 3, label: 'Document Uploads', done: true },
                { step: 4, label: 'Bank & COD Setup', done: true },
                {
                  step: 5,
                  label: 'Physical Verification',
                  done: candidateData.candidate.status === 'BRANCH_VERIFIED'
                },
                { step: 6, label: 'Central Approval', done: candidateData.candidate.status === 'HIRED' }
              ].map(st => (
                <div
                  key={st.step}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    st.done
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {st.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 text-[10px] font-bold flex items-center justify-center text-slate-400">
                        {st.step}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold block uppercase tracking-wider">Step {st.step}</span>
                  <span className="text-[11px] font-semibold block leading-tight mt-0.5">{st.label}</span>
                </div>
              ))}
            </div>

            {candidateData.application?.branchVerifiedBy && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Branch Verification Record: </span>
                  <span>Physically verified by {candidateData.application.branchVerifiedByName}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(candidateData.application.branchVerifiedAt!).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Uploaded Documents List */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              Candidate Verified Documentation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidateData.documents.map(doc => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{doc.documentType.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                        {doc.verificationStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">{doc.fileName}</p>
                    {doc.remarks && <p className="text-[11px] text-slate-600 italic mt-1">"{doc.remarks}"</p>}
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    View File
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Login / Verification Gateway Card */
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Candidate OTP Gateway</h3>
              <p className="text-[11px] text-slate-400">Joining ID &bull; CNIC &bull; Mobile Number &bull; OTP</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Quick Demo Previews */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Quick-Fill Candidate Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {candidatePresets.map(preset => (
                  <button
                    key={preset.joiningId}
                    type="button"
                    onClick={() => {
                      setJoiningId(preset.joiningId);
                      setCnic(preset.cnic);
                      setMobile(preset.mobile);
                      setAuthStep('CREDENTIALS');
                      setErrorMessage('');
                    }}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                      joiningId === preset.joiningId
                        ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-semibold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="block font-bold">{preset.label}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{preset.joiningId}</span>
                  </button>
                ))}
              </div>
            </div>

            {authStep === 'CREDENTIALS' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Joining ID</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="input-candidate-joining-id"
                      type="text"
                      required
                      value={joiningId}
                      onChange={e => setJoiningId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                      placeholder="PX-JOIN-2026-XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CNIC Number</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="input-candidate-cnic"
                      type="text"
                      required
                      value={cnic}
                      onChange={e => setCnic(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="35201-XXXXXXX-X"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Mobile Number</label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="input-candidate-mobile"
                      type="text"
                      required
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="+92-3XX-XXXXXXX"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  id="btn-request-candidate-otp"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating OTP...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" /> Request One-Time Password (OTP)
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {successInfo && (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>OTP Dispatched to {successInfo.maskedMobile}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Code is valid for {successInfo.expiresInMinutes} minutes. (Development console simulation: check
                      auto-filled code below)
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enter 6-Digit OTP Code</label>
                  <input
                    id="input-candidate-otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    className="w-full px-4 py-2.5 text-center text-lg font-mono tracking-widest font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="••••••"
                  />
                  <p className="text-[10px] text-slate-400 text-center mt-1">
                    Dev Mock OTP: <strong>{successInfo?.debugMockOtp || '123456'}</strong>
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthStep('CREDENTIALS')}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Change Credentials
                  </button>

                  <button
                    id="btn-verify-candidate-otp"
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Verify & Access Portal
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
