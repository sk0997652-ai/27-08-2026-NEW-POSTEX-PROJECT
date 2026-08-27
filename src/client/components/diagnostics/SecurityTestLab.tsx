import React, { useState, useEffect } from 'react';
import { User, Permission, Zone, Branch, AuthorizationCheckResult, Phase2SecurityTestResult } from '../../../types';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Layers,
  ArrowRight,
  RefreshCw,
  Lock,
  Compass,
  Building,
  KeyRound
} from 'lucide-react';

export const SecurityTestLab: React.FC = () => {
  const [phase2Results, setPhase2Results] = useState<Phase2SecurityTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);

  // Playground state
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermCode, setSelectedPermCode] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [customEvalResult, setCustomEvalResult] = useState<AuthorizationCheckResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const fetchContext = async () => {
    try {
      const [uRes, pRes, zRes, bRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/permissions'),
        fetch('/api/organization/zones'),
        fetch('/api/organization/branches')
      ]);

      const uData = await uRes.json();
      const pData = await pRes.json();
      const zData = await zRes.json();
      const bData = await bRes.json();

      setUsers(uData);
      setPermissions(pData.permissions);
      setZones(zData);
      setBranches(bData);

      if (uData.length > 0) setSelectedUserId(uData[0].id);
      if (pData.permissions.length > 0) setSelectedPermCode(pData.permissions[0].code);
      if (zData.length > 0) setSelectedZoneId(zData[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const runPhase2Suite = async () => {
    try {
      setIsRunningTests(true);
      const res = await fetch('/api/diagnostic/test-phase2-suite', { method: 'POST' });
      const data = await res.json();
      setPhase2Results(data.results);
      setAllPassed(data.allPassed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleEvaluatePlayground = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEvaluating(true);
      const res = await fetch('/api/authorization/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          permissionCode: selectedPermCode,
          targetZoneId: selectedZoneId || null,
          targetBranchId: selectedBranchId || null
        })
      });
      const data = await res.json();
      setCustomEvalResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    fetchContext();
    runPhase2Suite();
  }, []);

  const filteredBranches = branches.filter(b => !selectedZoneId || b.zoneId === selectedZoneId);

  return (
    <div id="security-test-lab" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-rose-600" />
            Phase 2: 3-Layer Security & RBAC Test Suite
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Live database-level and authorization engine verification against the 5 critical security specifications.
          </p>
        </div>

        <button
          id="btn-run-all-tests"
          onClick={runPhase2Suite}
          disabled={isRunningTests}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
          Run Phase 2 Security Tests
        </button>
      </div>

      {/* Automated Suite Summary Banner */}
      {allPassed !== null && (
        <div
          id="test-suite-summary"
          className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
            allPassed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {allPassed ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
            )}
            <div>
              <h3 className="text-sm font-bold">
                {allPassed
                  ? 'All 5 Mandatory Security Specification Tests Passed'
                  : 'Security Specification Violations Detected'}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {allPassed
                  ? 'Zonal boundaries, branch facility isolation, non-bypassable geographic scopes, and Super Admin audit restrictions are strictly verified.'
                  : 'One or more security checks did not satisfy the RBAC & RLS policies.'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white/90 border border-current shadow-xs">
            {phase2Results.filter(r => r.passed).length} / {phase2Results.length} PASSED
          </span>
        </div>
      )}

      {/* 5 Required Tests List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            Phase 2 Specification Verification Suite
          </h3>
          <span className="text-xs text-slate-500 font-mono">5 Required Tests</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {phase2Results.map(test => (
            <div
              key={test.id}
              id={`test-card-${test.id.toLowerCase()}`}
              className={`p-4 rounded-xl border bg-white shadow-xs transition-all ${
                test.passed ? 'border-slate-200 hover:border-emerald-300' : 'border-rose-300 bg-rose-50/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {test.id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{test.name}</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase ${
                        test.testCategory === 'ZONAL_ISOLATION'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : test.testCategory === 'BRANCH_ISOLATION'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : test.testCategory === 'PERMISSION_OVERRIDE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : test.testCategory === 'OVERRIDE_SCOPE_LIMIT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {test.testCategory.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{test.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] block font-mono text-slate-400">
                      Expected: <strong className="text-slate-700">{test.expectedVerdict}</strong>
                    </span>
                    <span className="text-[10px] block font-mono text-slate-400">
                      Actual: <strong className="text-slate-900">{test.actualVerdict}</strong>
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 border shadow-2xs ${
                      test.passed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {test.passed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> PASSED
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600" /> FAILED
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* 3-Layer Diagnostic Trace Matrix */}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 font-semibold block text-[10px]">Actor & Role</span>
                  <span className="font-semibold text-slate-800 truncate block" title={test.trace.actorEmail}>
                    {test.trace.actorEmail}
                  </span>
                  <span className="text-[10px] font-mono text-rose-600 font-bold">{test.trace.actorRole}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 font-semibold block text-[10px]">Layer 1: Role Default</span>
                  <span
                    className={`font-bold inline-block px-1.5 py-0.5 rounded text-[10px] mt-0.5 ${
                      test.trace.layer1RoleDefault
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {test.trace.layer1RoleDefault ? 'ALLOW (Role Default)' : 'DENY (No Default)'}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 font-semibold block text-[10px]">Layer 2: User Override</span>
                  <span
                    className={`font-bold inline-block px-1.5 py-0.5 rounded text-[10px] mt-0.5 ${
                      test.trace.layer2Override === 'GRANTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : test.trace.layer2Override === 'REVOKED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {test.trace.layer2Override}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 font-semibold block text-[10px]">Layer 3: Scope Guard</span>
                  <span
                    className={`font-bold inline-block px-1.5 py-0.5 rounded text-[10px] mt-0.5 ${
                      test.trace.layer3ScopeResult === 'PASSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {test.trace.layer3ScopeResult}
                  </span>
                </div>
              </div>

              {/* Engine Reason Output */}
              <div className="mt-2 text-[11px] text-slate-600 bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono">
                <span className="text-rose-400 font-bold">Engine Assertion Trace: </span>
                <span>{test.trace.engineReason}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Authorization Playground */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Play className="w-4 h-4 text-rose-600" />
            Interactive 3-Layer Authorization Evaluation Playground
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Simulate any arbitrary user, permission request, and target geographic resource to inspect the exact 3-layer authorization calculation trace in real-time.
          </p>
        </div>

        <form onSubmit={handleEvaluatePlayground} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select User (Principal)</label>
              <select
                id="select-eval-user"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Permission Requested</label>
              <select
                id="select-eval-perm"
                value={selectedPermCode}
                onChange={e => setSelectedPermCode(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                {permissions.map(p => (
                  <option key={p.id} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Zone (Optional)</label>
              <select
                id="select-eval-zone"
                value={selectedZoneId}
                onChange={e => {
                  setSelectedZoneId(e.target.value);
                  setSelectedBranchId('');
                }}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="">Global / Unrestricted</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Branch (Optional)</label>
              <select
                id="select-eval-branch"
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="">All Zone Branches / None</option>
                {filteredBranches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              id="btn-evaluate-playground"
              type="submit"
              disabled={evaluating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
              Evaluate 3-Layer Authorization Matrix
            </button>
          </div>
        </form>

        {/* Custom Evaluation Result Display */}
        {customEvalResult && (
          <div
            id="custom-eval-result-card"
            className={`p-4 rounded-xl border mt-4 ${
              customEvalResult.allowed
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-rose-50/50 border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {customEvalResult.allowed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Result:{' '}
                  <span className={customEvalResult.allowed ? 'text-emerald-700' : 'text-rose-700'}>
                    {customEvalResult.allowed ? 'ACCESS GRANTED (200 OK)' : 'ACCESS DENIED (403 FORBIDDEN)'}
                  </span>
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Layer 1 (Role Default)</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {customEvalResult.layer1RoleDefault ? 'Granted by Role' : 'Denied by Default'}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Layer 2 (User Override)</span>
                <p className="font-bold text-slate-800 mt-0.5">{customEvalResult.layer2OverrideState}</p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Layer 3 (Geographic Scope)</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {customEvalResult.layer3ScopeEvaluation.passed ? 'Scope Passed' : 'Scope Blocked'}
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs">
              <strong className="text-slate-900">Reason: </strong>
              {customEvalResult.reason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
