import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Lock,
  Calendar,
  AlertTriangle,
  CheckCheck,
  Trash2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Clock,
  RotateCw,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { BackButton } from '../../components/common/BackButton';
import { getNotificationMetadata } from '../../utils/notificationHelpers';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

export const DoctorNotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ACCESS' | 'APPOINTMENTS' | 'EMERGENCY'>('ALL');

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
    const metadata = getNotificationMetadata(notif);

    // 1. Direct linkRoute if populated
    if (notif.linkRoute) {
      navigate(notif.linkRoute);
      return;
    }

    // 2. Access Requests / Approvals / Permissions
    if (typeUpper.includes('ACCESS') || typeUpper.includes('PERMISSION') || titleUpper.includes('ACCESS') || titleUpper.includes('CONSENT')) {
      if (metadata.patientId && (titleUpper.includes('APPROVED') || typeUpper.includes('APPROVED'))) {
        navigate(`/doctor/patients/${metadata.patientId}/emr`);
        return;
      }
      navigate('/doctor/access-requests');
      return;
    }

    // 3. Appointments
    if (typeUpper.includes('APPOINTMENT') || titleUpper.includes('APPOINTMENT')) {
      navigate('/doctor/appointments');
      return;
    }

    // 4. Emergency Alerts
    if (typeUpper.includes('EMERGENCY') || titleUpper.includes('EMERGENCY')) {
      navigate('/doctor/emergency');
      return;
    }

    // 5. Fallback for Doctor
    navigate('/doctor/dashboard');
  };

  const filtered = notifications.filter((n) => {
    const typeUpper = String(n.type || n.category || '').toUpperCase();
    const titleUpper = String(n.title || '').toUpperCase();

    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'ACCESS') {
      return typeUpper.includes('ACCESS') || typeUpper.includes('PERMISSION') || titleUpper.includes('ACCESS') || titleUpper.includes('CONSENT');
    }
    if (filter === 'APPOINTMENTS') {
      return typeUpper.includes('APPOINTMENT') || titleUpper.includes('APPOINTMENT');
    }
    if (filter === 'EMERGENCY') {
      return typeUpper.includes('EMERGENCY') || titleUpper.includes('EMERGENCY');
    }
    return true;
  });

  const getIcon = (type: string, title: string) => {
    const typeUpper = String(type || '').toUpperCase();
    const titleUpper = String(title || '').toUpperCase();

    if (typeUpper.includes('EMERGENCY') || titleUpper.includes('EMERGENCY')) {
      return <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />;
    }
    if (typeUpper.includes('APPOINTMENT') || titleUpper.includes('APPOINTMENT')) {
      return <Calendar className="w-5 h-5 text-blue-400" />;
    }
    if (titleUpper.includes('APPROVED') || typeUpper.includes('APPROVED')) {
      return <UserCheck className="w-5 h-5 text-emerald-400" />;
    }
    if (typeUpper.includes('ACCESS') || typeUpper.includes('PERMISSION')) {
      return <Lock className="w-5 h-5 text-purple-400" />;
    }
    return <Bell className="w-5 h-5 text-teal-400" />;
  };

  const formatTimestamp = (createdAt?: string) => {
    if (!createdAt) return 'Just now';
    const d = new Date(createdAt);
    return isNaN(d.getTime())
      ? 'Just now'
      : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24 text-white antialiased">
      {/* Top Navigation */}
      <ScrollReveal direction="left">
        <div className="flex items-center justify-between">
          <BackButton fallbackPath="/doctor/dashboard" />
          <button
            onClick={refreshNotifications}
            className="px-4 py-2 rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 text-xs font-bold hover:bg-white/[0.08] hover:text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-teal-400" />
            <span>Refresh</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Header */}
      <ScrollReveal direction="left" delay={0.05}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Clinical Activity & Alerts Feed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
              Doctor Notifications & Clinical Alerts
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              Real-time updates regarding patient EMR consent approvals, booked appointments, and triage notices.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-5 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs font-bold hover:bg-white/[0.08] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-teal-400" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </ScrollReveal>

      {/* Filter Tabs */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-4 text-xs font-bold">
          {[
            { label: 'All Alerts', key: 'ALL', count: notifications.length },
            {
              label: 'Unread',
              key: 'UNREAD',
              count: unreadCount,
            },
            {
              label: 'Access Approvals / Requests',
              key: 'ACCESS',
              count: notifications.filter((n) => {
                const t = (n.type || '').toUpperCase() + (n.title || '').toUpperCase();
                return t.includes('ACCESS') || t.includes('PERMISSION') || t.includes('CONSENT');
              }).length,
            },
            {
              label: 'Appointments',
              key: 'APPOINTMENTS',
              count: notifications.filter((n) => {
                const t = (n.type || '').toUpperCase() + (n.title || '').toUpperCase();
                return t.includes('APPOINTMENT');
              }).length,
            },
            {
              label: 'Emergency Alerts',
              key: 'EMERGENCY',
              count: notifications.filter((n) => {
                const t = (n.type || '').toUpperCase() + (n.title || '').toUpperCase();
                return t.includes('EMERGENCY');
              }).length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer ${
                filter === tab.key
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
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
          <div className="bg-[#0B0B0D] p-12 text-center rounded-[32px] border border-white/[0.08] space-y-2">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-white/50 font-semibold">Loading doctor notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <ScrollReveal direction="bottom">
            <div className="bg-[#0B0B0D] p-12 text-center rounded-[32px] border border-white/[0.08] space-y-2">
              <Bell className="w-12 h-12 text-white/20 mx-auto" />
              <h4 className="text-base font-bold text-white">No notifications</h4>
              <p className="text-xs text-white/40">You're all caught up with your clinical alerts.</p>
            </div>
          </ScrollReveal>
        ) : filtered.length === 0 ? (
          <ScrollReveal direction="bottom">
            <div className="bg-[#0B0B0D] p-12 text-center rounded-[32px] border border-white/[0.08] space-y-2">
              <Bell className="w-12 h-12 text-white/20 mx-auto" />
              <h4 className="text-base font-bold text-white">No matching notifications</h4>
              <p className="text-xs text-white/40">No clinical alerts found for the selected filter.</p>
            </div>
          </ScrollReveal>
        ) : (
          <ScrollRevealGroup staggerDelay={0.04} className="space-y-3">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleReview(notif)}
                className={`p-5 rounded-[24px] border transition-all flex items-start justify-between gap-4 cursor-pointer shadow-lg ${
                  notif.isRead
                    ? 'bg-[#0B0B0D] border-white/[0.08] hover:border-white/20'
                    : 'bg-[#101014] border-teal-500/30 ring-1 ring-teal-500/20 hover:border-teal-500/50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex-shrink-0 mt-0.5">
                    {getIcon(notif.type, notif.title)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{notif.title}</h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-400" />
                      )}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{notif.message}</p>
                    <p className="text-[11px] text-white/40 font-medium">{formatTimestamp(notif.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleReview(notif)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 transition-all flex items-center gap-1 shadow-md shadow-teal-600/20 cursor-pointer"
                  >
                    <span>Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
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

export default DoctorNotificationsPage;
