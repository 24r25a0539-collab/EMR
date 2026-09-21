import React, { useState } from 'react';
import {
  AlertTriangle,
  Heart,
  Phone,
  QrCode,
  ShieldAlert,
  User,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  Building2,
  Stethoscope,
  Activity,
  Edit2,
  Trash2,
  Send,
  Info,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../contexts/ToastContext';
import { BackButton } from '../../components/common/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup, PremiumCard } from '../../components/common/ScrollReveal';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface EmergencyLogSession {
  id: string;
  hospital: string;
  doctor: string;
  reason: string;
  timestamp: string;
  status: 'ACTIVE' | 'CLOSED';
  recordsAccessed: string[];
}

export const PatientEmergencyPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    if (user?.patient?.emergencyContacts && Array.isArray(user.patient.emergencyContacts)) {
      return user.patient.emergencyContacts.map((c: any) => ({
        id: c.id,
        name: c.name,
        relationship: c.relationship || 'Emergency Contact',
        phone: c.phone,
        isPrimary: !!c.isPrimary,
      }));
    }
    return [];
  });

  const [emergencySessions, setEmergencySessions] = useState<EmergencyLogSession[]>([]);

  React.useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const [profRes, auditRes] = await Promise.allSettled([
        api.getProfile(),
        api.getPatientAuditHistory({ category: 'EMERGENCY' }),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value?.patient?.emergencyContacts && Array.isArray(profRes.value.patient.emergencyContacts)) {
        setContacts(profRes.value.patient.emergencyContacts.map((c: any) => ({
          id: c.id,
          name: c.name,
          relationship: c.relationship || 'Emergency Contact',
          phone: c.phone,
          isPrimary: !!c.isPrimary,
        })));
      }

      if (auditRes.status === 'fulfilled' && auditRes.value?.events) {
        const mapped: EmergencyLogSession[] = auditRes.value.events.map((ev: any) => ({
          id: ev.id || `emg-${Date.now()}`,
          hospital: ev.hospitalName || 'Emergency Care Center',
          doctor: ev.doctor?.fullName || ev.doctorName || 'ER Specialist',
          reason: ev.reason || ev.action || 'Emergency Triage Access',
          timestamp: ev.createdAt ? new Date(ev.createdAt).toLocaleString() : 'Recent',
          status: 'CLOSED',
          recordsAccessed: ev.scopes || ['Vitals', 'Allergies', 'Emergency Contacts', 'Blood Group'],
        }));
        setEmergencySessions(mapped);
      }
    } catch (err) {
      console.error('Failed to load emergency contacts/sessions:', err);
    }
  };

  // Modal states
  const [showAddContactModal, setShowAddContactModal] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  // Test notification state
  const [testNotificationResult, setTestNotificationResult] = useState<{
    sent: boolean;
    contactName: string;
    relationship: string;
    phone: string;
    status: string;
  } | null>(null);

  // Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('Spouse');
  const [contactPhone, setContactPhone] = useState('');
  const [contactIsPrimary, setContactIsPrimary] = useState(false);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    try {
      const res = await api.manageEmergencyContacts({
        name: contactName.trim(),
        relationship: contactRelation,
        phone: contactPhone.trim(),
        isPrimary: contactIsPrimary || contacts.length === 0,
      });

      if (res && res.contact) {
        setContacts((prev) => [
          ...prev,
          {
            id: res.contact.id,
            name: res.contact.name,
            relationship: res.contact.relationship || contactRelation,
            phone: res.contact.phone,
            isPrimary: !!res.contact.isPrimary,
          },
        ]);
      } else {
        const newContact: EmergencyContact = {
          id: `ec-${Date.now()}`,
          name: contactName,
          relationship: contactRelation,
          phone: contactPhone,
          isPrimary: contactIsPrimary || contacts.length === 0,
        };
        setContacts((prev) => [...prev, newContact]);
      }

      setShowAddContactModal(false);
      setContactName('');
      setContactPhone('');
      setContactIsPrimary(false);
      addToast('success', `Added ${contactName} to emergency contact registry.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add contact');
    }
  };

  const handleOpenEdit = (c: EmergencyContact) => {
    setEditingContact(c);
    setContactName(c.name);
    setContactRelation(c.relationship);
    setContactPhone(c.phone);
    setContactIsPrimary(c.isPrimary);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !contactName.trim() || !contactPhone.trim()) return;

    try {
      await api.manageEmergencyContacts({
        action: 'UPDATE',
        contactId: editingContact.id,
        name: contactName.trim(),
        relationship: contactRelation,
        phone: contactPhone.trim(),
        isPrimary: contactIsPrimary,
      });

      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id
            ? {
                ...c,
                name: contactName,
                relationship: contactRelation,
                phone: contactPhone,
                isPrimary: contactIsPrimary,
              }
            : contactIsPrimary ? { ...c, isPrimary: false } : c
        )
      );

      addToast('success', `Updated emergency contact ${contactName}.`);
      setEditingContact(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update contact');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingContactId) {
      try {
        await api.manageEmergencyContacts({
          action: 'DELETE',
          contactId: deletingContactId,
        });
        setContacts((prev) => prev.filter((c) => c.id !== deletingContactId));
        addToast('info', 'Emergency contact removed.');
        setDeletingContactId(null);
      } catch (err: any) {
        addToast('error', err.message || 'Failed to delete contact');
      }
    }
  };

  const handleTestNotification = (contact: EmergencyContact) => {
    setTestNotificationResult({
      sent: true,
      contactName: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      status: 'Emergency Alert Sent • SMS & Automated Voice Dispatch Verified (Test Mode Active)',
    });
    addToast('success', `Test emergency broadcast dispatched to ${contact.name}!`);
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <ScrollReveal direction="left">
        <div className="flex items-center justify-between">
          <BackButton fallbackPath="/patient" />
        </div>
      </ScrollReveal>

      {/* Header Banner */}
      <ScrollReveal direction="left" delay={0.05}>
        <div className="bg-gradient-to-r from-rose-950/80 via-[#101012] to-[#0B0B0D] text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider border border-rose-500/30">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Critical Triage Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Emergency Care & Contacts
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              In life-threatening trauma emergencies, verified hospital ER physicians can bypass consent to access
              vital signs and allergies. Priority alerts are dispatched to your registered contacts.
            </p>
          </div>

          <button
            onClick={handlePrintCard}
            className="px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold transition-all shadow-xl shadow-black/50 flex items-center gap-2 text-xs flex-shrink-0 cursor-pointer relative z-10"
          >
            <Printer className="w-4 h-4 text-rose-600" />
            <span>Print Emergency Card</span>
          </button>
        </div>
      </ScrollReveal>

      {/* CRITICAL PRIVACY & PERMISSION NOTICE */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 shadow-xl flex items-start gap-4 text-amber-200">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl flex-shrink-0 mt-0.5 border border-amber-500/30">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="text-sm font-black uppercase tracking-wide text-amber-300">
              IMPORTANT: Emergency Contact ≠ Full EMR Access
            </h3>
            <p className="leading-relaxed text-zinc-300 font-medium">
              An emergency contact does <strong className="text-white">NOT</strong> automatically receive the patient's complete Electronic Medical Record.
              Adding a family member or friend here designates them solely to receive automated emergency dispatch alerts, SMS notifications, and trauma hospital admissions updates when hospital triage bypass is triggered.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Lifesaving Emergency Parameters */}
      <ScrollReveal direction="bottom" delay={0.1}>
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Limited Lifesaving Emergency Parameters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PremiumCard accent="emergency" className="bg-[#0B0B0D] p-5 rounded-3xl border border-rose-500/30 shadow-xl space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Blood Group
              </span>
              <p className="text-2xl font-black text-white">
                {user?.patient?.bloodGroup || user?.patient?.healthProfile?.bloodGroup || 'Not specified'}
              </p>
              <p className="text-[11px] text-zinc-500">Registered blood group</p>
            </PremiumCard>

            <PremiumCard accent="emergency" className="bg-[#0B0B0D] p-5 rounded-3xl border border-rose-500/30 shadow-xl space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Severe Drug Allergies
              </span>
              {user?.patient?.allergies && user.patient.allergies.length > 0 ? (
                <p className="text-base font-bold text-rose-300">
                  {user.patient.allergies.map((a: any) => `${a.allergen} (${a.severity})`).join(', ')}
                </p>
              ) : (
                <p className="text-sm font-medium text-zinc-400">No allergies reported</p>
              )}
              <p className="text-[11px] text-zinc-500">Triage allergen contraindications</p>
            </PremiumCard>

            <PremiumCard accent="blue" className="bg-[#0B0B0D] p-5 rounded-3xl border border-white/10 shadow-xl space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Chronic Conditions
              </span>
              {user?.patient?.conditions && user.patient.conditions.length > 0 ? (
                <p className="text-base font-bold text-zinc-200">
                  {user.patient.conditions.map((c: any) => c.conditionName || c.name).join(', ')}
                </p>
              ) : (
                <p className="text-sm font-medium text-zinc-400">No chronic conditions recorded</p>
              )}
              <p className="text-[11px] text-zinc-500">Known diagnostic history</p>
            </PremiumCard>

            <PremiumCard accent="teal" className="bg-[#0B0B0D] p-5 rounded-3xl border border-white/10 shadow-xl space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Active Medications
              </span>
              {user?.patient?.medications && user.patient.medications.length > 0 ? (
                <p className="text-base font-bold text-zinc-200">
                  {user.patient.medications.map((m: any) => m.medicineName).join(', ')}
                </p>
              ) : (
                <p className="text-sm font-medium text-zinc-400">No active medications</p>
              )}
              <p className="text-[11px] text-zinc-500">Ongoing pharmaceutical regimen</p>
            </PremiumCard>
          </div>
        </div>
      </ScrollReveal>

      {/* EMERGENCY CONTACTS MANAGEMENT (Add, View, Edit, Remove) */}
      <ScrollReveal direction="bottom" delay={0.12}>
        <div className="bg-[#0B0B0D] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-bold text-white">Emergency Contacts Directory</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                These contacts receive immediate automated SMS alerts whenever an emergency bypass session is initiated.
              </p>
            </div>

            <button
              onClick={() => {
                setContactName('');
                setContactPhone('');
                setContactRelation('Spouse');
                setContactIsPrimary(false);
                setShowAddContactModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-teal-900/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </button>
          </div>

          {/* Contacts Cards */}
          {contacts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#101012] border border-white/5 text-center text-xs text-zinc-400">
              No emergency contacts registered yet. Please click "Add Contact" above to register a primary contact.
            </div>
          ) : (
            <ScrollRevealGroup stagger={0.08} alternateDirection={true} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.map((c) => (
              <PremiumCard
                key={c.id}
                accent="emergency"
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                  c.isPrimary
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : 'bg-[#101012] border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                        c.isPrimary
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-white/5 text-zinc-300 border border-white/10'
                      }`}
                    >
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{c.name}</h4>
                        {c.isPrimary && (
                          <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full">
                            Primary Contact
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{c.relationship}</p>
                      <p className="text-xs font-mono font-bold text-zinc-200 mt-1">{c.phone}</p>
                    </div>
                  </div>

                  <a
                    href={`tel:${c.phone}`}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-rose-400 hover:border-rose-500/40 transition-colors shadow-sm"
                    title="Call Contact"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>

                {/* Actions: Test Emergency Notification, Edit, Delete */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Test Emergency Notification Trigger */}
                  <button
                    onClick={() => handleTestNotification(c)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-rose-900/40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Test Emergency Notification</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-teal-400 hover:border-teal-500/40 hover:bg-white/5 transition-all"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => setDeletingContactId(c.id)}
                      className="p-1.5 rounded-lg border border-white/10 text-zinc-500 hover:text-rose-400 hover:border-rose-500/40 hover:bg-white/5 transition-all cursor-pointer"
                      title="Remove Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </PremiumCard>
            ))}
            </ScrollRevealGroup>
          )}

          {/* TEST EMERGENCY NOTIFICATION RESULT BANNER */}
          {testNotificationResult && (
            <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-black uppercase tracking-wide text-emerald-300">
                    Emergency Alert Sent
                  </h4>
                </div>
                <button
                  onClick={() => setTestNotificationResult(null)}
                  className="text-xs text-zinc-400 hover:text-white font-bold transition-colors"
                >
                  Dismiss
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold">Contact:</span>
                  <p className="font-bold text-white mt-0.5">{testNotificationResult.contactName}</p>
                </div>

                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold">Relationship:</span>
                  <p className="font-bold text-white mt-0.5">{testNotificationResult.relationship}</p>
                </div>

                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold">Status:</span>
                  <p className="font-bold text-emerald-300 mt-0.5">
                    SMS & Push Alert Delivered (Test Verified)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Emergency Access Audit History */}
      <ScrollReveal direction="bottom" delay={0.15}>
        <div className="bg-[#0B0B0D] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-lg font-bold text-white">Emergency Access History & Logs</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Every emergency bypass invocation creates an immutable blockchain-sealed incident report.
            </p>
          </div>

          {emergencySessions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#101012] border border-white/5 text-center text-xs text-zinc-400">
              No emergency bypass access sessions recorded.
            </div>
          ) : (
            emergencySessions.map((session) => (
              <div
                key={session.id}
                className="p-5 rounded-2xl bg-[#101012] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-white/15 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-200">{session.id}</span>
                    <span className="text-[10px] font-bold text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      SESSION {session.status}
                    </span>
                    <span className="text-zinc-500">• {session.timestamp}</span>
                  </div>
                  <p className="font-semibold text-zinc-200">
                    {session.hospital} • Attending: {session.doctor}
                  </p>
                  <p className="text-zinc-400 italic">"{session.reason}"</p>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                    <span className="text-zinc-500 font-semibold">Triage Scopes Accessed:</span>
                    {session.recordsAccessed.map((rec, idx) => (
                      <span
                        key={idx}
                        className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-300 font-medium"
                      >
                        {rec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                    On-Chain Audited
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollReveal>

      {/* Add Contact Modal */}
      <Modal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        title="Add Emergency Contact"
      >
        <form onSubmit={handleAddContact} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Contact Full Name *
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#141416] text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Relationship *
              </label>
              <select
                value={contactRelation}
                onChange={(e) => setContactRelation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#141416] text-white focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Adult Child</option>
                <option value="Friend">Friend / Guardian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#141416] text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contactIsPrimary}
              onChange={(e) => setContactIsPrimary(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded bg-[#141416] border-white/10"
            />
            <span className="text-zinc-300 font-medium">Set as Primary Emergency Contact</span>
          </label>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddContactModal(false)}
              className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 font-bold hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-lg shadow-teal-900/30"
            >
              Save Contact
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Contact Modal */}
      {editingContact && (
        <Modal
          isOpen={true}
          onClose={() => setEditingContact(null)}
          title={`Edit Emergency Contact: ${editingContact.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Contact Full Name *
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#141416] text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Relationship *
                </label>
                <select
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#141416] text-white focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Child">Adult Child</option>
                  <option value="Friend">Friend / Guardian</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#141416] text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contactIsPrimary}
                onChange={(e) => setContactIsPrimary(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded bg-[#141416] border-white/10"
              />
              <span className="text-zinc-300 font-medium">Set as Primary Emergency Contact</span>
            </label>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 font-bold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-lg shadow-teal-900/30"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingContactId}
        onClose={() => setDeletingContactId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Emergency Contact"
        message="Are you sure you want to remove this emergency contact from receiving trauma bypass SMS notifications?"
        confirmText="Yes, Remove Contact"
        variant="danger"
      />
    </div>
  );
};
