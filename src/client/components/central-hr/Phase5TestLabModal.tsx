import React, { useState } from 'react';
import {
  FlaskConical,
  X,
  Play,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileCheck2,
  UserPlus,
  Award,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Layers,
  Terminal
} from 'lucide-react';

interface Phase5TestLabModalProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

export const Phase5TestLabModal: React.FC<Phase5TestLabModalProps> = ({
  onClose,
  onRefreshData
}) => {
  const [running, setRunning] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runPhase5Tests = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await fetch('/api/diagnostic/test-phase5-central-hr', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute Phase 5 tests');
      }
      setTestResponse(data);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Error executing test lab');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600 rounded-lg">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Phase 5 Automated Diagnostic Test Suite</h2>
              <p className="text-xs text-slate-400 font-mono">
                Flow: Submission &rarr; BM Verification &rarr; Central HR Review &rarr; Approval &rarr; Employee Creation &rarr; PDF Generation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Action Trigger Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-900">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span>Execute Complete End-to-End Onboarding Lifecycle Verification</span>
              </div>
              <p className="text-xs text-slate-500">
                Validates Candidate Registration, Track Classification, Branch Verification Sign-Off, RLS Zone Isolation, Enrolment, Employee ID generation, and SHA-256 PDF Dossier generation.
              </p>
            </div>

            <button
              onClick={runPhase5Tests}
              disabled={running}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 shrink-0"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing 6 Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Phase 5 Tests</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Test Results */}
          {testResponse && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Overall Status Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                testResponse.allPassed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-center space-x-3">
                  {testResponse.allPassed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600" />
                  )}
                  <div>
                    <h3 className="text-sm font-black">
                      {testResponse.allPassed ? 'ALL PHASE 5 TESTS PASSED SUCCESSFULLY' : 'SOME TESTS FAILED'}
                    </h3>
                    <p className="text-xs mt-0.5 opacity-90">
                      Passed: {testResponse.passedSteps} / {testResponse.totalSteps} verification checkpoints &bull; Executed at: {new Date(testResponse.executedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-white rounded-full font-mono text-xs font-black border">
                  {testResponse.passedSteps} / {testResponse.totalSteps} PASS
                </span>
              </div>

              {/* Execution Summary Snapshot */}
              {testResponse.summary && (
                <div className="bg-slate-900 text-white rounded-xl p-4 text-xs font-mono space-y-2 border border-slate-800">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Lifecycle Execution Snapshot</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Test Candidate:</span>
                      <strong className="text-slate-200">{testResponse.summary.candidateName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Joining ID:</span>
                      <strong className="text-rose-400">{testResponse.summary.joiningId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Employee ID:</span>
                      <strong className="text-emerald-400">{testResponse.summary.employeeId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Dossier Stamp:</span>
                      <strong className="text-indigo-300 truncate block">{testResponse.summary.dossierHash.substring(0, 16)}...</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Test Steps Cards */}
              <div className="space-y-3">
                {testResponse.testRuns?.map((step: any) => (
                  <div
                    key={step.step}
                    className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          step.passed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {step.step}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{step.name}</div>
                          <div className="text-[11px] text-slate-500">{step.description}</div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        step.passed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {step.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 font-sans block text-[10px] font-bold uppercase">Expected:</span>
                        <span className="text-slate-700">{step.expected}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans block text-[10px] font-bold uppercase">Actual:</span>
                        <span className="text-emerald-700 font-bold">{step.actual}</span>
                      </div>
                    </div>

                    {step.data && (
                      <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded-md border border-slate-200 truncate">
                        Trace Payload: {JSON.stringify(step.data)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}

          {!testResponse && !running && (
            <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <FlaskConical className="w-10 h-10 mx-auto text-slate-300" />
              <div>
                <p className="text-xs font-bold text-slate-700">Test Suite Ready</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
                  Click the "Run Phase 5 Tests" button to trigger the end-to-end automated validation flow.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
