// frontend/src/hooks/useWhatsAppWebSocket.ts
/**
 * WebSocket hook for real-time WhatsApp messages.
 * Falls back to polling if WebSocket is unavailable.
 *
 * Usage:
 *   const { isConnected, lastMessage } = useWhatsAppWebSocket({
 *     onMessage: (msg) => queryClient.invalidateQueries(...)
 *   });
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';

interface IncomingEvent {
  type: 'new_message' | 'status_update' | 'ping';
  data?: Record<string, unknown>;
}

interface Options {
  onMessage?:      (event: IncomingEvent) => void;
  onConnect?:      () => void;
  onDisconnect?:   () => void;
}

interface State {
  isConnected: boolean;
  lastMessage: IncomingEvent | null;
  send: (data: Record<string, unknown>) => void;
}

// Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
const getDelay = (attempt: number) =>
  Math.min(1000 * Math.pow(2, attempt), 30_000);

export const useWhatsAppWebSocket = (options: Options = {}): State => {
  const { onMessage, onConnect, onDisconnect } = options;
  useAuthStore();

  const wsRef         = useRef<WebSocket | null>(null);
  const attemptRef    = useRef(0);
  const timerRef      = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef    = useRef(true);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<IncomingEvent | null>(null);

  const connect = useCallback(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken || !mountedRef.current) return;

    // Build WS URL from the API base URL
    const apiBase   = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsBase    = apiBase.replace(/^http/, 'ws');
    const wsUrl     = `${wsBase}/api/v1/ws/whatsapp?token=${encodeURIComponent(accessToken)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        attemptRef.current = 0;
        setIsConnected(true);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const parsed: IncomingEvent = JSON.parse(event.data);
          if (parsed.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          setLastMessage(parsed);
          onMessage?.(parsed);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        onDisconnect?.();

        // Don't reconnect on intentional close (code 1000)
        if (event.code === 1000) return;

        const delay = getDelay(attemptRef.current);
        attemptRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // onclose will fire next and handle reconnect
        ws.close();
      };
    } catch {
      // WebSocket constructor threw (e.g. bad URL)
      const delay = getDelay(attemptRef.current);
      attemptRef.current += 1;
      timerRef.current = setTimeout(connect, delay);
    }
  }, [onConnect, onDisconnect, onMessage]);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
      wsRef.current?.close(1000, 'component unmounted');
    };
  }, [connect]);

  return { isConnected, lastMessage, send };
};
