import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Stethoscope,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Header } from '../../components/common/Header';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

export const DoctorChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Password criteria checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isDiffFromCurrent = newPassword.length > 0 && newPassword !== currentPassword;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    currentPassword.trim().length > 0 &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial &&
    isDiffFromCurrent &&
    isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your current temporary password.');
      return;
    }

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setErrorMessage('Please ensure your new password meets all security requirements.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('New password must be different from your temporary password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.doctorChangePassword(currentPassword, newPassword, confirmPassword);
      if (res.token) {
        localStorage.setItem('emr_token', res.token);
      }
      await refreshUser();
      setIsSuccess(true);
      addToast('success', 'Password updated successfully! Welcome to your Doctor Dashboard.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white flex flex-col antialiased">
      <Header />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-12 flex flex-col justify-center">
        <ScrollReveal direction="bottom">
          {isSuccess ? (
            <div className="bg-[#0B0B0D] p-8 sm:p-10 rounded-[32px] shadow-2xl border border-white/[0.08] text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Security Setup Complete
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
                  Password Changed Successfully
                </h1>
                <p className="text-xs sm:text-sm text-white/50 mt-2 leading-relaxed">
                  Your temporary password has been permanently invalidated. In all future logins, use your
                  Medical Licence Number and your new password.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Account Activated & Verified</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Cryptographic Password Hash Stored in PostgreSQL</span>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <KeyRound className="w-4 h-4" />
                  <span>Temporary password no longer valid</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/doctor/dashboard')}
                className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 text-sm cursor-pointer"
              >
                <span>Continue to Doctor Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-[#0B0B0D] p-6 sm:p-8 rounded-[32px] shadow-2xl border border-white/[0.08]">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-3 shadow-md">
                  <KeyRound className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                  Welcome to Apex EMR
                </span>
                <h1 className="text-2xl font-black text-white mt-3 tracking-tight">
                  Create Your New Password
                </h1>
                <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto leading-relaxed">
                  Your account has been activated. For security, you must create a new permanent password
                  before accessing your clinical dashboard.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Current Temporary Password */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Current Temporary Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter system-generated temporary password"
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-sm focus:border-teal-500 focus:outline-none transition-all pr-10 font-mono"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-sm focus:border-teal-500 focus:outline-none transition-all pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-sm focus:border-teal-500 focus:outline-none transition-all pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirement Checklist */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-[11px]">
                  <p className="font-bold text-white/70">Password Requirements:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-white/30'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Minimum 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-white/30'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-white/30'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-white/30'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Numeric digit (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-white/30'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Special character (!@#$)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-400' : 'text-white/30'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 text-sm disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Create New Password & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </ScrollReveal>
      </main>
    </div>
  );
};

export default DoctorChangePasswordPage;
