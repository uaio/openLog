import { useEffect, useRef, useCallback, useState } from 'react';
import { websocketManager } from '../lib/websocketManager.js';

export interface WebSocketMessage {
  type: 'devices' | 'log' | 'heartbeat' | 'network' | 'storage' | 'dom' | 'performance';
  data: any;
}

export interface UseWebSocketOptions {
  url?: string;
  maxReconnectAttempts?: number;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export function useWebSocket(
  onMessage: (message: WebSocketMessage) => void,
  _options: UseWebSocketOptions = {}
) {
  const onMessageRef = useRef(onMessage);
  const [connectionState, setConnectionState] = useState<ConnectionState>(() =>
    websocketManager.getConnectionState()
  );

  // 更新 onMessage ref，避免依赖变化导致重连循环
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const unsubscribe = websocketManager.subscribe((message) => {
      onMessageRef.current(message);
      setConnectionState(websocketManager.getConnectionState());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connect = useCallback(() => {
    websocketManager.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocketManager.disconnect();
  }, []);

  return { connect, disconnect, connectionState };
}
