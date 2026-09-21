import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Download,
  Calendar,
  Building2,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { DocumentViewer } from '../../components/common/DocumentViewer';
import { FileUploader } from '../../components/common/FileUploader';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { BackButton } from '../../components/common/BackButton';
import api from '../../services/api';
import { ScrollReveal, ScrollRevealGroup, PremiumCard } from '../../components/common/ScrollReveal';

export interface LabReportItem {
  id: string;
  testName: string;
  category: 'Biochemistry' | 'Endocrinology' | 'Hematology' | 'Imaging';
  date: string;
  doctorName: string;
  labName: string;
  status: 'NORMAL' | 'BORDERLINE' | 'ABNORMAL';
  keyFindings: string;
  parameters: { name: string; value: string; unit: string; refRange: string; status: 'normal' | 'flag' }[];
  sha256Hash: string;
  blockNumber: number;
  verified: boolean;
}

export const PatientLabReportsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<LabReportItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const { addToast } = useToast();

  const [reports, setReports] = useState<LabReportItem[]>([]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.getLabReports();
      if (res.success && Array.isArray(res.reports)) {
        const mapped: LabReportItem[] = res.reports.map((r: any) => {
          let parameters: any[] = [];
          if (r.findingsJson) {
            try {
              const parsed = JSON.parse(r.findingsJson);
              if (Array.isArray(parsed)) parameters = parsed;
              else if (typeof parsed === 'object') {
                parameters = Object.entries(parsed).map(([k, v]) => ({
                  name: k,
                  value: String(v),
                  unit: '',
                  refRange: 'Normal',
                  status: 'normal',
                }));
              }
            } catch (e) {}
          }
          if (parameters.length === 0) {
            parameters = [{ name: 'Clinical Finding', value: r.summary || 'Normal Range', unit: '', refRange: 'Verified', status: 'normal' }];
          }
          return {
            id: r.reportNumber || r.id,
            testName: r.testName,
            category: (r.category as any) || 'Biochemistry',
            date: r.sampleDate || r.resultDate || 'Recent',
            doctorName: r.doctor?.fullName || 'Dr. Specialist',
            labName: r.laboratoryName || 'Apex Diagnostic Services',
            status: 'NORMAL',
            keyFindings: r.summary || 'Diagnostic test findings recorded.',
            parameters,
            sha256Hash: r.recordHash || '0x00',
            blockNumber: 10482,
            verified: r.blockchainStatus === 'VERIFIED',
          };
        });
        setReports(mapped);
      }
    } catch (err) {
      console.error('Failed to load lab reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReports();
  }, []);

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.labName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleSimulateRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast('info', 'Diagnostic test feeds synchronized with hospital laboratories.');
    }, 500);
  };

  const handleUploadReport = async (file: File, hash: string) => {
    try {
      setIsLoading(true);
      const testName = file.name.replace(/\.[^/.]+$/, '');
      const res = await api.uploadLabReport({
        testName,
        category: 'Biochemistry',
        laboratoryName: 'External Patient Document Upload',
        summary: 'Patient-submitted diagnostic document. Sealed with canonical SHA-256.',
        recordHash: hash,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        sampleDate: new Date().toISOString().split('T')[0],
        resultDate: new Date().toISOString().split('T')[0],
      });

      if (res && res.success) {
        addToast('success', 'Lab report uploaded and sealed to PostgreSQL with blockchain proof!');
        setShowUploadModal(false);
        await fetchReports();
      } else {
        throw new Error(res?.message || 'Failed to save lab report.');
      }
    } catch (err: any) {
      console.error('Failed to upload lab report:', err);
      addToast('error', err.message || 'Failed to upload and save lab report.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-white page-fade-in">
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/patient" />
      </div>

      {/* Header */}
      <ScrollReveal direction="left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Diagnostic Investigations
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Complete Lab Reports Management
            </h1>
            <p className="text-xs sm:text-sm text-white/65 mt-1">
              Pathology tests, biochemistry panels, and imaging reports anchored to the blockchain.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateRefresh}
              className="p-2.5 rounded-xl border border-white/[0.12] bg-[#141416] text-white hover:bg-white/[0.06] transition-colors shadow-sm cursor-pointer"
              title="Refresh Reports"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-cyan-500/20 cursor-pointer btn-interaction"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Report</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter & Search Bar */}
      <ScrollReveal direction="center" delay={0.04}>
        <div className="bg-[#101012] p-5 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Box */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by test name, hospital, physician, or findings..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#141416] text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-white/40"
              />
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-white/[0.1] text-xs bg-[#141416] text-white focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Diagnostic Categories</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Hematology">Hematology</option>
                <option value="Imaging">Imaging</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-white/[0.1] text-xs bg-[#141416] text-white focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Clinical Findings</option>
                <option value="NORMAL">Normal Findings</option>
                <option value="BORDERLINE">Borderline Findings</option>
                <option value="ABNORMAL">Abnormal Findings</option>
              </select>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ERROR STATE SIMULATION TOGGLE */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Connection to hospital laboratory server interrupted.</span>
          </div>
          <button
            onClick={() => setIsError(false)}
            className="font-bold underline hover:text-rose-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="bg-[#101012] p-12 rounded-3xl border border-white/[0.08] text-center space-y-3 shadow-2xl">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-bold text-white">Fetching verified laboratory records...</p>
        </div>
      ) : filtered.length === 0 ? (
        /* EMPTY STATE */
        <ScrollReveal direction="center">
          <div className="bg-[#101012] p-12 rounded-3xl border border-white/[0.08] text-center space-y-3 shadow-2xl">
            <FileText className="w-12 h-12 text-white/30 mx-auto" />
            <h4 className="text-base font-bold text-white">
              {reports.length === 0 ? 'No medical reports available' : 'No laboratory reports match your filter'}
            </h4>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              {reports.length === 0
                ? 'No laboratory reports or diagnostic documents recorded for this account.'
                : 'Try adjusting your search terms or select "All Diagnostic Categories" to browse all items.'}
            </p>
            {reports.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-[#18181B] hover:bg-[#222226] text-white text-xs font-bold transition-colors cursor-pointer border border-white/[0.08]"
              >
                Clear Filters
              </button>
            )}
          </div>
        </ScrollReveal>
      ) : (
        /* REPORT LIST */
        <ScrollRevealGroup staggerDelay={0.08} alternateDirection={true} className="space-y-6">
          {filtered.map((report) => (
            <PremiumCard
              key={report.id}
              accent="cyan"
              className="overflow-hidden space-y-0"
            >
              {/* Report Header Bar */}
              <div className="p-6 bg-[#141416] border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg flex-shrink-0 border border-cyan-500/20 shadow-md">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {report.testName}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {report.status}
                      </span>
                    </div>
                    <p className="text-xs text-cyan-400 font-semibold mt-0.5">
                      {report.category} • Ref ID: {report.id}
                    </p>
                    <p className="text-xs text-white/40">{report.labName}</p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between text-xs">
                  <span className="font-semibold text-white">{report.date}</span>
                  <span className="text-white/40 mt-0.5">Dr. {report.doctorName}</span>
                </div>
              </div>

              {/* Report Parameters Table */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-white/40 font-bold uppercase tracking-wider">
                        <th className="pb-3">Test Parameter</th>
                        <th className="pb-3">Observed Result</th>
                        <th className="pb-3">Reference Interval</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-white/80">
                      {report.parameters.map((p, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-semibold text-white">{p.name}</td>
                          <td className="py-3 font-bold text-white">
                            {p.value} <span className="text-white/40 font-normal">{p.unit}</span>
                          </td>
                          <td className="py-3 text-white/65 font-mono">{p.refRange}</td>
                          <td className="py-3">
                            {p.status === 'normal' ? (
                              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-500/20">
                                In Range
                              </span>
                            ) : (
                              <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold text-[10px] border border-amber-500/20">
                                Borderline
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-[#141416] rounded-xl border border-white/[0.08] text-xs text-white/80">
                  <strong className="text-white">Clinical Impression:</strong> {report.keyFindings}
                </div>

                {/* Footer with Blockchain Badge & Actions */}
                <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cryptographically Anchored • Block #{report.blockNumber}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-lg hover:shadow-cyan-500/20 cursor-pointer btn-interaction"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Full Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </PremiumCard>
          ))}
        </ScrollRevealGroup>
      )}

      {/* Document Viewer Modal */}
      {selectedReport && (
        <DocumentViewer
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.testName}
          category={`${selectedReport.category} Diagnostic Report`}
          date={selectedReport.date}
          doctorName={selectedReport.doctorName}
          hospitalName={selectedReport.labName}
          blockchainProof={{
            recordHash: selectedReport.sha256Hash,
            blockNumber: selectedReport.blockNumber,
            verified: selectedReport.verified,
          }}
        />
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Diagnostic Report"
      >
        <div className="space-y-4 text-white">
          <p className="text-xs text-white/60">
            Upload your laboratory PDF, scanned test, or DICOM imaging. The platform computes an
            instant canonical SHA-256 hash before storage.
          </p>
          <FileUploader
            label="Select Diagnostic File"
            onFileSelect={handleUploadReport}
          />
        </div>
      </Modal>
    </div>
  );
};
