import { useEffect, useRef, useCallback, useState } from 'react';

export interface WebSocketMessage {
  type: 'devices' | 'log' | 'heartbeat';
  data: any;
}

export interface UseWebSocketOptions {
  url?: string;
  maxReconnectAttempts?: number;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export function useWebSocket(
  onMessage: (message: WebSocketMessage) => void,
  options: UseWebSocketOptions = {}
) {
  const { url = 'ws://localhost:3000', maxReconnectAttempts = Infinity } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectCountRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  // 更新 onMessage ref，避免依赖变化导致重连循环
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // 检查重连次数限制
    if (reconnectCountRef.current >= maxReconnectAttempts) {
      console.error('WebSocket: 达到最大重连次数，停止重连');
      setConnectionState('disconnected');
      return;
    }

    setConnectionState('connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectCountRef.current = 0; // 连接成功，重置重连计数
      setConnectionState('connected');
      ws.send(JSON.stringify({ type: 'viewer' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessageRef.current(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setConnectionState('disconnected');
      reconnectCountRef.current++;
      if (reconnectCountRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      } else {
        console.error('WebSocket: 达到最大重连次数，停止重连');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [url, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    reconnectCountRef.current = 0;
    setConnectionState('disconnected');
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { connect, disconnect, connectionState };
}
