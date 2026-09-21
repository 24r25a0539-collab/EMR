import React from 'react';
import { Link } from 'react-router-dom';
import { User, Stethoscope, Shield, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { ScrollReveal, GlowCard } from '../../components/common/ScrollReveal';

export const RoleSelectionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050506] flex flex-col antialiased text-white selection:bg-teal-500/20 selection:text-teal-300">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex flex-col justify-center">
        <ScrollReveal direction="up" className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/60 text-teal-300 border border-teal-800 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span>Secure Portal Authentication</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Select Your Portal to Continue
          </h1>
          <p className="text-sm sm:text-base text-white/60 mt-2">
            Please choose whether you are logging in as a Citizen to manage your sovereign health
            records or as an Accredited Healthcare Practitioner.
          </p>
        </ScrollReveal>

        {/* Two Large Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* PATIENT ROLE CARD */}
          <ScrollReveal direction="left" duration={0.9} glowColor="rgba(59, 130, 246, 0.2)">
            <Link
              to="/patient/login"
              className="group relative p-8 rounded-3xl bg-[#0B0B0D] border border-white/10 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/40 transition-all duration-300 flex flex-col justify-between overflow-hidden hover-lift h-full"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-0 group-hover:scale-120 group-hover:bg-blue-500/10 transition-all duration-500" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-black transition-colors shadow-2xs">
                  <User className="w-7 h-7" />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-full">
                  For Citizens & Patients
                </span>

                <h2 className="text-2xl font-black text-white mt-4 tracking-tight">
                  Patient Portal
                </h2>

                <p className="text-sm text-white/60 mt-2 leading-relaxed">
                  Access your complete medical history, digital prescriptions, lab reports, and manage
                  doctor access permissions with zero-knowledge encryption.
                </p>

                <div className="mt-6 space-y-2.5 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Passwordless instant OTP login</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Sovereign Digital Health ID with QR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Approve & revoke doctor permissions</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between font-bold text-blue-400 group-hover:text-blue-300 relative z-10">
                <span>Sign In with Mobile / Health ID</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          </ScrollReveal>

          {/* DOCTOR ROLE CARD */}
          <ScrollReveal direction="right" duration={0.9} delay={0.1} glowColor="rgba(20, 184, 166, 0.2)">
            <Link
              to="/doctor/login"
              className="group relative p-8 rounded-3xl bg-[#0B0B0D] border border-white/10 hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-950/40 transition-all duration-300 flex flex-col justify-between overflow-hidden hover-lift h-full"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full -z-0 group-hover:scale-120 group-hover:bg-teal-500/10 transition-all duration-500" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:bg-teal-500 group-hover:text-black transition-colors shadow-2xs">
                  <Stethoscope className="w-7 h-7" />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-950/60 border border-teal-800/60 px-2.5 py-1 rounded-full">
                  For Medical Practitioners
                </span>

                <h2 className="text-2xl font-black text-white mt-4 tracking-tight">
                  Doctor Portal
                </h2>

                <p className="text-sm text-white/60 mt-2 leading-relaxed">
                  Consult registered patients, issue cryptographically sealed prescriptions, upload lab
                  diagnostics, and initiate emergency triage access.
                </p>

                <div className="mt-6 space-y-2.5 text-xs text-white/60">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>NMC / Medical Council license verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>Scoped consent access requests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>Emergency triage bypass with auto-alert</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between font-bold text-teal-400 group-hover:text-teal-300 relative z-10">
                <span>Sign In with Medical License</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          </ScrollReveal>
        </div>

        {/* Administrative Portal Link */}
        <ScrollReveal direction="up" delay={0.2} className="mt-14 text-center">
          <p className="text-xs text-white/40">
            System Administrator or Compliance Auditor?{' '}
            <Link
              to="/admin/login"
              className="text-white/60 font-semibold hover:text-white underline inline-flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Restricted Administrative Login</span>
            </Link>
          </p>
        </ScrollReveal>
      </main>
    </div>
  );
};
