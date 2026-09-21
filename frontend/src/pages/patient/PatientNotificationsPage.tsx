import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Lock,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCheck,
  Trash2,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { BackButton } from '../../components/common/BackButton';
import { getPrescriptionIdFromNotification } from '../../utils/notificationHelpers';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export const PatientNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ACCESS' | 'LABS'>('ALL');

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      addToast('info', 'All notifications marked as read.');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      addToast('info', 'Notification dismissed.');
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleReview = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    const typeUpper = String(notif.type || notif.category || '').toUpperCase();
    const titleUpper = String(notif.title || '').toUpperCase();

    // 1. Prescription Notifications
    if (typeUpper.includes('PRESCRIPTION') || titleUpper.includes('PRESCRIPTION')) {
      const rxId = getPrescriptionIdFromNotification(notif);
      if (rxId) {
        navigate(`/patient/prescriptions/${rxId}`);
        return;
      }
      addToast('warning', 'Prescription details are unavailable.');
      navigate('/patient/prescriptions');
      return;
    }

    // 2. Doctor Access Requests
    if (notif.relatedEntityId && (typeUpper.includes('ACCESS') || typeUpper.includes('DOCTOR_ACCESS'))) {
      navigate(`/patient/access-permissions?requestId=${notif.relatedEntityId}`);
      return;
    }

    // 3. Explicit linkRoute for other notification types
    let targetLink = notif.linkRoute || notif.link || '';
    if (!targetLink) {
      if (typeUpper.includes('ACCESS')) targetLink = '/patient/access-permissions';
      else if (typeUpper.includes('LAB')) targetLink = '/patient/lab-reports';
      else if (typeUpper.includes('APPOINTMENT')) targetLink = '/patient/appointments';
      else if (typeUpper.includes('CONSULTATION')) targetLink = '/patient/consultations';
      else if (typeUpper.includes('MEDICINE') || typeUpper.includes('DOSE') || titleUpper.includes('MEDICINE')) targetLink = '/patient/medicines';
      else if (typeUpper.includes('EMERGENCY')) targetLink = '/patient/emergency';
      else if (typeUpper.includes('AUDIT') || typeUpper.includes('SECURITY')) targetLink = '/patient/audit';
      else if (typeUpper.includes('HELPDESK')) targetLink = '/patient/helpdesk';
      else targetLink = '/patient/home';
    }
    navigate(targetLink);
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'ACCESS') return n.type === 'ACCESS_REQUEST' || n.type === 'DOCTOR_ACCESS';
    if (filter === 'LABS') return n.type === 'LAB_REPORT';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'ACCESS_REQUEST':
      case 'DOCTOR_ACCESS':
        return <Lock className="w-5 h-5 text-cyan-400" />;
      case 'LAB_REPORT':
        return <FileText className="w-5 h-5 text-teal-400" />;
      case 'APPOINTMENT':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'EMERGENCY':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    }
  };

  const formatTimestamp = (createdAt?: string) => {
    if (!createdAt) return 'Just now';
    const d = new Date(createdAt);
    return isNaN(d.getTime())
      ? 'Just now'
      : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
              Alerts & Activity Feed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Notifications & Clinical Alerts
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Real-time updates regarding doctor access requests, published lab reports, and security events.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#101012] text-zinc-300 text-xs font-bold hover:bg-white/5 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CheckCheck className="w-4 h-4 text-cyan-400" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </ScrollReveal>

      {/* Filter Tabs */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="flex items-center gap-2 border-b border-white/5 pb-3 text-xs font-bold">
          {[
            { label: 'All Alerts', key: 'ALL', count: notifications.length },
            {
              label: 'Unread',
              key: 'UNREAD',
              count: unreadCount,
            },
            {
              label: 'Access Requests',
              key: 'ACCESS',
              count: notifications.filter((n) => n.type === 'ACCESS_REQUEST' || n.type === 'DOCTOR_ACCESS').length,
            },
            {
              label: 'Lab Reports',
              key: 'LABS',
              count: notifications.filter((n) => n.type === 'LAB_REPORT').length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-xl transition-all ${
                filter === tab.key
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading && notifications.length === 0 ? (
          <div className="bg-[#0B0B0D] p-12 text-center rounded-3xl border border-white/10 space-y-2">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-semibold">Loading notifications...</p>
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="bg-[#0B0B0D] p-12 text-center rounded-3xl border border-white/10 space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Unable to load notifications</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">{error}</p>
            <button
              onClick={() => refreshNotifications()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold rounded-xl transition-colors border border-cyan-500/20"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#0B0B0D] p-12 text-center rounded-3xl border border-white/10 space-y-2">
            <Bell className="w-12 h-12 text-zinc-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No notifications</h4>
            <p className="text-xs text-zinc-500">You're all caught up with your healthcare alerts.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#0B0B0D] p-12 text-center rounded-3xl border border-white/10 space-y-2">
            <Bell className="w-12 h-12 text-zinc-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No matching notifications</h4>
            <p className="text-xs text-zinc-500">No alerts found for the selected filter.</p>
          </div>
        ) : (
          <ScrollRevealGroup direction="bottom" stagger={0.06}>
            {filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleReview(notif)}
                className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer hover:border-white/20 ${
                  notif.isRead
                    ? 'bg-[#0B0B0D] border-white/10 hover:bg-[#101012]'
                    : 'bg-[#101012] border-cyan-500/30 ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-950/20'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{notif.title}</h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{notif.message}</p>
                    <p className="text-[11px] text-zinc-500 font-medium">{formatTimestamp(notif.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleReview(notif)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-900/30 flex items-center gap-1"
                  >
                    <span>Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-white/5 transition-colors"
                    title="Dismiss"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </ScrollRevealGroup>
        )}
      </div>
    </div>
  );
};
