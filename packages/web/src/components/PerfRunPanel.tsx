import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.js';
import { websocketManager } from '../lib/websocketManager.js';
import type { PerfRunSession, PerfScoreItem } from '../types/index.js';

interface PerfRunPanelProps {
  deviceId?: string;
}

const GRADE_COLOR: Record<string, string> = {
  A: '#4caf50',
  B: '#8bc34a',
  C: '#ff9800',
  D: '#ff5722',
  F: '#f44336',
};

const RATING_COLOR: Record<string, string> = {
  good: '#4caf50',
  'needs-improvement': '#ff9800',
  poor: '#f44336',
  unknown: '#9e9e9e',
};

function ScoreCircle({ score, grade }: { score: number; grade: string }) {
  const color = GRADE_COLOR[grade] ?? '#9e9e9e';
  return (
    <div style={{ textAlign: 'center', padding: '16px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 96,
          height: 96,
          borderRadius: '50%',
          border: `4px solid ${color}`,
          flexDirection: 'column',
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 'bold', color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 18, color, fontWeight: 600 }}>{grade}</div>
      </div>
    </div>
  );
}

function MetricCard({ item }: { item: PerfScoreItem }) {
  const color = RATING_COLOR[item.rating] ?? '#9e9e9e';
  return (
    <div
      style={{
        padding: '10px 12px',
        border: `1px solid ${color}33`,
        borderTop: `3px solid ${color}`,
        borderRadius: 4,
        backgroundColor: '#fff',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{item.name}</div>
      <div style={{ fontSize: 22, fontWeight: 'bold', color, lineHeight: 1 }}>{item.score}</div>
      <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
        {item.value !== null ? `${item.value}${item.unit}` : 'N/A'}
      </div>
    </div>
  );
}

export function PerfRunPanel({ deviceId }: PerfRunPanelProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessions, setSessions] = useState<PerfRunSession[]>([]);
  const [selected, setSelected] = useState<PerfRunSession | null>(null);
  const [polling, setPolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useI18n();

  const loadSessions = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await api.get(`/api/devices/${deviceId}/perf-run`);
      if (Array.isArray(data)) {
        setSessions(data.reverse());
        if (data.length > 0 && !selected) setSelected(data[data.length - 1]);
      }
    } catch {
      /* ignore */
    }
  }, [deviceId, selected]);

  useEffect(() => {
    setSessions([]);
    setSelected(null);
    setRunning(false);
    setElapsed(0);
  }, [deviceId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // WS: listen for perf_run results
  useEffect(() => {
    const unsub = websocketManager.subscribe((msg: any) => {
      if (msg.type === 'perf_run' && msg.data?.deviceId === deviceId) {
        const session: PerfRunSession = msg.data;
        setSessions((prev) => [session, ...prev]);
        setSelected(session);
        setPolling(false);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    });
    return unsub;
  }, [deviceId]);

  const handleStart = useCallback(async () => {
    if (!deviceId || running) return;
    try {
      await api.post(`/api/devices/${deviceId}/perf-run/start`);
      setRunning(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (e: any) {
      alert(t.perfRunPanel.startFailed + ': ' + e.message);
    }
  }, [deviceId, running]);

  const handleStop = useCallback(async () => {
    if (!deviceId || !running) return;
    setRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      await api.post(`/api/devices/${deviceId}/perf-run/stop`);
      setPolling(true);
      pollRef.current = setInterval(() => loadSessions(), 2000);
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setPolling(false);
        }
      }, 30000);
    } catch (e: any) {
      alert(t.perfRunPanel.stopFailed + ': ' + e.message);
    }
  }, [deviceId, running, loadSessions]);

  const handleExport = useCallback(() => {
    if (!selected) return;
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perf-run-${selected.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selected]);

  if (!deviceId)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#999',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 48 }}>🏁</div>
        <div>{t.common.selectDevice}</div>
      </div>
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>🏁 {t.perfRunPanel.title}</span>
        {running && (
          <span style={{ fontSize: 13, color: '#ff4d4f', fontVariantNumeric: 'tabular-nums' }}>
            ⏱ {elapsed}s
          </span>
        )}
        {polling && <span style={{ fontSize: 12, color: '#888' }}>⏳ {t.perfRunPanel.running}</span>}
        <div style={{ flex: 1 }} />
        {!running ? (
          <button
            onClick={handleStart}
            disabled={!deviceId}
            style={{
              padding: '5px 16px',
              fontSize: 13,
              border: '1px solid #52c41a',
              borderRadius: 4,
              backgroundColor: '#52c41a',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            ▶ {t.perfRunPanel.start}
          </button>
        ) : (
          <button
            onClick={handleStop}
            style={{
              padding: '5px 16px',
              fontSize: 13,
              border: '1px solid #ff4d4f',
              borderRadius: 4,
              backgroundColor: '#ff4d4f',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            ⏹ {t.perfRunPanel.stop}
          </button>
        )}
        {selected && (
          <button
            onClick={handleExport}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              border: '1px solid #1890ff',
              borderRadius: 4,
              backgroundColor: '#fff',
              color: '#1890ff',
              cursor: 'pointer',
            }}
          >
            📤 {t.common.export}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* History sidebar */}
        <div
          style={{ width: 180, borderRight: '1px solid #e0e0e0', overflowY: 'auto', flexShrink: 0 }}
        >
          <div
            style={{
              padding: '8px 12px',
              fontSize: 11,
              color: '#888',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            {t.perfRunPanel.history}
          </div>
          {sessions.length === 0 && (
            <div style={{ padding: 12, fontSize: 12, color: '#bbb', textAlign: 'center' }}>
              {t.common.noData}
            </div>
          )}
          {sessions.map((s) => (
            <div
              key={s.sessionId}
              onClick={() => setSelected(s)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 12,
                borderBottom: '1px solid #f5f5f5',
                backgroundColor: selected?.sessionId === s.sessionId ? '#e6f4ff' : '#fff',
                borderLeft:
                  selected?.sessionId === s.sessionId
                    ? '3px solid #1890ff'
                    : '3px solid transparent',
              }}
            >
              <div style={{ fontWeight: 'bold', color: GRADE_COLOR[s.score.grade] }}>
                {s.score.grade} · {s.score.total}pts
              </div>
              <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
                {new Date(s.startTime).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {!selected ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#999',
              }}
            >
              {running ? (
                <>
                  <div style={{ fontSize: 48 }}>⏱</div>
                  <div>{t.perfRunPanel.running}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 48 }}>🏁</div>
                  <div>{t.perfRunPanel.start}</div>
                </>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: 700 }}>
              {/* Score card */}
              <div
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                }}
              >
                <ScoreCircle score={selected.score.total} grade={selected.score.grade} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                    {selected.score.summary}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {(selected.duration / 1000).toFixed(1)}s ·{' '}
                    {new Date(selected.startTime).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {selected.score.items.map((item) => (
                  <MetricCard key={item.name} item={item} />
                ))}
              </div>

              {/* Issues */}
              {selected.score.issues.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 10 }}>
                    ⚠️ Issues
                  </div>
                  {selected.score.issues.map((issue, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 0',
                        borderBottom: '1px solid #f5f5f5',
                        fontSize: 13,
                        color: '#595959',
                      }}
                    >
                      • {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
