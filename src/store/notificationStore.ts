import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface StoredNotification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  appointmentId?: number;
}

interface NotificationState {
  notifications: StoredNotification[];
  unreadCount: number;
  addNotification: (n: StoredNotification) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (notificationId: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) =>
        set(
          (state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }),
          false,
          'notifications/add',
        ),

      setUnreadCount: (unreadCount) =>
        set({ unreadCount }, false, 'notifications/setCount'),

      markAsRead: (notificationId) =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) =>
              n.notificationId === notificationId ? { ...n, read: true } : n,
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }),
          false,
          'notifications/markRead',
        ),

      clearAll: () =>
        set({ notifications: [], unreadCount: 0 }, false, 'notifications/clear'),
    }),
    { name: 'MediBook Notification Store' },
  ),
);
