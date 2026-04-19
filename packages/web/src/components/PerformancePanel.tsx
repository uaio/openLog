import { CSSProperties, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { usePerformance } from '../hooks/usePerformance.js';
import type {
  WebVital,
  PerformanceSample,
  LongTask,
  ResourceTiming,
  InteractionTiming,
} from '../types/index.js';

interface PerformancePanelProps {
  deviceId?: string;
}

// Google Web Vitals 阈值
const VITAL_THRESHOLDS: Record<string, { good: number; poor: number; unit: string; desc: string }> =
  {
    LCP: { good: 2500, poor: 4000, unit: 'ms', desc: 'Largest Contentful Paint' },
    FID: { good: 100, poor: 300, unit: 'ms', desc: 'First Input Delay' },
    INP: { good: 200, poor: 500, unit: 'ms', desc: 'Interaction to Next Paint' },
    CLS: { good: 0.1, poor: 0.25, unit: '', desc: 'Cumulative Layout Shift' },
    FCP: { good: 1800, poor: 3000, unit: 'ms', desc: 'First Contentful Paint' },
    TTFB: { good: 800, poor: 1800, unit: 'ms', desc: 'Time to First Byte' },
  };

const RATING_COLOR: Record<string, string> = {
  good: '#4caf50',
  'needs-improvement': '#ff9800',
  poor: '#f44336',
};

const RATING_LABEL: Record<string, string> = {
  good: '良好',
  'needs-improvement': '需改善',
  poor: '较差',
};

function VitalCard({ vital }: { vital: WebVital }) {
  const meta = VITAL_THRESHOLDS[vital.name];
  const color = RATING_COLOR[vital.rating];
  const formatted = meta?.unit === 'ms' ? `${vital.value.toFixed(0)}ms` : vital.value.toFixed(3);

  return (
    <div style={{ ...styles.vitalCard, borderTop: `3px solid ${color}` }}>
      <div style={styles.vitalName}>{vital.name}</div>
      <div style={{ ...styles.vitalValue, color }}>{formatted}</div>
      <div style={{ ...styles.vitalRating, color }}>{RATING_LABEL[vital.rating]}</div>
      {meta && <div style={styles.vitalDesc}>{meta.desc}</div>}
    </div>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipTime}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: '12px' }}>
          {p.name}:{' '}
          <strong>
            {p.value}
            {p.dataKey === 'fps' ? ' fps' : ' MB'}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function PerformancePanel({ deviceId }: PerformancePanelProps) {
  const { report, loading } = usePerformance(deviceId);
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  if (!deviceId) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>
          <div style={styles.placeholderIcon}>📊</div>
          <div style={styles.placeholderText}>从左侧选择设备查看性能数据</div>
        </div>
      </div>
    );
  }

  const samples: PerformanceSample[] = report?.samples ?? [];
  const longTasks: LongTask[] = report?.longTasks ?? [];
  const resources: ResourceTiming[] = report?.resources ?? [];
  const interactions: InteractionTiming[] = report?.interactions ?? [];

  const chartData = samples.map((s) => ({
    time: formatTime(s.timestamp),
    fps: s.fps,
    heapUsed: s.heapUsed,
    heapTotal: s.heapTotal,
  }));

  const latestSample = samples[samples.length - 1];
  const hasMemory = samples.some((s) => s.heapUsed !== undefined);

  // Resource filter
  const resourceTypes = [
    'all',
    ...Array.from(new Set(resources.map((r) => r.initiatorType))).sort(),
  ];
  const filteredResources =
    resourceFilter === 'all'
      ? [...resources].sort((a, b) => b.duration - a.duration).slice(0, 50)
      : resources
          .filter((r) => r.initiatorType === resourceFilter)
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 50);

  function formatBytes(b: number): string {
    if (b === 0) return '(cache)';
    if (b < 1024) return `${b}B`;
    return `${(b / 1024).toFixed(1)}KB`;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Performance</h3>
        {loading && <span style={styles.loadingBadge}>⏳ 加载中</span>}
        {latestSample && (
          <span style={styles.liveBadge}>
            <span style={styles.liveDot} /> LIVE · {latestSample.fps} fps
            {latestSample.heapUsed !== undefined && ` · 内存 ${latestSample.heapUsed} MB`}
          </span>
        )}
      </div>

      <div style={styles.body}>
        {/* Web Vitals 卡片 */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>🏅 Core Web Vitals</div>
          {!report || report.vitals.length === 0 ? (
            <div style={styles.emptyHint}>
              等待设备上报 Web Vitals（需页面交互才能触发部分指标）
            </div>
          ) : (
            <div style={styles.vitalsGrid}>
              {report.vitals.map((v) => (
                <VitalCard key={v.name} vital={v} />
              ))}
            </div>
          )}
        </section>

        {/* FPS 折线图 */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>🎯 FPS（帧率）</div>
          {chartData.length === 0 ? (
            <div style={styles.emptyHint}>等待采样数据（每 3 秒采集一次）...</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#888', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis domain={[0, 70]} tick={{ fill: '#888', fontSize: 11 }} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={60}
                  stroke="#4caf5066"
                  strokeDasharray="4 2"
                  label={{ value: '60fps', fill: '#4caf50', fontSize: 10 }}
                />
                <ReferenceLine
                  y={30}
                  stroke="#ff980066"
                  strokeDasharray="4 2"
                  label={{ value: '30fps', fill: '#ff9800', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="fps"
                  name="FPS"
                  stroke="#4fc3f7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* 内存折线图（仅 Chrome 支持） */}
        {hasMemory && (
          <section style={styles.section}>
            <div style={styles.sectionTitle}>🧠 JS 堆内存（MB，仅 Chrome）</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#888', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#888', fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="heapUsed"
                  name="已用"
                  stroke="#ce93d8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="heapTotal"
                  name="分配"
                  stroke="#5c6bc0"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Long Tasks */}
        <section style={styles.section}>
          <div style={styles.sectionTitle}>
            🔴 Long Tasks（主线程阻塞 &gt;50ms）
            {longTasks.length > 0 && <span style={styles.countBadge}>{longTasks.length}</span>}
          </div>
          {longTasks.length === 0 ? (
            <div style={styles.emptyHint}>
              暂无 Long Task（&gt;50ms 阻塞任务，需浏览器支持 longtask API）
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>开始时间</th>
                    <th style={styles.th}>耗时</th>
                    <th style={styles.th}>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {[...longTasks]
                    .sort((a, b) => b.duration - a.duration)
                    .slice(0, 30)
                    .map((t, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>{t.startTime.toFixed(0)}ms</td>
                        <td
                          style={{
                            ...styles.td,
                            color: t.duration > 200 ? '#f44336' : '#ff9800',
                            fontWeight: 600,
                          }}
                        >
                          {t.duration}ms
                        </td>
                        <td style={{ ...styles.td, color: '#888', fontSize: '11px' }}>{t.name}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Resource Timing */}
        <section style={styles.section}>
          <div
            style={{ ...styles.sectionTitle, display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <span>📦 资源加载（耗时 Top 50）</span>
            {resources.length > 0 && <span style={styles.countBadge}>{resources.length} 条</span>}
            <div style={styles.filterWrap}>
              {resourceTypes.map((t) => (
                <button
                  key={t}
                  style={{
                    ...styles.filterBtn,
                    ...(resourceFilter === t ? styles.filterBtnActive : {}),
                  }}
                  onClick={() => setResourceFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {filteredResources.length === 0 ? (
            <div style={styles.emptyHint}>暂无资源加载数据</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: '50%' }}>URL</th>
                    <th style={styles.th}>类型</th>
                    <th style={styles.th}>耗时</th>
                    <th style={styles.th}>大小</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map((r, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={{ ...styles.td, ...styles.urlCell }} title={r.name}>
                        {r.name.replace(/^https?:\/\/[^/]+/, '').slice(0, 60) ||
                          r.name.slice(0, 60)}
                      </td>
                      <td style={{ ...styles.td, color: '#9cdcfe', fontSize: '11px' }}>
                        {r.initiatorType}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          color:
                            r.duration > 1000
                              ? '#f44336'
                              : r.duration > 300
                                ? '#ff9800'
                                : '#4caf50',
                          fontWeight: 600,
                        }}
                      >
                        {r.duration}ms
                      </td>
                      <td style={{ ...styles.td, color: '#888', fontSize: '11px' }}>
                        {formatBytes(r.transferSize)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Interactions */}
        {interactions.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionTitle}>
              👆 交互延迟（近 {Math.min(interactions.length, 30)} 次）
              <span style={styles.countBadge}>{interactions.length}</span>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>交互类型</th>
                    <th style={styles.th}>延迟</th>
                    <th style={styles.th}>目标元素</th>
                    <th style={styles.th}>触发时间</th>
                  </tr>
                </thead>
                <tbody>
                  {[...interactions]
                    .reverse()
                    .slice(0, 30)
                    .map((item, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={{ ...styles.td, color: '#9cdcfe' }}>{item.type}</td>
                        <td
                          style={{
                            ...styles.td,
                            color:
                              item.duration > 200
                                ? '#f44336'
                                : item.duration > 100
                                  ? '#ff9800'
                                  : '#4caf50',
                            fontWeight: 600,
                          }}
                        >
                          {item.duration}ms
                        </td>
                        <td style={{ ...styles.td, color: '#888', fontSize: '11px' }}>
                          {item.target || '—'}
                        </td>
                        <td style={{ ...styles.td, color: '#666', fontSize: '11px' }}>
                          {item.startTime.toFixed(0)}ms
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 无数据兜底 */}
        {!loading && !report && (
          <div style={styles.noData}>
            <span style={{ fontSize: 32, opacity: 0.3 }}>📡</span>
            <span>等待设备接入并上报性能数据...</span>
          </div>
        )}
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
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
    padding: '10px 16px',
    borderBottom: '1px solid #333',
    backgroundColor: '#252526',
  },
  title: { margin: 0, fontSize: '14px', fontWeight: 600, color: '#ccc' },
  loadingBadge: { fontSize: '12px', color: '#888' },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: '#4fc3f7',
    marginLeft: 'auto',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    display: 'inline-block',
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: { backgroundColor: '#252526', borderRadius: '6px', padding: '12px' },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#bbb',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  vitalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '10px',
  },
  vitalCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: '6px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  vitalName: { fontSize: '13px', fontWeight: 700, color: '#9cdcfe', letterSpacing: '0.5px' },
  vitalValue: { fontSize: '20px', fontWeight: 700, lineHeight: 1.2 },
  vitalRating: { fontSize: '11px', fontWeight: 500 },
  vitalDesc: { fontSize: '10px', color: '#555', marginTop: '2px' },
  emptyHint: { fontSize: '12px', color: '#555', padding: '8px 0', fontStyle: 'italic' },
  noData: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '60px 0',
    color: '#555',
    fontSize: '13px',
  },
  tooltip: {
    backgroundColor: '#1e1e1e',
    border: '1px solid #444',
    borderRadius: 4,
    padding: '8px 10px',
  },
  tooltipTime: { fontSize: '11px', color: '#888', marginBottom: 4 },
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
  countBadge: {
    backgroundColor: '#333',
    color: '#888',
    borderRadius: '10px',
    padding: '1px 7px',
    fontSize: '11px',
    fontWeight: 'normal',
  },
  tableWrap: { overflowX: 'auto', maxHeight: '240px', overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: {
    textAlign: 'left',
    padding: '6px 10px',
    color: '#666',
    fontWeight: 500,
    borderBottom: '1px solid #333',
    position: 'sticky',
    top: 0,
    backgroundColor: '#252526',
  },
  tr: { borderBottom: '1px solid #2a2a2a' },
  td: { padding: '5px 10px', verticalAlign: 'top', color: '#ccc' },
  urlCell: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#9cdcfe',
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  filterWrap: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginLeft: 'auto' },
  filterBtn: {
    padding: '2px 8px',
    fontSize: '11px',
    border: '1px solid #444',
    borderRadius: '3px',
    backgroundColor: 'transparent',
    color: '#777',
    cursor: 'pointer',
  },
  filterBtnActive: { backgroundColor: '#1890ff22', borderColor: '#1890ff', color: '#4fc3f7' },
};
