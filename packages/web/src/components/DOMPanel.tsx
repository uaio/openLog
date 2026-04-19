import { CSSProperties, useState } from 'react';
import { useDOM } from '../hooks/useDOM.js';
import { useI18n } from '../i18n/index.js';
import type { DOMNode } from '../types/index.js';

interface DOMPanelProps {
  deviceId?: string;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString();
}

interface DOMNodeViewProps {
  node: DOMNode;
  depth?: number;
}

function DOMNodeView({ node, depth = 0 }: DOMNodeViewProps) {
  const hasChildren = (node.children && node.children.length > 0) || (node.childCount ?? 0) > 0;
  const [expanded, setExpanded] = useState(depth < 3);

  const indent = depth * 14;

  return (
    <div style={{ marginLeft: indent }}>
      {/* Opening tag */}
      <div
        style={{
          ...nodeStyles.row,
          cursor: hasChildren ? 'pointer' : 'default',
        }}
        onClick={() => hasChildren && setExpanded((e) => !e)}
      >
        {hasChildren && <span style={nodeStyles.arrow}>{expanded ? '▾' : '▸'}</span>}
        {!hasChildren && <span style={nodeStyles.arrowPlaceholder} />}

        <span style={nodeStyles.tag}>&lt;{node.tag}</span>
        {node.id && (
          <span style={nodeStyles.attrId}>
            {' '}
            id=<span style={nodeStyles.attrVal}>"{node.id}"</span>
          </span>
        )}
        {node.className && (
          <span style={nodeStyles.attrClass}>
            {' '}
            class=<span style={nodeStyles.attrVal}>"{node.className.slice(0, 50)}"</span>
          </span>
        )}
        {node.attrs &&
          Object.entries(node.attrs).map(([k, v]) => (
            <span key={k} style={nodeStyles.attr}>
              {' '}
              {k}=<span style={nodeStyles.attrVal}>"{v.slice(0, 40)}"</span>
            </span>
          ))}
        <span style={nodeStyles.tag}>&gt;</span>

        {/* Inline text for leaf nodes */}
        {node.text && !hasChildren && (
          <span style={nodeStyles.text}> {node.text.slice(0, 80)}</span>
        )}

        {/* Collapsed hint */}
        {hasChildren && !expanded && (
          <span style={nodeStyles.collapsedHint}>
            …{node.childCount ?? node.children?.length ?? 0} children
          </span>
        )}
      </div>

      {/* Children */}
      {expanded &&
        node.children &&
        node.children.map((child, i) => <DOMNodeView key={i} node={child} depth={depth + 1} />)}

      {/* Truncation notice */}
      {expanded && node.childCount && node.children && node.childCount > node.children.length && (
        <div style={{ marginLeft: 18, ...nodeStyles.truncated }}>
          … {node.childCount - node.children.length} more children not shown
        </div>
      )}

      {/* Closing tag for expanded parents */}
      {hasChildren && expanded && <div style={nodeStyles.closeTag}>&lt;/{node.tag}&gt;</div>}
    </div>
  );
}

export function DOMPanel({ deviceId }: DOMPanelProps) {
  const { snapshot, loading, refresh } = useDOM(deviceId);
  const { t } = useI18n();

  if (!deviceId) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>
          <div style={styles.placeholderIcon}>🌲</div>
          <div style={styles.placeholderText}>{t.common.selectDevice}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Element</h3>
        <div style={styles.headerRight}>
          {snapshot && (
            <span style={styles.meta}>
              {snapshot.title && <span style={styles.pageTitle}>{snapshot.title}</span>}
              <span style={styles.updateTime}>· {formatTime(snapshot.timestamp)}</span>
            </span>
          )}
          <button
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            onClick={refresh}
            disabled={loading}
          >
            🔄 {t.common.refresh}
          </button>
        </div>
      </div>

      {/* URL bar */}
      {snapshot?.url && (
        <div style={styles.urlBar}>
          <span style={styles.urlLabel}>URL</span>
          <span style={styles.urlValue}>{snapshot.url}</span>
        </div>
      )}

      {/* DOM Tree */}
      <div style={styles.tree}>
        {loading && <div style={styles.loadingWrap}>⏳ {t.common.loading}</div>}
        {!loading && !snapshot && (
          <div style={styles.emptyWrap}>
            <span style={styles.emptyIcon}>📡</span>
            <span>{t.domPanel.waitingHint}</span>
          </div>
        )}
        {!loading && snapshot && <DOMNodeView node={snapshot.dom} depth={0} />}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#1e1e1e',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid #333',
    backgroundColor: '#252526',
    flexShrink: 0,
  },
  title: { margin: 0, fontSize: '14px', fontWeight: 600, color: '#ccc' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  meta: { display: 'flex', alignItems: 'center', gap: '6px' },
  pageTitle: {
    fontSize: '12px',
    color: '#888',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  updateTime: { fontSize: '11px', color: '#666' },
  btn: {
    padding: '4px 10px',
    fontSize: '12px',
    border: '1px solid #555',
    borderRadius: '4px',
    backgroundColor: '#333',
    cursor: 'pointer',
    color: '#ccc',
  },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  urlBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '5px 16px',
    backgroundColor: '#2d2d2d',
    borderBottom: '1px solid #333',
    flexShrink: 0,
  },
  urlLabel: { fontSize: '11px', color: '#666', fontFamily: 'monospace' },
  urlValue: { fontSize: '11px', color: '#9cdcfe', fontFamily: 'monospace', wordBreak: 'break-all' },
  tree: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 8px',
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: '12px',
  },
  loadingWrap: { padding: '40px', color: '#666', textAlign: 'center' },
  emptyWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#555',
    gap: '10px',
    fontSize: '13px',
  },
  emptyIcon: { fontSize: '32px', opacity: 0.5 },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#555',
    gap: '12px',
  },
  placeholderIcon: { fontSize: '48px', opacity: 0.3 },
  placeholderText: { fontSize: '14px' },
};

const nodeStyles: Record<string, CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'baseline',
    padding: '1px 0',
    lineHeight: '1.7',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  arrow: { color: '#888', width: '14px', flexShrink: 0, fontSize: '10px', userSelect: 'none' },
  arrowPlaceholder: { width: '14px', flexShrink: 0, display: 'inline-block' },
  tag: { color: '#4ec9b0' },
  attrId: { color: '#ce9178' },
  attrClass: { color: '#ce9178' },
  attr: { color: '#9cdcfe' },
  attrVal: { color: '#ce9178' },
  text: {
    color: '#d4d4d4',
    fontSize: '11px',
    marginLeft: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  collapsedHint: { color: '#666', fontSize: '11px', marginLeft: '8px', fontStyle: 'italic' },
  truncated: { color: '#666', fontSize: '11px', fontStyle: 'italic', padding: '2px 0' },
  closeTag: { color: '#4ec9b0', paddingLeft: 0 },
};
