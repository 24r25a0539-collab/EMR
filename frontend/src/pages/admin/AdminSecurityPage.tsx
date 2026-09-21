import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  Building2,
  User,
  Stethoscope,
  Eye,
  X,
  Lock,
  ArrowRight,
  Filter,
  Check,
  FileText,
  Activity,
} from 'lucide-react';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export type SecurityEventType = 'UNAUTHORIZED_ACCESS' | 'AUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY';
export type SecurityResultType = 'DENIED' | 'ALLOWED' | 'SUSPICIOUS';

export interface SecurityEventDoctor {
  name: string;
  photo?: string;
  registrationId: string;
  qualification: string;
  hospital: string;
  verified: boolean;
}

export interface SecurityEventPatient {
  name: string;
  photo?: string;
  healthId: string;
  verified: boolean;
}

export interface SecurityEventItem {
  id: string;
  eventType: SecurityEventType;
  title: string;
  resultType: SecurityResultType;
  resultBadge: string;
  doctor: SecurityEventDoctor;
  patient: SecurityEventPatient;
  attemptedAccess: string;
  requestedScope: string;
  date: string;
  time: string;
  timestamp: string;
  reason: string;
  systemActions: string[];
  systemResponse: string;
  auditNote: string;
}

const MOCK_SECURITY_EVENTS: SecurityEventItem[] = [
  {
    id: 'EVT-2026-0891',
    eventType: 'UNAUTHORIZED_ACCESS',
    title: 'Unauthorized Access Attempt',
    resultType: 'DENIED',
    resultBadge: '🔴 Access Denied',
    doctor: {
      name: 'Dr. Ananya Sharma',
      photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      registrationId: 'DOC-20481',
      qualification: 'MBBS, MD - General Medicine',
      hospital: 'Apex Health City',
      verified: true,
    },
    patient: {
      name: 'Rahul Sharma',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100245',
      verified: true,
    },
    attemptedAccess: 'Medicines',
    requestedScope: 'Prescriptions & Active Medications',
    date: '14 Sep 2026',
    time: '7:30 PM',
    timestamp: '14 Sep 2026 • 7:30 PM',
    reason: "Doctor does not have permission to view the patient's medicines.",
    systemActions: ['Access blocked', 'Security event recorded'],
    systemResponse: 'Access was blocked because the doctor did not have the required permission.',
    auditNote: 'Security event recorded.',
  },
  {
    id: 'EVT-2026-0890',
    eventType: 'AUTHORIZED_ACCESS',
    title: 'Authorized Access',
    resultType: 'ALLOWED',
    resultBadge: '🟢 Access Allowed',
    doctor: {
      name: 'Dr. Rajesh Verma',
      photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      registrationId: 'DOC-20482',
      qualification: 'MBBS, MS, MCh - Neurology',
      hospital: 'Apex Neuro Center',
      verified: true,
    },
    patient: {
      name: 'Rahul Sharma',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100245',
      verified: true,
    },
    attemptedAccess: 'Medical History',
    requestedScope: 'Consultation & Past Medical History',
    date: '14 Sep 2026',
    time: '6:15 PM',
    timestamp: '14 Sep 2026 • 6:15 PM',
    reason: 'Patient granted active consent for neurological consultation.',
    systemActions: ['Access granted securely', 'Security event recorded'],
    systemResponse: 'Access was permitted under valid active patient consent.',
    auditNote: 'Security event recorded.',
  },
  {
    id: 'EVT-2026-0889',
    eventType: 'SUSPICIOUS_ACTIVITY',
    title: 'Suspicious Activity',
    resultType: 'SUSPICIOUS',
    resultBadge: '🟠 Suspicious Activity',
    doctor: {
      name: 'Dr. Vikram Rao',
      photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
      registrationId: 'DOC-20911',
      qualification: 'MBBS, DNB - Cardiology',
      hospital: 'City Care Hospital',
      verified: true,
    },
    patient: {
      name: 'Suresh Kumar',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100450',
      verified: true,
    },
    attemptedAccess: 'Multiple Records',
    requestedScope: 'Unassigned Patient Records',
    date: '14 Sep 2026',
    time: '5:42 PM',
    timestamp: '14 Sep 2026 • 5:42 PM',
    reason: 'Multiple unauthorized access attempts in rapid succession.',
    systemActions: ['Account/session flagged', 'Patient access protected', 'Security event recorded'],
    systemResponse: 'The account session was temporarily flagged for administrative review due to unusual repeated queries.',
    auditNote: 'Security event recorded.',
  },
  {
    id: 'EVT-2026-0888',
    eventType: 'AUTHORIZED_ACCESS',
    title: 'Authorized Access',
    resultType: 'ALLOWED',
    resultBadge: '🟢 Access Allowed',
    doctor: {
      name: 'Dr. Ananya Sharma',
      photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      registrationId: 'DOC-20481',
      qualification: 'MBBS, MD - General Medicine',
      hospital: 'Apex Health City',
      verified: true,
    },
    patient: {
      name: 'Ahmed Khan',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100512',
      verified: true,
    },
    attemptedAccess: 'Vitals & Prescriptions',
    requestedScope: 'Routine Health Checkup Data',
    date: '14 Sep 2026',
    time: '4:10 PM',
    timestamp: '14 Sep 2026 • 4:10 PM',
    reason: 'Patient confirmed consultation consent OTP.',
    systemActions: ['Access granted securely', 'Security event recorded'],
    systemResponse: 'Access granted under verified one-time patient authorization.',
    auditNote: 'Security event recorded.',
  },
  {
    id: 'EVT-2026-0887',
    eventType: 'UNAUTHORIZED_ACCESS',
    title: 'Unauthorized Access Attempt',
    resultType: 'DENIED',
    resultBadge: '🔴 Access Denied',
    doctor: {
      name: 'Dr. Sneha Patil',
      photo: 'https://images.unsplash.com/photo-1594824813589-20f781190226?auto=format&fit=crop&q=80&w=400',
      registrationId: 'DOC-20512',
      qualification: 'MBBS, MS - Orthopaedics',
      hospital: 'Metro General Hospital',
      verified: true,
    },
    patient: {
      name: 'Priya Patel',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100318',
      verified: true,
    },
    attemptedAccess: 'Diagnostic Lab Reports',
    requestedScope: 'Radiology & Blood Panels',
    date: '14 Sep 2026',
    time: '2:55 PM',
    timestamp: '14 Sep 2026 • 2:55 PM',
    reason: 'Doctor does not have active consent to access diagnostic records.',
    systemActions: ['Access blocked', 'Security event recorded'],
    systemResponse: 'Access was blocked because no valid consent grant was found for this patient record.',
    auditNote: 'Security event recorded.',
  },
  {
    id: 'EVT-2026-0886',
    eventType: 'AUTHORIZED_ACCESS',
    title: 'Authorized Access',
    resultType: 'ALLOWED',
    resultBadge: '🟢 Access Allowed',
    doctor: {
      name: 'Dr. Priya Deshmukh',
      photo: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400',
      registrationId: 'DOC-20834',
      qualification: 'MBBS, MD - Dermatology',
      hospital: 'Apex Skin & Health Center',
      verified: true,
    },
    patient: {
      name: 'Suresh Kumar',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100450',
      verified: true,
    },
    attemptedAccess: 'Clinical Notes',
    requestedScope: 'Dermatology Follow-up Notes',
    date: '14 Sep 2026',
    time: '11:20 AM',
    timestamp: '14 Sep 2026 • 11:20 AM',
    reason: 'Patient consent valid until 20 Sep 2026.',
    systemActions: ['Access granted securely', 'Security event recorded'],
    systemResponse: 'Access was granted within approved scope and validity period.',
    auditNote: 'Security event recorded.',
  },
];

