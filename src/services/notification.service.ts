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
  list: async () => {
    const response = await apiClient.get('/api/v1/notifications');
    return unwrapApiResponse<NotificationItem[]>(response.data);
  },

  listUnread: async () => {
    const response = await apiClient.get('/api/v1/notifications/unread');
    return unwrapApiResponse<NotificationItem[]>(response.data);
  },

  markRead: async (notificationId: string, createdAt: string) => {
    await apiClient.post(`/api/v1/notifications/${notificationId}/read`, { createdAt });
  },

  markAllRead: async () => {
    await apiClient.post('/api/v1/notifications/read-all');
  },
};
