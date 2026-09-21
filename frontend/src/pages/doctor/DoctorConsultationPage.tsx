import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  User,
  Heart,
  Activity,
  FileText,
  Pill,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export const DoctorConsultationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [patientName, setPatientName] = useState(searchParams.get('name') || '');
  const [patientHealthId, setPatientHealthId] = useState(searchParams.get('healthId') || '');

  // Vitals
  const [bloodPressure, setBloodPressure] = useState('128/82');
  const [heartRate, setHeartRate] = useState('74');
  const [temperature, setTemperature] = useState('98.4');
  const [spO2, setSpO2] = useState('99');
  const [weight, setWeight] = useState('72');

  // Clinical findings
  const [chiefComplaints, setChiefComplaints] = useState('Routine clinical consultation. Follow-up assessment.');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('Essential Hypertension - Moderate Control');
  const [clinicalNotes, setClinicalNotes] = useState('Patient adhering to clinical regimen. Advised lifestyle modifications and periodic monitoring.');
  const [recommendedLabTests, setRecommendedLabTests] = useState('Lipid Profile, Serum Creatinine, Fasting Blood Sugar');
  const [followUpDate, setFollowUpDate] = useState('3 months');

  // Medications
  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      name: 'Telmisartan (Telma)',
      dosage: '40 mg',
      frequency: 'Once daily (1-0-0)',
      duration: '30 days',
      instructions: 'Take in the morning with water',
    },
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPatientInfo = async () => {
      const target = patientId || patientHealthId;
      if (!target) return;
      try {
        const res = await api.getAuthorizedEMR(target);
        if (res && res.patient) {
          setPatientId(res.patient.id);
          setPatientName(res.patient.fullName);
          setPatientHealthId(res.patient.healthId);
        }
      } catch (err) {
        console.error('Failed to load patient profile for consultation:', err);
      }
    };
    fetchPatientInfo();
  }, [patientId, patientHealthId]);

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        name: '',
        dosage: '',
        frequency: 'Once daily (1-0-0)',
        duration: '30 days',
        instructions: 'Take after meals',
      },
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, idx) => idx !== index));
  };

  const updateMedication = (index: number, field: keyof MedicationItem, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalDiagnosis.trim()) {
      addToast('error', 'Please enter a clinical diagnosis');
      return;
    }
    if (!patientId) {
      addToast('error', 'No patient specified for this consultation.');
      return;
    }

    setSaving(true);
    try {
      const filteredMeds = medications.filter((m) => m.name.trim());
      const res = await api.createConsultation({
        patientId,
        symptoms: chiefComplaints.trim(),
        diagnosis: clinicalDiagnosis.trim(),
        treatmentPlan: clinicalNotes.trim(),
        clinicalNotes: clinicalNotes.trim(),
        vitals: { bloodPressure, heartRate, temperature, spO2, weight },
        recommendedLabTests: recommendedLabTests.trim(),
        followUpDate,
        medicines: filteredMeds,
      });

      if (res && res.success) {
        addToast('success', 'Consultation saved, e-prescription generated, and notarized on blockchain ledger with SHA-256 seal!');
        setTimeout(() => {
          navigate(`/doctor/patients/${patientId}/emr`);
        }, 600);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24 text-white antialiased">
      {/* Banner */}
      <ScrollReveal direction="left">
        <div className="bg-gradient-to-r from-[#0B0B0D] via-[#0D1520] to-[#0B0B0D] text-white p-5 sm:p-8 lg:p-10 rounded-[32px] shadow-2xl border border-teal-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-400 text-xs font-mono font-semibold">
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
              <span>Clinical Documentation Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              New Patient Consultation
            </h1>
            <p className="text-xs sm:text-sm text-white/50 max-w-xl leading-relaxed">
              Record comprehensive examination findings, diagnosis, vitals, and electronic prescriptions. Once notarized, a canonical SHA-256 hash is permanently registered on the blockchain.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-right">
              <span className="text-[10px] text-teal-400 uppercase font-bold block">Active Patient</span>
              <span className="text-base font-bold text-white block">{patientName || 'Patient'}</span>
              <span className="text-xs font-mono text-teal-300">{patientHealthId || 'ID'}</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <form onSubmit={handleSaveConsultation} className="space-y-8">
        {/* Vitals Recording Bar */}
        <ScrollReveal direction="bottom" delay={0.05}>
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
              <Activity className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Clinical Vitals Telemetry</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-white/50 font-bold block">BP (mmHg)</label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="120/80"
                  className="w-full px-3 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] font-mono text-center font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50 font-bold block">Heart Rate (bpm)</label>
                <input
                  type="text"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="72"
                  className="w-full px-3 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] font-mono text-center font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50 font-bold block">Temperature (°F)</label>
                <input
                  type="text"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="98.6"
                  className="w-full px-3 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] font-mono text-center font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50 font-bold block">SpO2 (%)</label>
                <input
                  type="text"
                  value={spO2}
                  onChange={(e) => setSpO2(e.target.value)}
                  placeholder="98"
                  className="w-full px-3 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] font-mono text-center font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50 font-bold block">Weight (kg)</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  className="w-full px-3 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] font-mono text-center font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Clinical Notes & Diagnosis */}
        <ScrollReveal direction="bottom" delay={0.1}>
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
              <FileText className="w-4 h-4 text-teal-400" />
              <h2 className="text-base font-bold text-white">Chief Complaints & Clinical Assessment</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-white/60 font-bold block">Chief Complaints & Present Illness</label>
                <textarea
                  rows={2}
                  value={chiefComplaints}
                  onChange={(e) => setChiefComplaints(e.target.value)}
                  placeholder="Describe patient symptoms, duration, intensity..."
                  className="w-full p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder-white/40 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white/60 font-bold block">Clinical Diagnosis (ICD-10 or Clinical Summary) *</label>
                <input
                  type="text"
                  required
                  value={clinicalDiagnosis}
                  onChange={(e) => setClinicalDiagnosis(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes Mellitus with Essential Hypertension"
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-bold text-white placeholder-white/40 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white/60 font-bold block">Examination Findings & Clinical Notes</label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Physical examination observations, organ systems checked, lifestyle recommendations..."
                  className="w-full p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder-white/40 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Electronic Prescription Rx Builder */}
        <ScrollReveal direction="bottom" delay={0.15}>
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-400" />
                <h2 className="text-base font-bold text-white">Rx Medication Orders</h2>
              </div>

              <button
                type="button"
                onClick={addMedication}
                className="px-4 py-2 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-all border border-purple-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medication</span>
              </button>
            </div>

            <div className="space-y-4">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-[24px] bg-white/[0.02] border border-white/[0.06] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 font-mono">
                      Item #{idx + 1}
                    </span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        title="Remove Medication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-white/50 font-bold block mb-1">Medication Name</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                        placeholder="e.g. Metformin 500mg"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white font-medium text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-white/50 font-bold block mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                        placeholder="e.g. 1 Tablet"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white font-medium text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-white/50 font-bold block mb-1">Frequency</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                        placeholder="e.g. Twice daily (1-0-1)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white font-medium text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-white/50 font-bold block mb-1">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedication(idx, 'duration', e.target.value)}
                        placeholder="e.g. 30 days"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white font-medium text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/50 font-bold block mb-1 text-xs">Instructions & Diet Cautions</label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) => updateMedication(idx, 'instructions', e.target.value)}
                      placeholder="e.g. Take immediately after meals with warm water"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white font-medium text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Lab Tests & Follow-Up */}
        <ScrollReveal direction="bottom" delay={0.2}>
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
              <Calendar className="w-4 h-4 text-teal-400" />
              <h2 className="text-base font-bold text-white">Investigations & Follow-Up Plan</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="text-white/60 font-bold block">Recommended Diagnostic Tests</label>
                <input
                  type="text"
                  value={recommendedLabTests}
                  onChange={(e) => setRecommendedLabTests(e.target.value)}
                  placeholder="e.g. Fasting Lipid Profile, HbA1c, ECG"
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white/60 font-bold block">Follow-Up Schedule</label>
                <input
                  type="text"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  placeholder="e.g. 3 months / Return sooner if blood pressure rises"
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Submit & Notarize CTA */}
        <ScrollReveal direction="bottom" delay={0.25}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-[32px] bg-gradient-to-r from-[#0B0B0D] via-[#0E1520] to-[#0B0B0D] border border-teal-500/30 text-white shadow-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Cryptographic Proof Guarantee</span>
              </div>
              <p className="text-xs text-white/50 max-w-lg leading-relaxed">
                Upon submission, a canonical SHA-256 digest is generated and permanently sealed onto the blockchain ledger.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sealing On-Chain...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Consultation & Notarize</span>
                </>
              )}
            </button>
          </div>
        </ScrollReveal>
      </form>
    </div>
  );
};

export default DoctorConsultationPage;