export const AdminSecurityPage: React.FC = () => {
  const [filterType, setFilterType] = useState<'ALL' | 'ALLOWED' | 'BLOCKED' | 'SUSPICIOUS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEventItem | null>(null);

  // Filter events based on active filter and search text
  const filteredEvents = useMemo(() => {
    return MOCK_SECURITY_EVENTS.filter((evt) => {
      // Filter tab match
      if (filterType === 'ALLOWED' && evt.resultType !== 'ALLOWED') return false;
      if (filterType === 'BLOCKED' && evt.resultType !== 'DENIED') return false;
      if (filterType === 'SUSPICIOUS' && evt.resultType !== 'SUSPICIOUS') return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const docName = evt.doctor.name.toLowerCase();
        const docHosp = evt.doctor.hospital.toLowerCase();
        const patName = evt.patient.name.toLowerCase();
        const patId = evt.patient.healthId.toLowerCase();
        const docId = evt.doctor.registrationId.toLowerCase();
        const resource = evt.attemptedAccess.toLowerCase();

        return (
          docName.includes(q) ||
          docHosp.includes(q) ||
          patName.includes(q) ||
          patId.includes(q) ||
          docId.includes(q) ||
          resource.includes(q)
        );
      }

      return true;
    });
  }, [filterType, searchQuery]);

  // Status badge styling helper
  const renderResultBadge = (resultType: SecurityResultType, text: string) => {
    switch (resultType) {
      case 'ALLOWED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>✓ Access Allowed</span>
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>🔴 Access Denied</span>
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>🟠 Suspicious Activity</span>
          </span>
        );
    }
  };

  const renderEventHeaderBadge = (eventType: SecurityEventType) => {
    switch (eventType) {
      case 'UNAUTHORIZED_ACCESS':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>⚠️ Unauthorized Access Attempt</span>
          </div>
        );
      case 'AUTHORIZED_ACCESS':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>✓ Authorized Access</span>
          </div>
        );
      case 'SUSPICIOUS_ACTIVITY':
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>⚠️ Suspicious Activity</span>
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 antialiased text-white">
      {/* ==================================================
          SECTION 4: SECURITY SUMMARY
          ================================================== */}
      <ScrollReveal direction="bottom">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Security Overview
            </h1>
            <p className="text-sm text-white/60 mt-1">
              Real-time security monitor protecting doctor-patient electronic health records.
            </p>
          </div>

          <ScrollRevealGroup direction="bottom" delay={0.05} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: System Status */}
            <div className="p-5 rounded-[24px] bg-[#0B0B0D] border border-emerald-500/20 shadow-lg">
              <div className="flex items-center justify-between text-white/60 text-xs font-semibold mb-2">
                <span>System Status</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-emerald-400">
                  🟢 Secure
                </span>
              </div>
              <span className="text-[11px] text-white/40 mt-1 block">
                Patient access protected
              </span>
            </div>

            {/* Card 2: Access Attempts */}
            <div className="p-5 rounded-[24px] bg-[#0B0B0D] border border-amber-500/20 shadow-lg">
              <div className="flex items-center justify-between text-white/60 text-xs font-semibold mb-2">
                <span>Access Attempts</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-amber-400">
                  ⚠️ 3
                </span>
              </div>
              <span className="text-[11px] text-white/40 mt-1 block">
                Evaluated in past 24 hours
              </span>
            </div>

            {/* Card 3: Blocked */}
            <div className="p-5 rounded-[24px] bg-[#0B0B0D] border border-rose-500/20 shadow-lg">
              <div className="flex items-center justify-between text-white/60 text-xs font-semibold mb-2">
                <span>Blocked</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-rose-400">
                  🔴 1
                </span>
              </div>
              <span className="text-[11px] text-white/40 mt-1 block">
                Unauthorized requests denied
              </span>
            </div>

            {/* Card 4: Authorized Accesses */}
            <div className="p-5 rounded-[24px] bg-[#0B0B0D] border border-blue-500/20 shadow-lg">
              <div className="flex items-center justify-between text-white/60 text-xs font-semibold mb-2">
                <span>Authorized Accesses</span>
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-blue-400">
                  ✓ 12
                </span>
              </div>
              <span className="text-[11px] text-white/40 mt-1 block">
                Verified patient consent grants
              </span>
            </div>
          </ScrollRevealGroup>
        </div>
      </ScrollReveal>

      {/* ==================================================
          SECTION 5: FILTERS & SEARCH
          ================================================== */}
      <ScrollReveal direction="bottom" delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-[#0B0B0D] p-4 rounded-[24px] border border-white/10 shadow-lg">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#141416] rounded-xl border border-white/5 overflow-x-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterType === 'ALL'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('ALLOWED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'ALLOWED'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-xs'
                  : 'text-white/60 hover:text-emerald-400'
              }`}
            >
              <span>Allowed</span>
            </button>
            <button
              onClick={() => setFilterType('BLOCKED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'BLOCKED'
                  ? 'bg-rose-500/20 text-rose-300 shadow-xs'
                  : 'text-white/60 hover:text-rose-400'
              }`}
            >
              <span>Blocked</span>
            </button>
            <button
              onClick={() => setFilterType('SUSPICIOUS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'SUSPICIOUS'
                  ? 'bg-amber-500/20 text-amber-300 shadow-xs'
                  : 'text-white/60 hover:text-amber-400'
              }`}
            >
              <span>Suspicious</span>
            </button>
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search doctor or patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-white/10 bg-[#141416] text-xs text-white placeholder:text-white/40 focus:border-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* ==================================================
          SECTION 1 & 3: SECURITY EVENT CARDS LIST
          ================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider">
            Security Events ({filteredEvents.length})
          </h2>
          <span className="text-xs text-white/40">
            Real-time access monitor
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-[#0B0B0D] rounded-[24px] border border-white/10 shadow-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">No Security Events Found</p>
            <p className="text-xs text-white/50">
              No access attempts match the selected filter or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#0B0B0D] rounded-[24px] border border-white/10 p-5 sm:p-6 shadow-lg hover:border-white/20 transition-all space-y-5"
              >
                {/* Event Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    {renderEventHeaderBadge(evt.eventType)}
                    <span className="text-xs font-mono text-white/40 hidden sm:inline">
                      {evt.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {renderResultBadge(evt.resultType, evt.resultBadge)}
                  </div>
                </div>

                {/* Doctor + Patient Visibility */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Doctor Box */}
                  <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                        <span>Doctor</span>
                      </span>
                      {evt.doctor.verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Doctor Verified</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3.5 pt-0.5">
                      <ProfileAvatar
                        photoUrl={evt.doctor.photo}
                        name={evt.doctor.name}
                        role="DOCTOR"
                        size="md"
                        className="rounded-xl ring-1 ring-white/10 shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white truncate">
                          {evt.doctor.name}
                        </h3>
                        <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                          <span>Medical Registration ID:</span>{' '}
                          <span className="font-mono text-teal-300 font-bold">
                            {evt.doctor.registrationId}
                          </span>
                        </p>
                        <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5 truncate">
                          <Building2 className="w-3 h-3 text-white/40 flex-shrink-0" />
                          <span className="truncate">{evt.doctor.hospital}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Patient Box */}
                  <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span>Patient</span>
                      </span>
                      {evt.patient.verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Patient Verified</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3.5 pt-0.5">
                      <ProfileAvatar
                        photoUrl={evt.patient.photo}
                        name={evt.patient.name}
                        role="PATIENT"
                        size="md"
                        className="rounded-xl ring-1 ring-white/10 shadow-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white truncate">
                          {evt.patient.name}
                        </h3>
                        <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                          <span>Health ID:</span>{' '}
                          <span className="font-mono text-cyan-400 font-bold">
                            {evt.patient.healthId}
                          </span>
                        </p>
                        <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                          ✓ Patient access protected
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attempted Access, Result, Reason, Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#101012] border border-white/5">
                    <span className="text-[10px] font-semibold text-white/40 block uppercase">
                      Attempted Access
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block">
                      {evt.attemptedAccess}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#101012] border border-white/5">
                    <span className="text-[10px] font-semibold text-white/40 block uppercase">
                      Result
                    </span>
                    <span className="text-xs sm:text-sm font-bold mt-0.5 block">
                      {evt.resultBadge}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#101012] border border-white/5">
                    <span className="text-[10px] font-semibold text-white/40 block uppercase">
                      Time
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-white/70 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/40" />
                      <span>{evt.timestamp}</span>
                    </span>
                  </div>
                </div>

                {/* Reason & System Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#101012] border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                      Reason
                    </span>
                    <p className="text-xs text-white/80 leading-relaxed font-medium">
                      {evt.reason}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#101012] border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                      System Action
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {evt.systemActions.map((action, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{action}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-end pt-2 border-t border-white/5">
                  <button
                    onClick={() => setSelectedEvent(evt)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-md cursor-pointer border border-white/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================
          SECTION 2: VIEW DETAILS MODAL
          ================================================== */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm page-fade-in overflow-y-auto"
          onClick={() => setSelectedEvent(null)}
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                    Security Event
                  </span>
                  <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    {selectedEvent.id}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor & Patient Identity Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Doctor Details */}
              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                    <span>Doctor Details</span>
                  </span>
                  {selectedEvent.doctor.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Doctor Verified</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    photoUrl={selectedEvent.doctor.photo}
                    name={selectedEvent.doctor.name}
                    role="DOCTOR"
                    size="lg"
                    className="rounded-2xl ring-1 ring-white/10 shadow-xs"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white">
                      {selectedEvent.doctor.name}
                    </h4>
                    <p className="text-xs text-white/50">
                      {selectedEvent.doctor.qualification}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs border-t border-white/5">
                  <div className="flex justify-between">
                    <span className="text-white/50">Medical Registration ID:</span>
                    <span className="font-mono font-semibold text-teal-300">
                      {selectedEvent.doctor.registrationId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Hospital:</span>
                    <span className="font-medium text-white/80 text-right">
                      {selectedEvent.doctor.hospital}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Patient Details</span>
                  </span>
                  {selectedEvent.patient.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Patient Verified</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    photoUrl={selectedEvent.patient.photo}
                    name={selectedEvent.patient.name}
                    role="PATIENT"
                    size="lg"
                    className="rounded-2xl ring-1 ring-white/10 shadow-xs"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white">
                      {selectedEvent.patient.name}
                    </h4>
                    <p className="text-xs text-white/50">
                      Sovereign Health Identity
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs border-t border-white/5">
                  <div className="flex justify-between">
                    <span className="text-white/50">Health ID:</span>
                    <span className="font-mono font-semibold text-cyan-400">
                      {selectedEvent.patient.healthId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Verification Status:</span>
                    <span className="font-semibold text-emerald-400">Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Access Details Box */}
            <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50 block">
                Access Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-white/40 block font-semibold">What was requested</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">
                    {selectedEvent.attemptedAccess}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block font-semibold">Requested scope</span>
                  <span className="font-semibold text-white/80 text-xs mt-0.5 block">
                    {selectedEvent.requestedScope}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block font-semibold">Date & Time</span>
                  <span className="font-medium text-white/70 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                    <span>{selectedEvent.date} • {selectedEvent.time}</span>
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block font-semibold">Access status</span>
                  <span className="mt-0.5 block">{selectedEvent.resultBadge}</span>
                </div>
              </div>

              {selectedEvent.reason && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-white/40 text-xs block font-semibold mb-0.5">
                    Reason
                  </span>
                  <p className="text-xs text-white/80 bg-[#141416] p-2.5 rounded-xl border border-white/10 font-medium">
                    {selectedEvent.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Security Result & System Response */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-1.5">
                <span className="text-white/40 uppercase font-bold block text-[10px]">
                  Security Result
                </span>
                <div>{renderResultBadge(selectedEvent.resultType, selectedEvent.resultBadge)}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-1.5">
                <span className="text-white/40 uppercase font-bold block text-[10px]">
                  Audit
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{selectedEvent.auditNote}</span>
                </div>
              </div>
            </div>

            {/* Human Readable System Response */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1 text-xs">
              <span className="text-blue-300 font-bold uppercase text-[10px] block tracking-wide">
                System Response
              </span>
              <p className="text-white/80 font-medium leading-relaxed">
                "{selectedEvent.systemResponse}"
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all shadow-md cursor-pointer border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecurityPage;
