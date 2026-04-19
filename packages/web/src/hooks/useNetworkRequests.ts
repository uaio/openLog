import { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocket } from './useWebSocket.js';
import { api } from '../api/client.js';
import type { NetworkRequest } from '../types/index.js';

export function useNetworkRequests(deviceId?: string, maxRequests = 500, tabId?: string | null) {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const bufferRef = useRef<NetworkRequest[]>([]);

  // 设备变化时加载历史数据
  useEffect(() => {
    if (!deviceId) {
      setRequests([]);
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await api.getNetworkRequests(deviceId, maxRequests);
        setRequests(data);
      } catch (error) {
        console.error('[useNetworkRequests] 加载历史请求失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [deviceId, maxRequests]);

  const handleWebSocketMessage = useCallback(
    (message: any) => {
      if (message.type === 'event' && message.envelope?.type === 'network') {
        const envelope = message.envelope;
        if (deviceId && message.deviceId !== deviceId) return;
        if (tabId && envelope.tabId !== tabId) return;

        const req: NetworkRequest = {
          deviceId: envelope.device?.deviceId || message.deviceId,
          tabId: envelope.tabId,
          id: envelope.data.id,
          timestamp: envelope.data.timestamp || envelope.ts,
          method: envelope.data.method,
          url: envelope.data.url,
          status: envelope.data.status,
          statusText: envelope.data.statusText,
          requestHeaders: envelope.data.requestHeaders,
          requestBody: envelope.data.requestBody,
          responseHeaders: envelope.data.responseHeaders,
          responseBody: envelope.data.responseBody,
          duration: envelope.data.duration,
          type: envelope.data.type || 'fetch',
          error: envelope.data.error,
        };

        bufferRef.current.push(req);
        if (bufferRef.current.length >= 5) flushBuffer();
      }
    },
    [deviceId, tabId],
  );

  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    const toAdd = [...bufferRef.current];
    bufferRef.current = [];
    setRequests((prev) => [...prev, ...toAdd].slice(-maxRequests));
  }, [maxRequests]);

  useWebSocket(handleWebSocketMessage);

  // 定期刷新缓冲区
  useEffect(() => {
    const interval = setInterval(flushBuffer, 200);
    return () => clearInterval(interval);
  }, [flushBuffer]);

  const clearRequests = useCallback(() => {
    setRequests([]);
    bufferRef.current = [];
  }, []);

  return { requests, clearRequests, loading };
}
