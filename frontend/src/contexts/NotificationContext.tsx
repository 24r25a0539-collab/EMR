import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  priority?: string;
  isRead: boolean;
  linkRoute?: string;
  link?: string;
  metadataJson?: string;
  metadata?: any;
  relatedEntityId?: string;
  createdAt?: string;
  timestamp?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem('emr_token');
    if (isLoading || !isAuthenticated || !token || !user) {
      if (!isAuthenticated || !token) {
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.getNotifications();
      if (res && (res.success || Array.isArray(res.notifications) || Array.isArray(res.data))) {
        const notifs: NotificationItem[] = res.notifications || res.data || [];
        setNotifications(notifs);
        const count = typeof res.unreadCount === 'number'
          ? res.unreadCount
          : notifs.filter((n) => !n.isRead).length;
        setUnreadCount(count);
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      if (localStorage.getItem('emr_token')) {
        setError(err?.message || 'Unable to load notifications');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, user]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      refreshNotifications();
    }
    const interval = setInterval(() => {
      if (!isLoading && isAuthenticated && user) {
        refreshNotifications();
      }
    }, 30000); // 30s background sync
    return () => clearInterval(interval);
  }, [refreshNotifications, isLoading, isAuthenticated, user]);

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markNotificationRead('all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
