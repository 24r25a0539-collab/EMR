import React, { useState } from 'react';
import {
  User,
  Globe,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { BackButton } from '../../components/common/BackButton';
import { ScrollReveal, PremiumCard } from '../../components/common/ScrollReveal';

export const PatientSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { language, setLanguage, languages } = useLanguage();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'LANGUAGE' | 'NOTIFICATIONS'>('ACCOUNT');

  // Account Settings state
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Notifications State
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [emergencySms, setEmergencySms] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Preferences and security settings saved successfully.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/patient" />
      </div>

      {/* Header */}
      <ScrollReveal direction="left">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Platform Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            Patient Account & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your contact details, interface language, and notification channels.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar Tabs */}
        <ScrollReveal direction="left" delay={0.08} className="md:col-span-4">
          <div className="bg-[#101012] p-3 rounded-[28px] border border-white/[0.08] shadow-2xl space-y-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('ACCOUNT')}
              className={`w-full p-3.5 rounded-2xl text-left flex items-center gap-3 transition-colors ${
                activeTab === 'ACCOUNT'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Account Details</span>
            </button>

            <button
              onClick={() => setActiveTab('LANGUAGE')}
              className={`w-full p-3.5 rounded-2xl text-left flex items-center gap-3 transition-colors ${
                activeTab === 'LANGUAGE'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Language & Region</span>
            </button>

            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`w-full p-3.5 rounded-2xl text-left flex items-center gap-3 transition-colors ${
                activeTab === 'NOTIFICATIONS'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Alert Preferences</span>
            </button>
          </div>
        </ScrollReveal>

        {/* Tab Content Area */}
        <ScrollReveal direction="right" delay={0.12} className="md:col-span-8">
          <div className="bg-[#101012] p-6 sm:p-8 rounded-[28px] border border-white/[0.08] shadow-2xl">
            {/* ACCOUNT TAB */}
            {activeTab === 'ACCOUNT' && (
              <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
                <h3 className="text-base font-bold text-white pb-3 border-b border-white/[0.08]">
                  Contact Information
                </h3>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Registered Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/[0.10] bg-[#141416] text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Notification Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/[0.10] bg-[#141416] text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Save Account Changes
                  </button>
                </div>
              </form>
            )}

            {/* LANGUAGE TAB */}
            {activeTab === 'LANGUAGE' && (
              <div className="space-y-5 text-xs">
                <h3 className="text-base font-bold text-white pb-3 border-b border-white/[0.08]">
                  Display Language
                </h3>
                <p className="text-slate-400">
                  Select the primary language for your clinical portal and medication instructions:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        addToast('success', `Language changed to ${l.name}`);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        language === l.code
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-white font-bold shadow-md'
                          : 'border-white/[0.08] bg-[#141416] hover:border-white/[0.14] text-slate-300'
                      }`}
                    >
                      <p className="text-base font-bold text-white">{l.nativeName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{l.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'NOTIFICATIONS' && (
              <div className="space-y-5 text-xs">
                <h3 className="text-base font-bold text-white pb-3 border-b border-white/[0.08]">
                  Alert Preferences
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-[#141416] border border-white/[0.08] cursor-pointer">
                    <div>
                      <p className="font-bold text-white">Doctor Access Request SMS</p>
                      <p className="text-slate-400">Instant SMS when an accredited doctor requests EMR access</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={() => setSmsAlerts(!smsAlerts)}
                      className="w-4 h-4 text-blue-600 rounded bg-[#101012] border-white/[0.12]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-[#141416] border border-white/[0.08] cursor-pointer">
                    <div>
                      <p className="font-bold text-white">Lab Reports Email Notifications</p>
                      <p className="text-slate-400">Email copies of published diagnostic findings</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={() => setEmailAlerts(!emailAlerts)}
                      className="w-4 h-4 text-blue-600 rounded bg-[#101012] border-white/[0.12]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 cursor-pointer">
                    <div>
                      <p className="font-bold text-rose-300">Emergency Bypass Alerts (Mandatory)</p>
                      <p className="text-rose-400">Immediate priority SMS dispatched if emergency trauma bypass is used</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emergencySms}
                      disabled={true}
                      className="w-4 h-4 text-rose-600 rounded opacity-60"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};
