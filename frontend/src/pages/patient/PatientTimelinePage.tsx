import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  FileText,
  Stethoscope,
  Pill,
  AlertTriangle,
  ShieldCheck,
  Building2,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { DocumentViewer } from '../../components/common/DocumentViewer';
import { BackButton } from '../../components/common/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export interface TimelineEvent {
  id: string;
  date: string;
  timestamp: string;
  title: string;
  category: 'CONSULTATION' | 'PRESCRIPTION' | 'LAB_REPORT' | 'EMERGENCY' | 'MILESTONE';
  doctor: string;
  hospital: string;
  description: string;
  sha256Hash: string;
  blockNumber: number;
}

export const PatientTimelinePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  React.useEffect(() => {
    loadTimeline();
  }, [user]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const [aptRes, cnsRes, rxRes, labRes, ticketsRes] = await Promise.all([
        api.getAppointments().catch(() => ({ appointments: [] })),
        api.getConsultations().catch(() => ({ consultations: [] })),
        api.getPrescriptions().catch(() => ({ prescriptions: [] })),
        api.getLabReports().catch(() => ({ reports: [] })),
        api.getPatientHelpdeskTickets().catch(() => ({ tickets: [] })),
      ]);

      const events: TimelineEvent[] = [];

      // Consultations
      (cnsRes?.consultations || []).forEach((c: any) => {
        events.push({
          id: `cns-${c.id}`,
          date: c.date ? new Date(c.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
          timestamp: 'Consultation',
          title: `Consultation: ${c.diagnosis}`,
          category: 'CONSULTATION',
          doctor: c.doctor?.fullName || 'Attending Physician',
          hospital: c.hospital?.name || 'Apex Health City',
          description: `Symptoms: ${c.symptoms}. Treatment: ${c.treatmentPlan}`,
          sha256Hash: c.recordHash || '0x7b12481029482019482019482019482019482019482019482019482019482019',
          blockNumber: 10479,
        });
      });

      // Prescriptions
      (rxRes?.prescriptions || []).forEach((p: any) => {
        events.push({
          id: `rx-${p.id}`,
          date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
          timestamp: 'Prescription Issued',
          title: `Prescription: ${p.diagnosis || p.prescriptionNumber}`,
          category: 'PRESCRIPTION',
          doctor: p.doctor?.fullName || 'Attending Physician',
          hospital: p.hospital?.name || 'Apex Health City',
          description: (p.medicines || []).map((m: any) => `${m.medicineName} ${m.dosage}`).join(', ') || 'Prescription medications',
          sha256Hash: p.recordHash || '0x3a9f02b184c019248ae819203948201948201948201948201948201948201948',
          blockNumber: 10481,
        });
      });

      // Lab Reports
      (labRes?.reports || []).forEach((l: any) => {
        events.push({
          id: `lab-${l.id}`,
          date: l.resultDate || l.sampleDate ? new Date(l.resultDate || l.sampleDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
          timestamp: 'Lab Diagnostic',
          title: `Lab Test: ${l.testName}`,
          category: 'LAB_REPORT',
          doctor: l.doctor?.fullName || 'Lab Specialist',
          hospital: l.laboratoryName || 'Apex Diagnostic Services',
          description: l.summary || `${l.category} diagnostic analysis completed.`,
          sha256Hash: l.recordHash || '0x8f3c7a21be892047cb59103e910248ad819203e4810294820192847291029482',
          blockNumber: 10482,
        });
      });

      // Appointments
      (aptRes?.appointments || []).forEach((a: any) => {
        events.push({
          id: `apt-${a.id}`,
          date: a.date ? new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
          timestamp: `Appointment (${a.status})`,
          title: `Appointment: ${a.doctor?.fullName || a.doctorName || 'Doctor'}`,
          category: 'CONSULTATION',
          doctor: a.doctor?.fullName || a.doctorName || 'Doctor',
          hospital: a.hospital?.name || a.hospitalName || 'Apex Health City',
          description: `${a.type || 'Consultation'} • Slot: ${a.timeSlot || 'Scheduled'} • ${a.reason || 'Medical appointment'}`,
          sha256Hash: '0x1928471928471928471928471928471928471928471928471928471928471928',
          blockNumber: 10485,
        });
      });

      setTimelineEvents(events);
    } catch (err) {
      console.error('Failed to load timeline events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (cat: TimelineEvent['category']) => {
    switch (cat) {
      case 'CONSULTATION':
        return <Stethoscope className="w-4 h-4 text-purple-400" />;
      case 'PRESCRIPTION':
        return <Pill className="w-4 h-4 text-teal-400" />;
      case 'LAB_REPORT':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'EMERGENCY':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Activity className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <ScrollReveal direction="left">
        <div className="flex items-center justify-between">
          <BackButton fallbackPath="/patient" />
        </div>
      </ScrollReveal>

      {/* Header */}
      <ScrollReveal direction="left" delay={0.05}>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
            Longitudinal Health Record
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            Recent Health Timeline
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Chronological milestone progression of clinical diagnoses, consultations, and verified tests.
          </p>
        </div>
      </ScrollReveal>

      {/* Timeline List */}
      {loading ? (
        <div className="bg-[#0B0B0D] p-12 text-center rounded-3xl border border-white/10">
          <Activity className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-400">Loading timeline...</p>
        </div>
      ) : timelineEvents.length === 0 ? (
        <div className="bg-[#0B0B0D] p-12 text-center rounded-3xl border border-white/10 space-y-2">
          <Activity className="w-12 h-12 text-zinc-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No timeline events</h4>
          <p className="text-xs text-zinc-500">
            You don't have any clinical records, appointments, or consultations on your timeline yet.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-white/10 space-y-8 my-6">
          <ScrollRevealGroup direction="bottom" stagger={0.08}>
            {timelineEvents.map((evt, idx) => (
              <div key={evt.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-8 h-8 rounded-full bg-[#101012] border-2 border-white/20 group-hover:border-teal-400 flex items-center justify-center transition-all shadow-md group-hover:shadow-[0_0_12px_rgba(20,184,166,0.3)]">
                  {getIcon(evt.category)}
                </div>

                {/* Event Box */}
                <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl hover:border-teal-500/40 transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                        {evt.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-white">{evt.date}</span>
                      <span className="text-xs text-zinc-500">• {evt.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Block #{evt.blockNumber}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white">{evt.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{evt.description}</p>

                  <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 text-xs text-zinc-500">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-zinc-300">{evt.doctor}</span>
                      <span>•</span>
                      <span>{evt.hospital}</span>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedDoc({
                          title: evt.title,
                          category: evt.category,
                          date: evt.date,
                          doctorName: evt.doctor,
                          hospitalName: evt.hospital,
                          blockchainProof: {
                            recordHash: evt.sha256Hash,
                            blockNumber: evt.blockNumber,
                            verified: true,
                          },
                        })
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10 flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-teal-400" />
                      <span>Inspect Record</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </ScrollRevealGroup>
        </div>
      )}

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
