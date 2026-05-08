import React, { useEffect } from 'react';
import { useSSENotifications } from '@/hooks/useSSENotifications';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = useAuthStore();
  const addNotification = useNotificationStore(state => state.addNotification);

  const { reconnect } = useSSENotifications((event) => {
    addNotification(event);
    
    // Potential browser notification integration
    if (Notification.permission === 'granted') {
      new Notification(event.title, { body: event.message });
    }
  });

  useEffect(() => {
    if (status === 'authenticated') {
      reconnect();
    }
  }, [status, reconnect]);

  return <>{children}</>;
};
