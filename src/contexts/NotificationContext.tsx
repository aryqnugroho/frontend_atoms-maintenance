import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Notification } from '@/types';
import { notificationService } from '@/services/notificationService';
import { NotificationContext } from '@/contexts/contextInstances';
import { useAuth } from '@/hooks/useAuth';

const POLL_INTERVAL_MS = 30_000;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Tracks whether a fetch is already in flight, so polling never stacks.
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || inFlight.current) return;
    inFlight.current = true;
    setIsLoading(true);
    try {
      const list = await notificationService.list(20);
      setNotifications(list);
    } catch {
      // Silent: notification fetch failures shouldn't disrupt the UI.
      // The bell just keeps showing the last successful state.
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch + 30s polling, scoped to authenticated sessions.
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isAuthenticated, refresh]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  const markAsRead = async (id: string | number) => {
    // Optimistic update first, server call second — bell badge feels instant.
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await notificationService.markAsRead(id);
    } catch {
      // Re-fetch on failure to reconcile state with the server.
      void refresh();
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch {
      void refresh();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refresh,
        addNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
