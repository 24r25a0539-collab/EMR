import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Download,
  Clock,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  Activity,
  Cpu,
  Fingerprint,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export interface RootAuditItem {
  id: string;
  exactTime: string;
  date: string;
  action: string;
  actor: string;
  actorRole: string;
  patientTarget: string;
  resource: string;
  hospital: string;
  ip: string;
  hash: string;
  result: string;
}

export const AdminAuditPage: React.FC = () => {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedAudit, setSelectedAudit] = useState<RootAuditItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const auditEvents: RootAuditItem[] = [
    {
      id: 'AUD-ROOT-10029',
      date: 'Today',
      exactTime: '14:35:20',
      action: 'EMERGENCY_NOTE',
      actor: 'Dr. Ananya Sharma',
      actorRole: 'Senior Cardiologist',
      patientTarget: 'Rahul Sharma (HP-100245)',
      resource: 'Emergency Triage Note Created',
      hospital: 'Apex Health City - Trauma ER',
      ip: '10.240.12.84',
      hash: '0x9920194820194820194820194820194820194820194820194820194820194820',
      result: 'Cryptographically sealed on Ethereum block #10486',
    },
    {
      id: 'AUD-ROOT-10028',
      date: 'Today',
      exactTime: '14:32:10',
      action: 'DOWNLOAD',
      actor: 'Dr. Ananya Sharma',
      actorRole: 'Senior Cardiologist',
      patientTarget: 'Rahul Sharma (HP-100245)',
      resource: 'Blood Report LR-2024-001 Downloaded',
      hospital: 'Apex Health City',
      ip: '10.240.12.84',
      hash: '0x8f19284729102948201948201948201948201948201948201948201948201948',
      result: 'Authorized under 24-hour consultation scope',
    },
    {
      id: 'AUD-ROOT-10027',
      date: 'Today',
      exactTime: '14:31:30',
      action: 'VIEW',
      actor: 'Dr. Ananya Sharma',
      actorRole: 'Senior Cardiologist',
      patientTarget: 'Rahul Sharma (HP-100245)',
      resource: 'Blood Report LR-2024-001 Viewed',
      hospital: 'Apex Health City',
      ip: '10.240.12.84',
      hash: '0x7728192837461928374619283746192837461928374619283746192837461928',
      result: 'Patient sovereign consent token verified',
    },
    {
      id: 'AUD-ROOT-10026',
      date: 'Today',
      exactTime: '14:31:08',
      action: 'VIEW',
      actor: 'Dr. Ananya Sharma',
      actorRole: 'Senior Cardiologist',
      patientTarget: 'Rahul Sharma (HP-100245)',
      resource: 'Prescription RX-2024-1024 Viewed',
      hospital: 'Apex Health City',
      ip: '10.240.12.84',
      hash: '0x6619283746192837461928374619283746192837461928374619283746192837',
      result: 'Read clearance confirmed via smart contract',
    },
    {
      id: 'AUD-ROOT-10025',
      date: 'Today',
      exactTime: '14:30:42',
      action: 'VIEW',
      actor: 'Dr. Ananya Sharma',
      actorRole: 'Senior Cardiologist',
      patientTarget: 'Rahul Sharma (HP-100245)',
      resource: 'Current Medication Regimen Viewed',
      hospital: 'Apex Health City',
      ip: '10.240.12.84',
      hash: '0x5519283746192837461928374619283746192837461928374619283746192837',
      result: 'Zero-knowledge proof matched session key',
    },
  ];

  const handleCopyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    addToast('success', 'Cryptographic event hash copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = auditEvents.filter((ev) => {
    const matchesAction = actionFilter === 'ALL' || ev.action.includes(actionFilter);
    const matchesSearch =
      ev.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.patientTarget.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 antialiased text-white">
      {/* Header */}
      <ScrollReveal direction="bottom">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              National EMR Cryptographic Ledger
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
              System-Wide Root Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Global immutable audit stream. Append-only enforcement prevents alterations or deletions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Append-Only Strict Compliance</span>
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter Bar */}
      <ScrollReveal direction="bottom" delay={0.05}>
        <div className="bg-[#0B0B0D] p-4 sm:p-5 rounded-[24px] border border-white/10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actor, patient Health ID, or resource..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white placeholder:text-white/40 text-xs focus:border-blue-500 outline-none"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-white/10 text-xs bg-[#141416] text-white/80 focus:border-blue-500 outline-none"
            >
              <option value="ALL">All Root Events ({auditEvents.length})</option>
              <option value="VIEW">VIEW Events</option>
              <option value="DOWNLOAD">DOWNLOAD Events</option>
              <option value="EMERGENCY">EMERGENCY Interventions</option>
            </select>
          </div>
        </div>
      </ScrollReveal>

      {/* Vertical Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6">
        {/* Continuous drawn vertical line */}
        <div className="absolute top-2 bottom-2 left-2 sm:left-3 w-0.5 bg-gradient-to-b from-blue-500 via-teal-500 to-indigo-500 opacity-30" />

        {filtered.map((ev, idx) => (
          <ScrollReveal key={ev.id} direction="bottom" delay={idx * 0.05}>
            <div className="relative group">
              {/* Timeline node icon */}
              <div className="absolute -left-6 sm:-left-8 top-5 w-4.5 h-4.5 rounded-full bg-[#050506] border-2 border-blue-500 flex items-center justify-center -translate-x-1/2 shadow-sm group-hover:scale-125 transition-transform">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              </div>

              {/* Event Card */}
              <div className="p-5 sm:p-6 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-3 hover:border-blue-500/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        ev.action.includes('EMERGENCY')
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          : ev.action === 'DOWNLOAD'
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                      }`}
                    >
                      {ev.action}
                    </span>
                    <span className="font-mono text-xs font-bold text-white">
                      {ev.resource}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ev.date}, {ev.exactTime}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white/70 pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Actor</span>
                    <p className="font-semibold text-white">{ev.actor}</p>
                    <p className="text-[10px] text-white/40">{ev.actorRole} • {ev.hospital}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Target Patient</span>
                    <p className="font-semibold text-white">{ev.patientTarget}</p>
                    <p className="text-[10px] text-cyan-400 font-mono">Terminal IP: {ev.ip}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Result</span>
                    <p className="text-xs text-teal-300 font-medium">{ev.result}</p>
                  </div>
                </div>

                {/* Event Digest SHA-256 */}
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-white/40">
                  <span className="truncate max-w-md">SHA-256: {ev.hash}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleCopyHash(ev.hash, ev.id)}
                      className="hover:text-white transition-colors flex items-center gap-1 text-white/60"
                    >
                      {copiedId === ev.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === ev.id ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAudit(ev)}
                      className="hover:text-blue-400 transition-colors flex items-center gap-1 font-sans font-semibold text-blue-400"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Inspect Audit Modal */}
      {selectedAudit && (
        <Modal
          isOpen={!!selectedAudit}
          onClose={() => setSelectedAudit(null)}
          title="Cryptographic Event Verification"
        >
          <div className="space-y-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-[#101012] border border-white/10 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-white/40">Event ID:</span>
                <span className="font-bold text-white">{selectedAudit.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Timestamp:</span>
                <span className="text-white/80">{selectedAudit.date} {selectedAudit.exactTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Action:</span>
                <span className="font-bold text-blue-400">{selectedAudit.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Actor:</span>
                <span className="text-white/80">{selectedAudit.actor} ({selectedAudit.actorRole})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Target:</span>
                <span className="text-cyan-400">{selectedAudit.patientTarget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Facility Node:</span>
                <span className="text-white/80">{selectedAudit.hospital}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B0B0D] border border-white/10 text-white font-mono space-y-1">
              <span className="text-[10px] text-white/40">Canonical SHA-256 Digest:</span>
              <p className="text-[11px] text-teal-300 break-all">{selectedAudit.hash}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedAudit(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/10"
              >
                Close Verification
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminAuditPage;
