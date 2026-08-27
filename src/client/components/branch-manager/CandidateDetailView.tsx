import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Send,
  RotateCcw,
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Sparkles,
  AlertTriangle,
  Lock,
  Layers
} from 'lucide-react';
import { Candidate, Application, CandidateDocument } from '../../../types';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface CandidateDetailViewProps {
  candidate: Candidate;
  application: Application | null;
  documents: CandidateDocument[];
  onBack: () => void;
  onRefresh: () => void;
  currentUserName: string;
}

export const CandidateDetailView: React.FC<CandidateDetailViewProps> = ({
  candidate,
  application,
  documents,
  onBack,
  onRefresh,
  currentUserName
}) => {
  const [activePreviewDoc, setActivePreviewDoc] = useState<CandidateDocument | null>(documents[0] || null);
  const [modalPreviewDoc, setModalPreviewDoc] = useState<CandidateDocument | null>(null);

  // Per-document verification state editing
  const [docStatuses, setDocStatuses] = useState<Record<string, 'ACCEPTED' | 'REQUIRES_REUPLOAD' | 'PENDING'>>(() => {
    const map: Record<string, 'ACCEPTED' | 'REQUIRES_REUPLOAD' | 'PENDING'> = {};
    documents.forEach(d => {
      map[d.id] = (d.verificationStatus as any) || 'PENDING';
    });
    return map;
  });

  const [docRemarks, setDocRemarks] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    documents.forEach(d => {
      map[d.id] = d.remarks || '';
    });
    return map;
  });

  const [savingDocId, setSavingDocId] = useState<string | null>(null);
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});

  // BM Approval & Forwarding state
  const [signatureData, setSignatureData] = useState<string | null>(
    application?.metadata?.digitalSignature || null
  );
  const [finalRemarks, setFinalRemarks] = useState<string>(
    application?.metadata?.finalRemarks || application?.rejectionReason || ''
  );
  const [forwarding, setForwarding] = useState(false);
  const [forwardError, setForwardError] = useState<string | null>(null);
  const [forwardSuccess, setForwardSuccess] = useState<string | null>(null);

  // Forwarding Guard: Calculate if all required documents are checked (none are PENDING)
  const uncheckedCount = documents.filter(d => (docStatuses[d.id] || d.verificationStatus) === 'PENDING').length;
  const hasCorrections = documents.some(d => (docStatuses[d.id] || d.verificationStatus) === 'REQUIRES_REUPLOAD');
  const allDocsChecked = documents.length > 0 && uncheckedCount === 0;

  // Handle single document status check
  const handleDocumentVerificationChange = async (docId: string, status: 'ACCEPTED' | 'REQUIRES_REUPLOAD') => {
    // Clear previous error
    setDocErrors(prev => ({ ...prev, [docId]: '' }));
    
    // Update local optimistic status
    setDocStatuses(prev => ({ ...prev, [docId]: status }));

    const remarks = docRemarks[docId] || '';

    // Requirement: Remarks must be required when selecting Needs Correction
    if (status === 'REQUIRES_REUPLOAD' && remarks.trim().length < 4) {
      setDocErrors(prev => ({
        ...prev,
        [docId]: 'Remarks are mandatory when marking as "Needs Correction". Please specify the correction needed.'
      }));
      return;
    }

    try {
      setSavingDocId(docId);
      const res = await fetch(`/api/branch-manager/documents/${docId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: status,
          remarks: remarks.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update document verification status');
      }

      onRefresh();
    } catch (err: any) {
      setDocErrors(prev => ({
        ...prev,
        [docId]: err.message || 'Verification update failed'
      }));
    } finally {
      setSavingDocId(null);
    }
  };

  const handleSaveRemarks = async (docId: string) => {
    const status = docStatuses[docId];
    if (status === 'PENDING') return;
    await handleDocumentVerificationChange(docId, status);
  };

  // Handle Forward to Central HR / Return for Correction
  const handleExecuteForward = async (decision: 'APPROVE_AND_FORWARD' | 'RETURN_FOR_CORRECTION') => {
    setForwardError(null);
    setForwardSuccess(null);

    // Validate checklist completeness
    if (!allDocsChecked) {
      setForwardError(`Cannot forward dossier: ${uncheckedCount} document(s) still need to be verified.`);
      return;
    }

    // Validate digital signature
    if (!signatureData) {
      setForwardError('Digital signature is mandatory before forwarding to Central HR.');
      return;
    }

    // Validate final remarks
    if (!finalRemarks || finalRemarks.trim().length < 5) {
      setForwardError('Please provide final remarks for the onboarding dossier.');
      return;
    }

    try {
      setForwarding(true);
      const res = await fetch(`/api/branch-manager/applications/${candidate.id}/forward-to-hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl: signatureData,
          signerName: currentUserName,
          finalRemarks: finalRemarks.trim(),
          decision
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to forward application.');
      }

      setForwardSuccess(data.message || 'Application forwarded successfully!');
      onRefresh();
    } catch (err: any) {
      setForwardError(err.message || 'Submission failed');
    } finally {
      setForwarding(false);
    }
  };

  return (
    <div id="candidate-detail-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Inbox
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {candidate.firstName} {candidate.lastName}
              </h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                {candidate.joiningId}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {candidate.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {candidate.designationTitle} &bull; {candidate.branchName} ({candidate.zoneName})
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Checked: <strong>{documents.length - uncheckedCount}/{documents.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Candidate Quick Profile Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="space-y-0.5">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" /> CNIC Number
          </span>
          <p className="font-mono font-bold text-slate-800">{candidate.cnic}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile
          </span>
          <p className="font-mono font-semibold text-slate-800">{candidate.mobile}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400" /> Assigned Branch
          </span>
          <p className="font-semibold text-slate-800">{candidate.branchName}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Expected Joining
          </span>
          <p className="font-semibold text-slate-800">{candidate.expectedJoiningDate}</p>
        </div>
      </div>

      {/* Main Split Layout: LEFT (Documents & Preview) & RIGHT (Checklist & BM Approval) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Uploaded Documents & Interactive Document Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-600" />
                Uploaded Documents ({documents.length})
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Select to preview</span>
            </div>

            {/* Document Tabs List */}
            <div className="p-3 divide-y divide-slate-100">
              {documents.map(doc => {
                const isSelected = activePreviewDoc?.id === doc.id;
                const status = docStatuses[doc.id] || doc.verificationStatus;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setActivePreviewDoc(doc)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-rose-50/80 border border-rose-200 ring-1 ring-rose-500/20'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : status === 'REQUIRES_REUPLOAD'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">{doc.documentType}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">{doc.fileName}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {status === 'ACCEPTED' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {status === 'REQUIRES_REUPLOAD' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Needs Correction
                        </span>
                      )}
                      {status === 'PENDING' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Unchecked
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Document Interactive Preview Box */}
          {activePreviewDoc && (
            <div className="bg-slate-900 rounded-2xl p-4 text-white border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-rose-400" />
                    Preview: {activePreviewDoc.documentType}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">{activePreviewDoc.fileName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalPreviewDoc(activePreviewDoc)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 text-slate-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Fullscreen
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl p-3 flex items-center justify-center min-h-[220px] max-h-[280px] overflow-hidden border border-slate-800/80">
                {activePreviewDoc.mimeType === 'application/pdf' ? (
                  <div className="text-center p-4 space-y-2">
                    <FileText className="w-10 h-10 text-rose-500 mx-auto" />
                    <p className="text-xs text-slate-300 font-semibold">{activePreviewDoc.fileName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Official PDF Document Sealed</p>
                    <button
                      type="button"
                      onClick={() => setModalPreviewDoc(activePreviewDoc)}
                      className="text-xs text-rose-400 hover:underline font-semibold"
                    >
                      Open in Document Viewer
                    </button>
                  </div>
                ) : (
                  <img
                    src={activePreviewDoc.fileUrl}
                    alt={activePreviewDoc.fileName}
                    referrerPolicy="no-referrer"
                    className="max-h-[240px] w-auto object-contain rounded-lg shadow-md"
                  />
                )}
              </div>

              {/* OCR data badge in preview */}
              {activePreviewDoc.ocrExtractedData && (
                <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> OCR Verified Metadata
                  </div>
                  {Object.entries(activePreviewDoc.ocrExtractedData).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-slate-300">
                      <span className="text-slate-500">{k}:</span>
                      <span>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Verification Checklist & BM Approval Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Verification Checklist Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  Document Physical Verification Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify each physical document against original credentials. Remarks mandatory for corrections.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {documents.length - uncheckedCount}/{documents.length} Completed
              </span>
            </div>

            {/* Checklist Items */}
            <div className="space-y-4">
              {documents.map((doc, idx) => {
                const currentStatus = docStatuses[doc.id] || doc.verificationStatus;
                const remarks = docRemarks[doc.id] || '';
                const error = docErrors[doc.id];
                const isSaving = savingDocId === doc.id;

                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-xl border transition-all ${
                      currentStatus === 'ACCEPTED'
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : currentStatus === 'REQUIRES_REUPLOAD'
                        ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/20'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{doc.documentType}</h4>
                          <span className="text-[11px] text-slate-500 font-mono">{doc.fileName}</span>
                        </div>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDocumentVerificationChange(doc.id, 'ACCEPTED')}
                          disabled={isSaving}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            currentStatus === 'ACCEPTED'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDocumentVerificationChange(doc.id, 'REQUIRES_REUPLOAD')}
                          disabled={isSaving}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            currentStatus === 'REQUIRES_REUPLOAD'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Needs Correction
                        </button>
                      </div>
                    </div>

                    {/* Remarks Input */}
                    <div className="space-y-1.5 mt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                          <span>Verification Remarks</span>
                          {currentStatus === 'REQUIRES_REUPLOAD' && (
                            <span className="text-amber-600 font-bold text-[10px]">(Mandatory)</span>
                          )}
                        </label>
                        {remarks && (
                          <button
                            type="button"
                            onClick={() => handleSaveRemarks(doc.id)}
                            className="text-[11px] text-rose-600 hover:underline font-semibold"
                          >
                            Save Remark
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDocRemarks(prev => ({ ...prev, [doc.id]: val }));
                          if (docErrors[doc.id]) {
                            setDocErrors(prev => ({ ...prev, [doc.id]: '' }));
                          }
                        }}
                        onBlur={() => handleSaveRemarks(doc.id)}
                        placeholder={
                          currentStatus === 'REQUIRES_REUPLOAD'
                            ? 'e.g. Blurry photo, expired license, wrong page uploaded...'
                            : 'Physical document verified against original CNIC/Card.'
                        }
                        className={`w-full px-3 py-1.5 text-xs bg-white rounded-lg border focus:outline-none transition-all ${
                          currentStatus === 'REQUIRES_REUPLOAD' && !remarks.trim()
                            ? 'border-amber-400 bg-amber-50/20 focus:ring-1 focus:ring-amber-500'
                            : 'border-slate-300 focus:ring-1 focus:ring-rose-500'
                        }`}
                      />

                      {error && (
                        <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Branch Manager Approval & Digital Sign-off Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-rose-600" />
                Branch Manager Formal Decision & Forwarding
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign off physically reviewed dossier and dispatch to Central HR for appointment letter generation.
              </p>
            </div>

            {/* Checklist Warning Banner if not all checked */}
            {!allDocsChecked && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Forwarding Locked:</strong> Every document must be reviewed and marked as either <em>Verified</em> or <em>Needs Correction</em> before forwarding.
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    {uncheckedCount} document(s) still pending Branch Manager inspection.
                  </div>
                </div>
              </div>
            )}

            {/* Final Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Branch Manager Final Remarks & Recommendation</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <textarea
                value={finalRemarks}
                onChange={(e) => setFinalRemarks(e.target.value)}
                rows={3}
                placeholder="Enter physical verification notes, candidate face-to-face check findings, and branch recommendation..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-800"
              />
            </div>

            {/* Digital Signature Pad */}
            <DigitalSignaturePad
              signerName={currentUserName}
              onSignatureChange={setSignatureData}
              required={true}
            />

            {/* Feedback Banners */}
            {forwardError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{forwardError}</span>
              </div>
            )}

            {forwardSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forwardSuccess}</span>
              </div>
            )}

            {/* Forwarding Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleExecuteForward('RETURN_FOR_CORRECTION')}
                disabled={forwarding || !allDocsChecked}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  !allDocsChecked
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                Return to Candidate for Correction
              </button>

              <button
                type="button"
                onClick={() => handleExecuteForward('APPROVE_AND_FORWARD')}
                disabled={forwarding || !allDocsChecked || hasCorrections}
                title={
                  !allDocsChecked
                    ? 'Check all documents first'
                    : hasCorrections
                    ? 'Resolve corrections before approving or click Return for Correction'
                    : 'Approve and forward'
                }
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
                  !allDocsChecked || hasCorrections
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                <Send className="w-4 h-4" />
                {forwarding ? 'Processing Sign-Off...' : 'Approve & Forward to Central HR'}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Fullscreen Document Preview Modal */}
      {modalPreviewDoc && (
        <DocumentPreviewModal
          document={modalPreviewDoc}
          onClose={() => setModalPreviewDoc(null)}
        />
      )}
    </div>
  );
};
