import { CSSProperties, useState, useCallback } from 'react';
import { useStorage } from '../hooks/useStorage.js';
import { api } from '../api/client.js';

interface StoragePanelProps {
  deviceId?: string;
}

type StorageTab = 'localStorage' | 'sessionStorage' | 'cookies';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export function StoragePanel({ deviceId }: StoragePanelProps) {
  const { snapshot, loading, refresh } = useStorage(deviceId);
  const [activeTab, setActiveTab] = useState<StorageTab>('localStorage');
  const [setKey, setSetKey] = useState('');
  const [setValue, setSetValue] = useState('');
  const [setLoading, setSetLoading] = useState(false);

  const storageType = activeTab === 'sessionStorage' ? 'session' : 'local';

  const handleSetItem = useCallback(async () => {
    if (!deviceId || !setKey.trim()) return;
    setSetLoading(true);
    try {
      await api.post(`/api/devices/${deviceId}/storage/set`, { key: setKey.trim(), value: setValue, storageType });
      setTimeout(refresh, 300);
      setSetKey(''); setSetValue('');
    } catch { /* ignore */ }
    finally { setSetLoading(false); }
  }, [deviceId, setKey, setValue, storageType, refresh]);

  const handleClearStorage = useCallback(async () => {
    if (!deviceId || activeTab === 'cookies') return;
    if (!window.confirm(`确认清空手机端 ${activeTab}？`)) return;
    try {
      await api.post(`/api/devices/${deviceId}/storage/clear`, { storageType });
      setTimeout(refresh, 300);
    } catch { /* ignore */ }
  }, [deviceId, activeTab, storageType, refresh]);

  if (!deviceId) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>
          <div style={styles.placeholderIcon}>💾</div>
          <div style={styles.placeholderText}>从左侧选择一个设备查看存储</div>
        </div>
      </div>
    );
  }

  const tabs: { id: StorageTab; label: string; count?: number }[] = [
    {
      id: 'localStorage',
      label: 'localStorage',
      count: snapshot ? Object.keys(snapshot.localStorage).length : undefined
    },
    {
      id: 'sessionStorage',
      label: 'sessionStorage',
      count: snapshot ? Object.keys(snapshot.sessionStorage).length : undefined
    },
    {
      id: 'cookies',
      label: 'Cookies',
      count: snapshot?.cookies
        ? snapshot.cookies.split(';').filter(Boolean).length
        : undefined
    }
  ];

  const renderKVTable = (data: Record<string, string>, totalSize?: number) => {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📭</span>
          <span>暂无数据</span>
        </div>
      );
    }
    return (
      <div>
        {totalSize !== undefined && (
          <div style={styles.sizeBar}>
            <span style={styles.sizeLabel}>总大小：{formatSize(totalSize)}</span>
            <span style={styles.countLabel}>{entries.length} 条记录</span>
          </div>
        )}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: '35%' }}>Key</th>
              <th style={styles.th}>Value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} style={styles.tr}>
                <td style={{ ...styles.td, ...styles.keyCell }}>{key}</td>
                <td style={{ ...styles.td, ...styles.valueCell }}>
                  <span style={styles.valueText}>{value}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCookies = (raw: string) => {
    if (!raw || raw.trim() === '') {
      return (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📭</span>
          <span>暂无 Cookie</span>
        </div>
      );
    }
    const entries = raw.split(';').map(c => c.trim()).filter(Boolean).map(c => {
      const idx = c.indexOf('=');
      if (idx === -1) return { key: c, value: '' };
      return { key: c.slice(0, idx).trim(), value: c.slice(idx + 1).trim() };
    });
    return (
      <div>
        <div style={styles.sizeBar}>
          <span style={styles.countLabel}>{entries.length} 条 Cookie</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: '35%' }}>Name</th>
              <th style={styles.th}>Value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ key, value }, i) => (
              <tr key={i} style={styles.tr}>
                <td style={{ ...styles.td, ...styles.keyCell }}>{key}</td>
                <td style={{ ...styles.td, ...styles.valueCell }}>
                  <span style={styles.valueText}>{value}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={styles.loadingWrap}>
          <span style={styles.spinner}>⏳</span>
          <span>加载中...</span>
        </div>
      );
    }
    if (!snapshot) {
      return (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📡</span>
          <span>等待设备上报存储数据，点击「刷新」获取</span>
        </div>
      );
    }
    if (activeTab === 'localStorage') {
      return renderKVTable(snapshot.localStorage, snapshot.localStorageSize);
    }
    if (activeTab === 'sessionStorage') {
      return renderKVTable(snapshot.sessionStorage, snapshot.sessionStorageSize);
    }
    return renderCookies(snapshot.cookies);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>存储</h3>
        <div style={styles.headerRight}>
          {snapshot && (
            <span style={styles.updateTime}>
              更新于 {formatTime(snapshot.timestamp)}
            </span>
          )}
          <button
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            onClick={refresh}
            disabled={loading}
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={styles.subTabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.subTab,
              ...(activeTab === tab.id ? styles.subTabActive : {})
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                ...styles.badge,
                ...(activeTab === tab.id ? styles.badgeActive : {})
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 写入 / 清空操作栏（仅 localStorage / sessionStorage） */}
      {activeTab !== 'cookies' && (
        <div style={styles.actionBar}>
          <input
            style={styles.actionInput}
            placeholder="Key"
            value={setKey}
            onChange={e => setSetKey(e.target.value)}
          />
          <input
            style={{ ...styles.actionInput, flex: 2 }}
            placeholder="Value"
            value={setValue}
            onChange={e => setSetValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSetItem()}
          />
          <button
            style={{ ...styles.btn, borderColor: '#1890ff', color: setLoading || !setKey.trim() ? '#999' : '#1890ff' }}
            disabled={setLoading || !setKey.trim() || !deviceId}
            onClick={handleSetItem}
          >
            写入
          </button>
          <button
            style={{ ...styles.btn, borderColor: '#ff4d4f', color: !deviceId ? '#999' : '#ff4d4f' }}
            disabled={!deviceId}
            onClick={handleClearStorage}
            title={`清空手机端 ${activeTab}`}
          >
            清空
          </button>
        </div>
      )}

      {/* Content */}
      <div style={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#fff'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  updateTime: {
    fontSize: '12px',
    color: '#999'
  },
  btn: {
    padding: '5px 12px',
    fontSize: '13px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    color: '#555'
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  actionBar: {
    display: 'flex',
    gap: '8px',
    padding: '8px 16px',
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  actionInput: {
    flex: 1,
    padding: '4px 8px',
    fontSize: '12px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontFamily: 'monospace',
    minWidth: 0,
  },
  subTabs: {
    display: 'flex',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fff',
    padding: '0 20px'
  },
  subTab: {
    padding: '8px 14px',
    fontSize: '13px',
    border: 'none',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: '#666',
    marginRight: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  subTabActive: {
    color: '#1890ff',
    borderBottomColor: '#1890ff',
    fontWeight: 500
  },
  badge: {
    backgroundColor: '#e8e8e8',
    color: '#666',
    borderRadius: '10px',
    padding: '1px 6px',
    fontSize: '11px',
    fontWeight: 'normal'
  },
  badgeActive: {
    backgroundColor: '#e6f7ff',
    color: '#1890ff'
  },
  content: {
    flex: 1,
    overflow: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  th: {
    textAlign: 'left',
    padding: '8px 16px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #f0f0f0',
    color: '#666',
    fontWeight: 500,
    fontSize: '12px',
    position: 'sticky',
    top: 0
  },
  tr: {
    borderBottom: '1px solid #f5f5f5'
  },
  td: {
    padding: '7px 16px',
    verticalAlign: 'top'
  },
  keyCell: {
    fontFamily: 'monospace',
    color: '#d56161',
    wordBreak: 'break-all',
    fontSize: '12px'
  },
  valueCell: {
    maxWidth: 0
  },
  valueText: {
    display: 'block',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#333',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
    maxHeight: '80px',
    overflow: 'hidden'
  },
  sizeBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 16px',
    backgroundColor: '#f9f9f9',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '12px'
  },
  sizeLabel: {
    color: '#888'
  },
  countLabel: {
    color: '#888'
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#bbb',
    gap: '8px',
    fontSize: '14px'
  },
  emptyIcon: {
    fontSize: '36px',
    opacity: 0.5
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#bbb',
    gap: '12px'
  },
  placeholderIcon: {
    fontSize: '48px',
    opacity: 0.4
  },
  placeholderText: {
    fontSize: '14px'
  },
  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#999',
    gap: '8px',
    fontSize: '14px'
  },
  spinner: {
    fontSize: '20px'
  }
};
