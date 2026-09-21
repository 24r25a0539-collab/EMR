import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  FileCheck,
  Activity,
  HeartPulse,
  UserCheck,
  KeyRound,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Building2,
  Stethoscope,
  Globe,
  Share2,
  Cpu,
  Fingerprint,
  FileText,
  Clock,
  ShieldCheck,
  X,
  HelpCircle,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Header } from '../../components/common/Header';
import { useLanguage } from '../../contexts/LanguageContext';
import { ScrollReveal, ScrollRevealGroup, GlowCard } from '../../components/common/ScrollReveal';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [explainerModal, setExplainerModal] = useState<{
    title: string;
    description: string;
    details: string[];
    actionText: string;
    actionLink: string;
  } | null>(null);

  // Smooth scroll handler for anchor links
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const faqs = [
    {
      q: 'What is EMR and how does it benefit me?',
      a: 'Electronic Medical Records (EMR) digitize your complete clinical history — prescriptions, diagnoses, and lab tests — into a single unified health record. With our platform, you own your health data and can securely share it with any doctor or hospital nationwide.',
    },
    {
      q: 'Is my actual medical history or prescription stored on the public blockchain?',
      a: 'No. In strict compliance with HIPAA and global data privacy standards, no protected health information (PHI) is ever written to the blockchain. We compute a canonical SHA-256 cryptographic hash of your record. Only this mathematical fingerprint and timestamp are recorded on the ledger for tamper-detection.',
    },
    {
      q: 'What happens during an emergency if I am unconscious?',
      a: 'Accredited emergency physicians can trigger the Emergency Access protocol. This creates an immediate, time-limited emergency session displaying only critical lifesaving info (Blood group, severe allergies, current medications, emergency contacts). Simultaneously, an emergency SMS is dispatched to your registered emergency contact, and an immutable audit log is generated.',
    },
    {
      q: 'How does doctor authorization and permission scoping work?',
      a: 'When you consult a doctor, the practitioner requests access specifying the scope (e.g., Cardiology Only, Prescriptions Only) and duration (e.g., 24 Hours). You receive an instant notification on your patient app to Approve or Reject. You retain sovereign control to revoke active permissions at any moment.',
    },
    {
      q: 'Can a hospital or doctor modify a signed prescription without my knowledge?',
      a: 'No. Every medical document is sealed with a digital signature and hashed onto the blockchain registry. If any record is altered in the database, recalculating its SHA-256 hash immediately exposes a cryptographic mismatch, triggering an automated tampering alert across the platform.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050506] flex flex-col antialiased text-white transition-colors duration-200 selection:bg-teal-500/20 selection:text-teal-300">
      {/* Top Navbar */}
      <Header />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#080C14] via-[#050506] to-[#050506] pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-white/10">
        {/* Glow ambient spots */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content with Directional ScrollReveal */}
            <ScrollReveal direction="left" duration={0.95} className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/60 text-teal-300 border border-teal-800/80 text-xs font-semibold tracking-wide shadow-xs">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Zero-Knowledge • SHA-256 Blockchain Integrity Proof</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Sovereign Health Records,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400">
                  Cryptographically Sealed.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Empowering patients with absolute ownership over their medical history. Certified
                doctors, hospitals, and emergency triage teams access verified EMRs with granular
                consent and immutable tamper-proof auditing.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/patient/login"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 group text-sm btn-interaction"
                >
                  <span>Access Patient Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/doctor/login"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-white/10 bg-[#0B0B0D] text-white font-bold hover:bg-white/5 hover:border-teal-500/40 transition-all shadow-xs flex items-center justify-center gap-2 text-sm btn-interaction"
                >
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  <span>Doctor Portal</span>
                </Link>

                <Link
                  to="/admin/login"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-white/10 bg-[#0B0B0D]/60 text-white/70 font-bold hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 text-sm btn-interaction"
                >
                  <Lock className="w-4 h-4 text-white/50" />
                  <span>Admin Portal</span>
                </Link>

                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="w-full sm:w-auto px-4 py-3.5 rounded-2xl text-teal-400 font-semibold hover:bg-teal-950/40 transition-colors text-sm cursor-pointer"
                >
                  How It Works ↓
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-white/50 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>HIPAA & ABDM Compliant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Zero PHI On-Chain</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Instant ER Triage Bypass</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Hero Right Visual: Digital Health Card Preview */}
            <ScrollReveal direction="right" duration={0.95} delay={0.1} glowColor="rgba(20, 184, 166, 0.25)" className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md">
                {/* Digital Health ID Card */}
                <div className="relative bg-[#0B0B0D] text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 overflow-hidden hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-blue-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold">
                        <HeartPulse className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold tracking-wider text-white uppercase">DIGITAL HEALTH IDENTITY</h3>
                        <p className="text-[10px] text-white/50">Cryptographically Anchored</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      VERIFIED SOVEREIGN
                    </span>
                  </div>

                  <div className="relative z-10 space-y-4">
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">Health ID Number</p>
                      <p className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-teal-300">
                        HP-••••••••
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-white/50 uppercase">Ownership Model</p>
                        <p className="text-sm font-bold text-white">Patient Sovereign</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/50 uppercase">Integrity Ledger</p>
                        <p className="text-sm font-bold text-teal-300">SHA-256 On-Chain</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-white/50">Emergency Protocol</p>
                        <p className="text-xs font-semibold text-emerald-400">Triage Bypass Audited</p>
                      </div>
                      <div className="p-2 bg-white/10 rounded-xl border border-white/15">
                        {/* Simulated QR */}
                        <div className="w-12 h-12 bg-[#050506] rounded grid grid-cols-4 gap-0.5 p-1">
                          <div className="bg-teal-400 rounded-xs" />
                          <div className="bg-teal-400 rounded-xs" />
                          <div className="bg-[#050506] rounded-xs" />
                          <div className="bg-teal-400 rounded-xs" />
                          <div className="bg-teal-400 rounded-xs" />
                          <div className="bg-[#050506] rounded-xs" />
                          <div className="bg-teal-400 rounded-xs" />
                          <div className="bg-teal-400 rounded-xs" />
                          <div className="bg-[#050506] rounded-xs" />
                          <div className="bg-teal-400 rounded-xs" />
                          <div className="bg-teal-400 rounded-xs" />
                          <div className="bg-[#050506] rounded-xs" />
                          <div className="bg-teal-400 rounded-xs" />
                          <div className="bg-teal-400 rounded-xs" />
                          <div className="bg-[#050506] rounded-xs" />
                          <div className="bg-teal-400 rounded-xs" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tamper-Proof Watermark */}
                  <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50 font-mono">
                    <span>SEAL: SHA-256</span>
                    <span className="truncate max-w-[150px]">0x8f3c7...9b12</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. WHAT IS EMR SECTION */}
      {/* ========================================================================= */}
      <section id="what-is-emr" className="py-20 bg-[#050506] border-b border-white/10 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800">
              Healthcare Fundamentals
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
              What is an Electronic Medical Record (EMR)?
            </h2>
            <p className="text-sm sm:text-base text-white/70 mt-2 leading-relaxed">
              An Electronic Medical Record is the complete digital version of a patient's medical history across consultations, diagnoses, lab investigations, and prescription medications.
            </p>
          </ScrollReveal>

          <ScrollRevealGroup staggerDelay={0.1} alternateDirection={true} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlowCard glowColor="rgba(59, 130, 246, 0.2)" className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Unified Longitudinal Record</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mt-2">
                Replaces scattered paper files with an immutable chronological stream of every doctor visit, blood test, and scan from birth to present.
              </p>
            </GlowCard>

            <GlowCard glowColor="rgba(20, 184, 166, 0.2)" className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold mb-4">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Patient-Sovereign Ownership</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mt-2">
                You decide which physician or hospital can view your records. No third party or insurance agency can access your health data without explicit consent.
              </p>
            </GlowCard>

            <GlowCard glowColor="rgba(16, 185, 129, 0.2)" className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Tamper-Proof Verification</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mt-2">
                Every record is sealed cryptographically on the blockchain. Any retrospective alteration or medical forgery is detected mathematically in milliseconds.
              </p>
            </GlowCard>
          </ScrollRevealGroup>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. WHY CHOOSE THIS EMR? (Comparison) */}
      {/* ========================================================================= */}
      <section id="why-emr" className="py-20 bg-[#08080A] border-b border-white/10 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800">
              Architecture Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
              Why Traditional EMRs Fail Patients
            </h2>
            <p className="text-base text-white/70 mt-3">
              Centralized healthcare databases are vulnerable to silent record tampering, data silos,
              and unauthorized access without patient visibility.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Traditional Systems */}
            <ScrollReveal direction="left" duration={0.9} className="p-8 rounded-3xl bg-[#0B0B0D] border border-white/10 shadow-xs space-y-4 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Legacy Centralized EMRs</h3>
              <p className="text-xs text-white/50">Fragile, siloed, and prone to vendor lock-in</p>

              <ul className="space-y-3 text-sm text-white/70 pt-2">
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Hospital-controlled silos: Patients cannot transfer histories seamlessly.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Vulnerable to silent database tampering with no immutable verification.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>All-or-nothing access: Doctors see entire records without scoping.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>No live notification when external providers query your private records.</span>
                </li>
              </ul>
            </ScrollReveal>

            {/* Our Blockchain EMR */}
            <ScrollReveal direction="right" duration={0.9} glowColor="rgba(20, 184, 166, 0.25)" className="p-8 rounded-3xl bg-gradient-to-b from-[#0F172A] to-[#0B0B0D] text-white border border-teal-500/30 shadow-xl space-y-4 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center font-bold text-teal-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Our Blockchain-Sealed EMR</h3>
              <p className="text-xs text-teal-300">Patient sovereign, cryptographic, zero-leakage</p>

              <ul className="space-y-3 text-sm text-white/90 pt-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Patient Sovereign ID: One unified Health ID across all clinics and hospitals.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>SHA-256 Proofs: Any database tampering is mathematically detected instantly.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Granular Consent: You choose exact scope and duration for every doctor.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Granular Audit Trail: Every single view, download, and emergency bypass logged.</span>
                </li>
              </ul>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS (4 STEPS) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-20 bg-[#050506] border-b border-white/10 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800">
              Seamless Healthcare Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
              How the Platform Works
            </h2>
            <p className="text-base text-white/70 mt-3">
              Simple 4-step workflow connecting patients, certified doctors, and healthcare networks.
            </p>
          </ScrollReveal>

          <ScrollRevealGroup staggerDelay={0.08} alternateDirection={true} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <GlowCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center">
                01
              </div>
              <h4 className="text-base font-bold text-white mt-4">Create Health Profile</h4>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mt-2">
                Register with your mobile number & ABHA ID to receive your unique Sovereign Health ID with digital QR verification.
              </p>
            </GlowCard>

            {/* Step 2 */}
            <GlowCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center">
                02
              </div>
              <h4 className="text-base font-bold text-white mt-4">Doctor Consult & Records</h4>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mt-2">
                Physicians issue digital prescriptions and lab tests automatically sealed with SHA-256 mathematical hashes.
              </p>
            </GlowCard>

            {/* Step 3 */}
            <GlowCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center">
                03
              </div>
              <h4 className="text-base font-bold text-white mt-4">Control Access Scope</h4>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mt-2">
                Approve or reject doctor requests. Grant access for 24 hours, specific departments, or revoke permissions anytime.
              </p>
            </GlowCard>

            {/* Step 4 */}
            <GlowCard className="p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center">
                04
              </div>
              <h4 className="text-base font-bold text-white mt-4">Blockchain Verification</h4>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mt-2">
                Recalculate record hashes on demand to confirm complete data integrity against the immutable blockchain ledger.
              </p>
            </GlowCard>
          </ScrollRevealGroup>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DATA PROTECTION & SECURITY */}
      {/* ========================================================================= */}
      <section id="security" className="py-20 bg-[#08080A] border-b border-white/10 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800">
              Security Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
              How Patient Data is Protected
            </h2>
            <p className="text-base text-white/70 mt-3">
              Built on strict zero-knowledge principles where personal health records are never exposed to public ledgers.
            </p>
          </ScrollReveal>

          <ScrollRevealGroup staggerDelay={0.1} alternateDirection={true} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlowCard glowColor="rgba(20, 184, 166, 0.2)" className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Zero PHI On-Chain</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mt-2">
                Protected Health Information (names, medical notes, lab results) is encrypted with AES-256 in compliant private storage. Never exposed publicly on blockchain nodes.
              </p>
            </GlowCard>

            <GlowCard glowColor="rgba(59, 130, 246, 0.2)" className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">SHA-256 State Anchors</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mt-2">
                Only the mathematical hash fingerprint of each record is registered on Ethereum smart contracts. Any unauthorized database modification breaks the hash instantly.
              </p>
            </GlowCard>

            <GlowCard glowColor="rgba(168, 85, 247, 0.2)" className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Granular Audit Logging</h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed mt-2">
                Every action — doctor viewing a report, downloading a prescription, or ER emergency triage access — is logged permanently with physician timestamp and license number.
              </p>
            </GlowCard>
          </ScrollRevealGroup>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. EMERGENCY ACCESS & TRIAGE */}
      {/* ========================================================================= */}
      <section id="emergency" className="py-20 bg-gradient-to-r from-rose-950/70 via-[#150a0f] to-[#08080A] text-white border-b border-rose-900/30 scroll-mt-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <ScrollReveal direction="left" duration={0.9} className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950 text-rose-300 text-xs font-bold uppercase tracking-wider border border-rose-800/60">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Life-Saving Protocol</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Emergency Care Bypass with Immutable Auditing
              </h2>
              <p className="text-sm sm:text-base text-rose-100/80 leading-relaxed">
                When seconds matter, verified emergency physicians can access critical triage data
                (Blood group, Allergies, Active Medications) without waiting for unconscious patient
                consent. Every action instantly alerts emergency contacts via SMS and logs an immutable audit
                trail.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-[#0B0B0D]/80 p-4 rounded-2xl border border-rose-900/40">
                  <p className="text-xs font-bold text-amber-300">Vital Parameters First</p>
                  <p className="text-[11px] text-white/60 mt-1">Blood group, anaphylaxis warnings, active cardiovascular meds.</p>
                </div>
                <div className="bg-[#0B0B0D]/80 p-4 rounded-2xl border border-rose-900/40">
                  <p className="text-xs font-bold text-amber-300">Automated SMS Alerts</p>
                  <p className="text-[11px] text-white/60 mt-1">Instant emergency alert sent to patient's registered kin.</p>
                </div>
                <div className="bg-[#0B0B0D]/80 p-4 rounded-2xl border border-rose-900/40">
                  <p className="text-xs font-bold text-amber-300">Permanent Incident Log</p>
                  <p className="text-[11px] text-white/60 mt-1">Attending doctor license and ER hospital sealed on ledger.</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" duration={0.9} delay={0.1} className="lg:col-span-4 flex flex-col items-start lg:items-end gap-3">
              <Link
                to="/patient/login"
                className="px-6 py-3.5 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-400 transition-colors shadow-lg shadow-rose-950/50 flex items-center gap-2 text-sm btn-interaction"
              >
                <span>Emergency Login Access</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() =>
                  setExplainerModal({
                    title: 'Emergency Care Bypass Protocol',
                    description:
                      'Designed for acute trauma situations where an unconscious patient cannot unlock their app.',
                    details: [
                      'Only certified ER physicians with hospital credentialing can initiate triage bypass.',
                      'Reveals ONLY life-critical vitals (Blood group, Severe drug allergies, Current medications, Emergency kin).',
                      'Does NOT expose general historical consultations or non-critical records.',
                      'Sends immediate priority SMS alert to registered emergency contacts.',
                      'Creates a tamper-proof audit record with physician timestamp.',
                    ],
                    actionText: 'Open Emergency Portal',
                    actionLink: '/patient/login',
                  })
                }
                className="text-xs text-rose-300 hover:text-white underline cursor-pointer"
              >
                Read Emergency Protocol Details →
              </button>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. BLOCKCHAIN PROOF SECTION */}
      {/* ========================================================================= */}
      <section id="blockchain-proof" className="py-20 bg-[#050506] border-b border-white/10 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800">
              Cryptographic Integrity
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 tracking-tight">
              How Blockchain Verification Works
            </h2>
            <p className="text-base text-white/70 mt-3">
              A mathematical guarantee that medical records have not been secretly modified, erased, or replaced.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="center" duration={0.95} className="bg-[#0B0B0D] p-8 rounded-3xl border border-white/10 max-w-4xl mx-auto space-y-6 hover-lift">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-[#101012] p-5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-white/40 uppercase">Input</span>
                <h4 className="text-sm font-bold text-white mt-1">Medical Document</h4>
                <p className="text-[11px] text-white/50 mt-1">Prescription or Lab PDF</p>
              </div>
              <div className="bg-[#101012] p-5 rounded-2xl border border-teal-500/20">
                <span className="text-xs font-bold text-teal-400 uppercase">Computation</span>
                <h4 className="text-sm font-bold text-white mt-1">SHA-256 Digest</h4>
                <p className="text-[11px] font-mono text-teal-300 mt-1">0x8f3c7...9b12</p>
              </div>
              <div className="bg-[#101012] p-5 rounded-2xl border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-400 uppercase">Storage</span>
                <h4 className="text-sm font-bold text-white mt-1">Ethereum Ledger</h4>
                <p className="text-[11px] text-emerald-300 mt-1">Block #10482 Sealed</p>
              </div>
            </div>

            <div className="p-4 bg-teal-950/40 rounded-2xl border border-teal-800/60 text-xs text-teal-200 leading-relaxed">
              <strong>Instant Tamper Check:</strong> Anyone inspecting a record can recompute its SHA-256 hash in real time. If even a single dosage number was altered in the database, the recalculated hash will not match the immutable blockchain ledger hash, immediately flagging the record as compromised.
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FAQ SECTION */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#08080A] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center mb-12">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-white/70 mt-2">
              Everything you need to know about blockchain integrity, privacy, and clinical workflows.
            </p>
          </ScrollReveal>

          <ScrollRevealGroup staggerDelay={0.07} className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#0B0B0D] rounded-2xl border border-white/10 overflow-hidden shadow-2xs transition-all hover:border-teal-500/40"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-teal-400 text-sm sm:text-base cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-teal-400' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/10 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </ScrollRevealGroup>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-[#050506] py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-[#050506] font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-white">
                Apex<span className="text-teal-400">EMR</span>
              </span>
              <span className="text-xs text-white/40 ml-2">© 2026 Sovereign Health Network</span>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-white/60 font-medium">
              <button onClick={() => scrollToSection('what-is-emr')} className="hover:text-teal-400 cursor-pointer">
                What is EMR
              </button>
              <button onClick={() => scrollToSection('why-emr')} className="hover:text-teal-400 cursor-pointer">
                Why EMR
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-teal-400 cursor-pointer">
                How It Works
              </button>
              <button onClick={() => scrollToSection('security')} className="hover:text-teal-400 cursor-pointer">
                Security
              </button>
              <button onClick={() => scrollToSection('emergency')} className="hover:text-teal-400 cursor-pointer">
                Emergency Care
              </button>
              <span className="text-white/20">|</span>
              <Link to="/patient/login" className="text-teal-400 font-bold hover:underline">
                Patient Portal
              </Link>
              <Link to="/doctor/login" className="text-teal-400 font-bold hover:underline">
                Doctor Portal
              </Link>
              <Link to="/admin/login" className="text-white/60 font-semibold hover:text-white">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Explainer Modal */}
      {explainerModal && (
        <div className="fixed inset-0 z-50 bg-[#050506]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D10] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-white/10 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{explainerModal.title}</h3>
              </div>
              <button
                onClick={() => setExplainerModal(null)}
                className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">{explainerModal.description}</p>

            <ul className="space-y-2 text-xs text-white/80 border-y border-white/10 py-3">
              {explainerModal.details.map((d, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setExplainerModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                Close
              </button>
              <Link
                to={explainerModal.actionLink}
                className="px-5 py-2 rounded-xl bg-teal-500 text-[#050506] text-xs font-bold hover:bg-teal-400 shadow-xs btn-interaction"
              >
                {explainerModal.actionText}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
