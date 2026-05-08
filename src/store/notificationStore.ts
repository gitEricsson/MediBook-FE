import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { NotificationEvent } from '@/hooks/useSSENotifications';

interface NotificationState {
  notifications: NotificationEvent[];
  unreadCount: number;
  addNotification: (notification: NotificationEvent) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => 
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }), false, 'notifications/add'),

      setUnreadCount: (unreadCount) => 
        set({ unreadCount }, false, 'notifications/setCount'),

      markAsRead: (id) => 
        set((state) => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }), false, 'notifications/markRead'),

      clearAll: () => 
        set({ notifications: [], unreadCount: 0 }, false, 'notifications/clear'),
    }),
    { name: 'MediBook Notification Store' }
  )
);
