import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  FileCheck,
  Search,
  Eye,
  AlertTriangle,
  KeyRound,
  Copy,
  Check,
  Shield,
  FileText,
  User,
  GraduationCap,
  Landmark,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export interface DoctorRecord {
  id: string;
  userId: string;
  fullName: string;
  registrationNumber: string;
  specialization: string;
  qualifications: string;
  experienceYears: number;
  hospitalAffiliation?: string;
  department?: string;
  regStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
  verificationNotes?: string;
  govMatchStatus?: 'PENDING' | 'GOVERNMENT_MATCHED' | 'GOVERNMENT_MISMATCH';
  govMismatchDetails?: string;
  govVerificationResult?: {
    status: string;
    isMatched: boolean;
    matchScorePercent: number;
    comparisonDetails: Array<{
      field: string;
      submitted: string;
      government: string;
      matched: boolean;
    }>;
    mismatchSummary: string[];
    verifiedAt: string;
  };
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  authority?: string;
  authorityType?: string;
  university?: string;
  certificatesJson?: string;
  createdAt: string;
  user?: {
    email: string;
    mobile: string;
    status: string;
  };
}

export const AdminDoctorsPage: React.FC = () => {
  const { addToast } = useToast();
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecord | null>(null);
  const [rejectionModalDoctor, setRejectionModalDoctor] = useState<DoctorRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Password delivery modal after Admin approves doctor
  const [approvalModalData, setApprovalModalData] = useState<{
    doctor: DoctorRecord;
    temporaryPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminDoctors();
      if (res.success && Array.isArray(res.doctors)) {
        setDoctors(res.doctors);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load doctor applications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleApprove = async (doc: DoctorRecord) => {
    setIsProcessing(true);
    try {
      const res = await api.verifyDoctor(doc.id, 'APPROVE', undefined, 'Accreditation approved by Administrator.');
      if (res.success && res.temporaryPassword) {
        setApprovalModalData({
          doctor: res.doctor || doc,
          temporaryPassword: res.temporaryPassword,
        });
        addToast('success', `Doctor ${doc.fullName} approved! Temporary password generated.`);
        loadDoctors();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Approval failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalDoctor || !rejectionReason.trim()) return;

    setIsProcessing(true);
    try {
      const res = await api.verifyDoctor(rejectionModalDoctor.id, 'REJECT', rejectionReason.trim());
      if (res.success) {
        addToast('warning', `Application for ${rejectionModalDoctor.fullName} rejected.`);
        setRejectionModalDoctor(null);
        setRejectionReason('');
        loadDoctors();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Rejection failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPassword = () => {
    if (!approvalModalData?.temporaryPassword) return;
    navigator.clipboard.writeText(approvalModalData.temporaryPassword);
    setCopied(true);
    addToast('info', 'Temporary password copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesFilter =
      filterStatus === 'ALL' ||
      (filterStatus === 'PENDING' && doc.regStatus === 'PENDING') ||
      (filterStatus === 'APPROVED' && doc.regStatus === 'APPROVED') ||
      (filterStatus === 'REJECTED' && doc.regStatus === 'REJECTED');

    const matchesSearch =
      !searchQuery.trim() ||
      doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.user?.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 antialiased">
      {/* Header */}
      <ScrollReveal direction="bottom">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold">
              Practitioner Accreditation Desk
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
              Doctor Verification Queue
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Compare doctor credentials against government medical council registries before authorizing platform access.
            </p>
          </div>

          <button
            onClick={loadDoctors}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-[#101012] border border-white/10 text-white/80 text-xs font-semibold hover:bg-white/5 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Filters & Search */}
      <ScrollReveal direction="bottom" delay={0.05}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0B0B0D] p-4 rounded-[24px] border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40 border border-teal-500/30'
                    : 'bg-[#101012] text-white/60 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                {status === 'ALL'
                  ? `All Requests (${doctors.length})`
                  : status === 'PENDING'
                  ? `Pending Review (${doctors.filter((d) => d.regStatus === 'PENDING').length})`
                  : status === 'APPROVED'
                  ? `Approved (${doctors.filter((d) => d.regStatus === 'APPROVED').length})`
                  : `Rejected (${doctors.filter((d) => d.regStatus === 'REJECTED').length})`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, licence..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 bg-[#141416] text-white placeholder:text-white/40 text-xs focus:border-teal-500 outline-none"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* Doctor Requests Table */}
      <ScrollReveal direction="bottom" delay={0.1}>
        <div className="bg-[#0B0B0D] rounded-[24px] border border-white/10 shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-white/40 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
              <span>Loading practitioner verification records from database...</span>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="py-16 text-center text-xs text-white/40">
              No doctor applications found matching current criteria.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredDoctors.map((doc) => {
                const govRes = doc.govVerificationResult;
                const isMatched = doc.govMatchStatus === 'GOVERNMENT_MATCHED' || govRes?.isMatched;

                return (
                  <div
                    key={doc.id}
                    className="p-5 sm:p-6 hover:bg-white/5 transition-colors space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Doctor Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base">
                            {doc.fullName}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold">
                            Licence: {doc.registrationNumber}
                          </span>
                        </div>
                        <div className="text-xs text-blue-400 font-semibold flex items-center gap-2">
                          <span>{doc.specialization}</span>
                          <span>•</span>
                          <span>{doc.qualifications}</span>
                          <span>•</span>
                          <span>{doc.experienceYears} Years Exp</span>
                        </div>
                        <div className="text-[11px] text-white/40">
                          {doc.hospitalAffiliation || 'Pending Hospital Affiliation'} • {doc.authority || 'State Medical Council'}
                        </div>
                      </div>

                      {/* Status and Action Buttons */}
                      <div className="flex items-center gap-2 self-start lg:self-center">
                        {doc.regStatus === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleApprove(doc)}
                              disabled={isProcessing}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>ACCEPT DOCTOR</span>
                            </button>
                            <button
                              onClick={() => setRejectionModalDoctor(doc)}
                              disabled={isProcessing}
                              className="px-4 py-2 rounded-xl border border-rose-500/30 text-rose-400 font-semibold hover:bg-rose-500/10 transition-all text-xs flex items-center gap-1.5"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>REJECT</span>
                            </button>
                          </>
                        ) : doc.regStatus === 'APPROVED' ? (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>ADMIN_APPROVED • ACTIVE</span>
                          </span>
                        ) : (
                          <div className="text-right">
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                              <XCircle className="w-4 h-4 text-rose-400" />
                              <span>ADMIN_REJECTED</span>
                            </span>
                            {doc.rejectionReason && (
                              <p className="text-[10px] text-rose-400/80 mt-1 max-w-xs">
                                Reason: {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedDoctor(doc)}
                          className="px-3.5 py-2 rounded-xl bg-[#141416] hover:bg-white/5 border border-white/10 text-white/80 font-semibold transition-all text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </button>
                      </div>
                    </div>

                    {/* Section 10: Admin Government Verification Display Card */}
                    <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white/80 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-teal-400" />
                          <span>Government Medical Registry Comparison Result:</span>
                        </span>

                        {isMatched ? (
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Government Details Matched</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>⚠ Government Details Mismatch</span>
                          </span>
                        )}
                      </div>

                      {isMatched ? (
                        /* Matched Fields Checklist */
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 text-[11px] text-emerald-400">
                          <div className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Doctor ID ✓</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Name ✓</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>DOB ✓</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Reg No ✓</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Authority ✓</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Qualification ✓</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Certificates ✓</span>
                          </div>
                        </div>
                      ) : (
                        /* Mismatch Details Table */
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[11px] text-amber-300 font-semibold">
                            Exact Mismatched Field Breakdown:
                          </p>
                          {govRes?.comparisonDetails && govRes.comparisonDetails.filter((c) => !c.matched).length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-[11px]">
                                <thead>
                                  <tr className="text-white/40 border-b border-white/5">
                                    <th className="py-1">Field</th>
                                    <th className="py-1">Submitted Value</th>
                                    <th className="py-1">Government Registry</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {govRes.comparisonDetails
                                    .filter((c) => !c.matched)
                                    .map((c, i) => (
                                      <tr key={i} className="text-white/80">
                                        <td className="py-1 font-bold text-rose-400">{c.field}</td>
                                        <td className="py-1 font-mono">{c.submitted}</td>
                                        <td className="py-1 font-mono text-amber-300">{c.government}</td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-400">
                              {doc.verificationNotes || 'Application credentials require administrative manual review.'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Section 37: Admin Approval Temporary Password Modal */}
      {approvalModalData && (
        <Modal
          isOpen={true}
          onClose={() => setApprovalModalData(null)}
          title="Doctor Approved — System Temporary Password"
        >
          <div className="space-y-5 text-xs pt-2">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                Doctor Accreditation Approved Successfully
              </h3>
              <p className="text-white/60">
                Dr. {approvalModalData.doctor.fullName} ({approvalModalData.doctor.registrationNumber}) is now active.
              </p>
            </div>

            {/* Temporary Password Box */}
            <div className="p-4 rounded-2xl bg-[#0B0B0D] border border-white/10 text-white space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-teal-400 block font-bold">
                System-Generated Temporary Password:
              </span>
              <div className="flex items-center justify-between gap-3 bg-[#141416] px-4 py-3 rounded-xl border border-white/10">
                <span className="font-mono text-lg font-black tracking-widest text-emerald-400">
                  {approvalModalData.temporaryPassword}
                </span>
                <button
                  onClick={handleCopyPassword}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5 text-[11px] font-semibold border border-white/10"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-amber-300">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Temporary Password Policy:</span>
              </p>
              <p className="leading-relaxed text-white/70">
                This temporary password is valid <strong>only for the doctor's first login</strong>. The doctor must change it immediately after signing in. The database stores only the secure cryptographic hash.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setApprovalModalData(null)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-all shadow-md"
              >
                Close & Complete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Modal */}
      {rejectionModalDoctor && (
        <Modal
          isOpen={true}
          onClose={() => setRejectionModalDoctor(null)}
          title={`Reject Application: ${rejectionModalDoctor.fullName}`}
        >
          <form onSubmit={handleRejectConfirm} className="space-y-4 text-xs pt-2">
            <p className="text-white/70">
              Provide an official statutory audit reason for rejecting this practitioner's registration:
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Medical registration licence could not be validated with State Council records..."
              className="w-full p-3 rounded-xl border border-white/10 bg-[#141416] text-white focus:border-rose-500 outline-none"
              required
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setRejectionModalDoctor(null)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 font-semibold hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold disabled:opacity-50 transition-all shadow-md"
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Full Dossier Inspection Modal */}
      {selectedDoctor && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDoctor(null)}
          title={`Accreditation Dossier: ${selectedDoctor.fullName}`}
        >
          <div className="space-y-4 text-xs pt-2">
            <div className="p-4 bg-[#101012] rounded-2xl border border-white/10 space-y-2.5">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Legal Name:</span>
                <span className="font-semibold text-white">{selectedDoctor.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Medical Registration Number:</span>
                <span className="font-mono font-bold text-teal-400">{selectedDoctor.registrationNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Licensing Authority:</span>
                <span className="font-semibold text-white/80">{selectedDoctor.authority || 'State Medical Council'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Qualification & Specialization:</span>
                <span className="font-semibold text-white/80">{selectedDoctor.qualifications} — {selectedDoctor.specialization}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Clinical Experience:</span>
                <span className="font-semibold text-white/80">{selectedDoctor.experienceYears} Years</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Hospital Affiliation:</span>
                <span className="font-semibold text-white/80">{selectedDoctor.hospitalAffiliation || 'Not affiliated'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/50">Government Match Status:</span>
                <span className={`font-semibold ${selectedDoctor.govMatchStatus === 'GOVERNMENT_MATCHED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedDoctor.govMatchStatus || 'PENDING'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDoctorsPage;
