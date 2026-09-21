import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Eye,
  Download,
  Clock,
  Building2,
  FileText,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

interface DoctorAuditLogItem {
  id: string;
  time: string;
  action: string;
  patient: string;
  resource: string;
  scope: string;
  hash: string;
}

export const DoctorAuditPage: React.FC = () => {
  const { addToast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<DoctorAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getDoctorAudit();
      if (res.success && res.audits) {
        const mapped = res.audits.map((item: any) => {
          const dateObj = new Date(item.timestamp || item.createdAt);
          const timeFormatted = isNaN(dateObj.getTime())
            ? item.timestamp || 'Recent'
            : dateObj.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

          const patientName = item.patientHealthId
            ? `${item.patientHealthId}`
            : item.patientId
            ? `Patient (${item.patientId.slice(0, 8)})`
            : 'General EMR Access';

          const resourceDesc = item.recordId
            ? `${item.documentType || 'Record'}: ${item.recordId}`
            : item.reason || item.documentType || 'Clinical EMR';

          return {
            id: item.id,
            time: timeFormatted,
            action: item.action || 'VIEW',
            patient: patientName,
            resource: resourceDesc,
            scope: item.documentType || item.accessType || 'Clinical Records',
            hash: item.newHash || item.previousHash || `0x${item.id.replace(/-/g, '')}`,
          };
        });
        setLogs(mapped);
      }
    } catch (err) {
      console.error('Failed to load doctor audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleCopy = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('info', 'Cryptographic audit hash copied.');
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.scope.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24 text-white antialiased">
      {/* Header */}
      <ScrollReveal direction="left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Practitioner Access Log
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
              Physician Clinical Audit History
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              Every clinical record accessed or issued under your medical license is permanently
              timestamped in the root audit ledger.
            </p>
          </div>

          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="self-start sm:self-auto px-5 py-2.5 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : 'text-white/40'}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Filter & Search Bar */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="bg-[#0B0B0D] p-4 rounded-[28px] border border-white/[0.08] shadow-xl flex items-center gap-3">
          <Search className="w-4 h-4 text-white/40 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by patient, action, or clinical resource..."
            className="w-full bg-transparent border-none text-xs text-white placeholder-white/40 focus:outline-none"
          />
        </div>
      </ScrollReveal>

      {/* Log Table */}
      <ScrollReveal direction="bottom" delay={0.14}>
        <div className="bg-[#0B0B0D] rounded-[32px] border border-white/[0.08] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.08] text-white/40 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-4">Action</th>
                  <th className="py-4 px-4">Patient Target</th>
                  <th className="py-4 px-4">Resource & Scope</th>
                  <th className="py-4 px-6 text-right">Cryptographic Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-white/70">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-white/40 text-xs font-medium">
                      {loading ? 'Querying immutable audit ledger...' : 'No audit entries found.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-mono text-white font-semibold">{log.time}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            log.action === 'VIEW'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                              : log.action === 'DOWNLOAD'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-white">{log.patient}</td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white/90">{log.resource}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">Scope: {log.scope}</div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-[11px] text-white/40">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="truncate max-w-[120px] bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-md text-white/80">
                            {log.hash}
                          </span>
                          <button
                            onClick={() => handleCopy(log.id, log.hash)}
                            className="p-1 hover:text-white transition-colors cursor-pointer"
                            title="Copy Hash"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-white/40" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default DoctorAuditPage;
