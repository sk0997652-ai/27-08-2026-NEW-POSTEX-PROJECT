import React, { useState, useEffect } from 'react';
import {
  Server,
  MessageSquare,
  Mail,
  HardDrive,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Key,
  Lock,
  FileText,
  Sparkles,
  ArrowRight,
  Database,
  Sliders,
  DollarSign
} from 'lucide-react';
import { GlobalIntegrationsState } from '../../../types';

interface IntegrationsDashboardProps {
  userRole: string;
}

export const IntegrationsDashboard: React.FC<IntegrationsDashboardProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<GlobalIntegrationsState | null>(null);
  const [activeCategory, setActiveCategory] = useState<'sms' | 'email' | 'storage' | 'whatsapp'>('sms');
  const [switching, setSwitching] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/integrations/overview');
      if (!res.ok) throw new Error('Failed to fetch integrations overview');
      const data = await res.json();
      setOverview(data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load integration states' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSwitchProvider = async (category: string, providerId: string) => {
    try {
      setSwitching(providerId);
      setFeedback(null);
      setTestResult(null);

      const res = await fetch('/api/integrations/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, providerId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to switch provider');
      }

      setFeedback({ type: 'success', message: data.message });
      if (data.overview) {
        setOverview(data.overview);
      } else {
        await fetchOverview();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSwitching(null);
    }
  };

  const handleRunDiagnosticTest = async (providerId: string) => {
    try {
      setTesting(true);
      setTestResult(null);
      setFeedback(null);

      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          providerId,
          testRecipient: testRecipient.trim() || undefined
        })
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        setFeedback({ type: 'success', message: data.message || 'Test successfully executed!' });
      } else {
        setFeedback({ type: 'error', message: data.message || data.error || 'Test failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Test execution failed' });
    } finally {
      setTesting(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
        <div className="text-slate-600 font-medium">Loading Production Integrations Architecture...</div>
      </div>
    );
  }

  const categoryCards = [
    {
      id: 'sms' as const,
      name: 'SMS & OTP Delivery',
      icon: MessageSquare,
      activeName: overview.sms.activeProviderName,
      isConfigured: overview.sms.isConfigured,
      badge: 'Pakistan Telecom Focus',
      summary: 'Delivers candidate login OTPs and verification alerts. Infobip and Jazz Business support PTA-compliant branded masks.'
    },
    {
      id: 'email' as const,
      name: 'Transactional Email',
      icon: Mail,
      activeName: overview.email.activeProviderName,
      isConfigured: overview.email.isConfigured,
      badge: 'Enterprise DKIM/SPF',
      summary: 'Dispatches onboarding offer letters and central HR review notifications. AWS SES recommended ($0.10/1k emails).'
    },
    {
      id: 'storage' as const,
      name: 'Private Document Vault',
      icon: HardDrive,
      activeName: overview.storage.activeProviderName,
      isConfigured: overview.storage.isConfigured,
      badge: '15-min Signed URLs',
      summary: 'Stores CNIC scans, degree proofs, and digital signatures in private buckets with short-lived HMAC signed download URLs.'
    },
    {
      id: 'whatsapp' as const,
      name: 'WhatsApp Business API',
      icon: Phone,
      activeName: overview.whatsapp.activeProviderName,
      isConfigured: overview.whatsapp.isConfigured,
      badge: 'Meta Cloud API',
      summary: 'High-visibility channel for candidate welcome alerts and instant document correction return notifications.'
    }
  ];

  const currentCategoryData = activeCategory === 'sms'
    ? overview.sms
    : activeCategory === 'email'
    ? overview.email
    : activeCategory === 'storage'
    ? overview.storage
    : overview.whatsapp;

  const currentRec = overview.recommendations.find(r =>
    (activeCategory === 'sms' && r.category.includes('SMS')) ||
    (activeCategory === 'email' && r.category.includes('Email')) ||
    (activeCategory === 'storage' && r.category.includes('Storage')) ||
    (activeCategory === 'whatsapp' && r.category.includes('WhatsApp'))
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 rounded-2xl p-6 md:p-8 text-white shadow-xl border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              Phase 7 — Production Integrations Architecture
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Real Gateway Management & Pluggable Providers
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
              Replace development mocks with production-grade enterprise providers. Built with strict zero-credential exposure,
              Pakistan telecom availability alignment, time-bounded private signed URLs, and dynamic hot-swapping.
            </p>
          </div>

          <button
            onClick={fetchOverview}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 transition-colors shadow-sm self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Gateway Status
          </button>
        </div>

        {/* Global Protection Safety Banner */}
        <div className="mt-6 pt-6 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Zero Hardcoded Credentials</span>
              <p className="text-slate-400 mt-0.5">All secrets stored exclusively in container environment variables (.env).</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <Sliders className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Pluggable & Replaceable</span>
              <p className="text-slate-400 mt-0.5">Hot-swap active gateways dynamically without restarting the application.</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <DollarSign className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Cost & Charge Protection</span>
              <p className="text-slate-400 mt-0.5">Paid APIs remain dormant in safe mock mode until credentials are provided.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryCards.map(cat => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setFeedback(null);
                setTestResult(null);
                setTestRecipient('');
              }}
              className={`text-left p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${isSelected ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    cat.isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cat.isConfigured ? 'Live Config' : 'Dev Safe Mode'}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-base">{cat.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.summary}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Active:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[130px]">{cat.activeName}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Detailed Category Configuration & Recommendation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Providers List & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Available {activeCategory.toUpperCase()} Providers
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a provider to hot-swap. Unconfigured paid gateways are guarded against accidental activation.
                </p>
              </div>
              <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                Active: <span className="font-bold text-slate-800">{currentCategoryData.activeProviderName}</span>
              </div>
            </div>

            <div className="space-y-3">
              {currentCategoryData.availableProviders.map(p => {
                const isActive = p.id === currentCategoryData.activeProviderId;
                const canSwitch = !isActive && (!p.isPaid || p.isConfigured);

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'border-rose-500 bg-rose-50/40'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{p.name}</span>
                          {isActive && (
                            <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
                              ACTIVE GATEWAY
                            </span>
                          )}
                          {p.isConfigured ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Configured in .env
                            </span>
                          ) : p.isPaid ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">
                              Awaiting Credentials
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                              Zero-Cost Dev Safe
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{p.description}</p>
                        {p.recommendationNote && (
                          <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 p-2 rounded-lg flex items-start gap-1.5 font-medium">
                            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-600" />
                            <span>{p.recommendationNote}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {!isActive ? (
                          <button
                            onClick={() => handleSwitchProvider(activeCategory, p.id)}
                            disabled={!canSwitch || switching === p.id}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                              canSwitch
                                ? 'bg-slate-900 hover:bg-slate-800 text-white border-transparent'
                                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            }`}
                            title={!canSwitch && p.isPaid ? 'Requires environment credentials in .env' : 'Activate this provider'}
                          >
                            {switching === p.id ? 'Switching...' : 'Activate'}
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Live In-Use
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Diagnostic Testing Studio */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-rose-600" />
              Live Gateway Diagnostic Dispatcher
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Send a test dispatch using the active {activeCategory.toUpperCase()} gateway to verify network connectivity and payload generation.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder={
                  activeCategory === 'sms'
                    ? 'Target Mobile (e.g. 03001234567)'
                    : activeCategory === 'email'
                    ? 'Target Email (e.g. test@postex.pk)'
                    : activeCategory === 'whatsapp'
                    ? 'Target Mobile (e.g. 03001234567)'
                    : 'Test file auto-generated'
                }
                value={testRecipient}
                onChange={e => setTestRecipient(e.target.value)}
                disabled={activeCategory === 'storage'}
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <button
                onClick={() => handleRunDiagnosticTest(currentCategoryData.activeProviderId)}
                disabled={testing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Dispatch Diagnostic Ping
                  </>
                )}
              </button>
            </div>

            {/* Test Result Inspection Window */}
            {testResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs border border-slate-800">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
                  <span className="flex items-center gap-1.5 font-sans font-semibold text-white">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    Diagnostic Response Trace
                  </span>
                  <span>Status: {testResult.success ? '200 SUCCESS' : 'FAILED'}</span>
                </div>
                <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Production Blueprint & Recommendation Dossier */}
        <div className="space-y-6">
          {currentRec && (
            <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                Production Recommendation
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{currentRec.recommendedProvider}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{currentRec.rationale}</p>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Cost Profile
                  </div>
                  <div className="text-xs font-medium text-emerald-400 bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800/40">
                    {currentRec.costProfile}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Required Environment Variables (.env)
                  </div>
                  <div className="space-y-1">
                    {currentRec.requiredCredentials.map(cred => (
                      <div key={cred} className="font-mono text-[11px] bg-slate-800 px-2.5 py-1.5 rounded text-rose-300 border border-slate-700/60 flex items-center justify-between">
                        <span>{cred}</span>
                        <Key className="w-3 h-3 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Storage Signed URL Verification Helper */}
          {activeCategory === 'storage' && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                Private Bucket & Signed URL Security
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Candidate identity proofs, police clearances, medical certificates, and digital signatures are never served publicly.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-800">Default Bucket:</strong> hr-private-documents</li>
                <li><strong className="text-slate-800">Signed URL TTL:</strong> 900 seconds (15 minutes)</li>
                <li><strong className="text-slate-800">RLS Enforcement:</strong> Public direct reads blocked</li>
                <li><strong className="text-slate-800">Local Dev Mode:</strong> Cryptographic SHA-256 HMAC verification</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
