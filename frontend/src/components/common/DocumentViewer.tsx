import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  FileText,
} from 'lucide-react';

export interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  category?: string;
  date?: string;
  doctorName?: string;
  hospitalName?: string;
  fileUrl?: string;
  contentSnippet?: React.ReactNode;
  blockchainProof?: {
    recordHash: string;
    blockNumber?: number;
    transactionHash?: string;
    timestamp?: string;
    verified: boolean;
  };
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  category = 'Medical Record',
  date,
  doctorName,
  hospitalName,
  contentSnippet,
  blockchainProof,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 75));
  const handleResetZoom = () => setZoom(100);

  const copyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob(
      [
        `====================================================\nEMR SECURE MEDICAL RECORD\n====================================================\nTitle: ${title}\nCategory: ${category}\nDate: ${date || 'N/A'}\nDoctor: ${doctorName || 'N/A'}\nHospital: ${hospitalName || 'N/A'}\nBlockchain SHA-256 Hash: ${blockchainProof?.recordHash || 'N/A'}\nTransaction Proof: ${blockchainProof?.transactionHash || 'N/A'}\n====================================================\n`,
      ],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_record.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 page-fade-in">
      <div className="relative w-full max-w-4xl bg-[#0B0B0D] rounded-[28px] shadow-2xl border border-white/[0.12] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-4 bg-[#101012] text-white flex items-center justify-between border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.08] text-cyan-400">
                  {category}
                </span>
                {date && <span className="text-xs text-slate-400">• {date}</span>}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white truncate max-w-md">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
              title="Download Record"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors ml-2"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-[#141416] border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Provider:</span>
            <span className="font-semibold text-white">
              {doctorName || 'Attending Physician'}
            </span>
            {hospitalName && (
              <>
                <span>•</span>
                <span className="text-slate-400">{hospitalName}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono w-12 text-center text-slate-300">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-[11px] bg-white/[0.06] hover:bg-white/[0.10] text-slate-300 border border-white/[0.08] rounded"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Document Body Area */}
        <div className="flex-1 overflow-auto p-6 bg-[#060709] flex justify-center items-start">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-2xl bg-[#101012] p-8 sm:p-10 rounded-2xl shadow-2xl border border-white/[0.10] transition-transform duration-150 text-slate-200"
          >
            {/* Hospital / Clinic Letterhead */}
            <div className="border-b border-white/[0.12] pb-4 mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  {hospitalName || 'National Health System EMR'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Accredited Clinical Diagnostics & Patient Records Center
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 bg-white/[0.08] text-[10px] font-mono font-bold text-cyan-400 rounded">
                  DOCUMENT NO: EMR-904281
                </span>
                <p className="text-xs text-slate-400 mt-1">Date: {date || 'Current Session'}</p>
              </div>
            </div>

            {/* Document Details */}
            <div className="mb-6">
              <h4 className="text-base font-bold text-white mb-1">{title}</h4>
              {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
            </div>

            {/* Custom Content Snippet or Clinical Report Body */}
            {contentSnippet ? (
              <div className="text-sm text-slate-300 leading-relaxed mb-6">{contentSnippet}</div>
            ) : (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed mb-6">
                <div className="p-4 bg-[#141416] rounded-xl border border-white/[0.08] space-y-2">
                  <div className="flex justify-between py-1 border-b border-white/[0.08] text-slate-400 font-bold">
                    <span>Test / Clinical Parameter</span>
                    <span>Result / Observation</span>
                    <span>Reference Interval</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-200">
                    <span>Serum Total Cholesterol</span>
                    <span className="font-bold text-white">188 mg/dL</span>
                    <span className="text-slate-400">&lt; 200 mg/dL</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-200">
                    <span>HDL (High-Density)</span>
                    <span className="font-bold text-white">46 mg/dL</span>
                    <span className="text-slate-400">&gt; 40 mg/dL</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-200">
                    <span>LDL (Low-Density)</span>
                    <span className="font-bold text-white">114 mg/dL</span>
                    <span className="text-slate-400">&lt; 100 mg/dL (Borderline)</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-200">
                    <span>Serum Triglycerides</span>
                    <span className="font-bold text-white">142 mg/dL</span>
                    <span className="text-slate-400">&lt; 150 mg/dL</span>
                  </div>
                </div>

                <p className="text-slate-400 text-xs italic">
                  Observation Note: Lipid ratios remain satisfactory. Advised continued moderate
                  aerobic exercise and low saturated fats diet. Follow up in 6 months.
                </p>
              </div>
            )}

            {/* Signature & Verification Seal */}
            <div className="pt-6 border-t border-white/[0.10] flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">{doctorName || 'Dr. Ananya Sharma'}</p>
                <p className="text-slate-400">Cardiology & Internal Medicine</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Lic: MED-TEL-89241</p>
              </div>
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-[11px]">Officially Certified Copy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Blockchain Integrity Footer */}
        {blockchainProof && (
          <div className="px-5 py-3 bg-[#101012] text-white border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {blockchainProof.verified ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>EMR INTEGRITY VERIFIED</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>INTEGRITY FAILURE</span>
                </div>
              )}
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5 font-mono text-slate-300">
                <span className="text-slate-500">SHA-256:</span>
                <span className="truncate max-w-[140px] sm:max-w-xs text-cyan-400">
                  {blockchainProof.recordHash}
                </span>
                <button
                  onClick={() => copyHash(blockchainProof.recordHash)}
                  className="p-1 hover:text-white text-slate-400 rounded"
                  title="Copy Hash"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              {blockchainProof.blockNumber && (
                <span>Block #{blockchainProof.blockNumber}</span>
              )}
              <span className="px-2 py-0.5 rounded bg-white/[0.08] text-slate-300 font-mono">
                Ethereum EVM
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
