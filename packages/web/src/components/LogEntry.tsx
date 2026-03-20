import type { ConsoleLog } from '../types/index.js';

interface LogEntryProps {
  log: ConsoleLog;
}

export function LogEntry({ log }: LogEntryProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLevelIcon = (level: ConsoleLog['level']) => {
    switch (level) {
      case 'error':
        return '🔴';
      case 'warn':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  const getLevelColor = (level: ConsoleLog['level']) => {
    switch (level) {
      case 'error':
        return '#ff4d4f';
      case 'warn':
        return '#faad14';
      case 'info':
        return '#597ef7';
      default:
        return '#52c41a';
    }
  };

  return (
    <div style={{ ...styles.entry, borderLeftColor: getLevelColor(log.level) }}>
      <div style={styles.header}>
        <span style={styles.icon}>{getLevelIcon(log.level)}</span>
        <span style={styles.timestamp}>{formatTime(log.timestamp)}</span>
        <span style={{ ...styles.levelTag, color: getLevelColor(log.level) }}>
          {log.level.toUpperCase()}
        </span>
      </div>
      <div style={styles.message}>
        {log.message}
      </div>
      {log.stack && (
        <details style={styles.stackDetails}>
          <summary style={styles.stackSummary}>查看堆栈</summary>
          <pre style={styles.stack}>{log.stack}</pre>
        </details>
      )}
    </div>
  );
}

const styles = {
  entry: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    borderLeft: '4px solid #52c41a',
    backgroundColor: '#fff',
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    transition: 'background-color 0.15s ease'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px'
  },
  icon: {
    fontSize: '14px'
  },
  timestamp: {
    color: '#999',
    fontSize: '12px',
    fontWeight: '500' as const
  },
  levelTag: {
    fontSize: '11px',
    fontWeight: 'bold' as const,
    padding: '2px 8px',
    borderRadius: '3px',
    backgroundColor: 'transparent',
    border: '1px solid currentColor',
    textTransform: 'uppercase' as const
  },
  message: {
    color: '#262626',
    wordBreak: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    fontSize: '13px'
  },
  stackDetails: {
    marginTop: '8px'
  },
  stackSummary: {
    cursor: 'pointer',
    color: '#1890ff',
    fontSize: '12px',
    userSelect: 'none' as const,
    '&:hover': {
      color: '#40a9ff'
    }
  },
  stack: {
    margin: '8px 0 0 0',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    color: '#666',
    fontSize: '11px',
    overflowX: 'auto' as const,
    border: '1px solid #e8e8e8'
  }
};
