import { useState, useCallback, useEffect } from 'react';
import { api } from '../api/client.js';
import { useI18n } from '../i18n/index.js';

interface HealthPanelProps {
  deviceId?: string;
}

interface HealthData {
  deviceId: string;
  timestamp: number;
  score: number;
  recentErrors: number;
  longTaskDurationMs: number;
  memoryMB: number | null;
  uncompressedResources: number;
  uncachedResources: number;
  vitalRatings: Record<string, string>;
  status: 'healthy' | 'warning' | 'critical';
}

const STATUS_COLOR: Record<string, string> = {
  healthy: '#4caf50',
  warning: '#ff9800',
  critical: '#f44336',
};

const RATING_COLOR: Record<string, string> = {
  good: '#4caf50',
  'needs-improvement': '#ff9800',
  poor: '#f44336',
};

export function HealthPanel({ deviceId }: HealthPanelProps) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useI18n();
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchHealth = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.get(`/api/devices/${deviceId}/health`);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    setData(null);
    setError('');
    if (deviceId) fetchHealth();
  }, [deviceId]);

  useEffect(() => {
    if (!autoRefresh || !deviceId) return;
    const id = setInterval(fetchHealth, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, deviceId, fetchHealth]);

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
        <div style={{ fontSize: 48 }}>🩺</div>
        <div>{t.healthPanel.selectDevice}</div>
      </div>
    );

  return (
    <div style={{ padding: 20, maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontWeight: 'bold', fontSize: 16 }}>🩺 {t.healthPanel.title}</span>
        <button
          onClick={fetchHealth}
          disabled={loading}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            border: '1px solid #1890ff',
            borderRadius: 4,
            backgroundColor: '#fff',
            color: '#1890ff',
            cursor: 'pointer',
          }}
        >
          {loading ? t.healthPanel.checking : '🔄 ' + t.common.refresh}
        </button>
        <label
          style={{
            fontSize: 12,
            color: '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          {t.healthPanel.autoRefresh}
        </label>
      </div>

      {error && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: 12,
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 4,
            fontSize: 13,
            color: '#f44336',
          }}
        >
          {error}
        </div>
      )}

      {data && (
        <div>
          {/* Status badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 20px',
              backgroundColor: '#fff',
              border: `2px solid ${STATUS_COLOR[data.status]}`,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 48 }}>
              {data.status === 'healthy' ? '✅' : data.status === 'warning' ? '⚠️' : '❌'}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: STATUS_COLOR[data.status] }}>
                {data.status === 'healthy'
                  ? t.healthPanel.healthy
                  : data.status === 'warning'
                    ? t.healthPanel.warning
                    : t.healthPanel.critical}{' '}
                · {data.score}pts
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                {t.healthPanel.updatedAt}: {new Date(data.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {[
              {
                label: t.healthPanel.recentErrors,
                value: data.recentErrors,
                unit: t.healthPanel.count,
                warn: data.recentErrors > 5,
              },
              {
                label: t.healthPanel.longTaskDuration,
                value: data.longTaskDurationMs,
                unit: 'ms',
                warn: data.longTaskDurationMs > 1000,
              },
              {
                label: t.healthPanel.memoryUsage,
                value: data.memoryMB !== null ? (data.memoryMB as number).toFixed(1) : 'N/A',
                unit: 'MB',
                warn: (data.memoryMB ?? 0) > 200,
              },
              {
                label: t.healthPanel.uncompressedResources,
                value: data.uncompressedResources,
                unit: t.healthPanel.count,
                warn: data.uncompressedResources > 0,
              },
            ].map(({ label, value, unit, warn }) => (
              <div
                key={label}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fff',
                  border: `1px solid ${warn ? '#ff490033' : '#e0e0e0'}`,
                  borderLeft: `4px solid ${warn ? '#ff4900' : '#4caf50'}`,
                  borderRadius: 4,
                }}
              >
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: warn ? '#ff4900' : '#333' }}>
                  {value}
                  <span
                    style={{ fontSize: 12, fontWeight: 'normal', color: '#888', marginLeft: 4 }}
                  >
                    {unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Web Vitals */}
          {Object.keys(data.vitalRatings).length > 0 && (
            <div
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 10 }}>Web Vitals</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                {Object.entries(data.vitalRatings).map(([name, rating]) => (
                  <div
                    key={name}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      backgroundColor: (RATING_COLOR[rating] ?? '#9e9e9e') + '22',
                      border: `1px solid ${RATING_COLOR[rating] ?? '#9e9e9e'}`,
                      fontSize: 12,
                      color: RATING_COLOR[rating] ?? '#9e9e9e',
                      fontWeight: 'bold',
                    }}
                  >
                    {name}: {rating}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <div style={{ textAlign: 'center', color: '#bbb', padding: 40 }}>
          {t.healthPanel.clickRefresh}
        </div>
      )}
    </div>
  );
}
