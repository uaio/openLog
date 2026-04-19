import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { useI18n } from '../i18n/index.js';

interface TabFilterProps {
  deviceId?: string;
  value: string | null;
  onChange: (tabId: string | null) => void;
}

/**
 * Discovers active browser tabs for a device and allows filtering by tab.
 * Listens to WebSocket events to auto-discover tabIds.
 */
export function TabFilter({ deviceId, value, onChange }: TabFilterProps) {
  const [knownTabs, setKnownTabs] = useState<Set<string>>(new Set());
  const { t } = useI18n();

  // Reset when device changes
  useEffect(() => {
    setKnownTabs(new Set());
    onChange(null);
  }, [deviceId]);

  const handleMessage = useCallback(
    (message: any) => {
      if (!deviceId) return;
      if (message.type === 'event' && message.deviceId === deviceId) {
        const tabId = message.envelope?.tabId;
        if (tabId) {
          setKnownTabs((prev) => {
            if (prev.has(tabId)) return prev;
            const next = new Set(prev);
            next.add(tabId);
            return next;
          });
        }
      }
    },
    [deviceId],
  );

  useWebSocket(handleMessage);

  if (knownTabs.size <= 1) return null;

  return (
    <div style={styles.container}>
      <span style={styles.label}>🗂️ Tab:</span>
      <select
        style={styles.select}
        value={value ?? '__all__'}
        onChange={(e) => onChange(e.target.value === '__all__' ? null : e.target.value)}
      >
        <option value="__all__">{t.common.all ?? 'All'}</option>
        {Array.from(knownTabs).map((tabId) => (
          <option key={tabId} value={tabId}>
            {tabId.replace('tab-', '#')}
          </option>
        ))}
      </select>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    fontSize: 12,
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
  },
  label: {
    color: '#666',
    fontWeight: 500,
  },
  select: {
    fontSize: 12,
    padding: '2px 6px',
    border: '1px solid #ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
};
