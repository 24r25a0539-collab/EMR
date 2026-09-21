import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ServerCrash, RefreshCw, Home } from 'lucide-react';
import { ScrollReveal } from '../../components/common/ScrollReveal';

export const ServerErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050506] text-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 selection:bg-teal-500/20 selection:text-teal-300">
      <ScrollReveal direction="up" className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-xl shadow-amber-950/40">
          <ServerCrash className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-950/60 border border-amber-800 px-3.5 py-1 rounded-full">
          Server Error 500
        </span>
        <h1 className="text-3xl font-black text-white mt-4 tracking-tight">
          System Interruption
        </h1>
        <p className="text-sm text-white/60 mt-2 leading-relaxed">
          The EMR platform encountered an unexpected error processing your encrypted request. Our
          infrastructure logs have recorded the incident with tamper-evident tracking.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors shadow-lg shadow-teal-950/40 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-[#0B0B0D] text-white/80 font-bold hover:bg-white/5 hover:text-white transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
};
