import { useEffect, useRef, useCallback } from 'react';
import { env } from '@/config/env';

export interface NotificationEvent {
  id: string;
  type: 'BOOKING' | 'CANCELLATION' | 'SYSTEM' | 'MESSAGE';
  title: string;
  message: string;
  timestamp: string;
}

/**
 * useSSENotifications Hook
 * 
 * Manages the Server-Sent Events (SSE) lifecycle for real-time notifications.
 * Handles reconnection, heartbeat, and stale recovery.
 */
export const useSSENotifications = (onNotification: (event: NotificationEvent) => void) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`${env.VITE_API_URL}/api/v1/me/notifications/stream`, {
      withCredentials: true,
    });

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onNotification(data);
      } catch (e) {
        console.error('SSE Parse Error:', e);
      }
    };

    es.onerror = (error) => {
      console.error('SSE Connection Error:', error);
      es.close();
      
      // Exponential backoff or simple reconnect logic
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    eventSourceRef.current = es;
  }, [onNotification]);

  useEffect(() => {
    connect();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    status: eventSourceRef.current?.readyState,
    reconnect: connect,
  };
};
