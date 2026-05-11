import { useEffect, useRef, useCallback } from 'react';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';

export interface NotificationEvent {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  appointmentId?: number;
}

const SSE_URL = `${env.VITE_API_URL}/api/v1/notifications/stream`;
const RECONNECT_DELAY = 5_000;

/**
 * useSSENotifications — fetch-based SSE so we can send the Bearer token header.
 * Native EventSource doesn't support custom headers; this implementation uses
 * the Fetch ReadableStream API which does.
 */
export const useSSENotifications = (
  onNotification: (event: NotificationEvent) => void,
  enabled = false,
) => {
  const abortRef = useRef<AbortController | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNotificationRef = useRef(onNotification);
  const connectRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    disconnect();
    if (!enabled) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const response = await fetch(SSE_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE connect failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const dataLine = part.split('\n').find((l) => l.startsWith('data:'));
            if (!dataLine) continue;
            try {
              const payload = JSON.parse(dataLine.slice(5).trim()) as NotificationEvent;
              onNotificationRef.current(payload);
            } catch {
              // malformed JSON — skip
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // Reconnect on unexpected drop
        reconnectRef.current = setTimeout(() => connectRef.current(), RECONNECT_DELAY);
      }
    })();
  }, [enabled, disconnect]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (enabled) connect();
    return disconnect;
  }, [enabled, connect, disconnect]);

  return { reconnect: connect, disconnect };
};
