import React from 'react';
import { Layers, ArrowRight, ShieldCheck, FileCheck, CheckCircle2, Building, UserCheck } from 'lucide-react';
import { UserRole } from '../../../types';

interface WorkflowPreviewProps {
  userRole: UserRole;
}

export const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({ userRole }) => {
  const steps = [
    { num: '01', title: 'Super Admin Org Setup', actor: 'Super Admin', desc: 'Define zones, branch hubs, departments, and designations.', phase: 'Phase 1 (Active)' },
    { num: '02', title: 'Staff & Zonal Assignment', actor: 'Super Admin / Zonal HR', desc: 'Provision staff and lock geographic boundaries.', phase: 'Phase 1 (Active)' },
    { num: '03', title: 'Candidate Creation', actor: 'Central HR', desc: 'Create candidate profile and issue Joining ID & OTP.', phase: 'Phase 2 (Next)' },
    { num: '04', title: 'Self-Service Onboarding', actor: 'Candidate', desc: 'Mobile-first 6-step form: CNIC, bio, experience, signatures.', phase: 'Phase 3' },
    { num: '05', title: 'AI Document Verification', actor: 'Gemini OCR + Rules', desc: 'Real-time document inspection, OCR extraction & tamper check.', phase: 'Phase 4' },
    { num: '06', title: 'Branch Physical Verification', actor: 'Branch Manager', desc: 'Physical document review, face-to-face check, and remarks.', phase: 'Phase 5' },
    { num: '07', title: 'Branch Forwarding', actor: 'Branch Manager', desc: 'Forward verified dossier package to Central HR.', phase: 'Phase 6' },
    { num: '08', title: 'Central HR Decisioning', actor: 'Central HR', desc: 'Approve, return for correction, or reject onboarding.', phase: 'Phase 7' },
    { num: '09', title: 'Employee Conversion', actor: 'System Engine', desc: 'Generate official Employee ID and assign official credentials.', phase: 'Phase 8' },
    { num: '10', title: 'Dossier PDF Archival', actor: 'PDF Generator', desc: 'Compile sealed PostEx Joining Dossier PDF to private storage.', phase: 'Phase 9' }
  ];

  return (
    <div id="workflow-preview" className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-rose-600" />
          Sequential PostEx Candidate Lifecycle Overview
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Master 10-step sequential workflow pipeline. Direct API skipping is blocked at the database engine level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step, i) => {
          const isPhase1 = i < 2;
          return (
            <div
              key={step.num}
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
                isPhase1 ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-500/20' : 'bg-slate-50/70 border-slate-200 opacity-80'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                  isPhase1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {step.num}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{step.title}</h4>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isPhase1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {step.phase}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-rose-700 mt-0.5">Actor: {step.actor}</div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
