import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  CheckCircle2,
  Video,
  MapPin,
  FileText,
  ChevronRight,
  Plus,
  ArrowRight,
  Stethoscope,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  patientHealthId: string;
  time: string;
  date: string;
  type: 'IN_PERSON' | 'TELECONSULTATION';
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reason: string;
  hospitalName: string;
}

export const DoctorAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING'>('ALL');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctorAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.getDoctorAppointments();
      if (res.success && Array.isArray(res.appointments)) {
        const mapped: Appointment[] = res.appointments.map((a: any) => ({
          id: a.id,
          appointmentNumber: a.appointmentNumber || `APT-${a.id.slice(0, 4)}`,
          patientId: a.patientId,
          patientName: a.patient?.fullName || 'Patient',
          patientHealthId: a.patient?.healthId || 'HP-000000',
          date: a.date,
          time: a.timeSlot,
          type: a.appointmentType === 'ONLINE' ? 'TELECONSULTATION' : 'IN_PERSON',
          status: a.status || 'CONFIRMED',
          reason: a.reason || 'Clinical consultation',
          hospitalName: a.hospital?.name || a.department || 'Apex Health City',
        }));
        setAppointments(mapped);
      }
    } catch (err) {
      console.error('Failed to load doctor appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const handleStartConsultation = (apt: Appointment) => {
    navigate(`/doctor/consultation/new?patientId=${apt.patientId}&name=${encodeURIComponent(apt.patientName)}&healthId=${apt.patientHealthId}&appointmentId=${apt.id}`);
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      const res = await api.updateDoctorAppointmentStatus(id, { status: 'COMPLETED' });
      if (res.success) {
        addToast('success', 'Appointment marked as completed');
        fetchDoctorAppointments();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update appointment');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = (d: string) => {
    if (!d) return false;
    if (d.toLowerCase() === 'today') return true;
    return d === todayStr;
  };
  const isUpcoming = (d: string) => {
    if (!d) return true;
    if (d.toLowerCase() === 'today') return true;
    return d >= todayStr;
  };

  const filteredAppointments = appointments.filter((apt) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      apt.patientName.toLowerCase().includes(q) ||
      apt.patientHealthId.toLowerCase().includes(q) ||
      (apt.appointmentNumber && apt.appointmentNumber.toLowerCase().includes(q)) ||
      apt.reason.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;

    const matchesDate =
      dateFilter === 'ALL' ||
      (dateFilter === 'TODAY' && isToday(apt.date)) ||
      (dateFilter === 'UPCOMING' && isUpcoming(apt.date));

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-8 pb-24 text-white antialiased">
      {/* Top Banner */}
      <ScrollReveal direction="left">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B0B0D] via-[#0E131F] to-[#0B0B0D] text-white p-8 sm:p-10 rounded-[32px] shadow-2xl border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-mono font-semibold">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Clinical Appointment Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Patient Appointments
            </h1>
            <p className="text-xs sm:text-sm text-white/50 max-w-2xl leading-relaxed">
              Manage your daily clinic consultations, video visits, and scheduled health reviews. Directly open patient electronic health records or launch clinical documentation.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={() => {
                fetchDoctorAppointments();
                addToast('info', 'Clinical appointments synchronized with PostgreSQL database');
              }}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Appointments</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Quick Filter Tabs */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0B0B0D] p-4 rounded-[28px] border border-white/[0.08] shadow-xl">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              All Scheduled ({appointments.length})
            </button>
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilter === 'TODAY'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Today ({appointments.filter((a) => isToday(a.date)).length})
            </button>
            <button
              onClick={() => setDateFilter('UPCOMING')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilter === 'UPCOMING'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Upcoming ({appointments.filter((a) => isUpcoming(a.date)).length})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, ID, APT#..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl border border-white/10 bg-[#101012] text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </ScrollReveal>

      {/* Appointment Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] space-y-3">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-white/50">Loading appointment roster from PostgreSQL...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <ScrollReveal direction="bottom">
            <div className="p-12 text-center text-white/40 bg-[#0B0B0D] rounded-[32px] border border-white/[0.08] space-y-2">
              <Calendar className="w-10 h-10 text-white/20 mx-auto" />
              <p className="text-sm font-bold text-white">No Appointments Match Criteria</p>
              <p className="text-xs text-white/40">Adjust your search or filter settings to view other clinical appointments.</p>
            </div>
          </ScrollReveal>
        ) : (
          <ScrollRevealGroup staggerDelay={0.06} className="space-y-4">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-5 sm:p-6 rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex flex-col items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] font-bold uppercase truncate max-w-[44px]">{apt.date}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-base">{apt.patientName}</span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {apt.patientHealthId}
                      </span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/[0.04] text-white/80 border border-white/10">
                        {apt.appointmentNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          apt.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : apt.status === 'COMPLETED'
                            ? 'bg-white/[0.04] text-white/50 border-white/10'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <p className="text-xs text-white/60 leading-relaxed max-w-xl">
                      <strong className="text-white/80">Reason:</strong> {apt.reason}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-white/80">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {apt.time}
                      </span>

                      <span className="flex items-center gap-1 text-white/50">
                        {apt.type === 'TELECONSULTATION' ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-purple-300 font-semibold">Teleconsultation</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-white/40" />
                            <span>{apt.hospitalName}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                  <Link
                    to={`/doctor/current-patient/${apt.patientId}`}
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Current Patient</span>
                  </Link>

                  {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                    <>
                      <button
                        onClick={() => handleMarkCompleted(apt.id)}
                        className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-bold text-white/60 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white/40" />
                        <span>Complete</span>
                      </button>

                      <button
                        onClick={() => handleStartConsultation(apt)}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Start Consultation</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </ScrollRevealGroup>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointmentsPage;
