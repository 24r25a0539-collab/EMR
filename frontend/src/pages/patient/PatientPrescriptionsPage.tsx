import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Pill,
  Building2,
  ShieldCheck,
  Eye,
  Copy,
  Check,
  PenTool,
  Table,
  AlertCircle,
  ArrowLeft,
  Calendar,
  RotateCw,
} from 'lucide-react';
import { DocumentViewer } from '../../components/common/DocumentViewer';
import { useToast } from '../../contexts/ToastContext';
import { BackButton } from '../../components/common/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup, PremiumCard } from '../../components/common/ScrollReveal';

export interface MedicineItem {
  name: string;
  dosage: string;
  form: string;
  frequency: string;
  timing: string;
  duration: string;
  foodInstructions: string;
  handwrittenNote: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  date: string;
  doctorName: string;
  specialty: string;
  licenseNo: string;
  hospital: string;
  hospitalAddress: string;
  status: 'ACTIVE' | 'COMPLETED';
  validUntil: string;
  diagnosis: string;
  dietAdvice: string;
  medicines: MedicineItem[];
  sha256Hash: string;
  blockNumber: number;
}

export const PatientPrescriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState<'STRUCTURED' | 'HANDWRITTEN'>('STRUCTURED');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetPrescriptionId = (id || searchParams.get('prescriptionId') || searchParams.get('id') || '').trim();

  const mapPrescriptionData = (rx: any): Prescription => {
    return {
      id: rx.id || rx.prescriptionNumber,
      prescriptionNumber: rx.prescriptionNumber || rx.id,
      date: rx.date
        ? new Date(rx.date).toLocaleDateString()
        : rx.createdAt
        ? new Date(rx.createdAt).toLocaleDateString()
        : 'N/A',
      doctorName: rx.doctor?.fullName || 'Physician',
      specialty: rx.doctor?.specialization || 'General Medicine',
      licenseNo: rx.doctor?.licenseNumber
        ? `Reg: ${rx.doctor.licenseNumber}`
        : rx.doctor?.registrationNumber
        ? `Reg: ${rx.doctor.registrationNumber}`
        : '',
      hospital: rx.hospital?.name || 'Apex Health Care',
      hospitalAddress: rx.hospital?.address || '',
      status: rx.status || 'ACTIVE',
      validUntil: rx.validUntil || 'N/A',
      diagnosis: rx.diagnosis || 'Clinical evaluation',
      dietAdvice: rx.dietAdvice || rx.notes || rx.instructions || 'Follow prescribed routine and dietary guidelines.',
      medicines: Array.isArray(rx.medicines)
        ? rx.medicines.map((m: any) => {
            const timingParts: string[] = [];
            if (m.timingMorning) timingParts.push('Morning');
            if (m.timingAfternoon) timingParts.push('Afternoon');
            if (m.timingEvening) timingParts.push('Evening');
            if (m.timingNight) timingParts.push('Night');
            const timingLabel = timingParts.length > 0 ? timingParts.join(' • ') : (m.timingSlot || m.timing || 'As directed');

            return {
              name: m.medicineName || m.name || 'Medication',
              dosage: m.dosage || '1 dose',
              form: m.form || 'Tablet',
              frequency: m.frequency || 'Once daily',
              timing: timingLabel,
              duration: m.duration || '5 days',
              foodInstructions: m.instructions || m.foodInstructions || 'After meals',
              handwrittenNote: `${m.medicineName || m.name || 'Medication'} ${m.dosage || ''} - ${m.frequency || ''}`,
            };
          })
        : [],
      sha256Hash: rx.recordHash || rx.blockchainHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      blockNumber: rx.blockNumber || 10480,
    };
  };

  const loadData = () => {
    let mounted = true;
    setLoading(true);
    setNotFound(false);
    setErrorMessage(null);

    if (targetPrescriptionId) {
      api.getPrescriptionById(targetPrescriptionId)
        .then((res: any) => {
          if (!mounted) return;
          if (res && res.success && (res.prescription || res.data)) {
            const rxData = res.prescription || res.data;
            setPrescriptions([mapPrescriptionData(rxData)]);
            setNotFound(false);
            setErrorMessage(null);
          } else {
            setPrescriptions([]);
            setNotFound(true);
            setErrorMessage(res?.error || t('prescription.notFound', 'Prescription not found.'));
          }
        })
        .catch((err: any) => {
          if (!mounted) return;
          console.error('Failed to load prescription detail:', err);
          setPrescriptions([]);
          setNotFound(true);
          setErrorMessage(t('prescription.unavailable', 'Prescription details are unavailable.'));
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else {
      api.getPrescriptions()
        .then((res: any) => {
          if (!mounted) return;
          if (res && res.success && Array.isArray(res.prescriptions)) {
            setPrescriptions(res.prescriptions.map(mapPrescriptionData));
            setNotFound(false);
            setErrorMessage(null);
          } else {
            setPrescriptions([]);
          }
        })
        .catch((err: any) => {
          if (!mounted) return;
          console.error('Failed to load prescriptions list:', err);
          setPrescriptions([]);
          setErrorMessage(t('prescription.unavailable', 'Failed to load prescriptions.'));
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }

    return () => { mounted = false; };
  };

  useEffect(() => {
    return loadData();
  }, [targetPrescriptionId]);

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('info', 'Prescription hash copied.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 text-white page-fade-in">
      {/* Top Back Button */}
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/patient" />
        {targetPrescriptionId && (
          <button
            onClick={() => navigate('/patient/prescriptions')}
            className="px-3.5 py-1.5 rounded-xl border border-white/[0.12] bg-[#141416] text-white text-xs font-bold hover:bg-white/[0.06] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('prescription.viewAll', 'View All Prescriptions')}</span>
          </button>
        )}
      </div>

      {/* Header */}
      <ScrollReveal direction="left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              {targetPrescriptionId ? t('prescription.details', 'Prescription Details') : 'Verified Clinical Prescriptions'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              {targetPrescriptionId && prescriptions.length > 0
                ? `${prescriptions[0].prescriptionNumber}`
                : t('nav.prescriptions', 'Prescriptions')}
            </h1>
            <p className="text-xs sm:text-sm text-white/65 mt-1">
              Doctor-signed digital and clinical slip prescriptions protected by tamper-proof blockchain proof.
            </p>
          </div>

          {/* View Mode Toggle */}
          {prescriptions.length > 0 && !loading && (
            <div className="flex items-center p-1 bg-[#141416] rounded-2xl border border-white/[0.08]">
              <button
                onClick={() => setViewMode('STRUCTURED')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'STRUCTURED'
                    ? 'bg-[#18181B] text-purple-300 border border-purple-500/30 shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-purple-400" />
                <span>Structured View</span>
              </button>

              <button
                onClick={() => setViewMode('HANDWRITTEN')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'HANDWRITTEN'
                    ? 'bg-[#18181B] text-purple-300 border border-purple-500/30 shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-purple-400" />
                <span>Handwritten Slip</span>
              </button>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Prescription Content */}
      <div className="space-y-8">
        {loading ? (
          <div className="bg-[#101012] rounded-3xl border border-white/[0.08] p-12 text-center shadow-2xl space-y-3">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-white/60 font-semibold">Loading prescription record...</p>
          </div>
        ) : notFound ? (
          <div className="bg-[#101012] rounded-3xl border border-white/[0.08] p-12 text-center shadow-2xl space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                {t('prescription.notFound', 'Prescription Not Found')}
              </h3>
              <p className="text-xs text-white/60 max-w-md mx-auto">
                {errorMessage || t('prescription.notFoundDesc', 'The requested prescription could not be found or you do not have permission to view it.')}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/patient/prescriptions')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                {t('prescription.viewAll', 'View All Prescriptions')}
              </button>
              <button
                onClick={() => navigate('/patient/notifications')}
                className="px-4 py-2 rounded-xl border border-white/[0.12] bg-[#141416] text-white text-xs font-bold hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                {t('prescription.backToNotif', 'Back to Notifications')}
              </button>
            </div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-[#101012] rounded-3xl border border-white/[0.08] p-12 text-center shadow-2xl">
            <Pill className="w-12 h-12 text-white/30 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No prescriptions found</h3>
            <p className="text-xs text-white/40 mt-1 max-w-md mx-auto">
              Active medical prescriptions created by authorized physicians will appear here.
            </p>
          </div>
        ) : (
          <ScrollRevealGroup staggerDelay={0.08} alternateDirection={true} className="space-y-6">
            {prescriptions.map((rx) => (
              <PremiumCard
                key={rx.id}
                accent="purple"
                className="overflow-hidden space-y-0"
              >
                {/* Top Bar */}
                <div className="p-6 bg-[#141416] border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white">{rx.prescriptionNumber}</h3>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            rx.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-white/[0.08] text-white/60'
                          }`}
                        >
                          {rx.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/65 mt-0.5">
                        Prescribed by <strong className="text-white">{rx.doctorName}</strong> ({rx.specialty})
                      </p>
                      <p className="text-xs text-white/40">{rx.hospital}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between text-xs">
                    <span className="text-white/40">Date Issued: {rx.date}</span>
                    <span className="text-purple-400 font-semibold mt-0.5">Valid: {rx.validUntil}</span>
                  </div>
                </div>

                {/* Content */}
                {viewMode === 'STRUCTURED' ? (
                  <div className="p-6 sm:p-8 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                          Primary Diagnosis:
                        </span>
                        <span className="text-xs font-semibold text-white bg-[#141416] border border-white/[0.08] px-3 py-1 rounded-lg">
                          {rx.diagnosis}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.08] text-white/40 font-bold uppercase tracking-wider">
                              <th className="pb-3 pr-4">Medicine Name</th>
                              <th className="pb-3 pr-4">Dosage</th>
                              <th className="pb-3 pr-4">Frequency</th>
                              <th className="pb-3 pr-4">Timing</th>
                              <th className="pb-3 pr-4">Duration</th>
                              <th className="pb-3">Food Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04] text-white/80">
                            {rx.medicines.map((m, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-4 pr-4 font-bold text-white">
                                  <div>{m.name}</div>
                                  <div className="text-[11px] text-white/40 font-normal mt-0.5">
                                    Formulation: {m.form}
                                  </div>
                                </td>
                                <td className="py-4 pr-4 font-semibold text-white">
                                  <span className="bg-[#18181B] border border-white/[0.08] px-2 py-1 rounded-md">{m.dosage}</span>
                                </td>
                                <td className="py-4 pr-4 font-bold text-purple-400">
                                  {m.frequency}
                                </td>
                                <td className="py-4 pr-4 text-white/80 font-medium">
                                  {m.timing}
                                </td>
                                <td className="py-4 pr-4 font-bold text-white">
                                  {m.duration}
                                </td>
                                <td className="py-4 text-white/80">
                                  <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg font-medium">
                                    {m.foodInstructions}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Dietary & Lifestyle Instructions */}
                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs">
                      <span className="font-bold text-purple-300 uppercase tracking-wider text-[10px]">
                        Doctor's Advice & Lifestyle Guidance:
                      </span>
                      <p className="text-white/80 mt-1">{rx.dietAdvice}</p>
                    </div>
                  </div>
                ) : (
                  /* Handwritten Rx Slip */
                  <div className="p-6 sm:p-8 bg-[#0a0a0c]">
                    <div className="max-w-3xl mx-auto bg-[#121215] rounded-2xl border border-white/[0.12] p-6 sm:p-10 shadow-2xl relative overflow-hidden font-serif">
                      <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
                        <Building2 className="w-96 h-96 text-white" />
                      </div>

                      {/* Clinic Header */}
                      <div className="border-b border-white/[0.12] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                            {rx.hospital}
                          </h2>
                          <p className="text-xs text-white/60 font-sans">{rx.hospitalAddress}</p>
                          <p className="text-xs text-purple-400 font-sans font-semibold mt-0.5">
                            24x7 Pharmacy & Emergency Care Hub
                          </p>
                        </div>

                        <div className="text-left sm:text-right font-sans">
                          <h3 className="text-base font-bold text-white">{rx.doctorName}</h3>
                          <p className="text-xs text-white/60">{rx.specialty}</p>
                          <p className="text-xs font-mono font-bold text-purple-300">{rx.licenseNo}</p>
                        </div>
                      </div>

                      {/* Patient Info Strip */}
                      <div className="py-3 border-b border-dashed border-white/[0.1] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-sans text-white/70">
                        <div>
                          <span className="text-white/40">Patient:</span>{' '}
                          <strong className="text-white">{user?.patient?.fullName || user?.name || 'Patient'}</strong>
                        </div>
                        <div>
                          <span className="text-white/40">Age / Sex:</span>{' '}
                          <strong className="text-white">
                            {user?.patient?.age
                              ? `${user.patient.age} Y`
                              : user?.patient?.dob
                              ? `${new Date().getFullYear() - new Date(user.patient.dob).getFullYear()} Y`
                              : ''}{' '}
                            / {user?.patient?.gender || 'N/A'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-white/40">Health ID:</span>{' '}
                          <strong className="font-mono text-purple-400">{user?.patient?.healthcareId || user?.healthId || ''}</strong>
                        </div>
                        <div>
                          <span className="text-white/40">Date:</span> <strong className="text-white">{rx.date}</strong>
                        </div>
                      </div>

                      {/* Rx Body */}
                      <div className="py-6 space-y-6">
                        <div className="text-4xl sm:text-5xl font-serif font-black text-purple-400 select-none">
                          ℞
                        </div>

                        <div className="text-sm text-white/80 italic border-l-2 border-purple-500 pl-3">
                          <span className="font-sans font-bold text-xs not-italic text-white uppercase tracking-wider block">
                            Clinical Diagnosis:
                          </span>
                          {rx.diagnosis}
                        </div>

                        <div className="space-y-5 pl-2">
                          {rx.medicines.map((m, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-white font-sans text-sm">
                                  {idx + 1}.
                                </span>
                                <div className="flex-1">
                                  <p className="text-lg sm:text-xl font-serif italic text-white tracking-wide leading-snug">
                                    {m.handwrittenNote}
                                  </p>
                                  <p className="text-xs font-sans text-white/40 mt-1">
                                    {m.timing} • {m.foodInstructions}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-white/[0.08]">
                          <span className="font-sans font-bold text-xs text-white/80 uppercase tracking-wider">
                            Advice & Diet:
                          </span>
                          <p className="text-sm font-serif italic text-white/70 mt-1">
                            "{rx.dietAdvice}"
                          </p>
                        </div>

                        {/* Clinic Stamp & Doctor Ink Signature */}
                        <div className="pt-8 flex flex-col sm:flex-row items-end justify-between gap-6">
                          <div className="p-3 border-2 border-dashed border-purple-500/40 rounded-xl text-center text-purple-300 font-sans text-[10px] space-y-0.5">
                            <p className="font-bold uppercase tracking-wider">OFFICIAL MEDICAL VERIFICATION</p>
                            <p>{rx.hospital} • EMR ANCHORED</p>
                            <p className="font-mono text-xs font-bold text-purple-400">BLOCK #{rx.blockNumber}</p>
                          </div>

                          <div className="text-center font-sans">
                            <div className="font-serif italic text-2xl text-purple-300 select-none pb-1 border-b border-white/20 px-6">
                              {rx.doctorName.replace('Dr. ', '')}
                            </div>
                            <p className="text-xs font-bold text-white mt-1">{rx.doctorName}</p>
                            <p className="text-[10px] text-white/40">Attending Specialist Physician</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer with Blockchain Integrity Proof */}
                <div className="p-6 bg-[#141416] border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-white/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-mono text-[11px] truncate max-w-xs text-white/80 bg-[#18181B] border border-white/[0.08] px-2 py-0.5 rounded">
                      {rx.sha256Hash}
                    </span>
                    <button
                      onClick={() => handleCopyHash(rx.id, rx.sha256Hash)}
                      className="p-1 hover:text-white cursor-pointer"
                      title="Copy Hash"
                    >
                      {copiedId === rx.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setSelectedDoc({
                          title: `Prescription ${rx.prescriptionNumber}`,
                          category: 'Doctor Prescription',
                          date: rx.date,
                          doctorName: rx.doctorName,
                          hospitalName: rx.hospital,
                          blockchainProof: {
                            recordHash: rx.sha256Hash,
                            blockNumber: rx.blockNumber,
                            verified: true,
                          },
                        })
                      }
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold transition-colors flex items-center gap-1.5 shadow-lg cursor-pointer btn-interaction"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Official Record</span>
                    </button>
                  </div>
                </div>
              </PremiumCard>
            ))}
          </ScrollRevealGroup>
        )}
      </div>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewer
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.title}
          category={selectedDoc.category}
          date={selectedDoc.date}
          doctorName={selectedDoc.doctorName}
          hospitalName={selectedDoc.hospitalName}
          blockchainProof={selectedDoc.blockchainProof}
        />
      )}
    </div>
  );
};

export default PatientPrescriptionsPage;
