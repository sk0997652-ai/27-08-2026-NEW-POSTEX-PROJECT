import React from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  Building2,
  GitBranch,
  Calendar,
  User,
  Hash,
  Award,
  Layers
} from 'lucide-react';
import { JoiningDossier } from '../../../types';

interface JoiningDossierModalProps {
  dossier: JoiningDossier;
  onClose: () => void;
}

export const JoiningDossierModal: React.FC<JoiningDossierModalProps> = ({
  dossier,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Controls Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Official Employee Joining Dossier</h2>
              <p className="text-xs text-slate-400 font-mono">Employee ID: {dossier.employeeId} | Joining ID: {dossier.joiningId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dossier Document Sheet (Print Optimized) */}
        <div id="printable-dossier" className="p-8 overflow-y-auto space-y-6 print:p-0 print:m-0">
          
          {/* Header Section */}
          <div className="flex items-start justify-between border-b-2 border-rose-600 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tighter text-slate-950">Post<span className="text-rose-600">Ex</span></span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold uppercase rounded-md tracking-wider border border-slate-200">
                  HR Operations
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">PostEx Pakistan Logistics & Financial Technologies (Pvt) Ltd</p>
              <p className="text-[11px] text-slate-400">Head Office: Executive Tower, Gulberg III, Lahore, Pakistan</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                Approved & Enrolled
              </span>
              <div className="text-sm font-black text-slate-900 font-mono">{dossier.employeeId}</div>
              <div className="text-[11px] text-slate-500">Date: {new Date(dossier.approvalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Cryptographic Verification Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700">Digital Cryptographic Verification Stamp:</span>
            </div>
            <div className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-sm border border-slate-200 truncate max-w-md">
              SHA256:{dossier.dossierHash}
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Name</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{dossier.candidateName}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Father's Name</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{dossier.fatherName}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CNIC Number</div>
              <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{dossier.cnic}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Career Track</div>
              <div className="mt-0.5">
                <span className={`inline-block px-2 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider ${
                  dossier.track === 'EXECUTIVE'
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {dossier.track} TRACK
                </span>
              </div>
            </div>
          </div>

          {/* Employment & Organizational Assignment */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Employment & Deployment Mapping</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs border border-slate-200 rounded-xl p-4 bg-white">
              <div>
                <span className="text-slate-500 block text-[11px]">Designation / Title</span>
                <span className="font-bold text-slate-800 text-sm">{dossier.designationTitle}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Department</span>
                <span className="font-bold text-slate-800">{dossier.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Zone</span>
                <span className="font-bold text-slate-800">{dossier.zoneName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Branch / Hub Facility</span>
                <span className="font-bold text-slate-800">{dossier.branchName}</span>
              </div>
            </div>
          </div>

          {/* Contact and Residential Details */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Contact & Address Verification</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs border border-slate-200 rounded-xl p-4 bg-white">
              <div>
                <span className="text-slate-500 block text-[11px]">Mobile Phone</span>
                <span className="font-semibold text-slate-800 font-mono">{dossier.mobile}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Email Address</span>
                <span className="font-semibold text-slate-800">{dossier.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Official Joining Date</span>
                <span className="font-semibold text-slate-800">{dossier.joiningDate}</span>
              </div>
              <div className="col-span-2 md:col-span-3">
                <span className="text-slate-500 block text-[11px]">Current Residential Address</span>
                <span className="font-medium text-slate-800">{dossier.currentAddress}</span>
              </div>
            </div>
          </div>

          {/* Verified Documents Inventory */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Document Credentials Matrix</span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Document Requirement</th>
                    <th className="px-4 py-2.5">File Reference</th>
                    <th className="px-4 py-2.5">Verification Status</th>
                    <th className="px-4 py-2.5">Inspector Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dossier.verifiedDocuments.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{doc.type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{doc.fileName}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>VERIFIED ORIGINAL</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-[11px]">{doc.remarks || 'Physically inspected & approved'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures & Verification Authorization Block */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-200">
            {/* Branch Manager Verification Block */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                1. Branch Physical Verification
              </div>
              <div className="h-16 flex items-center justify-center bg-white rounded-lg border border-dashed border-slate-300">
                <div className="text-center">
                  <div className="font-serif italic font-bold text-slate-800 text-lg tracking-wider">Usman Ali (BM)</div>
                  <div className="text-[9px] text-slate-400 uppercase font-sans font-medium">Digital Signature & Physical Stamp</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div><span className="font-semibold text-slate-700">Verified By:</span> {dossier.bmVerifiedBy}</div>
                <div><span className="font-semibold text-slate-700">Verification Date:</span> {new Date(dossier.bmVerifiedAt).toLocaleDateString()}</div>
                <div className="text-[10px] text-slate-500 italic mt-1">"{dossier.bmRemarks}"</div>
              </div>
            </div>

            {/* Central HR Approval Block */}
            <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/30 space-y-3">
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
                <span>2. Central HR Final Authorization</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black rounded-sm uppercase">Enrolled</span>
              </div>
              <div className="h-16 flex items-center justify-center bg-white rounded-lg border border-rose-200">
                <div className="text-center">
                  <div className="font-serif italic font-bold text-rose-700 text-lg tracking-wider">PostEx Central HR</div>
                  <div className="text-[9px] text-rose-500 uppercase font-sans font-semibold">Corporate Employment Stamp</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div><span className="font-semibold text-slate-700">Authorized By:</span> {dossier.centralApprovedBy}</div>
                <div><span className="font-semibold text-slate-700">Enrolment Date:</span> {new Date(dossier.centralApprovedAt).toLocaleDateString()}</div>
                <div className="text-[10px] text-slate-500 italic mt-1">"{dossier.centralRemarks}"</div>
              </div>
            </div>
          </div>

          {/* Legal / Policy Disclaimer */}
          <div className="text-[10px] text-slate-400 text-center pt-3 border-t border-slate-200 leading-relaxed">
            This document represents an official PostEx Human Resources Joining Dossier. Generated securely via PostEx Enterprise Portal.
            Cryptographically sealed and archived for regulatory compliance.
          </div>

        </div>

      </div>
    </div>
  );
};
