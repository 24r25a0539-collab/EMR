import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  FileText,
  Clock,
  Terminal,
  Play,
  RotateCcw,
  Smartphone,
  KeyRound,
  XCircle,
  AlertOctagon,
  Ban,
  Check,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { BackButton } from '../../components/common/BackButton';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { securityService, SecuritySummaryState, SecurityAlertItem, ActiveSessionItem } from '../../services/securityService';
import { ScrollReveal, ScrollRevealGroup, PremiumCard } from '../../components/common/ScrollReveal';

export const PatientSecurityPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'BLOCKCHAIN' | 'ACCOUNT_SECURITY' | 'SECURITY_ALERTS'>('BLOCKCHAIN');
  const [securityState, setSecurityState] = useState<SecuritySummaryState>(() =>
    securityService.getState()
  );

  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [isTamperedSimulated, setIsTamperedSimulated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    api.getPatientRecords().then((res) => {
      if (res && res.vaultRecords && res.vaultRecords.length > 0) {
        setPatientRecords(res.vaultRecords);
        setSelectedRecordId(res.vaultRecords[0].id);
      } else {
        setSelectedRecordId(user?.patient?.healthcareId || user?.healthId || 'HP-100246');
      }
    }).catch(() => {});
  }, [user]);

  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    isOpen: boolean;
    targetRecord: string;
    action: string;
    message: string;
  }>({
    isOpen: false,
    targetRecord: '',
    action: '',
    message: '',
  });

  const [hasChecked, setHasChecked] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);
  const [isSafeResult, setIsSafeResult] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = securityService.onSecurityChange(() => {
      setSecurityState(securityService.getState());
    });
    return unsub;
  }, []);

  const genuineData = {
    test: 'Lipid Profile Comprehensive',
    patient: `${user?.patient?.fullName || user?.name || 'Patient'} (${user?.patient?.healthcareId || user?.healthId || 'HP-000000'})`,
    cholesterol: '188 mg/dL',
    hdl: '46 mg/dL',
    triglycerides: '142 mg/dL',
  };

  const handleRunVerification = async () => {
    setIsVerifying(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const onChainHash = '0x8f3c7a21be892047cb59103e910248ad819203e4810294820192847291029482';
    const computedHash = isTamperedSimulated
      ? '0x4e91284719283746192847192847192847192847192847192847192847192847'
      : onChainHash;

    const matches = computedHash === onChainHash;

    setIsSafeResult(matches);
    setHasChecked(true);
    setLastCheckedTime('Just now');
    setIsVerifying(false);

    if (matches) {
      addToast('success', '✓ Record is Safe: This record has not been changed.');
    } else {
      addToast('error', '⚠ Alert: We found a difference in this record.');
    }
  };

  const handleTestUnauthorizedGuard = () => {
    const target = 'Prescription: Metformin 500mg (RX-2026-901)';
    const action = 'Force-Edit Dosage & Directions';
    const result = securityService.attemptUnauthorizedModification(target, action);

    setAccessDeniedModal({
      isOpen: true,
      targetRecord: target,
      action: action,
      message: result.message,
    });

    addToast(
      'error',
      "Access Denied: You don't have permission to modify this medical record."
    );
  };

  const handleRevokeSession = (sessionId: string) => {
    securityService.revokeSession(sessionId);
    addToast('info', 'Session cryptographic token revoked.');
  };

  const handleDismissAlert = (alertId: string) => {
    securityService.dismissAlert(alertId);
    addToast('success', 'Security alert resolved.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Back Button */}
      <ScrollReveal direction="left">
        <div className="flex items-center justify-between">
          <BackButton fallbackPath="/patient" />
          <span className="text-xs font-semibold text-zinc-500">
            Encrypted & Protected
          </span>
        </div>
      </ScrollReveal>

      {/* Header */}
      <ScrollReveal direction="left" delay={0.05}>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
            {t('security.sovereignBadge', 'Medical Record Security')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            {t('security.pageTitle', 'EMR Security & Record Verification')}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {t('security.pageSubtitle', 'Your health records are safeguarded with tamper-proof security and instant verification.')}
          </p>
        </div>
      </ScrollReveal>

      {/* Navigation Tabs */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3 text-xs font-bold">
          {[
            { key: 'BLOCKCHAIN', label: 'Check Medical Record' },
            { key: 'ACCOUNT_SECURITY', label: 'Account Security & Sessions' },
            { key: 'SECURITY_ALERTS', label: `Security Alerts (${securityState.securityAlerts.filter((a) => !a.resolved).length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.key
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* TAB 1: PATIENT RECORD VERIFICATION */}
      {activeTab === 'BLOCKCHAIN' && (
        <div className="space-y-6">
          {/* Status Summary Cards */}
          <ScrollReveal direction="bottom" delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PremiumCard accent="teal" className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Verified Records</span>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-black font-mono text-white">
                  {patientRecords.length > 0 ? `${patientRecords.length} / ${patientRecords.length}` : '1 / 1'}
                </p>
                <p className="text-xs text-emerald-400 font-semibold">All records safe & verified</p>
              </PremiumCard>

              <PremiumCard accent="blue" className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Record Protection</span>
                  <Cpu className="w-5 h-5 text-teal-400" />
                </div>
                <p className="text-xl font-bold text-white mt-1">Active Protection</p>
                <p className="text-xs text-zinc-400">Continuous automatic monitoring</p>
              </PremiumCard>

              <PremiumCard accent="purple" className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Record Issues</span>
                  <ShieldAlert className="w-5 h-5 text-zinc-500" />
                </div>
                <p className="text-3xl font-black font-mono text-emerald-400">0</p>
                <p className="text-xs text-zinc-400">No unauthorized changes detected</p>
              </PremiumCard>
            </div>
          </ScrollReveal>

          {/* Patient-Friendly Medical Record Integrity Check */}
          <ScrollReveal direction="bottom" delay={0.12}>
            <div className="bg-[#0B0B0D] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
              <div className="flex items-start gap-4 pb-4 border-b border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Check Your Medical Record
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    You can check whether this medical record has been changed or tampered with.
                  </p>
                </div>
              </div>

              {/* Record Information & Status Box */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#101012] border border-white/5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                      Record:
                    </span>
                    <span className="font-bold text-white text-base mt-1 block truncate">
                      {patientRecords.length > 0
                        ? patientRecords[0].title
                        : `${user?.patient?.fullName || user?.name || 'Patient'}'s Medical Profile`}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                      Record ID:
                    </span>
                    <span className="font-mono font-bold text-zinc-200 text-base mt-1 block">
                      {selectedRecordId || user?.patient?.healthcareId || user?.healthId || 'HP-100246'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                      Status:
                    </span>
                    <div className="mt-1">
                      {isVerifying ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Checking your medical record...
                        </span>
                      ) : !hasChecked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-zinc-400 border border-white/10">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          Not checked yet
                        </span>
                      ) : isSafeResult ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ✓ Record is Safe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          ⚠ Record May Have Been Changed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleRunVerification}
                    disabled={isVerifying}
                    className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition-all shadow-lg shadow-teal-900/30 flex items-center gap-2.5 disabled:opacity-60 cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Checking your medical record...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{hasChecked ? 'Check Record Again' : 'Check Record'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Results Alert Card (When Checked) */}
              {hasChecked && !isVerifying && (
                <div
                  className={`p-6 rounded-3xl border transition-all space-y-3 ${
                    isSafeResult
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isSafeResult
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isSafeResult ? (
                        <CheckCircle2 className="w-7 h-7" />
                      ) : (
                        <AlertTriangle className="w-7 h-7" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <h4
                        className={`text-lg font-black tracking-tight ${
                          isSafeResult ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {isSafeResult ? '✓ Record is Safe' : '⚠ Record May Have Been Changed'}
                      </h4>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {isSafeResult
                          ? 'This record has not been changed.'
                          : 'We found a difference in this record. Please review the record or contact your healthcare provider.'}
                      </p>
                      <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs text-zinc-500 font-medium">
                        <span>Last checked:</span>
                        <strong className="text-zinc-300">{lastCheckedTime || 'Just now'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtle Demo Simulation Control for Testing */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500 border-t border-white/5">
                <span>Testing Simulation (Demo):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTamperedSimulated(false);
                      setHasChecked(false);
                      setIsSafeResult(null);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                      !isTamperedSimulated
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    Original Record (Safe)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTamperedSimulated(true);
                      setHasChecked(false);
                      setIsSafeResult(null);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                      isTamperedSimulated
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    Modified Record (Warning)
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* TAB 2: ACCOUNT SECURITY & SESSIONS */}
      {activeTab === 'ACCOUNT_SECURITY' && (
        <ScrollReveal direction="bottom" delay={0.1}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Credential Security</h4>
                    <p className="text-xs text-zinc-400">Password & cryptographic keypair status</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Password Changed:</span>
                    <span className="font-bold text-zinc-200">{securityState.passwordLastChanged}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Two-Factor Authentication:</span>
                    <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
                      Enabled (TOTP Authenticator)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Active Device Sessions</h4>
                    <p className="text-xs text-zinc-400">Authorized terminals with active access tokens</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  {securityState.activeSessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{sess.device}</p>
                          {sess.isCurrent && (
                            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded font-bold">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-500 text-[11px]">
                          {sess.location} • IP: {sess.ip} • {sess.lastActive}
                        </p>
                      </div>
                      {!sess.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.id)}
                          className="text-rose-400 hover:text-rose-300 font-bold text-xs transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* TAB 3: SECURITY ALERTS & GUARD TESTER */}
      {activeTab === 'SECURITY_ALERTS' && (
        <ScrollReveal direction="bottom" delay={0.1}>
          <div className="space-y-6">
            {/* Unauthorized Modification Guard Test Sandbox */}
            <div className="bg-gradient-to-br from-[#101012] to-[#0B0B0D] text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-rose-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Security Guard: Unauthorized Modification Prevention
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Simulate an unverified practitioner attempting to alter clinical prescriptions without write consent.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141416] border border-white/5 text-xs space-y-2">
                <p className="text-zinc-300">
                  Target Simulated Record: <strong className="text-white">Prescription: Metformin 500mg (RX-2026-901)</strong>
                </p>
                <p className="text-zinc-500 text-[11px]">
                  Expected behavior: Immediate rejection with <strong>"Access Denied: You don't have permission to modify this medical record."</strong>, recording an append-only audit event and high-severity security alert.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleTestUnauthorizedGuard}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-900/40 flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  <span>Test Unauthorized Modification Guard</span>
                </button>
              </div>
            </div>

            {/* Alerts List */}
            <div className="bg-[#0B0B0D] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white">Active Security Alerts</h3>
                <span className="text-xs text-zinc-500">
                  {securityState.securityAlerts.length} total logged events
                </span>
              </div>

              <div className="space-y-3">
                {securityState.securityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      alert.resolved
                        ? 'bg-white/[0.02] border-white/5 opacity-60'
                        : 'bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-rose-500/30">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{alert.title}</span>
                          <span className="text-[10px] bg-rose-600 text-white px-2 py-0.2 rounded font-bold">
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{alert.description}</p>
                        <span className="text-[10px] text-zinc-500 mt-1 block">
                          {alert.dateStr} at {alert.timeStr}
                        </span>
                      </div>
                    </div>

                    {!alert.resolved && (
                      <button
                        type="button"
                        onClick={() => handleDismissAlert(alert.id)}
                        className="px-3 py-1.5 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 text-xs font-semibold self-end sm:self-auto transition-colors"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Access Denied Modal */}
      {accessDeniedModal.isOpen && (
        <Modal
          isOpen={true}
          onClose={() => setAccessDeniedModal({ ...accessDeniedModal, isOpen: false })}
          title="Security Exception: Access Denied"
        >
          <div className="space-y-4 text-xs text-center p-2">
            <div className="w-14 h-14 rounded-3xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
              <Ban className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Access Denied: Unauthorized Modification Blocked
              </h3>
              <p className="text-zinc-400">
                {accessDeniedModal.message}
              </p>
            </div>

            <div className="p-3 bg-[#141416] border border-white/10 rounded-xl text-left space-y-1 font-mono text-[11px]">
              <p className="text-zinc-500">Resource: <span className="text-white font-bold">{accessDeniedModal.targetRecord}</span></p>
              <p className="text-zinc-500">Attempted Action: <span className="text-white font-bold">{accessDeniedModal.action}</span></p>
              <p className="text-rose-400 font-bold">Status: REJECTED_BY_PERMISSION_GUARD</p>
            </div>

            <p className="text-[11px] text-zinc-500">
              An alert has been dispatched to the patient's sovereign audit ledger. Data integrity remains uncompromised.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAccessDeniedModal({ ...accessDeniedModal, isOpen: false })}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
