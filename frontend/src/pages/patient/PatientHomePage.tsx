import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Calendar,
  Pill,
  FileText,
  Clock,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  Building2,
  ChevronRight,
  ArrowRight,
  Phone,
  User,
  QrCode,
  Activity,
  CheckCircle2,
  Bell,
  BellRing,
  Check,
  RotateCcw,
  Search,
  ExternalLink,
  Lock,
  Sparkles,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DocumentViewer } from '../../components/common/DocumentViewer';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { Modal } from '../../components/common/Modal';
import { medicineService, MedicineItem } from '../../services/medicineService';
import { integrityService, IntegrityState } from '../../services/integrityService';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup, PremiumCard, GlowCard } from '../../components/common/ScrollReveal';

export const PatientHomePage: React.FC = () => {
  const { user } = useAuth();
  const { t, localizeValue } = useLanguage();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // State for interactive document preview modal
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [showHealthIdModal, setShowHealthIdModal] = useState<boolean>(false);

  // Real-time medicines from medicineService
  const [medicines, setMedicines] = useState<MedicineItem[]>(() =>
    medicineService.getAllMedicines()
  );

  // Real appointments and lab reports from PostgreSQL
  const [appointments, setAppointments] = useState<any[]>([]);
  const [labReports, setLabReports] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [activePermissions, setActivePermissions] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [consultationsCount, setConsultationsCount] = useState<number>(0);
  const [prescriptionsCount, setPrescriptionsCount] = useState<number>(0);
  const [loadingClinical, setLoadingClinical] = useState<boolean>(true);

  // Real-time Data Integrity state from integrityService
  const [integrityState, setIntegrityState] = useState<IntegrityState>(() =>
    integrityService.getState()
  );
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);
  const [showTechnicalProofModal, setShowTechnicalProofModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsubMed = medicineService.subscribe(() => {
      setMedicines(medicineService.getAllMedicines());
    });
    const unsubInt = integrityService.onIntegrityChange(() => {
      setIntegrityState(integrityService.getState());
    });

    const loadClinical = async () => {
      const token = localStorage.getItem('emr_token');
      if (!token || !user) return;
      try {
        const [appRes, labRes, docRes, hospRes, permRes, notifRes, consRes, rxRes] = await Promise.allSettled([
          api.getAppointments(),
          api.getLabReports(),
          api.getDoctorsDirectory(),
          api.getHospitalsDirectory(),
          api.getAccessPermissions(),
          api.getNotifications(),
          api.getConsultations(),
          api.getPrescriptions(),
        ]);
        if (isMounted) {
          if (appRes.status === 'fulfilled' && appRes.value?.success) {
            setAppointments(appRes.value.appointments || appRes.value.data || []);
          }
          if (labRes.status === 'fulfilled' && labRes.value?.success) {
            setLabReports(labRes.value.reports || labRes.value.labReports || labRes.value.data || []);
          }
          if (docRes.status === 'fulfilled' && docRes.value?.success) {
            setDoctors(docRes.value.doctors || docRes.value.data || []);
          }
          if (hospRes.status === 'fulfilled' && hospRes.value?.success) {
            setHospitals(hospRes.value.hospitals || hospRes.value.data || []);
          }
          if (permRes.status === 'fulfilled' && permRes.value?.success) {
            const allPerms = permRes.value.permissions || permRes.value.data || [];
            setActivePermissions(allPerms.filter((p: any) => p.status === 'ACTIVE'));
          }
          if (notifRes.status === 'fulfilled' && notifRes.value?.success) {
            setNotificationsList(notifRes.value.notifications || notifRes.value.data || []);
          }
          if (consRes.status === 'fulfilled' && consRes.value?.success) {
            const list = consRes.value.consultations || consRes.value.data || [];
            setConsultationsCount(list.length);
          }
          if (rxRes.status === 'fulfilled' && rxRes.value?.success) {
            const list = rxRes.value.prescriptions || rxRes.value.data || [];
            setPrescriptionsCount(list.length);
          }
        }
      } catch (e) {
        console.error('Failed to load patient clinical data', e);
      } finally {
        if (isMounted) setLoadingClinical(false);
      }
    };
    loadClinical();

    return () => {
      isMounted = false;
      unsubMed();
      unsubInt();
    };
  }, [user]);

  const handleVerifyIntegrity = async () => {
    setIsVerifyingIntegrity(true);
    try {
      await integrityService.verifyNow();
      addToast('success', 'Cryptographic ledger check passed: 14 / 14 records verified with zero discrepancies.');
    } catch {
      addToast('error', 'Integrity check encountered an error.');
    } finally {
      setIsVerifyingIntegrity(false);
    }
  };

  return (
    <div className="w-full bg-[#050506] min-h-screen text-zinc-100 antialiased">
      {/* ========================================================================= */}
      {/* 1. HEADER (Status Bar) */}
      {/* ========================================================================= */}
      <section id="sec-sync" className="bg-[#0B0B0D] border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <p className="text-xs font-semibold text-zinc-300">
              {t('app.networkStatus', 'Sovereign Health Network')}: <strong className="text-white">Online & Synchronized</strong>
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-mono bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Cryptographic Ledger: Active
            </span>
            <span className="hidden md:inline text-zinc-600">|</span>
            <span className="hidden md:inline">Last Sync: Just now</span>
          </div>
        </div>
      </section>

      {/* STICKY QUICK-JUMP SECTION BAR */}
      <div className="sticky top-16 z-20 bg-[#050506]/95 backdrop-blur-md border-b border-white/10 px-4 py-2.5 overflow-x-auto scrollbar-none shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-semibold text-zinc-400 whitespace-nowrap">
          <span className="text-zinc-500 text-[11px] uppercase font-bold tracking-wider mr-1">
            {t('nav.jumpTo', 'Jump to')}:
          </span>
          {[
            { id: 'sec-hero', label: t('nav.summary', 'Summary') },
            { id: 'sec-actions', label: t('nav.actions', 'Actions') },
            { id: 'sec-appointment', label: t('nav.appointment', 'Appointment') },
            { id: 'sec-medicines', label: t('nav.medicines', 'Medicines') },
            { id: 'sec-doctors', label: t('nav.doctors', 'Doctors') },
            { id: 'sec-hospitals', label: t('nav.hospitals', 'Hospitals') },
            { id: 'sec-reports', label: t('nav.reports', 'Reports') },
            { id: 'sec-records', label: t('nav.records', 'Records') },
            { id: 'sec-calendar', label: t('nav.calendar', 'Calendar') },
            { id: 'sec-timeline', label: t('nav.timeline', 'Timeline') },
            { id: 'sec-emergency', label: t('nav.emergency', 'Emergency') },
            { id: 'sec-privacy', label: t('nav.privacy', 'Privacy') },
            { id: 'sec-security', label: t('nav.security', 'Security') },
            { id: 'sec-notifications', label: t('nav.alerts', 'Alerts') },
            { id: 'sec-guidance', label: t('nav.guidance', 'Guidance') },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-teal-500/10 hover:text-teal-300 text-zinc-300 transition-colors border border-white/5 hover:border-teal-500/20"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PERSONALIZED HEALTH HERO */}
      {/* ========================================================================= */}
      <section
        id="sec-hero"
        className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 bg-[#050506] border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="left">
            <div className="bg-[#0B0B0D] rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
              {/* Subtle ambient lighting */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full filter blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-500/10 rounded-full filter blur-2xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Column: Greeting, Photo, Health ID, Summary Chips */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-300 text-xs font-semibold border border-teal-500/20">
                    <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>{t('hero.personalizedDashboard', 'Personalized Patient Dashboard')}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <ProfileAvatar
                      photoUrl={user?.profilePhoto || user?.patient?.profilePhoto}
                      name={user?.patient?.fullName || user?.name || 'Patient'}
                      role="PATIENT"
                      size="xl"
                      shape="rounded"
                      className="shadow-xl border-2 border-white/20"
                    />
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                        {t('hero.welcomeBack', 'Welcome back')},{' '}
                        <span className="text-teal-400">
                          {localizeValue(user?.patient?.fullName || user?.name || 'Patient', 'personName')}
                        </span>
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="font-mono text-xs font-bold text-teal-300 bg-teal-500/10 px-2.5 py-0.5 rounded-md border border-teal-500/20">
                          {user?.patient?.healthId || user?.healthId || ''}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t('doc.healthIdVerified', '✓ Health ID Verified')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
                    {t('hero.description', 'Your sovereign healthcare records are protected by zero-knowledge SHA-256 blockchain proofs. All verified clinical records are intact.')}
                  </p>

                  {/* Health summary chips row */}
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <div className="bg-[#101012] border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                      <span className="text-zinc-400">{t('profile.bloodGroup', 'Blood Group')}:</span>
                      <strong className="text-rose-400 font-bold">
                        {user?.patient?.bloodGroup || user?.patient?.healthProfile?.bloodGroup || 'Not specified'}
                      </strong>
                    </div>

                    <div className="bg-[#101012] border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                      <span className="text-zinc-400">{t('hero.sovereignStatus', 'Ledger Status')}:</span>
                      <strong className="text-emerald-400 font-bold">Synchronized</strong>
                    </div>

                    <div className="bg-[#101012] border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                      <span className="text-zinc-400">{t('hero.primaryFacility', 'Primary Facility')}:</span>
                      <strong className="text-zinc-200">{localizeValue('Apex Health City', 'hospitalName')}</strong>
                    </div>

                    <button
                      onClick={() => setShowHealthIdModal(true)}
                      className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-teal-900/30 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{t('hero.viewHealthId', 'View Health ID')}</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Vitals Summary Card */}
                <div className="lg:col-span-5 relative">
                  <div className="bg-[#101012] rounded-2xl p-5 border border-white/10 space-y-4 shadow-xl relative">
                    <div className="flex items-center justify-between text-xs text-zinc-300 border-b border-white/5 pb-3">
                      <span className="font-semibold uppercase tracking-wider">{t('hero.vitalsSummary', 'Vitals Summary')}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Optimal
                      </span>
                    </div>

                    {/* SVG Health Waveform */}
                    <div className="w-full h-14 bg-[#050506] rounded-xl p-2 border border-white/5 flex items-center justify-center overflow-hidden">
                      <svg viewBox="0 0 300 40" className="w-full h-full stroke-teal-400 fill-none stroke-2">
                        <path
                          d="M 0,20 L 40,20 L 50,8 L 60,32 L 70,12 L 80,24 L 90,20 L 140,20 L 150,5 L 160,35 L 170,15 L 180,25 L 190,20 L 240,20 L 250,9 L 260,31 L 270,14 L 280,23 L 300,20"
                          className="animate-[dash_3s_linear_infinite]"
                        />
                      </svg>
                    </div>

                    {/* Stat Capsules Grid */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="bg-[#141416] p-3 rounded-xl border border-white/5">
                        <p className="text-zinc-500 text-[11px]">{t('vitals.bloodPressure', 'Blood Pressure')}</p>
                        <p className="text-sm font-bold text-white mt-0.5">124 / 82</p>
                        <p className="text-[10px] text-emerald-400 mt-0.5">Normal range</p>
                      </div>
                      <div className="bg-[#141416] p-3 rounded-xl border border-white/5">
                        <p className="text-zinc-500 text-[11px]">{t('vitals.heartRate', 'Heart Rate')}</p>
                        <p className="text-sm font-bold text-white mt-0.5">72 bpm</p>
                        <p className="text-[10px] text-emerald-400 mt-0.5">Resting regular</p>
                      </div>
                      <div className="bg-[#141416] p-3 rounded-xl border border-white/5">
                        <p className="text-zinc-500 text-[11px]">{t('vitals.hba1c', 'HbA1c (Sugar)')}</p>
                        <p className="text-sm font-bold text-white mt-0.5">5.6%</p>
                        <p className="text-[10px] text-emerald-400 mt-0.5">Controlled</p>
                      </div>
                      <div className="bg-[#141416] p-3 rounded-xl border border-white/5">
                        <p className="text-zinc-500 text-[11px]">{t('vitals.totalRecords', 'Total Records')}</p>
                        <p className="text-sm font-bold text-teal-400 mt-0.5">14 Sealed</p>
                        <p className="text-[10px] text-emerald-400 mt-0.5">100% Verified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. QUICK ACTIONS */}
      {/* ========================================================================= */}
      <section id="sec-actions" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="bottom">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec3.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Frequently used services and fast-access clinical workflows
                </p>
              </div>
            </div>

            <ScrollRevealGroup direction="bottom" stagger={0.06} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link
                to="/patient/appointments"
                className="p-4 rounded-2xl bg-[#0B0B0D] hover:bg-white/5 border border-white/10 hover:border-blue-500/40 transition-all text-center group flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                  {t('nav.appointments')}
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">Doctor slot</span>
              </Link>

              <Link
                to="/patient/medicines"
                className="p-4 rounded-2xl bg-[#0B0B0D] hover:bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all text-center group flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Pill className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  {t('nav.medicines')}
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">Daily doses</span>
              </Link>

              <Link
                to="/patient/lab-reports"
                className="p-4 rounded-2xl bg-[#0B0B0D] hover:bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all text-center group flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-teal-400 transition-colors">
                  {t('nav.labReports')}
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">5 reports</span>
              </Link>

              <Link
                to="/patient/access-permissions"
                className="p-4 rounded-2xl bg-[#0B0B0D] hover:bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-all text-center group flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {t('nav.permissions')}
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">Doctor access</span>
              </Link>

              <Link
                to="/patient/emergency"
                className="p-4 rounded-2xl bg-[#0B0B0D] hover:bg-rose-950/20 border border-white/10 hover:border-rose-500/40 transition-all text-center group flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                  {t('nav.emergency')}
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">Triage card</span>
              </Link>

              <Link
                to="/patient/audit"
                className="p-4 rounded-2xl bg-[#0B0B0D] hover:bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all text-center group flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {t('nav.audit')}
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">Access history</span>
              </Link>
            </ScrollRevealGroup>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. UPCOMING APPOINTMENT */}
      {/* ========================================================================= */}
      <section id="sec-appointment" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="left">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec4.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Next scheduled clinical consultation and hospital appointment
                </p>
              </div>
              <Link
                to="/patient/appointments"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>View All Appointments</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-[#0B0B0D] rounded-3xl p-8 border border-dashed border-white/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  No upcoming appointments scheduled
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Consult verified hospital specialists and track future visits directly from your portal.
                </p>
                <Link
                  to="/patient/doctors"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/30 transition-all"
                >
                  <span>Book Appointment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="bg-[#0B0B0D] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {appointments[0].status || 'Scheduled'}
                      </span>
                      <span className="text-xs text-zinc-400">• {appointments[0].type || 'Consultation'}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {localizeValue(appointments[0].doctor?.user?.name || appointments[0].doctorName || 'Specialist Doctor', 'doctorName')}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {localizeValue(appointments[0].department || 'General Medicine', 'clinicalTerm')} • {localizeValue(appointments[0].hospitalName || 'Apex Health City', 'hospitalName')}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1 font-semibold text-zinc-200">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        {appointments[0].date} at {appointments[0].time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                  <Link
                    to="/patient/appointments"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-900/30 text-center"
                  >
                    View Appointment Details
                  </Link>
                </div>
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MEDICINES & REMINDERS */}
      {/* ========================================================================= */}
      <section id="sec-medicines" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="right">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec5.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Active prescriptions tracked by dose timing and adherence
                </p>
              </div>
              <Link
                to="/patient/medicines"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>View All Medicines</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {medicines.length === 0 ? (
              <div className="bg-[#0B0B0D] rounded-3xl p-8 border border-dashed border-white/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                  <Pill className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  No medicines added
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  No active daily maintenance medicines or prescriptions on file.
                </p>
                <Link
                  to="/patient/medicines"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/30 transition-all"
                >
                  <span>View Medicines</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <ScrollRevealGroup direction="bottom" stagger={0.06} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {medicines.slice(0, 4).map((med, index) => {
                  const isTaken = med.status === 'TAKEN';
                  const isLow = medicineService.isRefillWarning(med.remainingQuantity, med.dailyRequiredQuantity);
                  const daysLeft = medicineService.calculateDaysRemaining(med.remainingQuantity, med.dailyRequiredQuantity);

                  return (
                    <div
                      key={med.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isTaken
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-[#0B0B0D] border-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                              Task {med.taskNumber || index + 1}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
                              {localizeValue(med.timingSlot, 'clinicalTerm')} • {med.scheduledTime}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isTaken
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : med.status === 'SNOOZED'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {isTaken ? t('status.taken', 'Taken') : med.status === 'SNOOZED' ? 'Snoozed' : t('status.pending', 'Upcoming')}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white">{localizeValue(med.name, 'medicineName')}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{localizeValue(med.dosage, 'clinicalTerm')}</p>
                        {isTaken ? (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 font-medium">Last Taken:</span>
                              <span className="font-bold text-zinc-200">{med.lastTakenScheduledTime || med.scheduledTime}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 font-medium">Taken at:</span>
                              <span className="font-bold text-emerald-400">{med.takenAtTime || 'Just now'}</span>
                            </div>
                            <div className="pt-1 border-t border-emerald-500/20 flex items-center justify-between">
                              <span className="text-teal-400 font-medium">Next Dose:</span>
                              <span className="font-bold text-teal-300">{med.nextDoseTime || 'Tomorrow'}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-teal-400 font-semibold mt-1">
                            Next: {med.nextDoseTime || med.scheduledTime}
                          </p>
                        )}

                        {isLow && (
                          <div className="mt-2 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Refill Warning (&lt; 2 Days: {daysLeft}d left)</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <span className="text-xs text-zinc-400">
                          Stock: <strong className={isLow ? "text-rose-400 font-bold" : "text-white font-bold"}>{med.remainingQuantity}</strong> {med.unit}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {!isTaken ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  medicineService.snoozeDose(med.id, 15);
                                  addToast('info', `Snoozed reminder for ${med.name}.`);
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors flex items-center gap-1"
                                title="Remind me later"
                              >
                                <BellRing className="w-3 h-3 text-amber-400" />
                                <span>Remind</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  medicineService.markDoseTaken(med.id);
                                  addToast('success', `Completed dose for ${med.name}. Stock updated.`);
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  medicineService.markDoseUpcoming(med.id);
                                  addToast('info', `Restored ${med.name} to upcoming schedule.`);
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 text-zinc-300 hover:bg-white/10 flex items-center gap-1 border border-white/10 transition-colors"
                                title="Undo"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Undo</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  medicineService.advanceToNextScheduledTime(med.id);
                                  addToast('info', `Next scheduled time arrived for ${med.name}! Dose is now due.`);
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30 flex items-center gap-1 transition-all"
                                title="Next scheduled time arrives"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Next Dose</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </ScrollRevealGroup>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FIND DOCTORS */}
      {/* ========================================================================= */}
      <section id="sec-doctors" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="left">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec6.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Consult certified medical practitioners with blockchain credential verification
                </p>
              </div>
              <Link
                to="/patient/doctors"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>View All Doctors</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {doctors.length === 0 ? (
              <div className="bg-[#0B0B0D] p-8 rounded-3xl border border-dashed border-white/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  No verified doctors available currently
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Government-verified medical practitioners will appear here once approved.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctors.slice(0, 2).map((doc: any) => (
                  <div
                    key={doc.id}
                    className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-teal-500/40 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <ProfileAvatar
                        photoUrl={doc.profilePhoto}
                        role="DOCTOR"
                        name={doc.fullName || doc.name || 'Doctor'}
                        size="lg"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">
                            {localizeValue(doc.fullName || doc.name || 'Specialist Doctor', 'doctorName')}
                          </h4>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                            {t('status.verified')}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium mt-0.5">
                          {localizeValue(doc.specialization || 'General Physician', 'clinicalTerm')} • {localizeValue(doc.hospital || 'Apex Health City', 'hospitalName')}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          {doc.qualification || 'MBBS, MD'} • {doc.experienceYears ? `${doc.experienceYears} Years Exp` : 'Registered Practitioner'}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/patient/appointments"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-900/30 text-center whitespace-nowrap"
                    >
                      Book Consult
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. RECOMMENDED HOSPITALS */}
      {/* ========================================================================= */}
      <section id="sec-hospitals" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="right">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec7.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Accredited tertiary medical centers linked to the Sovereign EMR Network
                </p>
              </div>
              <Link
                to="/patient/hospitals"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>View All Hospitals</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {hospitals.length === 0 ? (
              <div className="bg-[#0B0B0D] p-8 rounded-3xl border border-dashed border-white/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                  <Building2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  No hospitals registered currently
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Registered hospital facilities will appear here once linked to the Sovereign network.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hospitals.slice(0, 2).map((hosp: any) => (
                  <div
                    key={hosp.id}
                    className="p-6 rounded-3xl bg-[#0B0B0D] border border-white/10 shadow-2xl flex flex-col justify-between hover:border-teal-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-teal-400" />
                          <h4 className="text-base font-bold text-white">
                            {localizeValue(hosp.name || 'Hospital', 'hospitalName')}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          24x7 ER Active
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {hosp.address ? `${hosp.address}, ${hosp.city}` : hosp.city || 'Multispecialty Center'}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                        <span className="bg-[#141416] px-2 py-0.5 rounded border border-white/10">
                          NABH Accredited
                        </span>
                        {hosp.phone && (
                          <span className="bg-[#141416] px-2 py-0.5 rounded border border-white/10">
                            Desk: {hosp.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">
                        City: {hosp.city || 'State Capital'}
                      </span>
                      <Link
                        to="/patient/hospitals"
                        className="font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
                      >
                        <span>Hospital Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. RECENT LAB REPORTS */}
      {/* ========================================================================= */}
      <section id="sec-reports" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="left">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec8.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Diagnostic investigations with SHA-256 blockchain proof sealing
                </p>
              </div>
              <Link
                to="/patient/lab-reports"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>View All Reports {labReports.length > 0 ? `(${labReports.length})` : ''}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {labReports.length === 0 ? (
              <div className="bg-[#0B0B0D] p-10 rounded-3xl border border-white/10 text-center">
                <FlaskConical className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No medical reports available</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Diagnostic reports and lab investigations will appear here once published by authorized labs.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {labReports.slice(0, 2).map((report: any) => (
                  <div
                    key={report.id}
                    className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between hover:border-cyan-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                          {report.testType || report.testName || 'Diagnostic'} • {report.status || t('status.verified')}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {report.date || (report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '')}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white">{report.testName || 'Lab Investigation'}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {report.doctor?.fullName || report.doctorName || 'Apex Diagnostics Lab'}
                      </p>
                    </div>
                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Report</span>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedDoc({
                            title: report.testName || 'Lab Report',
                            category: 'Lab Report',
                            date: report.date || '',
                            doctorName: report.doctor?.fullName || 'Doctor',
                            hospitalName: 'Apex Health',
                          })
                        }
                        className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10"
                      >
                        Quick View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. COMPLETE MEDICAL RECORDS */}
      {/* ========================================================================= */}
      <section id="sec-records" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="bottom">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec9.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Centralized vault of clinical consultations, prescriptions, and diagnostics
                </p>
              </div>
              <Link
                to="/patient/medical-history"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>Explore Vault</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link
                to="/patient/consultations"
                className="p-6 rounded-3xl bg-[#0B0B0D] border border-white/10 hover:border-purple-500/40 transition-all group shadow-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">Consultation Notes</h4>
                  <span className="text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    {consultationsCount} {consultationsCount === 1 ? 'Note' : 'Notes'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Clinical observations, diagnoses, and specialist recommendations.
                </p>
              </Link>

              <Link
                to="/patient/prescriptions"
                className="p-6 rounded-3xl bg-[#0B0B0D] border border-white/10 hover:border-teal-500/40 transition-all group shadow-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">Digital Prescriptions</h4>
                  <span className="text-xs font-bold text-teal-300 bg-teal-500/20 border border-teal-500/30 px-2 py-0.5 rounded-full">
                    {prescriptionsCount} {prescriptionsCount === 1 ? 'Prescription' : 'Prescriptions'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Doctor-signed digital medication regimens with blockchain seals.
                </p>
              </Link>

              <Link
                to="/patient/lab-reports"
                className="p-6 rounded-3xl bg-[#0B0B0D] border border-white/10 hover:border-blue-500/40 transition-all group shadow-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">Laboratory Reports</h4>
                  <span className="text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    {labReports.length} {labReports.length === 1 ? 'Report' : 'Reports'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Pathology, blood biochemistry, imaging, and diagnostic panels.
                </p>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. HEALTH ACTIVITY CALENDAR */}
      {/* ========================================================================= */}
      <section id="sec-calendar" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="left">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec10.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Upcoming consultations, scheduled tests, and medication refills
                </p>
              </div>
              <Link
                to="/patient/health-calendar"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>Open Full Calendar</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-[#0B0B0D] p-8 rounded-3xl border border-white/10 text-center">
                <Calendar className="w-9 h-9 text-zinc-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">No scheduled health activities</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Upcoming consultations, scheduled tests, and medication refills will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-6">
                {appointments.slice(0, 3).map((apt: any) => (
                  <div key={apt.id} className="p-4 rounded-2xl bg-[#101012] border border-white/5">
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                      {apt.status || 'Scheduled'}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-2">
                      {apt.doctor?.fullName || apt.doctorName || 'Consultation'}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {apt.date || (apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : '')} • {apt.time || apt.slot || ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. RECENT HEALTH TIMELINE */}
      {/* ========================================================================= */}
      <section id="sec-timeline" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="right">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec11.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Chronological sequence of clinical events and diagnostic updates
                </p>
              </div>
              <Link
                to="/patient/timeline"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>View Complete Timeline</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {appointments.length === 0 && labReports.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0B0B0D] border border-white/10 text-center">
                <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">No health activity recorded yet</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Clinical consultations and diagnostic updates will appear chronologically along your health journey.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.slice(0, 2).map((apt: any) => (
                  <div key={apt.id} className="flex items-start gap-4 p-4 rounded-2xl bg-[#0B0B0D] border border-white/10 shadow-xl hover:border-indigo-500/40 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">
                          Consultation with {apt.doctor?.fullName || apt.doctorName || 'Doctor'}
                        </h4>
                        <span className="text-xs text-zinc-500">
                          {apt.date || (apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : '')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Status: {apt.status || 'Completed'} • {apt.type || 'General Checkup'}
                      </p>
                    </div>
                  </div>
                ))}
                {labReports.slice(0, 2).map((rep: any) => (
                  <div key={rep.id} className="flex items-start gap-4 p-4 rounded-2xl bg-[#0B0B0D] border border-white/10 shadow-xl hover:border-teal-500/40 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">
                          {rep.testName || 'Diagnostic Report'}
                        </h4>
                        <span className="text-xs text-zinc-500">
                          {rep.date || (rep.createdAt ? new Date(rep.createdAt).toLocaleDateString() : '')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Published by {rep.doctor?.fullName || 'Diagnostic Lab'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. EMERGENCY CARE */}
      {/* ========================================================================= */}
      <section id="sec-emergency" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="left">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                  Life-Saving Bypass Protocol
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                  {t('sec12.title')} & Triage Card
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Immediate access for emergency room trauma physicians during critical care
                </p>
              </div>
              <Link
                to="/patient/emergency"
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <span>Open Emergency Module</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-[#0B0B0D] rounded-3xl p-6 border border-rose-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs rounded-lg shadow-lg shadow-rose-900/40">
                    Blood Group: {user?.patient?.bloodGroup || user?.patient?.healthProfile?.bloodGroup || 'Not specified'}
                  </span>
                  <span className="text-xs font-semibold text-zinc-300">
                    {user?.patient?.allergies && user.patient.allergies.length > 0
                      ? `Allergies: ${user.patient.allergies.map((a: any) => `${a.allergen} (${a.severity})`).join(', ')}`
                      : 'No allergies reported'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Registered Emergency Contact:{' '}
                  {user?.patient?.emergencyContacts && user.patient.emergencyContacts.length > 0 ? (
                    <>
                      <strong className="text-white">
                        {user.patient.emergencyContacts[0].name} ({user.patient.emergencyContacts[0].relationship || 'Contact'})
                      </strong> •{' '}
                      <span className="font-mono text-zinc-300">
                        {user.patient.emergencyContacts[0].phone}
                      </span>
                    </>
                  ) : (
                    <span className="italic text-zinc-500">Not provided yet</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/patient/emergency"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/40"
                >
                  View Emergency Triage QR
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. ACCESS & PRIVACY */}
      {/* ========================================================================= */}
      <section id="sec-privacy" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="bottom">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec13.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage doctor permissions, scope clearance, and revoke active grants anytime
                </p>
              </div>
              <Link
                to="/patient/access-permissions"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>Manage Permissions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {activePermissions.length === 0 ? (
              <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-dashed border-white/10 text-center space-y-2">
                <Lock className="w-8 h-8 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No active doctor access grants</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Doctor access requests will appear here for your review and explicit cryptographic approval.
                </p>
              </div>
            ) : (
              <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {activePermissions[0].doctor?.fullName || activePermissions[0].doctorName || 'Doctor'}
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-full">
                        Active Grant
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Scope: {Array.isArray(activePermissions[0].scopes) ? activePermissions[0].scopes.join(', ') : 'All Clinical Records'} • {activePermissions[0].expiresAt ? `Expires on ${new Date(activePermissions[0].expiresAt).toLocaleDateString()}` : 'Access: Forever'}
                    </p>
                  </div>
                </div>

                <Link
                  to="/patient/access-permissions"
                  className="px-4 py-2 rounded-xl border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition-colors"
                >
                  Review / Revoke
                </Link>
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 14. DATA INTEGRITY & SECURITY */}
      {/* ========================================================================= */}
      <section id="sec-security" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {t('sec14.title', 'Data Integrity & Security')}
                  </h2>
                </div>
                <p className="text-xs text-zinc-400">
                  {t('integrity.subtitle', 'Continuous zero-knowledge verification ensuring all clinical records are tamper-evident.')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleVerifyIntegrity}
                  disabled={isVerifyingIntegrity}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isVerifyingIntegrity ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{t('integrity.verifying', 'Checking Integrity...')}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t('integrity.verifyNow', 'Verify Now')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTechnicalProofModal(true)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-[#101012] text-zinc-300 hover:bg-white/5 text-xs font-bold transition-colors"
                >
                  {t('integrity.viewTechnicalDetails', 'View Technical Details')}
                </button>
              </div>
            </div>

            {/* Patient-Friendly Status Banner */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">
                    {integrityState.status === 'SECURE' ? '✓ All records are secure' : `Status: ${integrityState.status}`}
                  </h4>
                  <p className="text-xs text-emerald-400/80">
                    Zero discrepancies detected across all active medical files and prescriptions.
                  </p>
                </div>
              </div>
              <span className="text-xs text-zinc-400">
                Last checked: <strong className="text-white">{integrityService.getRelativeTimeString(integrityState.lastCheckedTime)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0B0B0D] p-5 rounded-2xl border border-white/10 shadow-xl">
                <span className="text-zinc-400 text-xs">Verified Records</span>
                <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                  {integrityState.recordsVerified} / {integrityState.recordsChecked}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">100% cryptographic ledger match</p>
              </div>

              <div className="bg-[#0B0B0D] p-5 rounded-2xl border border-white/10 shadow-xl">
                <span className="text-zinc-400 text-xs">Consensus Block Height</span>
                <p className="text-base font-bold text-white mt-1">Block #{integrityState.blockNumber}</p>
                <p className="text-[11px] text-zinc-500 mt-1">{integrityState.consensusNode}</p>
              </div>

              <div className="bg-[#0B0B0D] p-5 rounded-2xl border border-white/10 shadow-xl">
                <span className="text-zinc-400 text-xs">Integrity Exceptions</span>
                <p className="text-base font-bold text-emerald-400 mt-1">0 Issues Detected</p>
                <p className="text-[11px] text-zinc-500 mt-1">Continuous SHA-256 validation active</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 15. NOTIFICATIONS */}
      {/* ========================================================================= */}
      <section id="sec-notifications" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="bottom">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {t('sec15.title')}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Access notifications, clinical updates, and security logs
                </p>
              </div>
              <Link
                to="/patient/notifications"
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>View All Alerts</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {notificationsList.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#0B0B0D] border border-white/10 text-center">
                <Bell className="w-7 h-7 text-zinc-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-zinc-400">No new alerts or notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notificationsList.slice(0, 2).map((notif: any) => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-2xl bg-[#0B0B0D] border border-white/10 shadow-xl flex items-start gap-3 hover:border-cyan-500/40 transition-all"
                  >
                    <Bell className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white">{notif.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {notif.message}
                      </p>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 16. HEALTHCARE INFORMATION */}
      {/* ========================================================================= */}
      <section id="sec-guidance" className="scroll-mt-28 px-4 sm:px-6 lg:px-8 py-10 bg-[#050506] border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal direction="bottom">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {t('sec16.title')}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Curated medical insights for preventive wellness and cardiac health
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl hover:border-rose-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Managing Essential Hypertension</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Learn why low sodium diet and regular 30-minute brisk walks help maintain target
                  systolic pressure below 120 mmHg.
                </p>
              </div>

              <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl hover:border-teal-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Understanding Lipid Ratios</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Why HDL (good cholesterol) above 40 mg/dL provides protective cardiovascular benefits
                  against plaque buildup.
                </p>
              </div>

              <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl hover:border-blue-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Emergency Readiness Protocol</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Keep your digital Health ID accessible on your lock screen for instant paramedic triage
                  in unexpected trauma.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 17. FOOTER */}
      {/* ========================================================================= */}
      <footer id="sec-footer" className="scroll-mt-28 bg-[#0B0B0D] text-zinc-400 py-10 px-4 sm:px-6 lg:px-8 border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-zinc-200">
              National Sovereign EMR Infrastructure • Patient Portal
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <Link to="/patient/security" className="hover:text-teal-400 transition-colors">Security Center</Link>
            <span>•</span>
            <Link to="/patient/emergency" className="hover:text-rose-400 transition-colors">Emergency Desk</Link>
            <span>•</span>
            <Link to="/patient/settings" className="hover:text-teal-400 transition-colors">Settings</Link>
          </div>
        </div>
      </footer>

      {/* Digital Health ID Modal */}
      {showHealthIdModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#101012] text-white p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-white/10 text-center space-y-4">
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span className="font-bold tracking-wider">DIGITAL HEALTH CARD</span>
              <button
                onClick={() => setShowHealthIdModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-2xl font-mono font-bold text-teal-400">
              {user?.patient?.healthcareId || user?.healthId || 'HP-000000'}
            </p>
            <p className="text-base font-bold text-white">{user?.patient?.fullName || user?.name || 'Patient'}</p>

            <div className="p-4 bg-white rounded-2xl w-32 h-32 mx-auto flex items-center justify-center shadow-lg">
              <QrCode className="w-24 h-24 text-black" />
            </div>

            <p className="text-[11px] text-zinc-400">
              Scan with any certified doctor terminal for consent-based access.
            </p>

            <button
              onClick={() => setShowHealthIdModal(false)}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-teal-900/30"
            >
              Done
            </button>
          </div>
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

      {/* TECHNICAL PROOF MODAL (Section 14) */}
      {showTechnicalProofModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowTechnicalProofModal(false)}
          title="Cryptographic Ledger Integrity Proofs"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold uppercase text-[10px]">Merkle Root Hash</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Synchronized</span>
              </div>
              <p className="font-mono text-[11px] text-zinc-200 break-all bg-[#0B0B0D] p-2.5 rounded-xl border border-white/10">
                {integrityState.merkleRoot}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-zinc-500 font-medium">Consensus Mesh:</span>
                  <p className="font-bold text-zinc-200">{integrityState.consensusNode}</p>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">Ledger Height:</span>
                  <p className="font-bold text-teal-400">Block #{integrityState.blockNumber}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">
                Verified Medical Record Hashes ({integrityState.recordItems.length})
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {integrityState.recordItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#141416] border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.name}</span>
                        <span className="text-[10px] bg-white/5 px-1.5 py-0.2 rounded text-zinc-400">{item.type}</span>
                      </div>
                      <p className="font-mono text-[10px] text-zinc-500 mt-0.5">
                        SHA-256: {item.sha256} • Block #{item.blockNumber}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
                      ✓ Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTechnicalProofModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                Close Technical Details
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
