import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  User,
  Stethoscope,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Check,
  Bell,
  Activity,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  emergencyCareService,
  EmergencySessionItem,
  EmergencyStatus,
} from '../../services/emergencyCareService';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export const AdminEmergencyPage: React.FC = () => {
  const { t, localizeValue } = useLanguage();

  const [sessions, setSessions] = useState<EmergencySessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<EmergencyStatus | 'ALL'>('ALL');
  const [selectedSession, setSelectedSession] = useState<EmergencySessionItem | null>(null);

  // Summary counts
  const summaryCounts = useMemo(() => {
    return emergencyCareService.getSummaryCounts();
  }, []);

  // Fetch sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await emergencyCareService.getEmergencySessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search computation
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Status filter
      if (filterStatus !== 'ALL' && session.status !== filterStatus) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const docName = session.doctor.name.toLowerCase();
        const docId = session.doctor.doctorId.toLowerCase();
        const patName = session.patient.name.toLowerCase();
        const patId = session.patient.healthId.toLowerCase();
        const hosp = session.doctor.hospital.toLowerCase();
        const reason = session.emergencyReason.toLowerCase();

        return (
          docName.includes(q) ||
          docId.includes(q) ||
          patName.includes(q) ||
          patId.includes(q) ||
          hosp.includes(q) ||
          reason.includes(q)
        );
      }

      return true;
    });
  }, [sessions, filterStatus, searchQuery]);

  // Status badge styling helper
  const renderStatusBadge = (status: EmergencyStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{t('admin.emergency.active', '🟢 ACTIVE')}</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
            <Check className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('admin.emergency.completed', '✓ COMPLETED')}</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-white/50 border border-white/10">
            <span className="w-2 h-2 rounded-full border border-white/30" />
            <span>{t('admin.emergency.expired', '○ EXPIRED')}</span>
          </span>
        );
    }
  };

  // Header status banner helper
  const renderCardHeader = (status: EmergencyStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs sm:text-sm tracking-wide">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>🚨 {t('admin.emergency.cardActive', 'Active Emergency')}</span>
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs sm:text-sm tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>✓ {t('admin.emergency.cardCompleted', 'Emergency Completed')}</span>
          </div>
        );
      case 'EXPIRED':
        return (
          <div className="flex items-center gap-1.5 text-white/40 font-semibold text-xs sm:text-sm tracking-wide">
            <Clock className="w-4 h-4 text-white/40" />
            <span>○ {t('admin.emergency.cardExpired', 'Emergency Expired')}</span>
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 antialiased text-white">
      {/* ==================================================
          SECTION 2: PAGE HEADER
          ================================================== */}
      <ScrollReveal direction="bottom">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{t('admin.emergency.title', '🚨 Emergency Care')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {t('admin.emergency.title', 'Emergency Care')}
          </h1>
          <p className="text-sm text-white/60 max-w-3xl">
            {t(
              'admin.emergency.subtitle',
              'Monitor emergency access to patient records and review emergency activity.'
            )}
          </p>
        </div>
      </ScrollReveal>

      {/* ==================================================
          SECTION 3: SUMMARY CARDS
          ================================================== */}
      <ScrollRevealGroup direction="bottom" delay={0.05} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Emergency Sessions */}
        <div className="p-5 sm:p-6 rounded-[24px] bg-[#0B0B0D] border border-rose-500/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-white/60 text-xs font-semibold uppercase tracking-wider">
            <span>🚨 {t('admin.emergency.activeSessions', 'Active Emergency Sessions')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-rose-400 font-mono">
            {summaryCounts.active}
          </p>
          <span className="text-xs text-white/40 block">
            {t('admin.emergency.activeDesc', 'Immediate patient care in progress')}
          </span>
        </div>

        {/* Completed */}
        <div className="p-5 sm:p-6 rounded-[24px] bg-[#0B0B0D] border border-emerald-500/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-white/60 text-xs font-semibold uppercase tracking-wider">
            <span>✓ {t('admin.emergency.completed', 'Completed')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
            {summaryCounts.completed}
          </p>
          <span className="text-xs text-white/40 block">
            {t('admin.emergency.completedDesc', 'Successfully treated and concluded')}
          </span>
        </div>

        {/* Expired */}
        <div className="p-5 sm:p-6 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-white/60 text-xs font-semibold uppercase tracking-wider">
            <span>○ {t('admin.emergency.expired', 'Expired')}</span>
            <Clock className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white/70 font-mono">
            {summaryCounts.expired}
          </p>
          <span className="text-xs text-white/40 block">
            {t('admin.emergency.expiredDesc', 'Time-limited access window elapsed')}
          </span>
        </div>
      </ScrollRevealGroup>

      {/* ==================================================
          SECTION 4 & 5: SEARCH AND FILTERS
          ================================================== */}
      <ScrollReveal direction="bottom" delay={0.1}>
        <div className="bg-[#0B0B0D] p-4 sm:p-5 rounded-[24px] border border-white/10 shadow-lg flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                'admin.emergency.searchPlaceholder',
                'Search doctor, patient or Health ID...'
              )}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white placeholder:text-white/40 text-xs sm:text-sm focus:border-rose-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters: [ All ] [ Active ] [ Completed ] [ Expired ] */}
          <div className="flex items-center gap-1.5 p-1 bg-[#141416] rounded-xl border border-white/5 overflow-x-auto self-start md:self-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === 'ALL'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {t('admin.emergency.all', 'All')}
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                filterStatus === 'ACTIVE'
                  ? 'bg-rose-500/20 text-rose-300 shadow-xs'
                  : 'text-white/60 hover:text-rose-400'
              }`}
            >
              <span>{t('admin.emergency.active', 'Active')}</span>
            </button>
            <button
              onClick={() => setFilterStatus('COMPLETED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                filterStatus === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-xs'
                  : 'text-white/60 hover:text-emerald-400'
              }`}
            >
              <span>{t('admin.emergency.completed', 'Completed')}</span>
            </button>
            <button
              onClick={() => setFilterStatus('EXPIRED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                filterStatus === 'EXPIRED'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>{t('admin.emergency.expired', 'Expired')}</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* ==================================================
          SECTION 6, 7, 8: CARD-BASED MAIN PAGE GRID
          ================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">
            Emergency Sessions ({filteredSessions.length})
          </h2>
          <span className="text-xs text-white/40">
            Real-time patient emergency access stream
          </span>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center bg-[#0B0B0D] rounded-[24px] border border-white/10 shadow-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">
              No emergency sessions found
            </p>
            <p className="text-xs text-white/50">
              No access events match your current filter or search query.
            </p>
          </div>
        ) : (
          /* Responsive Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-[#0B0B0D] rounded-[24px] border border-white/10 p-5 sm:p-6 shadow-lg hover:border-rose-500/30 transition-all flex flex-col justify-between space-y-5"
              >
                {/* Top Status Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  {renderCardHeader(session.status)}
                  <span className="text-[11px] font-mono text-white/40">
                    {session.id}
                  </span>
                </div>

                {/* Card Body: Summary Only (Doctor, Patient, Reason, Time) */}
                <div className="space-y-4 flex-1">
                  {/* Doctor Section */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                      {t('admin.emergency.doctor', 'Doctor')}
                    </span>
                    <div className="flex items-center gap-3">
                      <ProfileAvatar
                        photoUrl={session.doctor.photoUrl}
                        name={session.doctor.name}
                        role="DOCTOR"
                        size="md"
                        className="rounded-xl ring-1 ring-white/10 shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white truncate">
                          {localizeValue(session.doctor.name, 'doctorName')}
                        </h3>
                        <p className="text-xs text-white/50 truncate">
                          {session.doctor.hospital}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Patient Section */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                      {t('admin.emergency.patient', 'Patient')}
                    </span>
                    <div className="flex items-center gap-3">
                      <ProfileAvatar
                        photoUrl={session.patient.photoUrl}
                        name={session.patient.name}
                        role="PATIENT"
                        size="md"
                        className="rounded-xl ring-1 ring-white/10 shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white truncate">
                          {localizeValue(session.patient.name, 'personName')}
                        </h3>
                        <p className="text-xs text-cyan-400 font-mono font-semibold">
                          {session.patient.healthId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Reason */}
                  <div className="space-y-1 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                      {t('admin.emergency.reason', 'Reason')}
                    </span>
                    <p className="text-xs text-white/80 font-medium line-clamp-2">
                      {session.emergencyReason}
                    </p>
                  </div>

                  {/* Started Time */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                      {t('admin.emergency.started', 'Started')}
                    </span>
                    <p className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/40" />
                      <span>{session.startedAtShort}</span>
                    </p>
                  </div>

                  {/* Nominee Notification Pill */}
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-white/40 text-[11px] font-semibold">
                      {t('admin.emergency.nomineeNotification', 'Nominee Notification')}:
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <Check className="w-3 h-3" />
                      <span>{t('admin.emergency.notificationSent', '✓ Notification Sent')}</span>
                    </span>
                  </div>
                </div>

                {/* Card Footer: Status Badge & [ View Details ] */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  {renderStatusBadge(session.status)}

                  <button
                    onClick={() => setSelectedSession(session)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 cursor-pointer border border-white/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('admin.emergency.viewDetails', 'View Details')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================
          SECTION 9 & 10: VIEW DETAILS MODAL
          ================================================== */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm page-fade-in overflow-y-auto"
          onClick={() => setSelectedSession(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-[#0B0B0D] rounded-[28px] w-full max-w-2xl shadow-2xl border border-white/10 overflow-hidden my-8 space-y-6 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  {t('admin.emergency.detailsTitle', 'Emergency Access Details')}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span>{selectedSession.id}</span>
                  <span>•</span>
                  {renderStatusBadge(selectedSession.status)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DOCTOR & PATIENT DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Doctor Details */}
              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                    <span>{t('admin.emergency.doctorDetails', 'Doctor Details')}</span>
                  </span>
                  {selectedSession.doctor.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Check className="w-3 h-3" />
                      <span>{t('admin.emergency.doctorVerified', '✓ Doctor Verified')}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    photoUrl={selectedSession.doctor.photoUrl}
                    name={selectedSession.doctor.name}
                    role="DOCTOR"
                    size="lg"
                    className="rounded-2xl ring-1 ring-white/10 shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white">
                      {localizeValue(selectedSession.doctor.name, 'doctorName')}
                    </h4>
                    <p className="text-xs text-white/50">
                      {selectedSession.doctor.hospital}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Doctor ID:</span>
                    <span className="font-mono font-semibold text-white">
                      {selectedSession.doctor.doctorId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Qualification:</span>
                    <span className="font-medium text-white/80">
                      {selectedSession.doctor.qualification}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Experience:</span>
                    <span className="font-medium text-white/80">
                      {selectedSession.doctor.experience}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('admin.emergency.patientDetails', 'Patient Details')}</span>
                  </span>
                  {selectedSession.patient.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Check className="w-3 h-3" />
                      <span>{t('admin.emergency.patientVerified', '✓ Patient Verified')}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    photoUrl={selectedSession.patient.photoUrl}
                    name={selectedSession.patient.name}
                    role="PATIENT"
                    size="lg"
                    className="rounded-2xl ring-1 ring-white/10 shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white">
                      {localizeValue(selectedSession.patient.name, 'personName')}
                    </h4>
                    <p className="text-xs text-white/50">
                      Sovereign Health Identity
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Health ID:</span>
                    <span className="font-mono font-semibold text-cyan-400">
                      {selectedSession.patient.healthId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Verification Status:</span>
                    <span className="font-semibold text-emerald-400">
                      ✓ Patient Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* EMERGENCY DETAILS BLOCK */}
            <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-3 text-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50 block">
                {t('admin.emergency.emergencyDetails', 'Emergency Details')}
              </span>

              <div className="space-y-2">
                <div>
                  <span className="text-white/40 font-semibold block">
                    {t('admin.emergency.reason', 'Reason')}:
                  </span>
                  <p className="font-bold text-white mt-0.5">
                    {selectedSession.emergencyReason}
                  </p>
                </div>

                <div>
                  <span className="text-white/40 font-semibold block">
                    {t('admin.emergency.patientCondition', 'Patient Condition')}:
                  </span>
                  <p className="text-white/80 font-medium mt-0.5">
                    {selectedSession.patientCondition}
                  </p>
                </div>

                <div>
                  <span className="text-white/40 font-semibold block">
                    {t('admin.emergency.incident', 'Incident')}:
                  </span>
                  <p className="text-white/80 font-medium mt-0.5">
                    {selectedSession.incident}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-white/40 font-semibold block">
                      {t('admin.emergency.accessStarted', 'Access Started')}:
                    </span>
                    <p className="font-semibold text-white/80 mt-0.5">
                      {selectedSession.startedAt}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/40 font-semibold block">
                      {t('admin.emergency.accessEnded', 'Access Ended')}:
                    </span>
                    <p className="font-semibold text-white/80 mt-0.5">
                      {selectedSession.endedAt || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/40 font-semibold block">
                      {t('admin.emergency.accessType', 'Access Type')}:
                    </span>
                    <p className="font-bold text-teal-400 mt-0.5">
                      {selectedSession.accessType}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* NOMINEE NOTIFICATION & AUDIT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Nominee Notification */}
              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/50 block flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t('admin.emergency.nomineeNotification', 'Nominee Notification')}</span>
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/50">Nominee:</span>
                    <span className="font-semibold text-white">
                      {localizeValue(selectedSession.nominee.name, 'personName')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Relationship:</span>
                    <span className="font-medium text-white/80">
                      {selectedSession.nominee.relationship}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Notification:</span>
                    <span className="font-semibold text-emerald-400">
                      ✓ {t('admin.emergency.notificationSent', 'Notification Sent')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Sent At:</span>
                    <span className="font-medium text-white/80">
                      {selectedSession.nominee.notificationSentAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Audit */}
              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/50 block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('admin.emergency.audit', 'Audit')}</span>
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/50">Record Status:</span>
                    <span className="font-semibold text-emerald-400">
                      ✓ {t('admin.emergency.auditRecorded', 'Emergency access recorded')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Doctor:</span>
                    <span className="font-medium text-white/80">
                      {selectedSession.doctor.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Patient:</span>
                    <span className="font-medium text-white/80">
                      {selectedSession.patient.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Audit Time:</span>
                    <span className="font-medium text-white/80">
                      {selectedSession.audit.auditTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 10: EMERGENCY TIMELINE */}
            <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50 block">
                {t('admin.emergency.timeline', 'Emergency Access Timeline')}
              </span>

              <div className="space-y-2.5">
                {selectedSession.timeline.map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {event.isCompleted ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-[10px]">
                          ✓
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-white/20 text-white/40 flex items-center justify-center text-[10px]">
                          ○
                        </span>
                      )}
                      <span className="font-medium text-white/90">
                        {event.title}
                      </span>
                    </div>
                    <span className="font-mono text-white/40">
                      {event.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all shadow-md cursor-pointer border border-white/10"
              >
                {t('admin.emergency.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmergencyPage;
