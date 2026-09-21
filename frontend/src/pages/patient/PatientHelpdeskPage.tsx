import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Send,
  User,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { BackButton } from '../../components/common/BackButton';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export interface HelpdeskTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  description: string;
  priority: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminResponse?: string;
  reviewedBy?: string;
  createdAt: string;
}

export const PatientHelpdeskPage: React.FC = () => {
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Ticket Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [priority, setPriority] = useState('NORMAL');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getPatientHelpdeskTickets();
      if (res && res.tickets) {
        setTickets(res.tickets);
      }
    } catch (err: any) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      addToast('error', 'Subject and description are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createHelpdeskTicket({
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
      });

      if (res && res.success) {
        addToast('success', 'Helpdesk ticket submitted successfully.');
        setShowModal(false);
        setSubject('');
        setDescription('');
        setCategory('General Inquiry');
        setPriority('NORMAL');
        loadTickets();
      } else {
        addToast('error', res?.error || 'Failed to create ticket.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Server error creating ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: HelpdeskTicket['status']) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Open
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            In Progress
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Resolved
          </span>
        );
      case 'CLOSED':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-zinc-400 border border-white/10 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
            Closed
          </span>
        );
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p?.toUpperCase()) {
      case 'URGENT':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">URGENT</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">HIGH</span>;
      case 'LOW':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">LOW</span>;
      case 'NORMAL':
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">NORMAL</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <ScrollReveal direction="left">
        <div className="flex items-center justify-between">
          <BackButton fallbackPath="/patient" />
        </div>
      </ScrollReveal>

      {/* Header */}
      <ScrollReveal direction="left" delay={0.05}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
              Patient Support & Helpdesk
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Helpdesk Tickets
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Report issues, request medical profile corrections, or communicate directly with system administrators.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-900/30 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Support Ticket</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Tickets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-[#0B0B0D] p-12 text-center rounded-3xl border border-white/10">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-400">Loading helpdesk tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-[#0B0B0D] p-12 text-center rounded-3xl border border-white/10 space-y-3">
            <HelpCircle className="w-12 h-12 text-zinc-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No support tickets found</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              You haven't submitted any helpdesk queries or record correction requests yet.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Submit First Ticket</span>
            </button>
          </div>
        ) : (
          <ScrollRevealGroup direction="bottom" stagger={0.08}>
            {tickets.map((t) => (
              <div
                key={t.id}
                className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4 hover:border-teal-500/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-white bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                      {t.ticketNumber}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                      {new Date(t.createdAt).toLocaleDateString()} at {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(t.priority)}
                    {getStatusBadge(t.status)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                      {t.category}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">{t.subject}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed whitespace-pre-wrap">
                    {t.description}
                  </p>
                </div>

                {/* Admin Response Box if available */}
                {t.adminResponse ? (
                  <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-teal-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-teal-400" />
                        Admin Resolution / Response:
                      </span>
                      <span className="text-teal-400 text-[11px]">
                        Reviewed by {t.reviewedBy || 'System Administrator'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                      "{t.adminResponse}"
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Awaiting administrative review and response.</span>
                  </div>
                )}
              </div>
            ))}
          </ScrollRevealGroup>
        )}
      </div>

      {/* New Ticket Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Helpdesk Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-zinc-400 block mb-1">Subject *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue or request"
              className="w-full px-3 py-2 bg-[#141416] border border-white/10 text-white placeholder-zinc-600 rounded-xl focus:outline-none focus:border-teal-500 text-xs transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-zinc-400 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#141416] border border-white/10 text-white rounded-xl focus:outline-none focus:border-teal-500 text-xs transition-colors"
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Record Correction">Record Correction</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Billing / Insurance">Billing / Insurance</option>
                <option value="Appointment Issue">Appointment Issue</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-zinc-400 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-[#141416] border border-white/10 text-white rounded-xl focus:outline-none focus:border-teal-500 text-xs transition-colors"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-zinc-400 block mb-1">Detailed Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details about the issue or requested change..."
              className="w-full px-3 py-2 bg-[#141416] border border-white/10 text-white placeholder-zinc-600 rounded-xl focus:outline-none focus:border-teal-500 text-xs transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-white/10 text-zinc-300 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-900/30 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
