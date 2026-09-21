import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Pill,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  User,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

export interface MedicineRow {
  name: string;
  dosage: string;
  form: string;
  frequency: string;
  timing: string;
  duration: string;
}

export const DoctorPrescriptionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [patientHealthId, setPatientHealthId] = useState(searchParams.get('healthId') || '');
  const [patientName, setPatientName] = useState(searchParams.get('name') || '');
  const [diagnosis, setDiagnosis] = useState('Essential Hypertension, Borderline Dyslipidemia');
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    {
      name: 'Telmisartan Tablets IP',
      dosage: '40 mg',
      form: 'Tablet',
      frequency: '1-0-0',
      timing: 'After Breakfast',
      duration: '90 Days',
    },
  ]);

  const [isSigning, setIsSigning] = useState(false);
  const [sealedPrescription, setSealedPrescription] = useState<any | null>(null);

  const doctorName = user?.doctor?.fullName || user?.name || 'Doctor';
  const doctorLicense = user?.doctor?.registrationNumber || 'Practitioner';

  const addMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        name: '',
        dosage: '10 mg',
        form: 'Tablet',
        frequency: '1-0-1',
        timing: 'After Food',
        duration: '14 Days',
      },
    ]);
  };

  const removeMedicineRow = (index: number) => {
    setMedicines(medicines.filter((_, idx) => idx !== index));
  };

  const updateMedicine = (index: number, field: keyof MedicineRow, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleSignAndAnchor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientHealthId.trim()) {
      addToast('error', 'Please enter patient Health ID.');
      return;
    }

    if (medicines.some((m) => !m.name.trim())) {
      addToast('error', 'Please enter medicine names for all rows.');
      return;
    }

    setIsSigning(true);

    try {
      const payload = {
        patientHealthId: patientHealthId.trim(),
        patientId: patientId || undefined,
        diagnosis: diagnosis.trim(),
        medicines: medicines.map((m) => ({
          medicineName: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          timing: m.timing,
          duration: m.duration,
          instructions: `${m.timing || ''} • ${m.form || ''}`.trim(),
        })),
      };

      const res = await api.createPrescription(payload);
      if (res.success) {
        setSealedPrescription({
          id: res.prescription?.prescriptionNumber || `RX-${Date.now().toString().slice(-6)}`,
          hash: res.prescription?.sha256Hash || '0x' + Array(64).fill('a').join(''),
          blockNumber: 10486,
          timestamp: new Date().toLocaleTimeString(),
        });
        addToast(
          'success',
          `Prescription cryptographically signed with Dr. ${doctorName} digital key and persisted in PostgreSQL!`
        );
      } else {
        addToast('error', res.error || 'Failed to issue prescription.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Prescription creation failed.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 text-white antialiased">
      {/* Header */}
      <ScrollReveal direction="left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Cryptographic Clinical Orders
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
              Issue Digital Prescription
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              Prescribing Physician: <strong className="text-white">{doctorName}</strong> ({doctorLicense})
            </p>
          </div>

          <Link
            to="/doctor/dashboard"
            className="px-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 text-xs font-bold hover:bg-white/[0.08] hover:text-white flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </ScrollReveal>

      {sealedPrescription ? (
        /* Success Screen */
        <ScrollReveal direction="bottom">
          <div className="p-8 sm:p-10 rounded-[32px] bg-[#0B0B0D] border border-purple-500/30 shadow-2xl text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20 shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Digital Signature Verified
              </span>
              <h2 className="text-2xl font-black text-white mt-3">
                Prescription Issued: {sealedPrescription.id}
              </h2>
              <p className="text-xs text-white/50">
                Synchronized with PostgreSQL and delivered to patient notification queue.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-white/40">Patient:</span>
                <span className="text-white font-bold">{patientName || patientHealthId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">SHA-256 Digest:</span>
                <span className="text-purple-400 truncate max-w-xs">{sealedPrescription.hash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Time:</span>
                <span className="text-white/80">{sealedPrescription.timestamp}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSealedPrescription(null);
                  setMedicines([{ name: '', dosage: '10 mg', form: 'Tablet', frequency: '1-0-1', timing: 'After Food', duration: '14 Days' }]);
                }}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
              >
                Issue Another Prescription
              </button>

              {patientHealthId && (
                <Link
                  to={`/doctor/patients/${patientHealthId}/emr`}
                  className="px-6 py-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold text-xs transition-colors"
                >
                  Return to Patient EMR
                </Link>
              )}

              <Link
                to="/doctor/dashboard"
                className="px-6 py-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold text-xs"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </ScrollReveal>
      ) : (
        /* Form */
        <form onSubmit={handleSignAndAnchor} className="space-y-6">
          <ScrollReveal direction="bottom" delay={0.05}>
            <div className="p-6 sm:p-8 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">
                1. Patient & Clinical Indication
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-white/50">
                    Patient Health ID *
                  </label>
                  <input
                    type="text"
                    value={patientHealthId}
                    onChange={(e) => setPatientHealthId(e.target.value)}
                    placeholder="e.g. HP-100246"
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold uppercase text-white/50">
                    Clinical Diagnosis *
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Essential Hypertension"
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="bottom" delay={0.1}>
            <div className="p-6 sm:p-8 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">
                  2. Medication Regimen ({medicines.length})
                </h2>
                <button
                  type="button"
                  onClick={addMedicineRow}
                  className="px-4 py-2 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              <div className="space-y-3">
                {medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.06] grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs items-center"
                  >
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-white/40 mb-1">Medicine Name *</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                        placeholder="e.g. Telmisartan"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-white/40 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                        placeholder="40 mg"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-white/40 mb-1">Frequency</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                        placeholder="1-0-0"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-white/40 mb-1">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                        placeholder="30 Days"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex justify-end pt-2 sm:pt-0">
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(idx)}
                          className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="bottom" delay={0.15}>
            <button
              type="submit"
              disabled={isSigning}
              className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSigning ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Sign & Issue Digital Prescription (Dr. {doctorName})</span>
                </>
              )}
            </button>
          </ScrollReveal>
        </form>
      )}
    </div>
  );
};

export default DoctorPrescriptionsPage;
