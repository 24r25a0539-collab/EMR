import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Shield,
  Stethoscope,
  Send,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

export interface OutboundRequest {
  id: string;
  patientName: string;
  healthId: string;
  requestedAt: string;
  reason: string;
  scopes: string[];
  durationHours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expiresIn?: string;
}

export const DoctorAccessRequestsPage: React.FC = () => {
  const { addToast } = useToast();
  const [showNewModal, setShowNewModal] = useState(false);

  // Form states
  const [newHealthId, setNewHealthId] = useState('HP-100245');
  const [newReason, setNewReason] = useState('Cardiology follow-up & medication review');
  const [newDuration, setNewDuration] = useState('24');
  const [newScopes, setNewScopes] = useState<string[]>([
    'Cardiology Records',
    'Prescriptions',
    'Biochemistry Lab Reports',
  ]);

  const [requests, setRequests] = useState<OutboundRequest[]>([
    {
      id: 'REQ-101',
      patientName: 'Rahul Sharma',
      healthId: 'HP-100245',
      requestedAt: '10 minutes ago',
      reason: 'Review baseline vitals and lipid panel for blood pressure management.',
      scopes: ['Cardiology Records', 'Prescriptions', 'Biochemistry Lab Reports'],
      durationHours: 24,
      status: 'APPROVED',
      expiresIn: '23h 45m remaining',
    },
    {
      id: 'REQ-098',
      patientName: 'Mohith Varma',
      healthId: 'HP-100246',
      requestedAt: '1 day ago',
      reason: 'Pre-consultation cardiac screening evaluation.',
      scopes: ['Cardiology Records'],
      durationHours: 48,
      status: 'PENDING',
    },
    {
      id: 'REQ-084',
      patientName: 'Sneha Patel',
      healthId: 'HP-100247',
      requestedAt: '3 days ago',
      reason: 'Specialist consultation follow-up.',
      scopes: ['Prescriptions'],
      durationHours: 24,
      status: 'EXPIRED',
    },
  ]);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: OutboundRequest = {
      id: `REQ-${Math.floor(105 + Math.random() * 900)}`,
      patientName: newHealthId === 'HP-100245' ? 'Rahul Sharma' : 'Registered Patient',
      healthId: newHealthId,
      requestedAt: 'Just now',
      reason: newReason,
      scopes: newScopes,
      durationHours: Number(newDuration),
      status: 'PENDING',
    };

    setRequests([newReq, ...requests]);
    setShowNewModal(false);
    addToast('success', `EMR access request dispatched to patient ${newHealthId}!`);
  };

  const toggleScope = (scope: string) => {
    setNewScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  return (
    <div className="space-y-8 pb-24 text-white antialiased">
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

          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-3 rounded-2xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New EMR Request</span>
          </button>
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
                {requests.map((req) => (
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
                          Active ({req.expiresIn})
                        </span>
                      ) : req.status === 'PENDING' ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 w-fit">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Pending Patient Approval
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
                          onClick={() => addToast('info', 'Reminder notification resent to patient device.')}
                          className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-white/70 font-bold hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                        >
                          Ping Patient
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
              className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.05] font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-md shadow-purple-600/20 cursor-pointer"
            >
              Dispatch Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorAccessRequestsPage;
