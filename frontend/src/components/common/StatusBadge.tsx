import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldAlert, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const normalized = (status || '').toUpperCase().trim();

  let bg = 'bg-white/[0.06] text-slate-300 border-white/[0.10]';
  let Icon = Clock;
  let label = status;

  switch (normalized) {
    case 'VERIFIED':
    case 'APPROVED':
    case 'COMPLETED':
    case 'SUCCESS':
    case 'CONFIRMED':
      bg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      Icon = CheckCircle2;
      label = normalized === 'VERIFIED' ? 'Verified' : normalized === 'APPROVED' ? 'Approved' : 'Confirmed';
      break;

    case 'PENDING':
    case 'IN_PROGRESS':
    case 'NEW':
    case 'INVESTIGATING':
      bg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      Icon = Clock;
      label = normalized === 'PENDING' ? 'Pending Review' : 'In Progress';
      break;

    case 'ACTIVE':
      bg = 'bg-teal-500/15 text-teal-400 border-teal-500/30';
      Icon = ShieldCheck;
      label = 'Active';
      break;

    case 'REJECTED':
    case 'CANCELLED':
    case 'FAILED':
      bg = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      Icon = XCircle;
      label = normalized === 'REJECTED' ? 'Rejected' : normalized === 'CANCELLED' ? 'Cancelled' : 'Failed';
      break;

    case 'SUSPENDED':
    case 'REVOKED':
    case 'EXPIRED':
    case 'ENDED_MANUALLY':
      bg = 'bg-white/[0.08] text-slate-400 border-white/[0.12]';
      Icon = AlertTriangle;
      label = normalized === 'REVOKED' ? 'Revoked' : normalized === 'EXPIRED' ? 'Expired' : 'Suspended';
      break;

    case 'INTEGRITY_FAILURE':
    case 'HASH_MISMATCH':
    case 'TAMPERING_DETECTED':
      bg = 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold animate-pulse';
      Icon = ShieldAlert;
      label = 'Integrity Failure';
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-sm tracking-tight transition-colors duration-200 ${sizeClasses} ${bg} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};

export { PremiumCard } from './ScrollReveal';
