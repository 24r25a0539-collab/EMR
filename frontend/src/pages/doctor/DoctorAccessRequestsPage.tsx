import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import {
  ScrollReveal,
} from '../../components/common/ScrollReveal';
import { api } from '../../services/api';

export interface OutboundRequest {
  id: string;
  patientName: string;
  healthId: string;
  requestedAt: string;
  reason: string;
  scopes: string[];
  durationHours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | string;
  expiresIn?: string;
}

export const DoctorAccessRequestsPage: React.FC = () => {
  const { addToast } = useToast();
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);

  // Form states
  const [newHealthId, setNewHealthId] = useState('');
  const [newReason, setNewReason] = useState('Cardiology follow-up & medication review');
  const [newDuration, setNewDuration] = useState('24');
  const [newScopes, setNewScopes] = useState<string[]>([
    'Cardiology Records',
    'Prescriptions',
    'Biochemistry Lab Reports',
  ]);

  const [requests, setRequests] = useState<OutboundRequest[]>([]);

  const formatRequestedTime = (createdAt?: string | Date): string => {
    if (!createdAt) return 'Recently';
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const formatExpiresIn = (expiresAt?: string | Date | null, status?: string): string | undefined => {
    if (!expiresAt || status !== 'APPROVED') return undefined;
    const exp = new Date(expiresAt);
    if (isNaN(exp.getTime())) return undefined;
    const now = new Date();
    const diffMs = exp.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    return `${mins}m remaining`;
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.listDoctorAccessRequests();
      const rawRequests: any[] = res.requests || res.data || [];
      const mapped: OutboundRequest[] = rawRequests.map((req: any) => {
        let scopes: string[] = [];
        try {
          if (typeof req.scopeJson === 'string') {
            const parsed = JSON.parse(req.scopeJson);
            scopes = Array.isArray(parsed) ? parsed : [req.scopeJson];
          } else if (Array.isArray(req.scopeJson)) {
            scopes = req.scopeJson;
          } else {
            scopes = ['Consultations', 'Prescriptions', 'Lab Reports'];
          }
        } catch {
          scopes = req.scopeJson ? [String(req.scopeJson)] : ['Consultations', 'Prescriptions', 'Lab Reports'];
        }

        const durationHours = req.durationDays ? req.durationDays * 24 : 24;

        return {
          id: req.id,
          patientName: req.patient?.fullName || req.patientName || 'Patient',
          healthId: req.patient?.healthId || req.patientHealthId || '',
          requestedAt: formatRequestedTime(req.createdAt),
          reason: req.reason || 'Clinical Consultation & EMR Review',
          scopes,
          durationHours,
          status: req.status || 'PENDING',
          expiresIn: formatExpiresIn(req.expiresAt, req.status),
        };
      });

      setRequests(mapped);
    } catch (err: any) {
      console.error('Failed to load doctor access requests:', err);
      addToast('error', err.message || 'Failed to load access requests.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHealthId.trim()) {
      addToast('error', 'Please enter a valid Patient Health ID.');
      return;
    }
    if (newScopes.length === 0) {
      addToast('error', 'Please select at least one record scope.');
      return;
    }

    try {
      setSubmitting(true);
      const durationLabel = `${newDuration} Hours`;
      await api.createDoctorAccessRequest(
        newHealthId.trim(),
        newReason.trim(),
        newScopes,
        durationLabel
      );

      await fetchRequests();
      setShowNewModal(false);
      setNewHealthId('');
      addToast('success', `EMR access request dispatched to patient ${newHealthId}!`);
    } catch (err: any) {
      console.error('Error creating access request:', err);
      addToast('error', err.message || 'Failed to create access request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePingPatient = async (reqId: string, patientName: string) => {
    try {
      setPingingId(reqId);
      await api.pingPatientAccessRequest(reqId);
      addToast('success', `Reminder notification resent to ${patientName}.`);
    } catch (err: any) {
      console.error('Error pinging patient:', err);
      addToast('error', err.message || 'Failed to send reminder notification.');
    } finally {
      setPingingId(null);
    }
  };

  const toggleScope = (scope: string) => {
    setNewScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24 text-white antialiased">
      {/* Header */}
      <ScrollReveal direction="left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Consent Clearance Management
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
              Outbound Access Requests
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              Dispatch scoped consent requests to patients. Records become readable upon patient cryptographic approval.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRequests}
              disabled={loading}
              title="Refresh access requests"
              className="p-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-6 py-3 rounded-2xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New EMR Request</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Requests Table */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="bg-[#0B0B0D] rounded-[32px] border border-white/[0.08] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.08] text-white/40 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Patient & Health ID</th>
                  <th className="py-4 px-4">Requested Scopes</th>
                  <th className="py-4 px-4">Reason & Duration</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-white/70">
                {loading && requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-white/40">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                        <span>Loading real access requests from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-white/40">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock className="w-6 h-6 text-white/20" />
                        <span className="text-sm font-medium text-white/60">No outbound access requests found</span>
                        <span className="text-xs text-white/40">Click "New EMR Request" to request access clearance from a patient.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-sm">{req.patientName}</div>
                        <div className="text-xs font-mono text-teal-400 mt-0.5">{req.healthId}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{req.requestedAt}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {req.scopes.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 text-[10px] font-semibold"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <p className="text-white font-medium line-clamp-1">"{req.reason}"</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{req.durationHours} Hours duration</p>
                      </td>

                      <td className="py-4 px-4">
                        {req.status === 'APPROVED' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Active {req.expiresIn ? `(${req.expiresIn})` : ''}
                          </span>
                        ) : req.status === 'PENDING' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 w-fit">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            Pending Patient Approval
                          </span>
                        ) : req.status === 'REJECTED' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 w-fit">
                            Rejected
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/[0.04] text-white/40 border border-white/10 w-fit">
                            {req.status}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {req.status === 'APPROVED' ? (
                          <Link
                            to={`/doctor/patients/${req.healthId}/emr`}
                            className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500 transition-all shadow-md shadow-teal-600/20 inline-flex items-center gap-1"
                          >
                            <span>Open EMR</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <button
                            onClick={() => handlePingPatient(req.id, req.patientName)}
                            disabled={pingingId === req.id || req.status !== 'PENDING'}
                            className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-white/70 font-bold hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          >
                            {pingingId === req.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                                <span>Pinging...</span>
                              </>
                            ) : (
                              <span>Ping Patient</span>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* New Request Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create Outbound EMR Access Request"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs text-white">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
              Patient Sovereign Health ID *
            </label>
            <input
              type="text"
              value={newHealthId}
              onChange={(e) => setNewHealthId(e.target.value)}
              placeholder="e.g. HP-100245"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] font-mono text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
              Clinical Justification *
            </label>
            <textarea
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="State clear clinical reason for patient's review"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
              Required Record Scopes
            </label>
            <div className="space-y-1.5">
              {[
                'Cardiology Records',
                'Neurology Records',
                'Prescriptions',
                'Biochemistry Lab Reports',
                'General Medical History',
              ].map((scope) => (
                <label
                  key={scope}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer text-white/80 font-medium hover:bg-white/[0.06]"
                >
                  <input
                    type="checkbox"
                    checked={newScopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                    className="rounded text-purple-600 focus:ring-purple-500 bg-transparent border-white/20"
                  />
                  <span>{scope}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
              Clearance Duration
            </label>
            <select
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#101012] text-white focus:outline-none"
            >
              <option value="12">12 Hours</option>
              <option value="24">24 Hours (Standard Consultation)</option>
              <option value="48">48 Hours</option>
              <option value="168">7 Days (Inpatient Protocol)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.05] font-bold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <span>Dispatch Request</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorAccessRequestsPage;
