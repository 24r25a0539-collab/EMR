import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, LogIn, ArrowRight } from 'lucide-react';
import { ScrollReveal } from '../../components/common/ScrollReveal';

export const SessionExpiredPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050506] text-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 selection:bg-teal-500/20 selection:text-teal-300">
      <ScrollReveal direction="up" className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-400 shadow-xl shadow-indigo-950/40">
          <Clock className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-950/60 border border-indigo-800 px-3.5 py-1 rounded-full">
          Security Timeout
        </span>
        <h1 className="text-3xl font-black text-white mt-4 tracking-tight">
          Session Expired
        </h1>
        <p className="text-sm text-white/60 mt-2 leading-relaxed">
          For your clinical privacy and HIPAA compliance, inactive sessions automatically expire.
          Please re-authenticate to decrypt and access your medical records.
        </p>

        <div className="mt-8">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors shadow-lg shadow-teal-950/40"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In Again</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
};
