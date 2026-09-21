import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  FileCheck,
  Stethoscope,
  Award,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

export const DoctorVerificationPage: React.FC = () => {
  const { user } = useAuth();

  const isDrNair = user?.email?.includes('nair');

  return (
    <div className="space-y-8 pb-24 text-white antialiased">
      {/* Header */}
      <ScrollReveal direction="left">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
            Medical Council Accreditation
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
            Physician Verification Status
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Every healthcare provider must hold active, verified registration with the National
            Medical Commission (NMC) to access sovereign EMR records.
          </p>
        </div>
      </ScrollReveal>

      {/* Main Card */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="bg-[#0B0B0D] rounded-[32px] border border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-md">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {user?.doctor?.fullName || user?.name || 'Physician'}
                  </h2>
                  {!isDrNair ? (
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Accredited & Active
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Review in Progress
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  License: <strong className="font-mono text-teal-300">{user?.doctor?.registrationNumber || 'Verified License'}</strong> • {user?.doctor?.authority || 'State Medical Council'}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-xs text-white/70">
              Verification Milestone Checklist:
            </h3>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Government Identity & Phone Verification</p>
                  <p className="text-white/40">Biometrically authenticated via National ID gateway</p>
                </div>
              </div>
              <span className="text-emerald-400 font-bold uppercase text-[10px]">Verified</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">State Medical Council Registry Match</p>
                  <p className="text-white/40">
                    Confirmed against official registered medical practitioners ledger
                  </p>
                </div>
              </div>
              <span className="text-emerald-400 font-bold uppercase text-[10px]">Verified</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Hospital Department Affiliation</p>
                  <p className="text-white/40">
                    Apex Health City, Jubilee Hills — Department of Cardiology
                  </p>
                </div>
              </div>
              <span className="text-emerald-400 font-bold uppercase text-[10px]">Active</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Emergency Room Triage Clearance</p>
                  <p className="text-white/40">
                    Authorized to initiate emergency bypass in accredited trauma suites
                  </p>
                </div>
              </div>
              <span className="text-emerald-400 font-bold uppercase text-[10px]">Clearance Active</span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default DoctorVerificationPage;
