import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ScrollReveal } from '../../components/common/ScrollReveal';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();

  const getHomeUrl = () => {
    if (!isAuthenticated) return '/';
    if (role === 'PATIENT') return '/patient/home';
    if (role === 'DOCTOR') return '/doctor/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 selection:bg-teal-500/20 selection:text-teal-300">
      <ScrollReveal direction="up" className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-teal-500/10 border border-teal-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-teal-400 shadow-xl shadow-teal-950/40">
          <FileQuestion className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-950/60 border border-teal-800 px-3.5 py-1 rounded-full">
          Error 404
        </span>
        <h1 className="text-3xl font-black text-white mt-4 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-white/60 mt-2 leading-relaxed">
          The healthcare resource or clinical page you are trying to access does not exist or has
          been archived.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-[#0B0B0D] text-white/80 font-bold hover:bg-white/5 hover:text-white transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <Link
            to={getHomeUrl()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors shadow-lg shadow-teal-950/40"
          >
            <Home className="w-4 h-4" />
            <span>Return to Portal</span>
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
};
