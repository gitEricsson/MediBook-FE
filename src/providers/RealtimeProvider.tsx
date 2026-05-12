import React from 'react';
import { useStompNotifications, NotificationEvent } from '@/hooks/useStompNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const status = useAuthStore((s) => s.status);
  const addNotification = useNotificationStore((s) => s.addNotification);

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
    status === 'authenticated',
  );

  return <>{children}</>;
};
