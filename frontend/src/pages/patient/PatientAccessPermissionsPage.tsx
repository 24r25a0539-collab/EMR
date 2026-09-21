import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Lock,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Stethoscope,
  Building2,
  Calendar,
  Check,
  X,
  AlertOctagon,
  Eye,
  Plus,
  Search,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  UserCheck,
  FileText,
  EyeOff,
  Sliders,
  FileCheck,
  Loader2,
  CheckCheck,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { BackButton } from '../../components/common/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  documentPrivacyService,
  PatientDocumentItem,
  DocumentVisibility,
} from '../../services/documentPrivacyService';
import { ScrollReveal, ScrollRevealGroup, PremiumCard } from '../../components/common/ScrollReveal';

export const PatientAccessPermissionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { t, localizeValue } = useLanguage();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [tab, setTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'EXPIRED' | 'REVOKED' | 'DOCUMENT_PRIVACY'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  // PostgreSQL State
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);

  // Review & Details Modal states
  const [reviewingRequest, setReviewingRequest] = useState<any | null>(null);
  const [reviewScope, setReviewScope] = useState<string[]>(['Consultations', 'Prescriptions', 'Lab Reports']);
  const [reviewDurationDays, setReviewDurationDays] = useState<number>(3);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState<boolean>(false);

  // Rejection Modal state
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // Revocation Modal state
  const [revokingPermission, setRevokingPermission] = useState<any | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  // Document privacy state
  const [documents, setDocuments] = useState<PatientDocumentItem[]>([]);
  const [updatingDocId, setUpdatingDocId] = useState<string | null>(null);

  // Proactive Grant Modal state
  const [showGrantWizard, setShowGrantWizard] = useState<boolean>(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'Consultations',
    'Prescriptions',
    'Lab Reports',
  ]);
  const [selectedDurationDays, setSelectedDurationDays] = useState<number>(3);
  const [grantReason, setGrantReason] = useState('Patient-initiated clinical consultation');

  const availableScopes = [
    'Basic Profile',
    'Consultations',
    'Prescriptions',
    'Lab Reports',
    'Medical History',
    'Medicines',
    'Allergies',
    'Full EMR',
  ];

  const durationOptions = [
    { label: '1 Hour', days: 1 / 24, hours: 1 },
    { label: '6 Hours', days: 6 / 24, hours: 6 },
    { label: '12 Hours', days: 12 / 24, hours: 12 },
    { label: '1 Day', days: 1 },
    { label: '2 Days', days: 2 },
    { label: '3 Days (Recommended)', days: 3 },
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: 'Allow Forever', days: 0, isForever: true },
  ];

  // Fetch real data from PostgreSQL
  const loadData = useCallback(async () => {
    const token = localStorage.getItem('emr_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [res, docsRes] = await Promise.all([
        api.getAccessPermissions().catch((e) => {
          console.error('Failed to fetch access permissions:', e);
          return { success: false, requests: [], permissions: [], error: e.message };
        }),
        api.getDocuments().catch((e) => {
          console.error('Failed to fetch documents:', e);
          return { success: false, documents: [], error: e.message };
        }),
      ]);

      if (res && res.success) {
        const reqs = res.requests || res.data?.requests || [];
        const perms = res.permissions || res.data?.permissions || [];
        setAccessRequests(reqs);
        setPermissions(perms);

        // Check if there is a specific requestId in search params
        const targetReqId = searchParams.get('requestId') || searchParams.get('id');
        if (targetReqId) {
          const matchReq = reqs.find((r: any) => r.id === targetReqId);
          const matchPerm = perms.find((p: any) => p.id === targetReqId || p.accessRequestId === targetReqId);
          if (matchReq) {
            handleOpenReview(matchReq);
          } else if (matchPerm) {
            handleOpenReview({
              ...matchPerm,
              status: matchPerm.status,
              reason: matchPerm.reason || 'Authorized sovereign EMR access grant',
            });
          }
        }
      } else if (res && !res.success && res.error && !res.error.includes('AUTHENTICATION_REQUIRED')) {
        addToast('error', res.error || 'Unable to load access permissions from database.');
      }

      if (docsRes && docsRes.success && Array.isArray(docsRes.documents)) {
        setDocuments(docsRes.documents);
      }
    } catch (err: any) {
      console.error('Failed to load access permissions:', err);
      if (!err.message?.includes('AUTHENTICATION_REQUIRED') && !err.message?.includes('401')) {
        addToast('error', err.message || 'Unable to load access permissions from database.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleToggleVisibility = async (doc: PatientDocumentItem) => {
    try {
      setUpdatingDocId(doc.id);
      const nextVisibility: DocumentVisibility = doc.visibility === 'PRIVATE' ? 'NORMAL' : 'PRIVATE';
      const res = await api.updateDocumentPrivacy(doc.id, { visibility: nextVisibility });
      if (res && res.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, visibility: nextVisibility } : d))
        );
        addToast(
          'success',
          `"${doc.title}" visibility updated to ${nextVisibility === 'PRIVATE' ? 'CONFIDENTIAL (Private)' : 'PUBLIC (Standard Access)'}.`
        );
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update document privacy.');
    } finally {
      setUpdatingDocId(null);
    }
  };

  const handleToggleEmergencyAccess = async (doc: PatientDocumentItem) => {
    try {
      setUpdatingDocId(doc.id);
      const nextEmergency = !doc.allowEmergencyAccess;
      const res = await api.updateDocumentPrivacy(doc.id, { allowEmergencyAccess: nextEmergency });
      if (res && res.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, allowEmergencyAccess: nextEmergency } : d))
        );
        addToast(
          'success',
          `Emergency access for "${doc.title}" is now ${nextEmergency ? 'ALLOWED in verified emergency' : 'BLOCKED from emergency override'}.`
        );
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update emergency access.');
    } finally {
      setUpdatingDocId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenReview = (request: any) => {
    setReviewingRequest(request);
    let parsedScopes: string[] = ['Consultations', 'Prescriptions', 'Lab Reports'];
    try {
      if (request.scopeJson) {
        const s = JSON.parse(request.scopeJson);
        if (Array.isArray(s) && s.length > 0) parsedScopes = s;
      }
    } catch {}
    setReviewScope(parsedScopes);
    setReviewDurationDays(request.durationDays || 3);
  };

  const handleConfirmApprove = async () => {
    if (!reviewingRequest) return;
    try {
      setIsApproving(true);
      const selectedOpt = durationOptions.find((d) => d.days === reviewDurationDays);
      const durationLabel = reviewDurationDays === 0 ? 'Forever' : (selectedOpt ? selectedOpt.label : `${reviewDurationDays} days`);
      const isForever = reviewDurationDays === 0;

      const res = await api.approveAccessRequest(
        reviewingRequest.id,
        reviewScope,
        reviewDurationDays,
        isForever,
        selectedOpt?.hours
      );
      if (res && res.success) {
        addToast(
          'success',
          `EMR access granted to Dr. ${reviewingRequest.doctor?.fullName || 'Doctor'} (${durationLabel}). Status is now ACTIVE.`
        );
        setShowApproveConfirm(false);
        setReviewingRequest(null);
        // Clear search params if any
        if (searchParams.get('requestId')) {
          setSearchParams({});
        }
        await loadData();
        await refreshNotifications();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to approve access request.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    try {
      setIsRejecting(true);
      const res = await api.rejectAccessRequest(
        rejectingRequest.id,
        rejectionReason || 'Declined by patient'
      );
      if (res && res.success) {
        addToast('info', 'Doctor access request declined.');
        setRejectingRequest(null);
        setRejectionReason('');
        if (reviewingRequest?.id === rejectingRequest.id) {
          setReviewingRequest(null);
        }
        if (searchParams.get('requestId')) {
          setSearchParams({});
        }
        await loadData();
        await refreshNotifications();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to reject access request.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokingPermission) return;
    try {
      setIsRevoking(true);
      const res = await api.revokePermission(
        revokingPermission.id,
        revokeReason || 'Revoked by patient'
      );
      if (res && res.success) {
        addToast('warning', 'Active EMR access permission revoked immediately. Doctor cannot access records.');
        setRevokingPermission(null);
        setRevokeReason('');
        await loadData();
        await refreshNotifications();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to revoke permission.');
    } finally {
      setIsRevoking(false);
    }
  };

  const toggleReviewScope = (scope: string) => {
    setReviewScope((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  // Filtered lists
  const pendingRequests = accessRequests.filter((r) => r.status === 'PENDING');
  const approvedPermissions = permissions.filter((p) => p.status === 'ACTIVE' && (!p.expiresAt || new Date(p.expiresAt) > new Date()));
  const expiredPermissions = permissions.filter((p) => p.status === 'EXPIRED' || (p.status === 'ACTIVE' && p.expiresAt && new Date(p.expiresAt) <= new Date()));
  const revokedPermissions = permissions.filter((p) => p.status === 'REVOKED');

  const parseScopes = (scopeJson?: string): string[] => {
    if (!scopeJson) return ['Consultations', 'Prescriptions', 'Lab Reports'];
    try {
      const parsed = JSON.parse(scopeJson);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return [scopeJson];
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/patient" />
      </div>

      {/* Page Header */}
      <ScrollReveal direction="left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-health-600 dark:text-teal-400 bg-health-50 dark:bg-teal-950/40 px-3 py-1 rounded-full border border-teal-200/60 dark:border-teal-800/40">
              Data Sovereignty & Access Control
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              Access & Privacy Permissions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage, approve, and revoke doctor access to your sovereign medical records. You have total control.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Tabs */}
      <ScrollReveal direction="center" delay={0.04}>
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-bold overflow-x-auto">
          {[
            { label: 'All Permissions', key: 'ALL', count: accessRequests.length + permissions.length },
            { label: 'Pending Requests', key: 'PENDING', count: pendingRequests.length, highlight: pendingRequests.length > 0 },
            { label: 'Active Permissions', key: 'APPROVED', count: approvedPermissions.length },
            { label: 'Expired', key: 'EXPIRED', count: expiredPermissions.length },
            { label: 'Revoked', key: 'REVOKED', count: revokedPermissions.length },
            { label: 'Document Privacy', key: 'DOCUMENT_PRIVACY', count: documents.length },
          ].map((tItem) => (
            <button
              key={tItem.key}
              onClick={() => setTab(tItem.key as any)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                tab === tItem.key
                  ? 'bg-health-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tItem.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  tab === tItem.key
                    ? 'bg-white/20 text-white'
                    : tItem.highlight
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tItem.count}
              </span>
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Loading Indicator */}
      {loading && (
        <div className="p-12 text-center bg-white dark:bg-[#0D1420] rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Loader2 className="w-8 h-8 text-health-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading access permissions from PostgreSQL...</p>
        </div>
      )}

      {/* Tab: DOCUMENT PRIVACY */}
      {!loading && tab === 'DOCUMENT_PRIVACY' && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                  Granular Document-Level Privacy & Emergency Control
                </p>
                <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">
                  Set specific clinical records as confidential (Private) to hide them from standard doctor EMR access, or manage emergency break-glass permissions.
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-slate-700 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#0D1420] rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No medical documents available.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                You have no medical records, prescriptions, lab reports, or clinical consultations on file yet. Records created during appointments or hospital visits will automatically appear here with full privacy controls.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {documents.map((doc) => {
                const isPrivate = doc.visibility === 'PRIVATE';
                const isEmergencyAllowed = doc.allowEmergencyAccess;
                const isUpdating = updatingDocId === doc.id;

                return (
                  <div
                    key={doc.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      isPrivate
                        ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
                        : 'bg-white dark:bg-[#0D1420] border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top row: Title + Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`p-2.5 rounded-xl flex-shrink-0 ${
                              isPrivate
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                                : 'bg-health-50 dark:bg-health-950/30 text-health-600'
                            }`}
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {doc.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {doc.category} • {doc.date}
                            </p>
                            {doc.doctorName && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Provider: Dr. {doc.doctorName} {doc.hospital ? `• ${doc.hospital}` : ''}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 ${
                              isPrivate
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            }`}
                          >
                            {isPrivate ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{isPrivate ? 'PRIVATE' : 'PUBLIC'}</span>
                          </span>

                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              isEmergencyAllowed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {isEmergencyAllowed ? 'Emergency: Allowed' : 'Emergency: Blocked'}
                          </span>
                        </div>
                      </div>

                      {/* Blockchain hash & Access Explanation */}
                      {doc.sha256 && (
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                          <span className="truncate">SHA-256: {doc.sha256}</span>
                          <span className="text-teal-600 font-bold flex-shrink-0">✓ Verified</span>
                        </div>
                      )}

                      <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {documentPrivacyService.getAccessExplanation(doc)}
                      </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleVisibility(doc)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isPrivate
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:border-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isPrivate ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          <span>{isPrivate ? 'Make Public' : 'Make Confidential'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleEmergencyAccess(doc)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            isEmergencyAllowed
                              ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sliders className="w-3.5 h-3.5" />
                          )}
                          <span>{isEmergencyAllowed ? 'Block Emergency' : 'Allow in Emergency'}</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">
                        ID: {doc.id.substring(0, 12)}...
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: PENDING REQUESTS OR GENERAL LIST */}
      {!loading && tab !== 'DOCUMENT_PRIVACY' && (
        <div className="space-y-6">
          {/* SECTION 1: Pending Doctor Requests */}
          {(tab === 'ALL' || tab === 'PENDING') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Pending Doctor Access Requests ({pendingRequests.length})</span>
                </h2>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#0D1420] rounded-2xl border border-slate-200 dark:border-slate-800">
                  <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Pending Requests</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No doctor is currently waiting for your consent approval.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 bg-amber-50/40 dark:bg-amber-950/10 border-2 border-amber-300 dark:border-amber-700/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl flex-shrink-0">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              Dr. {req.doctor?.fullName || 'Doctor'}
                            </h3>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified Doctor</span>
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Licence: {req.doctor?.registrationNumber || req.doctor?.doctorIdNumber || 'Verified'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {req.doctor?.specialization || 'General Medicine'} • {req.doctor?.hospitalAffiliation || req.hospital?.name || 'Apex Health City'}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Requested Scope:</span>
                            {parseScopes(req.scopeJson).map((s, idx) => (
                              <span key={idx} className="px-2 py-0.5 text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300">
                                {s}
                              </span>
                            ))}
                            <span className="text-xs font-bold text-slate-500 ml-2">Duration: {req.requestedDuration || `${req.durationDays} Days`}</span>
                          </div>

                          <p className="text-xs text-amber-800 dark:text-amber-300 italic">
                            Reason: "{req.reason || 'Medical consultation & clinical evaluation'}"
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Requested on {new Date(req.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleOpenReview(req)}
                          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => {
                            setReviewingRequest(req);
                            setShowApproveConfirm(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-health-600 hover:bg-health-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setRejectingRequest(req);
                            setRejectionReason('');
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-bold transition-colors border border-rose-200 dark:border-rose-800"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: Active / Expired / Revoked Permissions */}
          {(tab === 'ALL' || tab === 'APPROVED' || tab === 'EXPIRED' || tab === 'REVOKED') && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-health-600" />
                <span>Granted Access Permissions ({permissions.length})</span>
              </h2>

              {permissions.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#0D1420] rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Lock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Permissions on Record</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">You have not granted access permissions yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions
                    .filter((p) => {
                      if (tab === 'APPROVED') return p.status === 'ACTIVE' && (!p.expiresAt || new Date(p.expiresAt) > new Date());
                      if (tab === 'EXPIRED') return p.status === 'EXPIRED' || (p.status === 'ACTIVE' && p.expiresAt && new Date(p.expiresAt) <= new Date());
                      if (tab === 'REVOKED') return p.status === 'REVOKED';
                      return true;
                    })
                    .map((p) => {
                      const isCurrentlyActive = p.status === 'ACTIVE' && (!p.expiresAt || new Date(p.expiresAt) > new Date());
                      const isExpired = p.status === 'EXPIRED' || (p.status === 'ACTIVE' && p.expiresAt && new Date(p.expiresAt) <= new Date());
                      const isRevoked = p.status === 'REVOKED';

                      return (
                        <div
                          key={p.id}
                          className="p-5 bg-white dark:bg-[#0D1420] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-health-50 dark:bg-health-950/30 text-health-600 rounded-xl">
                                  <Stethoscope className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Dr. {p.doctor?.fullName || 'Doctor'}
                                  </h3>
                                  <p className="text-xs text-slate-500">
                                    Licence: {p.doctor?.registrationNumber || p.doctor?.doctorIdNumber || 'Verified'}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                  isCurrentlyActive
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : isRevoked
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {isCurrentlyActive ? 'ACTIVE' : isRevoked ? 'REVOKED' : 'EXPIRED'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                              <p>
                                <strong className="text-slate-800 dark:text-slate-200">Permitted Scopes:</strong>{' '}
                                {parseScopes(p.scopeJson).join(', ')}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {p.expiresAt ? `Expires: ${new Date(p.expiresAt).toLocaleString()}` : 'Access: Forever (No normal expiry)'}
                              </p>
                              {p.blockchainProofId && (
                                <p className="text-[10px] font-mono text-teal-600 truncate">
                                  Blockchain Proof: {p.blockchainProofId}
                                </p>
                              )}
                            </div>
                          </div>

                          {isCurrentlyActive && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                              <button
                                onClick={() => {
                                  setRevokingPermission(p);
                                  setRevokeReason('');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-bold transition-colors"
                              >
                                Revoke Access
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ACCESS REQUEST DETAILS & REVIEW MODAL                                   */}
      {/* ========================================================================= */}
      {reviewingRequest && (
        <Modal
          isOpen={!!reviewingRequest}
          onClose={() => {
            setReviewingRequest(null);
            if (searchParams.get('requestId')) setSearchParams({});
          }}
          title={
            reviewingRequest.status === 'PENDING'
              ? 'Review Doctor Access Request'
              : reviewingRequest.status === 'APPROVED' || reviewingRequest.status === 'ACTIVE'
              ? 'Authorized Doctor Access Clearance'
              : reviewingRequest.status === 'REJECTED'
              ? 'Declined Doctor Access Request'
              : reviewingRequest.status === 'REVOKED'
              ? 'Revoked Doctor Access Permission'
              : 'Expired Doctor Access Permission'
          }
        >
          <div className="space-y-6">
            {/* Doctor Info Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-4">
              <ProfileAvatar
                name={reviewingRequest.doctor?.fullName || 'Doctor'}
                role="DOCTOR"
                size="lg"
                shape="rounded"
              />
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    Dr. {reviewingRequest.doctor?.fullName || 'Doctor'}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {reviewingRequest.doctor?.specialization || 'General Medicine'} • {reviewingRequest.doctor?.qualifications || 'MBBS'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Hospital: {reviewingRequest.doctor?.hospitalAffiliation || reviewingRequest.hospital?.name || 'Apex Health City'}
                </p>
                <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  Medical Licence: {reviewingRequest.doctor?.registrationNumber || reviewingRequest.doctor?.doctorIdNumber || 'Verified'}
                </p>
              </div>
            </div>

            {/* STATUS VIEW: APPROVED / ACTIVE */}
            {(reviewingRequest.status === 'APPROVED' || reviewingRequest.status === 'ACTIVE') && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>✓ ACCESS GRANTED</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    This doctor currently has authorized consent to access your specified clinical records.
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-1 border-emerald-200/60 dark:border-emerald-800/30">
                    <div><strong>Approved Scopes:</strong> {reviewingRequest.approvedScope || reviewScope.join(', ')}</div>
                    <div><strong>Access Duration:</strong> {reviewingRequest.expiresAt ? new Date(reviewingRequest.expiresAt).toLocaleString() : 'Forever (Active until manually revoked)'}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const permToRevoke = permissions.find((p) => p.doctorId === reviewingRequest.doctorId && p.status === 'ACTIVE') || reviewingRequest;
                      setRevokingPermission(permToRevoke);
                      setReviewingRequest(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400 text-xs font-bold transition-colors"
                  >
                    Revoke Access
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewingRequest(null);
                      if (searchParams.get('requestId')) setSearchParams({});
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* STATUS VIEW: REJECTED */}
            {reviewingRequest.status === 'REJECTED' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>DECLINED REQUEST</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                      REJECTED
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    You declined this doctor's EMR access request. The doctor has no access to your clinical records.
                  </p>
                  {reviewingRequest.reason && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <strong>Original Reason:</strong> "{reviewingRequest.reason}"
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewingRequest(null);
                      if (searchParams.get('requestId')) setSearchParams({});
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* STATUS VIEW: REVOKED */}
            {reviewingRequest.status === 'REVOKED' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>REVOKED PERMISSION</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                      REVOKED
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    This consent clearance was revoked. The doctor cannot access your EMR.
                  </p>
                  {reviewingRequest.revokeReason && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <strong>Revocation Reason:</strong> "{reviewingRequest.revokeReason}"
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewingRequest(null);
                      if (searchParams.get('requestId')) setSearchParams({});
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* STATUS VIEW: EXPIRED */}
            {reviewingRequest.status === 'EXPIRED' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>EXPIRED PERMISSION</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-600 text-white">
                      EXPIRED
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    This access clearance duration has elapsed.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewingRequest(null);
                      if (searchParams.get('requestId')) setSearchParams({});
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* STATUS VIEW: PENDING (Show Approve / Reject Actions) */}
            {reviewingRequest.status === 'PENDING' && (
              <>
                {/* Request Context */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Clinical Reason for Request
                  </h4>
                  <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      "{reviewingRequest.reason || 'Medical Consultation & EMR Review'}"
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Requested on {new Date(reviewingRequest.createdAt).toLocaleString()} • Status: <strong className="text-amber-600">PENDING CONSENT</strong>
                    </p>
                  </div>
                </div>

                {/* Scope Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Approved Record Scopes
                    </h4>
                    <span className="text-[11px] text-health-600 font-semibold">
                      {reviewScope.length} scopes selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableScopes.map((scope) => {
                      const isChecked = reviewScope.includes(scope);
                      return (
                        <button
                          key={scope}
                          type="button"
                          onClick={() => toggleReviewScope(scope)}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                            isChecked
                              ? 'bg-health-50 border-health-500 text-health-900 dark:bg-health-950/30 dark:border-health-600 dark:text-health-300'
                              : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span>{scope}</span>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              isChecked
                                ? 'bg-health-600 border-health-600 text-white'
                                : 'border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Selector */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Grant Access Duration
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {durationOptions.map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setReviewDurationDays(opt.days)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                          reviewDurationDays === opt.days
                            ? 'bg-health-600 border-health-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingRequest(reviewingRequest);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-colors"
                  >
                    Reject Request
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewingRequest(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApproveConfirm(true)}
                      disabled={reviewScope.length === 0}
                      className="px-6 py-2.5 rounded-xl bg-health-600 hover:bg-health-700 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Access</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 2. APPROVE ACCESS CONFIRMATION DIALOG                                     */}
      {/* ========================================================================= */}
      {showApproveConfirm && reviewingRequest && (
        <ConfirmationDialog
          isOpen={showApproveConfirm}
          title="Confirm EMR Access Permission"
          message={`Are you sure you want to grant Dr. ${reviewingRequest.doctor?.fullName || 'Doctor'} access to your medical records (${reviewScope.join(', ')}) for ${reviewDurationDays === 0 ? 'Forever' : `${reviewDurationDays} days`}? You can revoke this permission at any time.`}
          confirmText={isApproving ? "Granting Access..." : "Yes, Grant Access"}
          cancelText="Cancel"
          variant="info"
          isLoading={isApproving}
          onConfirm={handleConfirmApprove}
          onClose={() => setShowApproveConfirm(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. REJECT ACCESS REQUEST DIALOG                                           */}
      {/* ========================================================================= */}
      {rejectingRequest && (
        <Modal
          isOpen={!!rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          title="Decline Access Request"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to decline Dr. {rejectingRequest.doctor?.fullName || 'Doctor'}'s access request?
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reason for Declining (Optional):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Not consulting this doctor, Second opinion no longer needed..."
                className="w-full h-24 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                {isRejecting ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 4. REVOKE ACTIVE PERMISSION DIALOG                                        */}
      {/* ========================================================================= */}
      {revokingPermission && (
        <ConfirmationDialog
          isOpen={!!revokingPermission}
          title="Revoke Active EMR Access"
          message={`Are you sure you want to revoke Dr. ${revokingPermission.doctor?.fullName || 'Doctor'}'s access permission? The doctor will immediately lose all normal access to your clinical records.`}
          confirmText={isRevoking ? "Revoking..." : "Revoke Access Immediately"}
          cancelText="Cancel"
          variant="danger"
          isLoading={isRevoking}
          onConfirm={handleConfirmRevoke}
          onClose={() => setRevokingPermission(null)}
        />
      )}
    </div>
  );
};
