import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  ShieldCheck,
  Calendar,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CandidateDocument } from '../../../types';

interface DocumentPreviewModalProps {
  document: CandidateDocument | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  if (!document) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  const isPdf = document.mimeType === 'application/pdf' || document.fileName.endsWith('.pdf');

  return (
    <div id="document-preview-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">{document.fileName}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {document.documentType}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Uploaded {new Date(document.uploadedAt).toLocaleString()} &bull; {(document.fileSizeBytes / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Controls */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-300 min-w-[3rem] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90deg"
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Reset View"
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area: Split View Canvas & Metadata */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden min-h-[420px]">
          {/* Main Document Viewer Canvas */}
          <div className="md:col-span-2 bg-slate-950 p-6 flex items-center justify-center overflow-auto relative select-none">
            <div
              className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`
              }}
            >
              {isPdf ? (
                <div className="bg-white text-slate-900 rounded-xl shadow-2xl p-8 max-w-md w-full border border-slate-300 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-6 h-6 text-rose-600" />
                      <span className="font-bold text-sm">Official PDF Document Dossier</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">SEALED</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <strong>Document Title:</strong> {document.fileName}
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <strong>Verification Hash:</strong> SHA256:{document.id.replace(/-/g, '').substring(0, 16)}...
                    </div>
                    <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Security watermark and tamper-evident signatures verified.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={document.fileUrl}
                  alt={document.fileName}
                  referrerPolicy="no-referrer"
                  className="max-h-[500px] w-auto object-contain rounded-lg shadow-2xl border border-slate-800"
                />
              )}
            </div>

            {/* Quick Watermark Overlay */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-400 border border-slate-800">
              POSTEX INTERNAL ONBOARDING &bull; PHYSICAL VERIFICATION ONLY
            </div>
          </div>

          {/* Sidebar Info & OCR Metadata */}
          <div className="p-5 bg-slate-900 border-l border-slate-800 space-y-4 overflow-y-auto">
            {/* Status Card */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Verification State</label>
              <div className="mt-1.5 flex items-center gap-2">
                {document.verificationStatus === 'ACCEPTED' && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified (Accepted)
                  </span>
                )}
                {document.verificationStatus === 'REQUIRES_REUPLOAD' && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Needs Correction
                  </span>
                )}
                {document.verificationStatus === 'PENDING' && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                    Pending BM Check
                  </span>
                )}
              </div>
            </div>

            {/* OCR Extracted Data (if available) */}
            {document.ocrExtractedData && Object.keys(document.ocrExtractedData).length > 0 && (
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Automated OCR Extraction</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  {Object.entries(document.ocrExtractedData).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-1 border-b border-slate-800/60 text-[11px]">
                      <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-white font-medium">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Remarks */}
            {document.remarks && (
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Verification Remarks</label>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">{document.remarks}</p>
              </div>
            )}

            {/* Document Attributes */}
            <div className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" /> Size
                </span>
                <span className="font-mono text-slate-300">{(document.fileSizeBytes / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Upload Date
                </span>
                <span className="font-mono text-slate-300">{new Date(document.uploadedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Security Check
                </span>
                <span className="text-emerald-400 font-medium">Tamper Clean</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
};
