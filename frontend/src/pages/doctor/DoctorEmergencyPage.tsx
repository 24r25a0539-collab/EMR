import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  CheckCircle2,
  Heart,
  Phone,
  Clock,
  Lock,
  FileText,
  User,
  Building2,
  Stethoscope,
  Send,
  XCircle,
  Eye,
  AlertOctagon,
  Pill,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

export const DoctorEmergencyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [healthId, setHealthId] = useState(searchParams.get('healthId') || '');
  const [emergencyReason, setEmergencyReason] = useState(
    'Acute trauma / syncope with loss of consciousness. Triage hemodynamics unstable.'
  );
  const [condition, setCondition] = useState('Unresponsive / Acute Trauma');
  const [confirmedDeclaration, setConfirmedDeclaration] = useState(false);
  const [isEngaging, setIsEngaging] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    sessionNumber?: string;
    startTime: string;
    expiresAt?: string;
    patient: {
      id?: string;
      photoUrl?: string | null;
      fullName: string;
      dob?: string;
      gender: string;
      healthId: string;
      bloodGroup?: string;
      allergies?: any[];
      conditions?: any[];
      medications?: any[];
      emergencyContacts?: any[];
    };
  } | null>(null);

  // Emergency Treatment Note state
  const [treatmentNote, setTreatmentNote] = useState('');
  const [treatmentNotesList, setTreatmentNotesList] = useState<string[]>([]);

  const handleEngageEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthId.trim()) {
      addToast('error', 'Please enter the patient Health ID.');
      return;
    }

    if (!emergencyReason.trim()) {
      addToast('error', 'Emergency reason is required.');
      return;
    }

    if (!condition.trim()) {
      addToast('error', 'Clinical condition is required.');
      return;
    }

    if (!confirmedDeclaration) {
      addToast('error', 'You must verify the legal emergency clinical declaration.');
      return;
    }

    setIsEngaging(true);

    try {
      const res = await api.initiateEmergencyAccess({
        healthId: healthId.trim(),
        reason: emergencyReason.trim(),
        condition: condition.trim(),
        confirmation: true,
      });

      if (res.success) {
        setActiveSession({
          sessionId: res.session?.id || 'EMS-SESSION',
          sessionNumber: res.session?.sessionNumber || 'EMS-2026',
          startTime: new Date().toLocaleTimeString(),
          expiresAt: res.session?.autoExpiryTime,
          patient: res.patient || {
            fullName: 'Patient',
            healthId: healthId.trim(),
            gender: 'Not specified',
          },
        });
        addToast('success', '🚨 Emergency Level-1 session initiated with 2-hour strict audit window.');
      } else {
        addToast('error', res.error || 'Failed to initiate emergency access.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Emergency access denied. Ensure doctor credentials are active and approved.');
    } finally {
      setIsEngaging(false);
    }
  };

  const handleAddTreatmentNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentNote.trim() || !activeSession) return;

    try {
      await api.addEmergencyTreatmentNote(activeSession.sessionId, treatmentNote.trim());
      setTreatmentNotesList((prev) => [treatmentNote.trim(), ...prev]);
      setTreatmentNote('');
      addToast('success', 'Emergency treatment note appended to immutable audit trail.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save treatment note.');
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await api.endEmergencySession(activeSession.sessionId);
      setActiveSession(null);
      addToast('info', 'Emergency clinical session ended and sealed.');
      navigate('/doctor/dashboard');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to end emergency session.');
    }
  };

  return (
    <div className="space-y-8 pb-24 text-white antialiased">
      {/* Header Banner */}
      <ScrollReveal direction="left">
        <div className="p-8 sm:p-10 rounded-[32px] bg-gradient-to-r from-[#1A0A0E] via-[#0E0608] to-[#050506] border border-rose-500/30 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-600/30">
                <ShieldAlert className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold tracking-wider uppercase">
                    EMS Protocol Level-1
                  </span>
                  <span className="text-xs text-rose-400 font-mono font-bold">
                    Immutable 2-Hour Window
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  Emergency Life-Support Clinical Bypass
                </h1>
                <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl leading-relaxed">
                  Emergency override protocol for acute trauma and unresponsive patients.
                  Requires verified practitioner credentials, clinical justification, and mandatory confirmation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/doctor/dashboard"
                className="px-5 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* If No Active Session: Show Emergency Initiation Form */}
      {!activeSession ? (
        <ScrollReveal direction="bottom" delay={0.08}>
          <div className="max-w-2xl mx-auto bg-[#0B0B0D] p-6 sm:p-8 rounded-[32px] border border-rose-500/30 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Initiate Emergency Session
                </h2>
                <p className="text-xs text-white/50">
                  Practitioner: <strong className="text-white">{user?.doctor?.fullName || user?.name} ({user?.doctor?.registrationNumber || 'Doctor'})</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleEngageEmergency} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold uppercase tracking-wider text-white/60">
                  Patient Health ID *
                </label>
                <input
                  type="text"
                  value={healthId}
                  onChange={(e) => setHealthId(e.target.value)}
                  placeholder="e.g. HP-100246"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white font-mono text-sm uppercase focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold uppercase tracking-wider text-white/60">
                  Clinical Condition / Incident *
                </label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="e.g. Unresponsive, acute road accident trauma"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold uppercase tracking-wider text-white/60">
                  Emergency Medical Reason *
                </label>
                <textarea
                  rows={3}
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  placeholder="Detail clinical necessity for emergency consent bypass..."
                  required
                  className="w-full p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs placeholder-white/40 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedDeclaration}
                    onChange={(e) => setConfirmedDeclaration(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 bg-transparent border-rose-500/30"
                  />
                  <span className="text-[11px] text-rose-200 font-medium leading-relaxed">
                    I solemnly declare and confirm under statutory medical regulations that this is a genuine medical emergency requiring immediate consent bypass for patient preservation.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isEngaging || !confirmedDeclaration || !healthId.trim()}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isEngaging ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Initiate Emergency Access (2 Hours)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </ScrollReveal>
      ) : (
        /* Active Emergency Session View */
        <div className="space-y-6">
          {/* Active Session Top Bar */}
          <ScrollReveal direction="left">
            <div className="p-5 rounded-[28px] bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-rose-300 bg-rose-500/20 px-3 py-1 rounded-xl border border-rose-500/30">
                  Session: {activeSession.sessionNumber || activeSession.sessionId}
                </span>
                <span className="text-white/70">
                  Started: <strong className="text-white">{activeSession.startTime}</strong> • Strict Expiry: <strong className="text-rose-400">2 Hours</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleEndSession}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Conclude & Seal Session</span>
              </button>
            </div>
          </ScrollReveal>

          {/* Patient Emergency Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Patient Identity & Blood Group */}
            <ScrollReveal direction="bottom" delay={0.05}>
              <div className="p-6 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    photoUrl={activeSession.patient.photoUrl}
                    name={activeSession.patient.fullName}
                    role="PATIENT"
                    size="lg"
                    shape="rounded"
                    className="border-2 border-white/10"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white">{activeSession.patient.fullName}</h3>
                    <p className="text-xs font-mono text-teal-400 font-bold">{activeSession.patient.healthId}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-rose-400 tracking-wider">Blood Group</span>
                  <p className="text-2xl font-black text-rose-300 font-mono">
                    {activeSession.patient.bloodGroup || 'Not specified'}
                  </p>
                </div>

                {activeSession.patient.emergencyContacts && activeSession.patient.emergencyContacts.length > 0 && (
                  <div className="space-y-2 text-xs text-white/70">
                    <span className="text-[10px] font-bold uppercase text-white/40">Emergency Contacts</span>
                    {activeSession.patient.emergencyContacts.map((c: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <p className="font-bold text-white">{c.name} ({c.relation})</p>
                        <p className="font-mono text-white/50">{c.mobile}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Column 2: Critical Allergies & Conditions */}
            <ScrollReveal direction="bottom" delay={0.1}>
              <div className="p-6 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Allergies & Critical Warnings</span>
                </h3>

                {activeSession.patient.allergies && activeSession.patient.allergies.length > 0 ? (
                  <div className="space-y-2">
                    {activeSession.patient.allergies.map((a: any, i: number) => (
                      <div key={i} className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs">
                        <p className="font-bold text-rose-200">{a.allergen}</p>
                        <p className="text-[11px] text-rose-300/80">{a.severity} • {a.reaction || 'Strict Avoidance'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/40">No recorded drug allergies.</p>
                )}

                <h3 className="text-xs font-bold uppercase text-teal-400 tracking-wider flex items-center gap-1.5 pt-3 border-t border-white/[0.08]">
                  <Activity className="w-4 h-4" />
                  <span>Critical Conditions</span>
                </h3>

                {activeSession.patient.conditions && activeSession.patient.conditions.length > 0 ? (
                  <div className="space-y-2">
                    {activeSession.patient.conditions.map((c: any, i: number) => (
                      <div key={i} className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs">
                        <p className="font-bold text-teal-200">{c.conditionName || c.name}</p>
                        <p className="text-[11px] text-teal-300/80">Status: {c.status || 'Active'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/40">No critical chronic conditions recorded.</p>
                )}
              </div>
            </ScrollReveal>

            {/* Column 3: Emergency Treatment Notes */}
            <ScrollReveal direction="bottom" delay={0.15}>
              <div className="p-6 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-white/80 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span>Emergency Treatment Notes</span>
                  </h3>

                  <form onSubmit={handleAddTreatmentNote} className="space-y-2">
                    <textarea
                      rows={2}
                      value={treatmentNote}
                      onChange={(e) => setTreatmentNote(e.target.value)}
                      placeholder="Append treatment action, resuscitation vitals..."
                      className="w-full p-3 rounded-2xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder-white/40 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={!treatmentNote.trim()}
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Append Note to Ledger</span>
                    </button>
                  </form>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {treatmentNotesList.map((note, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-white/80">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.08] text-[10px] text-white/40 font-mono">
                  Audit Status: Real-time PostgreSQL Logged
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorEmergencyPage;
