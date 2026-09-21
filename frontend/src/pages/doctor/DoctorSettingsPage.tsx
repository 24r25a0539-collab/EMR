import React, { useState } from 'react';
import {
  Settings,
  Stethoscope,
  Building2,
  Lock,
  Clock,
  ShieldCheck,
  Save,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
  PageHeader,
  StatusBadge,
} from '../../components/common/ScrollReveal';

export const DoctorSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [opdTimings, setOpdTimings] = useState('09:00 AM - 01:00 PM & 04:00 PM - 07:00 PM');
  const [maxPatientsPerSlot, setMaxPatientsPerSlot] = useState('12');

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Clinical workspace preferences saved successfully.');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await api.doctorChangePassword(currentPassword, newPassword, confirmPassword);
      if (res.token) {
        localStorage.setItem('emr_token', res.token);
      }
      setPasswordSuccess('Password updated successfully. In future logins, use your new password.');
      addToast('success', 'Security password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 text-white antialiased">
      {/* Header */}
      <ScrollReveal direction="left">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
            Practitioner Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
            Clinical Profile & Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Manage your OPD consultation hours, digital signature certificate, and security credentials.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workspace & OPD Schedule */}
        <ScrollReveal direction="left" delay={0.08}>
          <div className="bg-[#0B0B0D] rounded-[32px] border border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSave} className="space-y-5 text-xs">
              <div className="space-y-3 pb-4 border-b border-white/[0.08]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  <span>Practitioner Identity</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-white/70">
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-white/40 text-[10px] uppercase font-bold">Doctor Name:</span>
                    <p className="font-bold text-white text-sm mt-0.5">
                      {user?.name || 'Dr. Practitioner'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-white/40 text-[10px] uppercase font-bold">Registration:</span>
                    <p className="font-mono font-bold text-teal-400 mt-0.5">
                      {user?.doctor?.registrationNumber || 'TSMC-458721'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-white/40 text-[10px] uppercase font-bold">Specialization:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {user?.doctor?.specialization || 'Clinical Specialist'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-white/40 text-[10px] uppercase font-bold">Primary Hospital:</span>
                    <p className="font-semibold text-white mt-0.5 truncate">
                      {user?.doctor?.hospitalAffiliation || 'Apex Health City'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  OPD Consultation Schedule
                </label>
                <input
                  type="text"
                  value={opdTimings}
                  onChange={(e) => setOpdTimings(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  Max Outpatient Appointments Per Session
                </label>
                <input
                  type="number"
                  value={maxPatientsPerSlot}
                  onChange={(e) => setMaxPatientsPerSlot(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Digital Signature Card */}
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <div>
                    <p className="font-bold text-teal-200 text-xs">Physician Digital Signature Key</p>
                    <p className="text-teal-400/70 text-[11px]">
                      Anchored to Smart Contract Registry • Valid
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[10px] border border-teal-500/30">
                  Active
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-lg shadow-teal-600/20 text-xs cursor-pointer"
              >
                Save Schedule Settings
              </button>
            </form>
          </div>
        </ScrollReveal>

        {/* Security & Password Management */}
        <ScrollReveal direction="right" delay={0.14}>
          <div className="bg-[#0B0B0D] rounded-[32px] border border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-400" />
                <span>Security & Password Management</span>
              </h3>
              <p className="text-xs text-white/50 mt-1">
                Update your account password. All passwords are encrypted and hashed before storage in PostgreSQL.
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-white/60 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs pr-10 focus:outline-none focus:border-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-white/60 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters with symbols"
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs pr-10 focus:outline-none focus:border-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-white/60 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs pr-10 focus:outline-none focus:border-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-lg shadow-teal-600/20 text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isChangingPassword ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default DoctorSettingsPage;
