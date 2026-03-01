/**
 * 新規 Webhook 受信をリアルタイムで受け取り、コールバックを呼ぶフック。
 * 接続断時は自動再接続を試みる。
 * US-107: 新着 ID をコールバックに渡す（アニメーション・効果音用）
 * US-156: 接続状態の詳細化（connecting / connected / reconnecting）
 */
import { useEffect, useRef, useCallback, useState } from "react";

const WS_PATH = "/api/webhooks/ws";
const RECONNECT_DELAY_MS = 3000;

export type WebSocketStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export function useWebhookWebSocket(
  onWebhookReceived: (newId?: string) => void
): {
  connected: boolean;
  status: WebSocketStatus;
  reconnect: () => void;
} {
  const [status, setStatus] = useState<WebSocketStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onReceivedRef = useRef(onWebhookReceived);
  onReceivedRef.current = onWebhookReceived;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}${WS_PATH}`;
    const ws = new WebSocket(url);
    setStatus("connecting");

    ws.onopen = () => {
      setStatus("connected");
      wsRef.current = ws;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "webhook_received") {
          onReceivedRef.current(data?.id);
        }
      } catch {
        // パースエラーは無視
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setStatus("reconnecting");
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
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
    setStatus("disconnected");
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const reconnect = useCallback(() => {
    disconnect();
    setStatus("connecting");
    connect();
  }, [connect, disconnect]);

  return { connected: status === "connected", status, reconnect };
}
