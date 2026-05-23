import React from 'react';
import { useStompNotifications, NotificationEvent } from '@/hooks/useStompNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { NotificationService } from '@/services/notification.service';
import { toast } from 'sonner';

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const status = useAuthStore((s) => s.status);
  const isAuthenticated = status === 'authenticated';
  const { addNotification, setUnreadCount } = useNotificationStore();

  // Poll unread count every 30 s as a reliable badge fallback alongside STOMP.
  // Disable retries: on a 5xx we'd otherwise hit the failing endpoint 4× per cycle.
  useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
      return count;
    },
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: false,
  });

  useStompNotifications(
    (event: NotificationEvent) => {
      addNotification({
        notificationId: event.notificationId,
        type: event.type,
        title: event.title,
        message: event.message,
        createdAt: event.createdAt,
        read: false,
        appointmentId: event.appointmentId,
      });
      toast(event.title, { description: event.message });
    },
    isAuthenticated,
  );

  return <>{children}</>;
};
