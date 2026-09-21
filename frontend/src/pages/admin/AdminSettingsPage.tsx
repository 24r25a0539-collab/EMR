import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Shield,
  Clock,
  Bell,
  Save,
  RefreshCw,
  CheckCircle2,
  Lock,
  Database,
  Sliders,
  Server,
  Key,
} from 'lucide-react';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';
import { useToast } from '../../contexts/ToastContext';

export const AdminSettingsPage: React.FC = () => {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Settings states
  const [rpcUrl, setRpcUrl] = useState('http://127.0.0.1:8545');
  const [contractAddress, setContractAddress] = useState('0x5FbDB2315678afecb367f032d93F642f64180aa3');
  const [emergencyTimeoutMinutes, setEmergencyTimeoutMinutes] = useState(120);
  const [failedLoginThreshold, setFailedLoginThreshold] = useState(5);
  const [auditRetentionYears, setAuditRetentionYears] = useState(7);
  const [autoSealInterval, setAutoSealInterval] = useState('HOURLY');
  const [alertSmsDispatch, setAlertSmsDispatch] = useState(true);
  const [alertEmailDispatch, setAlertEmailDispatch] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      addToast('System settings and blockchain node policies updated successfully', 'success');
    }, 600);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Banner */}
      <ScrollReveal direction="bottom">
        <div className="bg-gradient-to-r from-indigo-950/80 via-[#0B0B0D] to-[#0B0B0D] text-white p-6 sm:p-8 rounded-[28px] shadow-xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-semibold">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Infrastructure Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              System & Security Configuration
            </h1>
            <p className="text-xs sm:text-sm text-white/60 max-w-xl">
              Control blockchain anchor nodes, emergency session time-to-live, immutable audit retention policies, and cryptographic security parameters.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-950/40 flex items-center gap-2 relative z-10"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </div>
      </ScrollReveal>

      <form onSubmit={handleSave} className="space-y-6">
        <ScrollRevealGroup direction="bottom">
          {/* Blockchain Node & Contract Configuration */}
          <div className="p-6 sm:p-8 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Blockchain Node & Smart Contract</h2>
                <p className="text-xs text-white/50">Zero-PHI proof notarization ledger connectivity</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <label className="text-white/80 font-semibold block">
                  Ethereum EVM RPC Endpoint URL
                </label>
                <input
                  type="text"
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white font-mono text-xs focus:border-indigo-500 outline-none"
                />
                <span className="text-[11px] text-white/40 block">
                  Default: Local Hardhat Node (http://127.0.0.1:8545)
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-white/80 font-semibold block">
                  EMRIntegrityRegistry Contract Address
                </label>
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-cyan-400 font-mono text-xs focus:border-indigo-500 outline-none"
                />
                <span className="text-[11px] text-white/40 block">Verified Solidity smart contract</span>
              </div>

              <div className="space-y-2">
                <label className="text-white/80 font-semibold block">
                  Automatic Batch Sealing Cadence
                </label>
                <select
                  value={autoSealInterval}
                  onChange={(e) => setAutoSealInterval(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-xs focus:border-indigo-500 outline-none"
                >
                  <option value="REALTIME">Immediate On-Write (Default for Emergency & Prescriptions)</option>
                  <option value="HOURLY">Hourly Batch Digest</option>
                  <option value="DAILY">Daily Epoch Digest</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-white/80 font-semibold block">
                  Hashing Specification Standard
                </label>
                <input
                  type="text"
                  disabled
                  value="Canonical JSON + FIPS 180-4 SHA-256 (Strict Zero-PHI)"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#101012] text-white/50 font-mono text-xs"
                />
                <span className="text-[11px] text-white/40 block">Mandated by national digital health protocol</span>
              </div>
            </div>
          </div>

          {/* Emergency Trauma Bypass Policies */}
          <div className="p-6 sm:p-8 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Emergency Bypass Timers & Notifications</h2>
                <p className="text-xs text-white/50">Trauma protocol parameters and automated escalation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <label className="text-white/80 font-semibold block">
                  Emergency Session Auto-Expiry (Minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={emergencyTimeoutMinutes}
                  onChange={(e) => setEmergencyTimeoutMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-xs focus:border-rose-500 font-mono outline-none"
                />
                <span className="text-[11px] text-white/40 block">
                  Session locks automatically once elapsed (Default: 120 min)
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-white/80 font-semibold block">
                  Failed Authentication Rate-Limit Threshold
                </label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={failedLoginThreshold}
                  onChange={(e) => setFailedLoginThreshold(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-xs focus:border-rose-500 font-mono outline-none"
                />
                <span className="text-[11px] text-white/40 block">
                  Attempts before account lockdown & security alert trigger
                </span>
              </div>

              <div className="space-y-3 md:col-span-2 pt-2">
                <span className="text-white/80 font-semibold block">Emergency Notification Channels</span>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertSmsDispatch}
                      onChange={(e) => setAlertSmsDispatch(e.target.checked)}
                      className="rounded-md border-white/20 bg-[#141416] text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-white/70 font-medium">Instant SMS Broadcast to Registered Contact</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertEmailDispatch}
                      onChange={(e) => setAlertEmailDispatch(e.target.checked)}
                      className="rounded-md border-white/20 bg-[#141416] text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-white/70 font-medium">Encrypted Email Alert to Patient Account</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Retention & Compliance */}
          <div className="p-6 sm:p-8 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Audit & Compliance Retention</h2>
                <p className="text-xs text-white/50">WORM (Write Once Read Many) append-only storage policy</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <label className="text-white/80 font-semibold block">
                  Minimum Audit Retention Period (Years)
                </label>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={auditRetentionYears}
                  onChange={(e) => setAuditRetentionYears(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-xs font-mono focus:border-emerald-500 outline-none"
                />
                <span className="text-[11px] text-white/40 block">HIPAA & NMC mandates minimum 7 years</span>
              </div>

              <div className="space-y-2">
                <label className="text-white/80 font-semibold block">
                  Database Engine Provider Mode
                </label>
                <input
                  type="text"
                  disabled
                  value="SQLite (Active Development) ↔ PostgreSQL Ready"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-[#101012] text-white/50 font-mono text-xs"
                />
                <span className="text-[11px] text-white/40 block">Switchable via DATABASE_URL environment variable</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-950/40 flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Apply Global System Parameters</span>
            </button>
          </div>
        </ScrollRevealGroup>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
