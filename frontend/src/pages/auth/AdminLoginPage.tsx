import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ScrollReveal } from '../../components/common/ScrollReveal';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mfaCode, setMfaCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { loginAsAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Administrative credentials required.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await loginAsAdmin(email, password);
      addToast('success', 'Administrator clearance verified. Loading control plane.');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid administrative credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden antialiased selection:bg-teal-500/20 selection:text-teal-300">
      {/* Background security grid */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-br from-indigo-500/10 via-purple-600/10 to-transparent rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        <ScrollReveal direction="up">
          {/* Card */}
          <div className="bg-[#0B0B0D] p-8 rounded-3xl border border-white/10 shadow-2xl hover:border-indigo-500/40 transition-all">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-950/40">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">System Control Plane</h1>
              <p className="text-xs text-white/60 mt-1">
                Restricted to authorized national health infrastructure personnel
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Administrative Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@emr.gov.in"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#141416] border border-white/10 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 placeholder-white/30"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                    Root Password
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">Demo: Admin@123456</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#141416] border border-white/10 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 placeholder-white/30 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Hardware MFA / Security Token (Optional)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="e.g. 892014"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#141416] border border-white/10 text-sm text-white font-mono placeholder-white/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 text-sm mt-4 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Enter Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Immutable Audit notice */}
            <div className="mt-6 pt-5 border-t border-white/10 flex items-start gap-2.5 text-[11px] text-white/50 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                All administrator activities are cryptographically signed, timestamped, and
                immutably recorded in the blockchain-anchored audit ledger.
              </span>
            </div>
          </div>
        </ScrollReveal>

        <div className="text-center">
          <Link to="/" className="text-xs text-white/50 hover:text-white transition-colors">
            ← Return to Public Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};
