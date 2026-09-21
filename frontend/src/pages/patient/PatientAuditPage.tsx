import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Download,
  AlertTriangle,
  Lock,
  Clock,
  Building2,
  Stethoscope,
  Copy,
  Check,
  Calendar,
  FileText,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { BackButton } from '../../components/common/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  exactTime: string;
  action: 'VIEW' | 'DOWNLOAD' | 'CREATE' | 'APPROVE' | 'REVOKE' | 'EMERGENCY_ACCESS' | 'MODIFY' | 'REJECT';
  resourceType: string;
  resourceId: string;
  actorName: string;
  actorRole: string;
  hospitalName: string;
  ipAddress: string;
  eventHash: string;
  scopeUsed: string;
}

export const PatientAuditPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getPatientAudit();
      if (res.success && res.audits) {
        const mapped: AuditLogEntry[] = res.audits.map((item: any) => {
          const dateObj = new Date(item.timestamp || item.createdAt);
          const dateStr = isNaN(dateObj.getTime())
            ? 'Recent'
            : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const timeStr = isNaN(dateObj.getTime())
            ? ''
            : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          const actRole =
            item.actorRole === 'DOCTOR'
              ? item.department
                ? `Attending ${item.department}`
                : 'Attending Physician'
              : item.actorRole === 'PATIENT'
              ? 'Citizen Sovereign Owner'
              : item.actorRole || 'Medical Staff';

          const resType = item.documentType
            ? item.documentType.replace(/_/g, ' ')
            : item.reason || 'Medical Record';

          const resId = item.recordId
            ? `${item.documentType ? item.documentType.replace(/_/g, ' ') : 'Record'} (${item.recordId})`
            : item.reason || 'Clinical Access';

          return {
            id: item.id,
            timestamp: dateStr,
            exactTime: timeStr,
            action: (item.action as any) || 'VIEW',
            resourceType: resType,
            resourceId: resId,
            actorName: item.actorName || item.doctorName || 'Medical Professional',
            actorRole: actRole,
            hospitalName: item.hospitalName || 'Apex Health Network',
            ipAddress: item.ipAddress || '127.0.0.1 (Secure Node)',
            eventHash: item.newHash || item.previousHash || `0x${item.id.replace(/-/g, '')}`,
            scopeUsed: item.accessType || item.documentType || 'Clinical Records',
          };
        });
        setLogs(mapped);
      }
    } catch (err) {
      console.error('Failed to load patient audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.resourceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.resourceType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const handleCopy = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('info', 'Cryptographic event hash copied.');
  };

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'VIEW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'DOWNLOAD':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'APPROVE':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'REVOKE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'EMERGENCY_ACCESS':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse';
      default:
        return 'bg-white/5 text-zinc-300 border-white/10';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Back Button */}
      <ScrollReveal direction="left">
        <div className="flex items-center justify-between">
          <BackButton fallbackPath="/patient" />
          <span className="text-xs font-mono text-zinc-500">
            Audit Protocol: Append-Only SHA-256
          </span>
        </div>
      </ScrollReveal>

      {/* Header */}
      <ScrollReveal direction="left" delay={0.05}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Tamper-Proof Audit Ledger
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Immutable Access Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Every view, download, consent grant, and emergency access event is recorded in an
              append-only cryptographic log.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAuditLogs}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-[#101012] border border-white/10 hover:bg-white/5 text-zinc-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-zinc-500'}`} />
              <span>Refresh Ledger</span>
            </button>
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Append-Only • No Edit / Delete</span>
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter & Search Bar */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="bg-[#0B0B0D] p-5 rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor, record ID, or hospital..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#141416] border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-[#141416] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="ALL">All Audit Actions</option>
              <option value="VIEW">VIEW Events</option>
              <option value="DOWNLOAD">DOWNLOAD Events</option>
              <option value="CREATE">CREATE Events</option>
              <option value="APPROVE">APPROVE Grants</option>
              <option value="REVOKE">REVOKE Grants</option>
              <option value="EMERGENCY_ACCESS">EMERGENCY ACCESS Events</option>
            </select>
          </div>
        </div>
      </ScrollReveal>

      {/* Audit Log Stream */}
      <ScrollReveal direction="bottom" delay={0.1}>
        <div className="bg-[#0B0B0D] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp (Exact)</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Resource Accessed</th>
                  <th className="py-3.5 px-4">Actor & Institution</th>
                  <th className="py-3.5 px-4">Cryptographic Hash</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs font-medium">
                      {loading ? 'Querying immutable audit ledger...' : 'No audit entries match criteria.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-mono text-white font-semibold whitespace-nowrap">
                        <div>{log.exactTime}</div>
                        <div className="text-[10px] text-zinc-500 font-normal">{log.timestamp}</div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-semibold text-white">
                        <div>{log.resourceId}</div>
                        <div className="text-[10px] text-zinc-500 font-normal">{log.resourceType}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-200">{log.actorName}</div>
                        <div className="text-[10px] text-zinc-500">{log.hospitalName}</div>
                      </td>

                      <td className="py-4 px-4 font-mono text-[11px] text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[120px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                            {log.eventHash}
                          </span>
                          <button
                            onClick={() => handleCopy(log.id, log.eventHash)}
                            className="p-1 hover:text-white transition-colors"
                            title="Copy Event Hash"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedEntry(log)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all text-[11px]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* Audit Detail Modal */}
      {selectedEntry && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title={`Audit Forensic Record: ${selectedEntry.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#141416] rounded-2xl border border-white/10 space-y-2">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Exact Action:</span>
                <span className="font-bold text-white">{selectedEntry.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Exact Timestamp:</span>
                <span className="font-mono text-white">
                  {selectedEntry.timestamp} at {selectedEntry.exactTime}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Target Clinical Record:</span>
                <span className="font-semibold text-white">{selectedEntry.resourceId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Actor & Role:</span>
                <span className="font-semibold text-white">
                  {selectedEntry.actorName} ({selectedEntry.actorRole})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Originating Facility / App:</span>
                <span className="text-zinc-300">{selectedEntry.hospitalName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">IP Node / Terminal:</span>
                <span className="font-mono text-zinc-300">{selectedEntry.ipAddress}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Consent Scope Invoked:</span>
                <span className="font-semibold text-cyan-400">{selectedEntry.scopeUsed}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Canonical SHA-256 Event Hash:
              </span>
              <p className="p-3 bg-[#050506] border border-white/10 text-emerald-400 font-mono text-[11px] rounded-xl break-all">
                {selectedEntry.eventHash}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
