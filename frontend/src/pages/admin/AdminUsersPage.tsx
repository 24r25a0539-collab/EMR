import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  User,
  Stethoscope,
  Lock,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  identifier: string;
  status: 'ACTIVE' | 'SUSPENDED';
  joinedDate: string;
}

export const AdminUsersPage: React.FC = () => {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [users, setUsers] = useState<AdminUserItem[]>([
    {
      id: 'usr-1',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91 98765 43210',
      role: 'PATIENT',
      identifier: 'HP-100245',
      status: 'ACTIVE',
      joinedDate: '14 Jun 2024',
    },
    {
      id: 'usr-2',
      name: 'Dr. Ananya Sharma',
      email: 'dr.sharma@apexhealth.org',
      phone: '+91 98765 43211',
      role: 'DOCTOR',
      identifier: 'TS-MCI-8921',
      status: 'ACTIVE',
      joinedDate: '01 Aug 2024',
    },
    {
      id: 'usr-3',
      name: 'Dr. Rajesh Verma',
      email: 'dr.verma@carehospital.in',
      phone: '+91 98765 43212',
      role: 'DOCTOR',
      identifier: 'TS-MCI-7412',
      status: 'ACTIVE',
      joinedDate: '15 Jul 2024',
    },
    {
      id: 'usr-4',
      name: 'Dr. Priya Nair',
      email: 'dr.nair@skinclinic.in',
      phone: '+91 98765 43213',
      role: 'DOCTOR',
      identifier: 'TS-MCI-9102',
      status: 'ACTIVE',
      joinedDate: 'Today',
    },
    {
      id: 'usr-5',
      name: 'Vikram Malhotra',
      email: 'admin@emr.gov.in',
      phone: '+91 98765 43200',
      role: 'ADMIN',
      identifier: 'ADMIN-ROOT-01',
      status: 'ACTIVE',
      joinedDate: '01 Jan 2024',
    },
  ]);

  const toggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: nextStatus as any } : u))
    );
    addToast(
      nextStatus === 'ACTIVE' ? 'success' : 'warning',
      `Account status updated to ${nextStatus}.`
    );
  };

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 antialiased">
      {/* Header */}
      <ScrollReveal direction="bottom">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
            Account Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
            System Users & Identities
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Manage citizen sovereign accounts, licensed medical practitioners, and platform administrators.
          </p>
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
              placeholder="Search by name, Health ID, email, or phone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white placeholder:text-white/40 text-xs focus:border-blue-500 outline-none"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-white/10 text-xs bg-[#141416] text-white/80 focus:border-blue-500 outline-none"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="PATIENT">Patients</option>
              <option value="DOCTOR">Doctors</option>
              <option value="ADMIN">Administrators</option>
            </select>
          </div>
        </div>
      </ScrollReveal>

      {/* Desktop View: Premium Table */}
      <ScrollReveal direction="bottom" delay={0.1}>
        <div className="hidden md:block bg-[#0B0B0D] rounded-[24px] border border-white/10 shadow-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#101012] border-b border-white/5 text-white/50 uppercase font-semibold text-[10px]">
                <th className="py-4 px-6">User / Account</th>
                <th className="py-4 px-4">Role Clearance</th>
                <th className="py-4 px-4">Identifier / License</th>
                <th className="py-4 px-4">Joined Date</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/70">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-white text-sm">{u.name}</div>
                    <div className="text-[11px] text-white/50 mt-0.5">{u.email}</div>
                    <div className="text-[10px] text-white/40 font-mono">{u.phone}</div>
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                          : u.role === 'DOCTOR'
                          ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                          : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="py-4 px-4 font-mono font-bold text-cyan-400">
                    {u.identifier}
                  </td>

                  <td className="py-4 px-4 text-white/40">{u.joinedDate}</td>

                  <td className="py-4 px-4">
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    {u.role !== 'ADMIN' ? (
                      <button
                        onClick={() => toggleStatus(u.id, u.status)}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                          u.status === 'ACTIVE'
                            ? 'border border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-white/40 font-mono">Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollReveal>

      {/* Mobile View: Converted Rows into Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((u) => (
          <div
            key={u.id}
            className="p-5 rounded-2xl bg-[#0B0B0D] border border-white/10 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{u.name}</h3>
                <p className="text-xs text-white/60">{u.email}</p>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">{u.phone}</p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  u.role === 'ADMIN'
                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                    : u.role === 'DOCTOR'
                    ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                    : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                }`}
              >
                {u.role}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
              <span className="font-mono text-cyan-400">{u.identifier}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  u.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {u.status}
              </span>
            </div>

            {u.role !== 'ADMIN' && (
              <button
                onClick={() => toggleStatus(u.id, u.status)}
                className={`w-full py-2 rounded-xl font-semibold text-xs transition-colors ${
                  u.status === 'ACTIVE'
                    ? 'border border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {u.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersPage;
