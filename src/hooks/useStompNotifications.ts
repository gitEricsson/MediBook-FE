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
// Security: Always use wss:// (secure WebSocket) in production, ws:// only in dev
const buildWsUrl = (token: string) => {
  const apiUrl = env.VITE_API_URL;
  // Convert https:// to wss://, http:// to ws://
  const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
  const host = apiUrl.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${host}/ws?token=${encodeURIComponent(token)}`;
};

// Exponential backoff for reconnection with max delay
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

export const useStompNotifications = (
  onNotification: (event: NotificationEvent) => void,
  enabled = false,
) => {
  const clientRef = useRef<Client | null>(null);
  const onNotificationRef = useRef(onNotification);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
  }, []);

  const connect = useCallback(() => {
    disconnect();
    if (!enabled) return;

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    // Calculate exponential backoff delay
    const exponentialDelay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current),
      MAX_RECONNECT_DELAY_MS
    );

    const client = new Client({
      brokerURL: buildWsUrl(token),
      reconnectDelay: exponentialDelay,

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
        // Reset reconnect attempts on successful connection
        reconnectAttemptsRef.current = 0;

        client.subscribe('/user/queue/notifications', (frame: IMessage) => {
          try {
            const payload = JSON.parse(frame.body) as NotificationEvent;
            onNotificationRef.current(payload);
          } catch (e) {
            // Malformed JSON — log and skip
            console.warn('[WebSocket] Malformed notification payload:', e);
          }
        });
      },

      // Handle connection errors gracefully
      onStompError: (frame) => {
        reconnectAttemptsRef.current += 1;
        console.error('[WebSocket] STOMP error:', frame);
        // Client will automatically attempt to reconnect with exponential backoff
      },

      // Handle WebSocket connection errors
      onWebSocketError: (event) => {
        reconnectAttemptsRef.current += 1;
        console.error('[WebSocket] Connection error:', event);
        // Client will automatically attempt to reconnect with exponential backoff
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
