import { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocket } from './useWebSocket.js';
import type { ConsoleLog } from '../types/index.js';

export function useLogs(deviceId?: string, maxLogs = 500) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const logBufferRef = useRef<ConsoleLog[]>([]);

  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'log' && message.data) {
      const newLog = message.data as ConsoleLog;

      // 如果指定了 deviceId，只过滤该设备的日志
      if (deviceId && newLog.deviceId !== deviceId) {
        return;
      }

      // 添加到缓冲区
      logBufferRef.current.push(newLog);

      // 批量更新日志（每 10 条或 100ms）
      if (logBufferRef.current.length >= 10) {
        flushLogs();
      }
    }
  }, [deviceId]);

  const flushLogs = useCallback(() => {
    if (logBufferRef.current.length === 0) {
      return;
    }

    setLogs(prevLogs => {
      const newLogs = [...prevLogs, ...logBufferRef.current];
      // 限制日志数量，避免内存溢出
      return newLogs.slice(-maxLogs);
    });

    logBufferRef.current = [];
  }, [maxLogs]);

  useWebSocket(handleWebSocketMessage);

  // 定期刷新缓冲区
  useEffect(() => {
    const interval = setInterval(flushLogs, 100);
    return () => clearInterval(interval);
  }, [flushLogs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    logBufferRef.current = [];
  }, []);

  return {
    logs,
    clearLogs
  };
}
