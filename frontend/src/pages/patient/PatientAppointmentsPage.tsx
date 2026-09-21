import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  Plus,
  AlertCircle,
  X,
  MapPin,
  QrCode,
  Printer,
  Download,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../contexts/ToastContext';
import { BackButton } from '../../components/common/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';

import { ScrollReveal, ScrollRevealGroup, PremiumCard } from '../../components/common/ScrollReveal';

export interface AppointmentItem {
  id: string;
  doctorName: string;
  specialty: string;
  department: string;
  hospital: string;
  date: string;
  time: string;
  tokenNumber: string;
  type: 'IN_PERSON' | 'TELEMEDICINE';
  status: string;
  room?: string;
  reason: string;
  instructions: string;
  hasOpdPass: boolean;
  createdAt?: string;
}

export const PatientAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const healthId = user?.patient?.healthcareId || user?.healthId || '';

  const navigate = useNavigate();

  const [tab, setTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');
  const [viewingAppointment, setViewingAppointment] = useState<AppointmentItem | null>(null);
  const [viewingOpdPass, setViewingOpdPass] = useState<AppointmentItem | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { addToast } = useToast();

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.getAppointments();
      if (res.success && Array.isArray(res.appointments)) {
        const mapped: AppointmentItem[] = res.appointments.map((a: any) => {
          const docName = a.doctor?.fullName
            ? (a.doctor.fullName.startsWith('Dr.') ? a.doctor.fullName : `Dr. ${a.doctor.fullName}`)
            : 'Dr. Specialist';
          const spec = a.doctor?.specialization || a.department || 'General Medicine';
          const hosp = a.hospital?.name || a.doctor?.hospitalAffiliation || 'Apex Health City';
          const dep = a.department || (a.doctor?.department ? a.doctor.department : `Department of ${spec}`);
          const isTele = a.appointmentType === 'ONLINE' || a.appointmentType === 'TELEMEDICINE';

          return {
            id: a.id,
            doctorName: docName,
            specialty: spec,
            department: dep,
            hospital: hosp,
            date: a.date,
            time: a.timeSlot,
            tokenNumber: a.appointmentNumber || a.id,
            type: isTele ? 'TELEMEDICINE' : 'IN_PERSON',
            status: a.status || 'CONFIRMED',
            room: 'OPD Suite 12',
            reason: a.reason || `Clinical consultation with ${spec} specialist.`,
            instructions: isTele
              ? 'A secure video link will be activated in your appointments portal 10 minutes prior.'
              : 'Please report to OPD triage desk 15 minutes before your time slot.',
            hasOpdPass: !isTele,
            createdAt: a.createdAt,
          };
        });
        setAppointments(mapped);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async () => {
    if (!cancelId) return;
    try {
      const res = await api.cancelAppointment(cancelId);
      if (res.success) {
        addToast('info', 'Appointment cancelled successfully.');
        setAppointments((prev) =>
          prev.map((a) => (a.id === cancelId ? { ...a, status: 'CANCELLED' } : a))
        );
      } else {
        addToast('error', res.error || 'Failed to cancel appointment');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Error cancelling appointment');
    } finally {
      setCancelId(null);
    }
  };

  const filtered = appointments.filter((apt) => {
    if (tab === 'UPCOMING') {
      return (
        apt.status === 'CONFIRMED' ||
        apt.status === 'SCHEDULED' ||
        apt.status === 'PENDING'
      );
    }
    return (
      apt.status === 'COMPLETED' ||
      apt.status === 'CANCELLED' ||
      apt.status === 'REJECTED'
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/patient" />
      </div>

      {/* Header */}
      <ScrollReveal direction="left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              Clinical Visits & Consultations
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Appointments
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your hospital OPD visits, consultations, and digital entry passes.
            </p>
          </div>

          <button
            onClick={() => navigate('/patient/doctors')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Tabs */}
      <ScrollReveal direction="center" delay={0.05}>
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 text-xs font-bold">
          <button
            onClick={() => setTab('UPCOMING')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              tab === 'UPCOMING'
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            Upcoming ({appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'SCHEDULED' || a.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setTab('PAST')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              tab === 'PAST'
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            Past Visits ({appointments.filter((a) => a.status !== 'CONFIRMED' && a.status !== 'SCHEDULED' && a.status !== 'PENDING').length})
          </button>
        </div>
      </ScrollReveal>

      {/* Appointment Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-[#101012] p-12 text-center rounded-[28px] border border-white/[0.08] space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-400">Loading appointments from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <ScrollReveal direction="center">
            <div className="bg-[#101012] p-12 text-center rounded-[28px] border border-white/[0.08] space-y-3">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-300">No appointments found</h4>
              <p className="text-xs text-slate-500">
                {tab === 'UPCOMING'
                  ? 'You have no scheduled upcoming visits.'
                  : 'No past appointment history.'}
              </p>
              {tab === 'UPCOMING' && (
                <button
                  onClick={() => navigate('/patient/doctors')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 cursor-pointer mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book an Appointment</span>
                </button>
              )}
            </div>
          </ScrollReveal>
        ) : (
          <ScrollRevealGroup stagger={0.08} alternateDirection={true} className="space-y-4">
            {filtered.map((apt) => (
              <PremiumCard
                key={apt.id}
                accent="blue"
                className="bg-[#101012] rounded-[28px] border border-white/[0.08] shadow-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl flex-shrink-0 border border-blue-500/20 shadow-md">
                    <Stethoscope className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : apt.status === 'COMPLETED'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {apt.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">• {apt.tokenNumber}</span>
                      <span className="text-xs font-semibold text-cyan-400">• {apt.type === 'TELEMEDICINE' ? 'Telemedicine' : 'In-Person'}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {apt.doctorName}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      {apt.department} ({apt.specialty}) • <strong className="text-white">{apt.hospital}</strong>
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {apt.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {apt.time}
                      </span>
                      {apt.room && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {apt.room}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap sm:flex-col md:flex-row items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setViewingAppointment(apt)}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Details</span>
                  </button>

                  {apt.hasOpdPass && (
                    <button
                      onClick={() => setViewingOpdPass(apt)}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>OPD Pass</span>
                    </button>
                  )}

                  {tab === 'UPCOMING' && apt.status !== 'CANCELLED' && (
                    <button
                      onClick={() => setCancelId(apt.id)}
                      className="px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </PremiumCard>
            ))}
          </ScrollRevealGroup>
        )}
      </div>

      {/* View Appointment Details Modal */}
      {viewingAppointment && (
        <Modal
          isOpen={true}
          onClose={() => setViewingAppointment(null)}
          title="Appointment Details"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#141416] border border-white/[0.08] flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Token Number</p>
                <p className="text-base font-mono font-bold text-blue-400">{viewingAppointment.tokenNumber}</p>
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {viewingAppointment.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#141416] border border-white/[0.08]">
                <p className="text-slate-400">Doctor</p>
                <p className="font-bold text-white mt-0.5">{viewingAppointment.doctorName}</p>
                <p className="text-slate-400 text-[11px]">{viewingAppointment.specialty}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#141416] border border-white/[0.08]">
                <p className="text-slate-400">Hospital</p>
                <p className="font-bold text-white mt-0.5">{viewingAppointment.hospital}</p>
                <p className="text-slate-400 text-[11px]">{viewingAppointment.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#141416] border border-white/[0.08]">
                <p className="text-slate-400">Date & Slot</p>
                <p className="font-bold text-white mt-0.5">{viewingAppointment.date}</p>
                <p className="text-cyan-400 text-[11px]">{viewingAppointment.time}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#141416] border border-white/[0.08]">
                <p className="text-slate-400">Consultation Type</p>
                <p className="font-bold text-white mt-0.5">
                  {viewingAppointment.type === 'TELEMEDICINE' ? 'Video Telemedicine' : 'In-Person OPD Visit'}
                </p>
                <p className="text-slate-400 text-[11px]">{viewingAppointment.room || 'OPD Desk'}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141416] border border-white/[0.08]">
              <p className="text-slate-400 font-semibold mb-1">Reason for Consultation</p>
              <p className="text-slate-300 leading-relaxed">{viewingAppointment.reason}</p>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-slate-300 leading-relaxed">
              <strong className="text-blue-400">Instructions:</strong> {viewingAppointment.instructions}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingAppointment(null)}
                className="px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* OPD Pass Modal */}
      {viewingOpdPass && (
        <Modal
          isOpen={true}
          onClose={() => setViewingOpdPass(null)}
          title="Hospital OPD Digital Entry Pass"
        >
          <div className="space-y-4 text-xs">
            <div className="p-6 rounded-[24px] bg-[#141416] border border-white/[0.08] text-center space-y-3">
              <div className="w-20 h-20 bg-white p-2 rounded-2xl mx-auto shadow-md flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-900" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Pass Code</span>
                <p className="text-lg font-mono font-black text-cyan-400">OPD-{viewingOpdPass.tokenNumber}</p>
              </div>
              <div className="border-t border-white/[0.08] pt-3 text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient Sovereign ID:</span>
                  <span className="font-mono font-bold text-white">{healthId || 'HP-100245'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attending Physician:</span>
                  <span className="font-bold text-white">{viewingOpdPass.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reporting Slot:</span>
                  <span className="font-bold text-white">{viewingOpdPass.date} ({viewingOpdPass.time})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hospital Facility:</span>
                  <span className="font-bold text-white">{viewingOpdPass.hospital}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Pass
              </button>
              <button
                onClick={() => setViewingOpdPass(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation confirmation */}
      {cancelId && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setCancelId(null)}
          onConfirm={handleCancelAppointment}
          title="Cancel Clinical Appointment"
          message="Are you sure you want to cancel this scheduled consultation? This slot will be released back to the clinical directory."
          confirmText="Yes, Cancel Appointment"
          isDestructive={true}
        />
      )}
    </div>
  );
};
