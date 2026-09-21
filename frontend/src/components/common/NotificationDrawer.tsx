import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bell,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Lock,
  ArrowRight,
  CheckCheck,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getPrescriptionIdFromNotification } from '../../utils/notificationHelpers';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'ACCESS_REQUEST' | 'LAB_REPORT' | 'APPOINTMENT' | 'EMERGENCY' | 'SECURITY' | 'GENERAL';
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      try {
        await markAsRead(n.id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    onClose();

    const typeUpper = String(n.type || n.category || '').toUpperCase();
    const titleUpper = String(n.title || '').toUpperCase();

    // 1. Explicit linkRoute if provided
    if (n.linkRoute) {
      navigate(n.linkRoute);
      return;
    }

    // 2. Prescription Notifications (Patient only)
    if (typeUpper.includes('PRESCRIPTION') || titleUpper.includes('PRESCRIPTION')) {
      const rxId = getPrescriptionIdFromNotification(n);
      if (rxId) {
        navigate(`/patient/prescriptions/${rxId}`);
        return;
      }
      navigate('/patient/prescriptions');
      return;
    }

    // 3. Access Requests & Permissions
    if (typeUpper.includes('ACCESS') || typeUpper.includes('DOCTOR_ACCESS') || typeUpper.includes('PERMISSION')) {
      if (role === 'DOCTOR') {
        navigate('/doctor/access-requests');
      } else {
        const reqId = n.relatedEntityId;
        navigate(reqId ? `/patient/access-permissions?requestId=${reqId}` : '/patient/access-permissions');
      }
      return;
    }

    // 4. Appointments
    if (typeUpper.includes('APPOINTMENT')) {
      navigate(role === 'DOCTOR' ? '/doctor/appointments' : '/patient/appointments');
      return;
    }

    // 5. Emergency
    if (typeUpper.includes('EMERGENCY')) {
      navigate(role === 'DOCTOR' ? '/doctor/emergency' : '/patient/emergency');
      return;
    }

    // 6. Role fallback
    if (role === 'DOCTOR') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/patient/home');
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'urgent') return n.type === 'EMERGENCY' || n.type === 'SECURITY' || n.type === 'ACCESS_REQUEST';
    return true;
  });

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ACCESS_REQUEST':
        return <Lock className="w-5 h-5 text-purple-400" />;
      case 'LAB_REPORT':
        return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'APPOINTMENT':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'EMERGENCY':
        return <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />;
      case 'SECURITY':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatTime = (createdAt?: string) => {
    if (!createdAt) return 'Just now';
    const d = new Date(createdAt);
    return isNaN(d.getTime())
      ? 'Just now'
      : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0B0B0D] border-l border-white/[0.08] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#101012]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Notifications</h2>
                <p className="text-xs text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts read'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-header / Filters */}
          <div className="px-4 sm:px-6 py-2.5 bg-[#141416] border-b border-white/[0.08] flex items-center justify-between text-xs">
            <div className="flex gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('urgent')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filter === 'urgent'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Priority
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] p-3 space-y-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-400">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 px-4">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-300">{error}</p>
                <button
                  onClick={refreshNotifications}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold rounded-lg transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-300">No notifications yet.</p>
                <p className="text-xs text-slate-500 mt-1">
                  You have cleared all alerts in this view.
                </p>
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer flex gap-3 border ${
                    n.isRead
                      ? 'bg-[#101012] border-white/[0.04] hover:bg-[#141416] opacity-80'
                      : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15 shadow-md shadow-blue-500/5'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4
                        className={`text-sm truncate ${
                          n.isRead ? 'font-medium text-slate-300' : 'font-bold text-white'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="mt-2 flex items-center text-xs font-semibold text-blue-400">
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/[0.08] bg-[#101012] text-center">
            <button
              onClick={() => {
                onClose();
                navigate(role === 'DOCTOR' ? '/doctor/notifications' : role === 'ADMIN' ? '/admin/audit' : '/patient/notifications');
              }}
              className="text-xs font-semibold text-blue-400 hover:underline"
            >
              View complete notification history →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
