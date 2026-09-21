import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Shield,
  ArrowRight,
  Lock,
  FileCheck,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Header } from '../../components/common/Header';
import { ScrollReveal } from '../../components/common/ScrollReveal';

export const DoctorLoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { loginAsDoctor } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter your Medical Licence / Registration Number and password.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const data = await loginAsDoctor(identifier.trim(), password.trim());
      if (data?.mustChangePassword) {
        addToast('info', 'First sign-in detected. Please set your new permanent password.');
        navigate('/doctor/change-password');
      } else {
        addToast('success', 'Practitioner authenticated successfully. Accessing clinical dashboard.');
        navigate('/doctor/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid registration number or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white flex flex-col antialiased relative overflow-hidden selection:bg-teal-500/20 selection:text-teal-300">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-br from-teal-500/15 via-blue-600/10 to-transparent rounded-full filter blur-[100px] pointer-events-none" />

      <Header />

      <main className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 py-10 flex flex-col justify-center relative z-10">
        <ScrollReveal direction="up">
          {/* Login Card */}
          <div className="bg-[#0B0B0D] p-6 sm:p-8 rounded-[30px] shadow-2xl border border-white/10 hover:border-teal-500/40 transition-all">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-950/40">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Doctor Sign In</h1>
              <p className="text-xs text-white/60 mt-1">
                Medical Practitioners & Accredited Specialists
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Medical Licence / Registration Number *
                </label>
                <div className="relative">
                  <FileCheck className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. TSMC-458721 or TS-MCI-2024-8921"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 font-mono placeholder-white/30 transition-all"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold uppercase tracking-wider text-white/70">
                    Password *
                  </label>
                  <span className="text-[10px] text-teal-400">
                    Temporary / Permanent
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 transition-all font-mono placeholder-white/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#050506] font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 text-sm disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Clinical Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Registration link */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-white/50">
              <span>Are you a licensed practitioner? </span>
              <Link to="/doctor/register" className="font-bold text-teal-400 hover:text-teal-300 hover:underline">
                Apply for Accreditation
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
};

export default DoctorLoginPage;
