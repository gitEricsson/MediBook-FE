import { apiClient } from '@/lib/api/client';
import { unwrapApiResponse } from '@/lib/api/contracts';

export interface NotificationItem {
  notificationId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  appointmentId?: number;
}

export const NotificationService = {
  list: async (unreadOnly = false) => {
    const response = await apiClient.get('/api/v1/me/notifications', {
      params: unreadOnly ? { unread: true } : undefined,
    });
    return unwrapApiResponse<NotificationItem[]>(response.data);
  },

  listUnread: async () => {
    const response = await apiClient.get('/api/v1/me/notifications/unread');
    return unwrapApiResponse<NotificationItem[]>(response.data);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/api/v1/me/notifications/unread-count');
    return unwrapApiResponse<number>(response.data);
  },

  markRead: async (notificationId: string, createdAt: string) => {
    await apiClient.post(`/api/v1/me/notifications/${notificationId}/read`, { createdAt });
  },

  markAllRead: async () => {
    await apiClient.post('/api/v1/me/notifications/read-all');
  },
};
