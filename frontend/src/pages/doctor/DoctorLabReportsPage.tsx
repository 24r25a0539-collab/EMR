import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Search,
  UploadCloud,
} from 'lucide-react';
import { FileUploader } from '../../components/common/FileUploader';
import { useToast } from '../../contexts/ToastContext';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

export const DoctorLabReportsPage: React.FC = () => {
  const { addToast } = useToast();

  const [patientHealthId, setPatientHealthId] = useState('HP-100245');
  const [testName, setTestName] = useState('Comprehensive Lipid Profile');
  const [category, setCategory] = useState('Biochemistry');
  const [impression, setImpression] = useState('Optimal cardiac lipid ratios under active statin therapy.');
  const [fileHash, setFileHash] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsPublishing(false);

    addToast(
      'success',
      `Diagnostic report ${testName} published to patient ${patientHealthId} and registered on blockchain!`
    );
  };

  return (
    <div className="space-y-8 pb-24 text-white antialiased">
      {/* Header */}
      <ScrollReveal direction="left">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Diagnostic Upload Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
            Publish Laboratory Investigation
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Upload certified pathology results, biochemistry assays, and diagnostic panels with
            automatic cryptographic sealing.
          </p>
        </div>
      </ScrollReveal>

      {/* Upload Form */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="bg-[#0B0B0D] rounded-[32px] border border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
          <form onSubmit={handlePublish} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                  Patient Health ID *
                </label>
                <input
                  type="text"
                  value={patientHealthId}
                  onChange={(e) => setPatientHealthId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                  Test Name *
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                  Diagnostic Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-[#101012] text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Imaging">Radiology & Imaging</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                Pathologist / Clinical Impression *
              </label>
              <textarea
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder-white/40 focus:outline-none focus:border-cyan-500"
                rows={2}
                required
              />
            </div>

            <div>
              <FileUploader
                label="Select Diagnostic PDF or DICOM File"
                onFileSelect={(file, hash) => setFileHash(hash)}
              />
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-white/40 text-xs">
                Laboratory: Apex Diagnostic Services, Jubilee Hills
              </span>
              <button
                type="submit"
                disabled={isPublishing}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 text-xs disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isPublishing ? 'Anchoring to Blockchain...' : 'Publish & Anchor to Ledger'}</span>
              </button>
            </div>
          </form>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default DoctorLabReportsPage;
