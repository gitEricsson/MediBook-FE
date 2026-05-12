import { useEffect, useRef, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
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

// Convert http(s)://host to ws(s)://host/ws?token=...
// Backend auth: JWT passed as query param because browser WebSocket API
// cannot send custom headers during the HTTP→WS upgrade handshake.
const buildWsUrl = (token: string) =>
  `${env.VITE_API_URL.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`;

const RECONNECT_DELAY_MS = 5_000;

export const useStompNotifications = (
  onNotification: (event: NotificationEvent) => void,
  enabled = false,
) => {
  const clientRef = useRef<Client | null>(null);
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current = null;
  }, []);

  const connect = useCallback(() => {
    disconnect();
    if (!enabled) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const client = new Client({
      brokerURL: buildWsUrl(token),
      reconnectDelay: RECONNECT_DELAY_MS,

      // Re-read the token from the store before every connect / reconnect attempt.
      // The Axios response interceptor already handles access-token refresh on HTTP 401s,
      // so getState().accessToken is always the latest token after a refresh cycle.
      // Without this, every reconnect after the 15-min token lifetime would send the
      // same expired token and get rejected by JwtHandshakeInterceptor.
      beforeConnect: () => {
        const freshToken = useAuthStore.getState().accessToken;
        if (!freshToken) {
          // Token gone (logged out) — stop reconnecting immediately.
          client.deactivate();
          return;
        }
        client.brokerURL = buildWsUrl(freshToken);
      },

      onConnect: () => {
        client.subscribe('/user/queue/notifications', (frame: IMessage) => {
          try {
            const payload = JSON.parse(frame.body) as NotificationEvent;
            onNotificationRef.current(payload);
          } catch {
            // malformed JSON — skip
          }
        });
      },
    });

    clientRef.current = client;
    client.activate();
  }, [enabled, disconnect]);

  useEffect(() => {
    if (enabled) connect();
    return disconnect;
  }, [enabled, connect, disconnect]);

  return { reconnect: connect, disconnect };
};
