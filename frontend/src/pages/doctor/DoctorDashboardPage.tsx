import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Users,
  Calendar,
  FileText,
  AlertTriangle,
  Search,
  ShieldCheck,
  Plus,
  Clock,
  ArrowRight,
  Pill,
  Lock,
  Activity,
  CheckCircle2,
  ShieldAlert,
  Fingerprint,
  TrendingUp,
  Cpu,
  Sparkles,
  ChevronRight,
  HeartPulse,
  Award,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { api } from '../../services/api';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
  AnimatedSection,
  AnimatedCard,
  PageHeader,
  StatusBadge,
} from '../../components/common/ScrollReveal';

export const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'confirmed'>('all');
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(user?.doctor || null);
  const [stats, setStats] = useState({
    todayAppointmentsCount: 0,
    totalAppointmentsCount: 0,
    pendingAccessRequestsCount: 0,
    activeEmergencySessionsCount: 0,
    unreadNotificationsCount: 0,
  });

  const doctorName = user?.doctor?.fullName || user?.name || 'Practitioner';
  const licenseNumber = user?.doctor?.registrationNumber || doctorProfile?.registrationNumber || 'Not provided';
  const specialization = user?.doctor?.specialization || doctorProfile?.specialization || 'Not provided';
  const hospital = user?.doctor?.hospitalAffiliation || doctorProfile?.hospitalAffiliation || 'Not provided';
  const verificationStatus = user?.doctor?.regStatus || doctorProfile?.regStatus || user?.doctor?.govMatchStatus || 'ACTIVE';
  const doctorPhoto = user?.profilePhoto || user?.doctor?.profilePhoto || doctorProfile?.profilePhoto;

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [dashRes, profRes, reqsRes] = await Promise.allSettled([
          api.getDoctorDashboard(),
          api.getDoctorProfile(),
          api.listDoctorAccessRequests(),
        ]);

        if (isMounted) {
          if (dashRes.status === 'fulfilled' && dashRes.value.success) {
            setStats(dashRes.value.stats || {});
            setTodayAppointments(dashRes.value.todayAppointments || []);
          }

          if (profRes.status === 'fulfilled' && profRes.value.success && profRes.value.doctor) {
            setDoctorProfile(profRes.value.doctor);
          }

          if (reqsRes.status === 'fulfilled' && reqsRes.value.success) {
            setAccessRequests(reqsRes.value.requests || []);
          }
        }
      } catch (err) {
        console.error('Failed to load doctor dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/doctor/patients?query=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="space-y-12 pb-24 text-white antialiased">
      {/* ========================================================================= */}
      {/* SECTION 1: DOCTOR HERO BANNER */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#0B0B0D] via-[#08080A] to-[#050506] border border-white/[0.08] p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <ScrollReveal direction="left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold backdrop-blur-md">
                <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                <span>Physician Workspace • Medical Licence: <strong className="font-mono text-white">{licenseNumber}</strong></span>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={0.08}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Good day, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-cyan-400">
                  {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={0.14}>
              <p className="text-base sm:text-lg font-medium text-white/70">
                {specialization !== 'Not provided' ? `${specialization} Specialist` : 'Medical Practitioner'} • {hospital}
              </p>
              <p className="text-xs sm:text-sm text-white/50 max-w-xl mt-1 leading-relaxed">
                Your sovereign clinical workstation: live electronic medical records, real-time patient queues, and cryptographic audit logs.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={0.2}>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('patient-search-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-102 flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Patient Directory</span>
                </button>

                <Link
                  to="/doctor/appointments"
                  className="px-6 py-3.5 rounded-2xl bg-[#101012] text-white/80 hover:text-white hover:bg-[#18181B] font-bold text-sm border border-white/10 shadow-sm transition-all hover:scale-102 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-teal-400" />
                  <span>Appointments Queue ({todayAppointments.length})</span>
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={0.26}>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-white/40">
                <span className="flex items-center gap-1.5 font-sans font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  Status: {verificationStatus}
                </span>
                <span>•</span>
                <span>Specialization: {specialization}</span>
                <span>•</span>
                <span className="text-teal-400">Zero Demo Mock Mode</span>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Visual Composition */}
          <div className="lg:col-span-5 relative flex justify-center">
            <ScrollReveal direction="right" delay={0.15}>
              <GlowCard glowColor="rgba(59, 130, 246, 0.25)" className="w-full max-w-md">
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <ProfileAvatar
                      photoUrl={doctorPhoto}
                      name={doctorName}
                      role="DOCTOR"
                      size="xl"
                      shape="rounded"
                      className="border-2 border-teal-500/40 shadow-md flex-shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <p className="text-lg font-bold text-white truncate">
                        {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
                      </p>
                      <p className="text-xs text-white/50 font-mono">
                        Licence: {licenseNumber}
                      </p>
                      <p className="text-xs text-teal-400 font-medium">
                        {specialization} • {hospital}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.08] text-xs">
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Appointments</span>
                      <p className="font-bold text-white font-mono text-base mt-0.5">{stats.todayAppointmentsCount || todayAppointments.length} Today</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-[10px] uppercase font-bold text-teal-400/80 tracking-wider">Clearances</span>
                      <p className="font-bold text-teal-400 font-mono text-base mt-0.5">{stats.pendingAccessRequestsCount || accessRequests.length} Pending</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-white/50">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Direct PostgreSQL Sync
                    </span>
                    <span className="font-mono text-white/30">Node Active</span>
                  </div>
                </div>
              </GlowCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: QUICK WORKSPACE ACTIONS */}
      {/* ========================================================================= */}
      <section className="space-y-5">
        <ScrollReveal direction="left">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Clinical Workflow Actions
            </h2>
            <span className="text-xs font-semibold text-white/40">Core Operations</span>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Primary Action Card: Large SEARCH PATIENT */}
          <ScrollReveal direction="left" delay={0.05} className="md:col-span-6">
            <div
              id="patient-search-section"
              className="rounded-[28px] p-6 sm:p-8 bg-gradient-to-br from-[#0B0B0D] to-[#101014] border border-blue-500/30 text-white shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden group h-full"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform" />

              <div className="space-y-2 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
                  <Search className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-teal-300 font-bold">
                  Primary Physician Workflow
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  SEARCH PATIENT EMR
                </h3>
                <p className="text-xs sm:text-sm text-white/60 max-w-md leading-relaxed">
                  Lookup patients by Health ID, Full Name, Aadhaar Number, or ABHA ID.
                  All queries resolve directly against the live database records.
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative z-10 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter Health ID, Name, or Aadhaar..."
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/40 text-xs font-mono font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-600/20 whitespace-nowrap cursor-pointer"
                >
                  Lookup
                </button>
              </form>
            </div>
          </ScrollReveal>

          {/* 3 Smaller Actions */}
          <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Action 1: Appointments */}
            <ScrollReveal direction="right" delay={0.08}>
              <Link
                to="/doctor/appointments"
                className="p-6 rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] hover:border-teal-500/30 transition-all hover:scale-102 flex flex-col justify-between group shadow-lg h-full"
              >
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Schedule</span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    Appointments
                  </h4>
                  <p className="text-xs text-white/50 mt-1">
                    {todayAppointments.length} visits queued today
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                  Open Queue <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </ScrollReveal>

            {/* Action 2: Access Requests */}
            <ScrollReveal direction="right" delay={0.14}>
              <Link
                to="/doctor/access-requests"
                className="p-6 rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] hover:border-amber-500/30 transition-all hover:scale-102 flex flex-col justify-between group shadow-lg h-full"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Clearances</span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    Access Requests
                  </h4>
                  <p className="text-xs text-white/50 mt-1">
                    {accessRequests.length} clearance records
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                  Review Clearances <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </ScrollReveal>

            {/* Action 3: Emergency Bypass */}
            <ScrollReveal direction="right" delay={0.2}>
              <Link
                to="/doctor/emergency"
                className="p-6 rounded-[28px] bg-[#14080A] border border-rose-500/30 hover:border-rose-500/50 transition-all hover:scale-102 flex flex-col justify-between group shadow-lg h-full"
              >
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Critical Care</span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    Emergency
                  </h4>
                  <p className="text-xs text-rose-300/60 mt-1">
                    2-Hour EMS Protocol
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                  Launch EMS <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: TODAY'S PRACTICE TIMELINE */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <ScrollReveal direction="left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold">
                Daily Clinical Agenda
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Today's Practice Timeline
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">
                Hospital Node: <strong className="text-white font-medium">{hospital}</strong>
              </span>
            </div>
          </div>
        </ScrollReveal>

        {todayAppointments.length === 0 ? (
          <ScrollReveal direction="bottom">
            <div className="p-8 rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] text-center space-y-2">
              <Calendar className="w-8 h-8 text-white/30 mx-auto" />
              <p className="text-sm font-bold text-white">No appointments scheduled for today</p>
              <p className="text-xs text-white/50">When patients book consultations with you, their appointments will appear here.</p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {todayAppointments.map((visit, idx) => (
              <ScrollReveal key={visit.id} direction="bottom" delay={idx * 0.05}>
                <div className="p-5 rounded-[24px] border border-white/[0.08] bg-[#0B0B0D] hover:border-white/20 transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black font-mono text-white">
                      {visit.timeSlot || 'Scheduled'}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {visit.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      photoUrl={visit.patient?.profilePhoto}
                      name={visit.patient?.fullName || 'Patient'}
                      role="PATIENT"
                      size="md"
                      shape="rounded"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {visit.patient?.fullName || 'Patient'}
                      </p>
                      <p className="text-xs text-white/40 font-mono">{visit.patient?.healthId || 'Health ID'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/50">
                    <span className="truncate">{visit.type || 'Consultation'}</span>
                    <span className="font-semibold text-white font-mono">{visit.tokenNumber || 'Token 1'}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: ACCESS CLEARANCES */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <ScrollReveal direction="left">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold">
                Sovereign Consent Clearances
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Your Access Requests & Permissions
              </h3>
            </div>
            <Link
              to="/doctor/access-requests"
              className="text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              View All Clearances →
            </Link>
          </div>
        </ScrollReveal>

        {accessRequests.length === 0 ? (
          <ScrollReveal direction="bottom">
            <div className="p-8 rounded-[28px] bg-[#0B0B0D] border border-white/[0.08] text-center space-y-2">
              <Clock className="w-8 h-8 text-white/30 mx-auto" />
              <p className="text-sm font-bold text-white">No active access requests</p>
              <p className="text-xs text-white/50">When you search for a patient and request EMR access, the request status will appear here.</p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accessRequests.slice(0, 4).map((req, idx) => (
              <ScrollReveal key={req.id} direction={idx % 2 === 0 ? 'left' : 'right'} delay={idx * 0.05}>
                <div className="p-4 rounded-[24px] bg-[#0B0B0D] border border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {req.patient?.fullName || 'Patient'} ({req.patient?.healthId || 'ID'})
                      </p>
                      <p className="text-[11px] text-white/50">
                        Status: <strong className="font-mono text-white/80">{req.status}</strong> • Reason: {req.reason}
                      </p>
                    </div>
                  </div>

                  {req.status === 'APPROVED' ? (
                    <Link
                      to={`/doctor/patients/${req.patientId}/emr`}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md"
                    >
                      Open EMR
                    </Link>
                  ) : (
                    <span className="text-[11px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {req.status}
                    </span>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: EMERGENCY ACCESS PROTOCOL */}
      {/* ========================================================================= */}
      <ScrollReveal direction="bottom">
        <section className="p-8 sm:p-10 rounded-[32px] bg-gradient-to-br from-[#1A0A0E] via-[#0E0608] to-[#050506] border border-rose-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-600/30">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold tracking-wider uppercase">
                    EMS Protocol Level-1
                  </span>
                  <span className="text-xs text-rose-400 font-mono font-bold">
                    2-Hour Window
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  Emergency Life-Support Clinical Bypass
                </h3>
                <p className="text-xs sm:text-sm text-white/60 max-w-xl leading-relaxed">
                  For unconscious patients or acute trauma. Requires clinical incident reason and confirmation.
                  Exposes emergency summary with immediate sovereign notification dispatch.
                </p>
              </div>
            </div>

            <Link
              to="/doctor/emergency"
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-transform hover:scale-105 whitespace-nowrap flex items-center gap-2 self-start md:self-auto cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Launch Emergency Bypass</span>
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
};

export default DoctorDashboardPage;
