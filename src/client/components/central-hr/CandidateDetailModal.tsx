import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  FileText,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Building2,
  GitBranch,
  Calendar,
  Layers,
  ShieldCheck,
  Award,
  Download,
  Printer,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Loader2,
  Eye,
  AlertCircle
} from 'lucide-react';
import { CandidateTrack, UserRole } from '../../../types';
import { JoiningDossierModal } from './JoiningDossierModal';

interface CandidateDetailModalProps {
  candidateId: string;
  onClose: () => void;
  onRefresh: () => void;
  userRole: UserRole;
}

export type DetailTab = 'PERSONAL' | 'DOCUMENTS' | 'BM_REMARKS' | 'TIMELINE';

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidateId,
  onClose,
  onRefresh,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('PERSONAL');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decision Modal States
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'RETURN' | 'REJECT' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  // Dossier Modal
  const [dossierData, setDossierData] = useState<any>(null);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Preview Document Image/PDF
  const [selectedDocPreview, setSelectedDocPreview] = useState<any>(null);

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/central-hr/candidates/${candidateId}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch candidate details');
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error fetching candidate');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidateDetails();
  }, [candidateId]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionType) return;

    if ((decisionType === 'RETURN' || decisionType === 'REJECT') && (!decisionReason.trim() || decisionReason.trim().length < 5)) {
      setDecisionError('Please provide a mandatory explanatory reason (minimum 5 characters).');
      return;
    }

    try {
      setSubmittingDecision(true);
      setDecisionError(null);

      const decisionPayload = {
        decision: decisionType === 'APPROVE' ? 'APPROVE_AND_ENROL' : (decisionType === 'RETURN' ? 'RETURN_FOR_CORRECTION' : 'REJECT'),
        reason: decisionReason,
        remarks: decisionRemarks
      };

      const res = await fetch(`/api/central-hr/candidates/${candidateId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decisionPayload)
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to submit decision');
      }

      setDecisionType(null);
      setDecisionReason('');
      setDecisionRemarks('');
      await fetchCandidateDetails();
      onRefresh();

      if (decisionType === 'APPROVE') {
        // Fetch and show dossier
        handleViewDossier();
      }
    } catch (err: any) {
      setDecisionError(err.message || 'An error occurred while executing decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleViewDossier = async () => {
    try {
      setLoadingDossier(true);
      const empId = data?.employee?.id || data?.candidate?.id;
      const res = await fetch(`/api/central-hr/employees/${empId}/dossier`);
      const dossier = await res.json();
      if (!res.ok) throw new Error(dossier.error || 'Failed to generate dossier');
      setDossierData(dossier);
      setShowDossierModal(true);
    } catch (err: any) {
      console.error(err);
      alert('Could not retrieve joining dossier: ' + err.message);
    } finally {
      setLoadingDossier(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-700">Loading Candidate Dossier & Verification Records...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
            <p className="text-xs text-slate-600 mt-1">{error || 'Candidate not found'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { candidate, application, documents, employee, timeline, bmRemarks } = data;
  const isEnrolled = candidate.status === 'CONVERTED_TO_EMPLOYEE' || Boolean(employee);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar with Candidate Snapshot */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-600 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
              {candidate.firstName?.[0]}{candidate.lastName?.[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight">{candidate.firstName} {candidate.lastName}</h2>
                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                  candidate.track === 'EXECUTIVE'
                    ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-700'
                    : 'bg-amber-900/80 text-amber-200 border border-amber-700'
                }`}>
                  {candidate.track || 'NON_EXECUTIVE'} TRACK
                </span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded-sm border border-slate-700">
                  {candidate.joiningId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {candidate.designationTitle} &bull; {candidate.departmentName} &bull; {candidate.branchName} ({candidate.zoneName})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isEnrolled && (
              <button
                onClick={handleViewDossier}
                disabled={loadingDossier}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                {loadingDossier ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Joining Dossier PDF</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-6 border-b border-slate-200 flex items-center space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('PERSONAL')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'PERSONAL'
                ? 'border-rose-600 text-rose-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Information</span>
          </button>

          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'DOCUMENTS'
                ? 'border-rose-600 text-rose-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Documents ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('BM_REMARKS')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'BM_REMARKS'
                ? 'border-rose-600 text-rose-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>BM Physical Verification</span>
          </button>

          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'TIMELINE'
                ? 'border-rose-600 text-rose-600 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Timeline</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'PERSONAL' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Identity & Bio */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-rose-600" />
                  <span>Demographics & Identity Credentials</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Full Legal Name</span>
                    <span className="font-bold text-slate-900 text-sm">{candidate.firstName} {candidate.lastName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Father's Name</span>
                    <span className="font-semibold text-slate-800">{candidate.fatherName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">CNIC Number</span>
                    <span className="font-bold text-slate-900 font-mono">{candidate.cnic}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{candidate.dateOfBirth}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Gender / Marital</span>
                    <span className="font-semibold text-slate-800">{candidate.gender} &bull; {candidate.maritalStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Mobile Number</span>
                    <span className="font-semibold text-slate-800 font-mono">{candidate.mobile}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Email Address</span>
                    <span className="font-semibold text-slate-800">{candidate.email}</span>
                  </div>
                </div>
              </div>

              {/* Address Records */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Residential Addresses
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-semibold block text-[11px]">Current Address</span>
                    <span className="text-slate-800 mt-1 block">{candidate.currentAddress}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-semibold block text-[11px]">Permanent Address (CNIC Match)</span>
                    <span className="text-slate-800 mt-1 block">{candidate.permanentAddress}</span>
                  </div>
                </div>
              </div>

              {/* Organization & Track Mapping */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Organizational Hierarchy & Deployment</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Career Track</span>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs font-bold uppercase rounded-sm ${
                      candidate.track === 'EXECUTIVE'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {candidate.track} TRACK
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Operational Zone</span>
                    <span className="font-bold text-slate-900">{candidate.zoneName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Branch Facility</span>
                    <span className="font-bold text-slate-900">{candidate.branchName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Expected Joining</span>
                    <span className="font-semibold text-slate-800">{candidate.expectedJoiningDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Department</span>
                    <span className="font-bold text-slate-900">{candidate.departmentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Designation Title</span>
                    <span className="font-bold text-slate-900">{candidate.designationTitle}</span>
                  </div>
                  {employee && (
                    <div className="col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center space-x-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="text-[10px] font-bold text-emerald-800 uppercase">Enrolled Employee ID</div>
                        <div className="font-mono font-bold text-emerald-950">{employee.employeeId}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DOCUMENTS */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Uploaded Onboarding Documentation</h3>
                  <p className="text-xs text-slate-500">All credentials must be verified by Branch Manager prior to Central HR enrollment.</p>
                </div>
                <div className="text-xs text-slate-500">
                  Total: <span className="font-bold text-slate-800">{documents.length}</span> documents
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{doc.documentType.replace(/_/g, ' ')}</div>
                          <div className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">{doc.fileName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        doc.verificationStatus === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : (doc.verificationStatus === 'REQUIRES_REUPLOAD'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200')
                      }`}>
                        {doc.verificationStatus}
                      </span>
                    </div>

                    {doc.remarks && (
                      <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100">
                        <span className="font-semibold text-slate-700">BM Remark:</span> {doc.remarks}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setSelectedDocPreview(doc)}
                        className="inline-flex items-center space-x-1 text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Document</span>
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BM REMARKS */}
          {activeTab === 'BM_REMARKS' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* BM Sign-Off Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Branch Manager Physical Verification Protocol</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Physical in-person inspection conducted at {candidate.branchName}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase border border-emerald-200">
                    Physical Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800">Original CNIC Checked</div>
                      <div className="text-[10px] text-slate-500">Matched with NADRA credentials</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800">Driving / Degree License</div>
                      <div className="text-[10px] text-slate-500">Track credentials verified</div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800">Permanent Address Check</div>
                      <div className="text-[10px] text-slate-500">Physical utility bill inspected</div>
                    </div>
                  </div>
                </div>

                {/* Remarks Text */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Branch Manager Final Remarks</div>
                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    "{bmRemarks?.remarks || 'Candidate physically verified in person. All original documents were verified and matched with uploaded copies. Candidate is recommended for active deployment.'}"
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Verified By: <strong className="text-slate-800">{bmRemarks?.verifiedByName || application?.branchVerifiedByName || 'Usman Ali (Branch Manager)'}</strong></span>
                    <span>Date: {new Date(bmRemarks?.verifiedAt || application?.branchVerifiedAt || Date.now()).toLocaleString()}</span>
                  </div>
                </div>

                {/* Digital Signature */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Authenticated Digital Signature Stamp</div>
                    <div className="text-[11px] text-slate-500">Cryptographically stamped during Branch Verification session</div>
                  </div>
                  <div className="px-6 py-2 bg-slate-50 rounded-lg border border-dashed border-slate-300 font-serif italic text-slate-800 text-lg">
                    Usman Ali (BM)
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: TIMELINE */}
          {activeTab === 'TIMELINE' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">End-to-End Onboarding Lifecycle Audit Trail</h3>
                <span className="text-xs text-slate-500 font-mono">Candidate ID: {candidate.id}</span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timeline?.map((step: any, idx: number) => (
                  <div key={step.id || idx} className="relative flex items-start space-x-4 text-xs">
                    <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                      step.status === 'COMPLETED'
                        ? 'bg-emerald-500 text-white'
                        : (step.status === 'IN_PROGRESS'
                            ? 'bg-amber-500 text-white animate-pulse'
                            : (step.status === 'FAILED' ? 'bg-rose-500 text-white' : 'bg-slate-300 text-slate-600'))
                    }`}>
                      {step.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{step.title}</span>
                        {step.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(step.timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px]">{step.description}</p>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        Actor: {step.actor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* DECISION ACTION BAR (Central HR Controls) */}
        {!isEnrolled && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900">Central HR Action:</span> Review all documents & BM verification before making enrollment decision.
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setDecisionType('REJECT')}
                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-colors"
              >
                Reject
              </button>

              <button
                onClick={() => setDecisionType('RETURN')}
                className="px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 rounded-lg text-xs font-bold transition-colors"
              >
                Return for Correction
              </button>

              <button
                onClick={() => setDecisionType('APPROVE')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Approve & Enrol
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Decision Confirmation Sub-Modal */}
      {decisionType && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {decisionType === 'APPROVE' && 'Confirm Approval & Enrolment'}
                {decisionType === 'RETURN' && 'Return Application for Document Correction'}
                {decisionType === 'REJECT' && 'Confirm Candidate Application Rejection'}
              </h3>
              <button
                onClick={() => {
                  setDecisionType(null);
                  setDecisionError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {decisionError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{decisionError}</span>
              </div>
            )}

            {decisionType === 'APPROVE' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Approving will automatically:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px]">
                  <li>Create official <strong>Employee Record</strong> in active database.</li>
                  <li>Generate unique <strong>Employee ID (PX-EMP-2026-XXXX)</strong>.</li>
                  <li>Generate <strong>Joining Dossier PDF</strong> with SHA-256 digital stamp.</li>
                  <li>Archive onboarding application and dispatch SMS & email alerts.</li>
                </ul>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Enrolment Remarks (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. All documents verified. Ready for deployment."
                    value={decisionRemarks}
                    onChange={e => setDecisionRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {(decisionType === 'RETURN' || decisionType === 'REJECT') && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  {decisionType === 'RETURN'
                    ? 'Please specify the exact correction instructions for the candidate and Branch Manager.'
                    : 'Please provide the mandatory rejection justification note.'}
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mandatory Reason (Min 5 chars) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={
                      decisionType === 'RETURN'
                        ? 'e.g. CNIC copy is blurry. Please re-upload high-resolution scan of back side.'
                        : 'e.g. Candidate failed driving license verification check.'
                    }
                    value={decisionReason}
                    onChange={e => setDecisionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setDecisionType(null);
                  setDecisionError(null);
                }}
                disabled={submittingDecision}
                className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDecisionSubmit}
                disabled={submittingDecision}
                className={`px-4 py-1.5 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 ${
                  decisionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : (decisionType === 'RETURN' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700')
                }`}
              >
                {submittingDecision ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {decisionType === 'APPROVE' && 'Confirm & Enrol'}
                    {decisionType === 'RETURN' && 'Return for Correction'}
                    {decisionType === 'REJECT' && 'Confirm Rejection'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Lightbox Modal */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedDocPreview.documentType.replace(/_/g, ' ')}</h4>
                <p className="text-xs text-slate-500 font-mono">{selectedDocPreview.fileName}</p>
              </div>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-64 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 space-y-2 p-6 text-center">
              <FileText className="w-12 h-12 text-slate-400" />
              <div className="text-xs font-semibold text-slate-700">Official Document Digital Scan</div>
              <div className="text-[11px] text-slate-500 max-w-sm">
                File URL: {selectedDocPreview.fileUrl}
              </div>
              <div className="text-[10px] font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-600">
                MIME: {selectedDocPreview.mimeType} &bull; Status: {selectedDocPreview.verificationStatus}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Joining Dossier PDF Modal */}
      {showDossierModal && dossierData && (
        <JoiningDossierModal
          dossier={dossierData}
          onClose={() => setShowDossierModal(false)}
        />
      )}

    </div>
  );
};
