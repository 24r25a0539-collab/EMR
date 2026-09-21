import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Stethoscope,
  Building2,
  Lock,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  Server,
  ShieldCheck,
  FileCheck,
  Radio,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup, GlowCard } from '../../components/common/ScrollReveal';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('IN_PROGRESS');
  const [adminResponse, setAdminResponse] = useState<string>('');
  const [savingTicket, setSavingTicket] = useState<boolean>(false);

  useEffect(() => {
    loadHelpdeskTickets();
  }, []);

  const loadHelpdeskTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await api.getAdminHelpdeskTickets();
      if (res && res.tickets) {
        setTickets(res.tickets);
      }
    } catch (err) {
      console.error('Failed to load tickets in admin:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      setSavingTicket(true);
      const res = await api.updateAdminHelpdeskTicket(selectedTicket.id, {
        status: updateStatus,
        reviewNotes: adminResponse,
      });
      if (res && res.success) {
        addToast('success', `Ticket ${selectedTicket.ticketNumber} updated to ${updateStatus}.`);
        setSelectedTicket(null);
        setAdminResponse('');
        loadHelpdeskTickets();
      } else {
        addToast('error', res?.error || 'Failed to update ticket.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Server error updating ticket.');
    } finally {
      setSavingTicket(false);
    }
  };

  // Animated KPI numbers state (Part 28)
  const [counts, setCounts] = useState({
    patients: 0,
    doctors: 0,
    hospitals: 0,
    pending: 0,
  });

  const targets = {
    patients: 14820,
    doctors: 1428,
    hospitals: 48,
    pending: 2,
  };

  useEffect(() => {
    const duration = 800; // ms
    const steps = 30;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounts({
        patients: Math.round(targets.patients * progress),
        doctors: Math.round(targets.doctors * progress),
        hospitals: Math.round(targets.hospitals * progress),
        pending: Math.round(targets.pending * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounts(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const systemHealthModules = [
    {
      name: 'Authentication',
      desc: 'Sovereign OAuth & Biometric ID Gateway',
      status: 'Operational',
      ping: '14ms',
      icon: Lock,
      color: 'text-emerald-400',
    },
    {
      name: 'EMR Services',
      desc: 'Encrypted Record Vault & Scoped Access Engine',
      status: 'Operational',
      ping: '22ms',
      icon: Server,
      color: 'text-emerald-400',
    },
    {
      name: 'Audit Engine',
      desc: 'Continuous SHA-256 Tamper Validation',
      status: 'Synchronized',
      ping: '18ms',
      icon: Activity,
      color: 'text-emerald-400',
    },
    {
      name: 'Blockchain Proof',
      desc: 'Ethereum Smart Contract Notary (Block #10486)',
      status: 'Synchronized',
      ping: '31ms',
      icon: Cpu,
      color: 'text-teal-400',
    },
    {
      name: 'Notifications',
      desc: 'Emergency SMS & Critical Patient Alerts',
      status: '99.9% Uptime',
      ping: '45ms',
      icon: Radio,
      color: 'text-emerald-400',
    },
  ];

  const recentEvents = [
    {
      id: 'EVT-1084',
      actor: 'Telangana State Medical Council (TS-MCI)',
      action: 'Doctor License Verification Approved',
      target: 'Dr. Ananya Sharma (TS-MCI-8921)',
      time: '12m ago',
      hash: '0x3f4a...92b1',
      status: 'SUCCESS',
    },
    {
      id: 'EVT-1083',
      actor: 'Apex Health City (Jubilee Hills)',
      action: 'Emergency Trauma Bypass Session Opened',
      target: 'Emergency Record #EMS-2024-001',
      time: '45m ago',
      hash: '0x88c1...e402',
      status: 'CRITICAL',
    },
    {
      id: 'EVT-1082',
      actor: 'Ethereum Ledger Anchor Service',
      action: 'Batch SHA-256 Root Merkle Seal Committed',
      target: '14 Prescription & Diagnostic Records',
      time: '1h ago',
      hash: '0x12d9...fa77',
      status: 'SEALED',
    },
    {
      id: 'EVT-1081',
      actor: 'Apex Automated Security Daemon',
      action: 'Cryptographic Hash Discrepancy Scan',
      target: 'Zero Tampering Detected Across 94,210 Records',
      time: '2h ago',
      hash: '0x994a...01cb',
      status: 'VERIFIED',
    },
  ];

  return (
    <div className="space-y-12 pb-20 antialiased">
      {/* ========================================================================= */}
      {/* SECTION 1: ADMIN CONTROL CENTER HERO */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#080809] via-[#0B0B0D] to-[#050506] text-white border-b border-white/10 pt-8 pb-16 lg:pt-12 lg:pb-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <ScrollReveal direction="left" className="lg:col-span-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/5 text-white/80 text-xs font-mono font-semibold flex items-center gap-1.5 border border-white/10">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>National Health Infrastructure Control Plane</span>
                </span>

                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-semibold border border-amber-500/20">
                  LOCAL / DEMO ENVIRONMENT
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Apex EMR <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-indigo-400">
                    Control Center
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-white/60 max-w-xl leading-relaxed">
                  Monitor nationwide healthcare operations, practitioner verification queues, cryptographic ledger security, and citizen access governance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  to="/admin/doctors"
                  className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-950/40 flex items-center gap-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Review Doctor Queue ({targets.pending})</span>
                </Link>

                <Link
                  to="/admin/audit"
                  className="px-6 py-3.5 rounded-2xl bg-[#101012] hover:bg-white/5 text-white/80 font-semibold text-xs border border-white/10 transition-all flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>View System Audit Stream</span>
                </Link>
              </div>

              <div className="pt-2 flex items-center gap-3 text-xs text-white/40 font-mono">
                <span>Authority: <strong className="text-white font-sans">{user?.name || 'Vikram Malhotra'} (Root Superadmin)</strong></span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Full Network Consensus Active
                </span>
              </div>
            </ScrollReveal>

            {/* Right: Floating System Status Cards with Connection Lines */}
            <ScrollReveal direction="right" className="lg:col-span-6 relative flex justify-center">
              <div className="w-full max-w-lg p-6 rounded-[28px] bg-[#0B0B0D]/90 backdrop-blur-md border border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white/80">
                      Decentralized Topology Mesh
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    5/5 Nodes Healthy
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        Auth Gateway
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <p className="text-[10px] text-white/40 font-mono">0x9812...Auth Cluster</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-teal-400" />
                        Blockchain Proof
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <p className="text-[10px] text-white/40 font-mono">Block #10486 Confirmed</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        Audit Validation
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <p className="text-[10px] text-white/40 font-mono">SHA-256 Continuous</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        Emergency EMS
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <p className="text-[10px] text-white/40 font-mono">SMS Relay Ready</p>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-white/40 font-mono">
                    Interconnected through TLS 1.3 + zero-knowledge permission protocol
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* ========================================================================= */}
        {/* SECTION 2: ADMIN STATISTICS */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <ScrollReveal direction="left" className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              National Infrastructure Metrics
            </h2>
            <span className="text-xs font-mono text-white/40">Live Telemetry Counters</span>
          </ScrollReveal>

          <ScrollRevealGroup direction="bottom" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Metric 1: Registered Patients */}
            <div className="p-6 sm:p-7 rounded-[24px] bg-[#0B0B0D] border border-blue-500/20 shadow-lg space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Registered Patients
                </span>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-black font-mono text-white">
                {counts.patients.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-400 font-medium">
                +124 citizens joined this week
              </p>
            </div>

            {/* Metric 2: Verified Doctors */}
            <div className="p-6 sm:p-7 rounded-[24px] bg-[#0B0B0D] border border-teal-500/20 shadow-lg space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Verified Doctors
                </span>
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-black font-mono text-white">
                {counts.doctors.toLocaleString()}
              </p>
              <p className="text-xs text-teal-400 font-medium">
                Across 24 clinical specialties
              </p>
            </div>

            {/* Metric 3: Partner Hospitals */}
            <div className="p-6 sm:p-7 rounded-[24px] bg-[#0B0B0D] border border-indigo-500/20 shadow-lg space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Partner Hospitals
                </span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-black font-mono text-white">
                {counts.hospitals}
              </p>
              <p className="text-xs text-indigo-400 font-medium">
                All nodes synchronized on mesh
              </p>
            </div>

            {/* Metric 4: Pending Reviews */}
            <div className="p-6 sm:p-7 rounded-[24px] bg-[#0B0B0D] border border-amber-500/20 shadow-lg space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Pending Reviews
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-black font-mono text-amber-400">
                {counts.pending}
              </p>
              <Link
                to="/admin/doctors"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                Inspect Verification Queue →
              </Link>
            </div>
          </ScrollRevealGroup>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: SYSTEM HEALTH MODULES */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <ScrollReveal direction="left" className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-teal-400 font-semibold">
                Telemetry & Resilience
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Core System Health Monitor
              </h2>
            </div>
            <span className="text-xs text-white/40 font-mono">Heartbeat: Every 5s</span>
          </ScrollReveal>

          <ScrollRevealGroup direction="bottom" className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {systemHealthModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-sm hover:border-teal-500/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#141416] text-white flex items-center justify-center border border-white/5">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      {mod.ping}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{mod.name}</h3>
                    <p className="text-[11px] text-white/50 mt-0.5 line-clamp-2">{mod.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-white/40">STATUS</span>
                    <span className="font-semibold text-emerald-400">{mod.status}</span>
                  </div>
                </div>
              );
            })}
          </ScrollRevealGroup>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4 & 5: FAST MODULE NAVIGATION & AUDIT STREAM */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Quick Management Shortcuts (col-span-5) */}
          <ScrollReveal direction="left" className="lg:col-span-5 space-y-4">
            <h3 className="text-xl font-bold text-white">
              Control Center Navigation
            </h3>

            <div className="space-y-3">
              <Link
                to="/admin/doctors"
                className="p-5 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-sm hover:border-teal-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Doctor Verification Queue</h4>
                    <p className="text-xs text-white/50">Audit TS-MCI credentials & state licenses</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin/users"
                className="p-5 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-sm hover:border-blue-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Citizen & Doctor Management</h4>
                    <p className="text-xs text-white/50">Accounts, roles, and identity registry</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/admin/blockchain"
                className="p-5 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-sm hover:border-indigo-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Blockchain Integrity Explorer</h4>
                    <p className="text-xs text-white/50">Smart contract events & SHA-256 proofs</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>

          {/* Real-Time Audit Stream (col-span-7) */}
          <ScrollReveal direction="right" className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                National Security Audit Stream
              </h3>
              <Link to="/admin/audit" className="text-xs font-semibold text-blue-400 hover:underline">
                Full Audit Trail →
              </Link>
            </div>

            <div className="p-6 sm:p-7 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-sm space-y-5">
              {recentEvents.map((evt) => (
                <div key={evt.id} className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-none last:pb-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">{evt.action}</p>
                      <span className="text-[11px] font-mono text-white/40">{evt.time}</span>
                    </div>
                    <p className="text-xs text-white/60">
                      Actor: <strong className="text-white">{evt.actor}</strong> • Target: {evt.target}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] font-mono text-white/40">TX Hash: {evt.hash}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {evt.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* Citizen & Patient Helpdesk Tickets (Full Width) */}
        <ScrollReveal direction="bottom" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-400" />
                <span>Citizen & Patient Helpdesk Tickets</span>
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Review, respond, and resolve patient support queries and EMR record correction requests.
              </p>
            </div>
            <button
              onClick={loadHelpdeskTickets}
              className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-white/80 hover:bg-white/5 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
              <span>Refresh Tickets</span>
            </button>
          </div>

          <div className="bg-[#0B0B0D] rounded-[24px] border border-white/10 shadow-sm overflow-hidden">
            {loadingTickets ? (
              <div className="p-8 text-center text-xs text-white/40">Loading helpdesk tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/40">No helpdesk tickets submitted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#101012] border-b border-white/5 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Ticket #</th>
                      <th className="px-5 py-3.5">Patient</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Subject</th>
                      <th className="px-5 py-3.5">Priority</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-white">
                          {t.ticketNumber}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">{t.patient?.fullName || 'Patient'}</p>
                          <p className="text-[10px] text-cyan-400 font-mono">{t.patient?.healthId || ''}</p>
                        </td>
                        <td className="px-5 py-4 font-medium text-white/70">
                          {t.category}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white line-clamp-1">{t.subject}</p>
                          <p className="text-[11px] text-white/40 line-clamp-1">{t.description}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.priority === 'URGENT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            t.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            t.priority === 'LOW' ? 'bg-white/5 text-white/60 border border-white/10' :
                            'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            t.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            t.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            t.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-white/5 text-white/60 border border-white/10'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedTicket(t);
                              setUpdateStatus(t.status);
                              setAdminResponse(t.adminResponse || '');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-sm transition-colors"
                          >
                            Respond
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Modal for Admin Ticket Resolution */}
        {selectedTicket && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedTicket(null)}
            title={`Respond to Ticket: ${selectedTicket.ticketNumber}`}
          >
            <form onSubmit={handleUpdateTicket} className="space-y-4 text-xs pt-2">
              <div className="p-3 bg-[#101012] rounded-xl border border-white/10 space-y-1">
                <p className="text-[10px] text-white/40 uppercase font-bold">Patient Request</p>
                <p className="font-bold text-white text-sm">{selectedTicket.subject}</p>
                <p className="text-white/70 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              <div>
                <label className="font-semibold text-white/80 block mb-1">Ticket Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 rounded-xl bg-[#141416] text-white text-xs font-semibold focus:border-teal-500 outline-none"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-white/80 block mb-1">Admin Response / Resolution Notes *</label>
                <textarea
                  required
                  rows={4}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Enter response or resolution details for the patient..."
                  className="w-full px-3 py-2 border border-white/10 rounded-xl bg-[#141416] text-white text-xs focus:border-teal-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 border border-white/10 rounded-xl font-semibold text-white/70 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTicket}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md"
                >
                  {savingTicket ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Save Resolution</span>
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
