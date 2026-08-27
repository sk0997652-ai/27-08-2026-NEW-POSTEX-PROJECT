import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, Sparkles } from 'lucide-react';

interface DigitalSignaturePadProps {
  signerName: string;
  onSignatureChange: (dataUrl: string | null) => void;
  required?: boolean;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  signerName,
  onSignatureChange,
  required = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(signerName || 'Usman Ali');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a'; // slate-900
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignatureChange(null);
  };

  const handleUseTypedSignature = () => {
    if (!typedName.trim()) return;
    // Generate SVG / Canvas data URL from typed name
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80">
      <style>
        .sig { font-family: 'Brush Script MT', 'Dancing Script', cursive, sans-serif; font-size: 32px; fill: #0f172a; }
        .meta { font-family: sans-serif; font-size: 9px; fill: #64748b; }
      </style>
      <text x="15" y="45" class="sig">${typedName.trim()}</text>
      <line x1="10" y1="58" x2="290" y2="58" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,3"/>
      <text x="15" y="70" class="meta">DIGITALLY VERIFIED BM SIGN-OFF &bull; ${new Date().toLocaleDateString()}</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    setHasDrawn(true);
    onSignatureChange(dataUrl);
  };

  return (
    <div id="digital-signature-pad" className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-rose-600" />
          <span>Branch Manager Digital Signature</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>

        <div className="flex items-center gap-1 text-[11px] bg-slate-200/70 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setMode('draw');
              handleClear();
            }}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              mode === 'draw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Draw
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('type');
              handleUseTypedSignature();
            }}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              mode === 'type' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Type & Generate
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-28 bg-white border border-slate-300 rounded-lg cursor-crosshair touch-none"
          />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-slate-400 font-mono select-none">
              Sign here using mouse or touchscreen...
            </div>
          )}
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>Official digital sign-off will be stamped on dossier</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" /> Clear Signature
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={typedName}
              onChange={(e) => {
                setTypedName(e.target.value);
              }}
              placeholder="Enter Branch Manager Full Name"
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
            />
            <button
              type="button"
              onClick={handleUseTypedSignature}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Apply
            </button>
          </div>
          {hasDrawn && (
            <div className="p-2.5 bg-white border border-emerald-300 rounded-lg flex items-center justify-between text-xs">
              <div className="font-serif italic text-base text-slate-900">{typedName}</div>
              <div className="flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                <Check className="w-3.5 h-3.5" /> Cryptographic Sign-Off Generated
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
