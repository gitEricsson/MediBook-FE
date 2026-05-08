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

export interface MarkReadRequest {
  createdAt: string;
}

export const NotificationService = {
  list: async (unread?: boolean) => {
    const response = await apiClient.get('/api/v1/me/notifications', { params: { unread } });
    return unwrapApiResponse<NotificationItem[]>(response.data);
  },

  unreadCount: async () => {
    const response = await apiClient.get('/api/v1/me/notifications/unread-count');
    return unwrapApiResponse<number>(response.data);
  },

  markRead: async (id: string, payload: MarkReadRequest) => {
    await apiClient.post(`/api/v1/me/notifications/${id}/read`, payload);
  },

  markAllRead: async () => {
    await apiClient.post('/api/v1/me/notifications/read-all');
  },

  streamUrl: (baseUrl: string) => `${baseUrl}/api/v1/me/notifications/stream`,
};

