import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket.js';
import { api } from '../api/client.js';
import { websocketManager } from '../lib/websocketManager.js';
import type { DOMSnapshot } from '../types/index.js';

export function useDOM(deviceId?: string) {
  const [snapshot, setSnapshot] = useState<DOMSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDOM = useCallback(async () => {
    if (!deviceId) { setSnapshot(null); return; }
    setLoading(true);
    try {
      const data = await api.getDOM(deviceId);
      setSnapshot(data);
    } catch (err) {
      console.error('[useDOM] 加载失败:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => { fetchDOM(); }, [fetchDOM]);

  const handleMessage = useCallback((message: any) => {
    if (message.type === 'dom' && message.data?.deviceId === deviceId) {
      setSnapshot(message.data);
    }
  }, [deviceId]);

  useWebSocket(handleMessage);

  const refresh = useCallback(() => {
    if (!deviceId) return;
    websocketManager.send({ type: 'refresh_dom', deviceId });
    setTimeout(fetchDOM, 800);
  }, [deviceId, fetchDOM]);

  return { snapshot, loading, refresh };
}
