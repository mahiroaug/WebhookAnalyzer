/**
 * 新規 Webhook 受信をリアルタイムで受け取り、コールバックを呼ぶフック。
 * 接続断時は自動再接続を試みる。
 */
import { useEffect, useRef, useCallback, useState } from "react";

const WS_PATH = "/api/webhooks/ws";
const RECONNECT_DELAY_MS = 3000;

export function useWebhookWebSocket(onWebhookReceived: () => void): {
  connected: boolean;
  reconnect: () => void;
} {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onReceivedRef = useRef(onWebhookReceived);
  onReceivedRef.current = onWebhookReceived;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}${WS_PATH}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setConnected(true);
      wsRef.current = ws;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "webhook_received") {
          onReceivedRef.current();
        }
      } catch {
        // パースエラーは無視
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setConnected(false);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current != null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  return { connected, reconnect };
}
