/**
 * PageAudit - 页面静态审计（类 Lighthouse 诊断项）
 * 在 stop_perf_run 时运行一次，扫描 DOM 状态产出审计报告
 */

export interface AuditItem {
  id: string;
  title: string;
  score: number; // 0-100, 100=pass
  rating: 'good' | 'needs-improvement' | 'poor';
  value: string; // 人类可读的值描述
  details?: any; // 结构化细节供 AI 分析
}

export interface PageAuditReport {
  timestamp: number;
  url: string;
  audits: AuditItem[];
  summary: { good: number; warning: number; poor: number };
}

function rating(score: number): AuditItem['rating'] {
  if (score >= 75) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}

/** DOM 规模分析 */
function auditDOMSize(): AuditItem {
  const allElements = document.querySelectorAll('*');
  const count = allElements.length;

  // 计算最大深度
  let maxDepth = 0;
  function getDepth(el: Element, depth: number) {
    if (depth > maxDepth) maxDepth = depth;
    if (depth > 50) return; // 防止极端情况
    for (let i = 0; i < el.children.length && i < 100; i++) {
      getDepth(el.children[i], depth + 1);
    }
  }
  getDepth(document.documentElement, 0);

  // 计算最大子节点宽度
  let maxWidth = 0;
  allElements.forEach((el) => {
    if (el.children.length > maxWidth) maxWidth = el.children.length;
  });

  let score: number;
  if (count <= 800) score = 100;
  else if (count <= 1500) score = 75;
  else if (count <= 3000) score = 50;
  else score = Math.max(0, 100 - Math.floor(count / 100));

  return {
    id: 'dom-size',
    title: 'DOM 规模',
    score,
    rating: rating(score),
    value: `${count} 个元素, 深度 ${maxDepth}, 最大宽度 ${maxWidth}`,
    details: { totalElements: count, maxDepth, maxWidth },
  };
}

/** 渲染阻塞资源检测 */
function auditRenderBlocking(): AuditItem {
  const blockingResources: { tag: string; url: string }[] = [];

  // 检测同步 script（无 async/defer）
  document.querySelectorAll('script[src]').forEach((el) => {
    const script = el as HTMLScriptElement;
    if (!script.async && !script.defer && script.type !== 'module') {
      blockingResources.push({ tag: 'script', url: script.src });
    }
  });

  // 检测 render-blocking CSS（非 media=print 的 link stylesheet）
  document.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
    const link = el as HTMLLinkElement;
    if (link.media !== 'print' && !link.disabled) {
      blockingResources.push({ tag: 'link/css', url: link.href });
    }
  });

  const count = blockingResources.length;
  let score: number;
  if (count === 0) score = 100;
  else if (count <= 2) score = 75;
  else if (count <= 5) score = 50;
  else score = Math.max(10, 100 - count * 10);

  return {
    id: 'render-blocking',
    title: '渲染阻塞资源',
    score,
    rating: rating(score),
    value: count === 0 ? '无阻塞资源' : `${count} 个渲染阻塞资源`,
    details: { count, resources: blockingResources.slice(0, 10) },
  };
}

/** 图片优化检测 */
function auditImages(): AuditItem {
  const issues: { src: string; problem: string; naturalSize?: string; displaySize?: string }[] = [];

  document.querySelectorAll('img').forEach((el) => {
    const img = el as HTMLImageElement;
    if (!img.src || img.src.startsWith('data:')) return;

    // 检测过大图片（实际尺寸远大于显示尺寸）
    if (img.naturalWidth > 0 && img.width > 0) {
      const ratio = (img.naturalWidth * img.naturalHeight) / (img.width * img.height);
      if (ratio > 4) {
        issues.push({
          src: img.src.slice(0, 100),
          problem: 'oversized',
          naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
          displaySize: `${img.width}x${img.height}`,
        });
      }
    }

    // 检测未使用 lazy loading 的非首屏图片
    const rect = img.getBoundingClientRect();
    if (rect.top > window.innerHeight * 1.5 && img.loading !== 'lazy') {
      issues.push({
        src: img.src.slice(0, 100),
        problem: 'missing-lazy-load',
      });
    }

    // 检测缺少尺寸属性（会导致 CLS）
    if (
      !img.hasAttribute('width') &&
      !img.hasAttribute('height') &&
      !img.style.width &&
      !img.style.height
    ) {
      const computedStyle = getComputedStyle(img);
      if (computedStyle.width === 'auto' || computedStyle.height === 'auto') {
        issues.push({
          src: img.src.slice(0, 100),
          problem: 'missing-dimensions',
        });
      }
    }
  });

  const count = issues.length;
  let score: number;
  if (count === 0) score = 100;
  else if (count <= 2) score = 75;
  else if (count <= 5) score = 50;
  else score = Math.max(10, 100 - count * 8);

  return {
    id: 'image-optimization',
    title: '图片优化',
    score,
    rating: rating(score),
    value: count === 0 ? '图片优化良好' : `${count} 张图片存在优化空间`,
    details: { count, issues: issues.slice(0, 10) },
  };
}

/** 资源体积分析 */
function auditResourceSize(): AuditItem {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  let totalTransferKB = 0;
  const largeResources: { url: string; sizeKB: number; type: string }[] = [];

  for (const entry of entries) {
    const sizeKB = Math.round(entry.transferSize / 1024);
    totalTransferKB += sizeKB;
    if (entry.transferSize > 100 * 1024) {
      // > 100KB
      largeResources.push({
        url: entry.name.slice(0, 100),
        sizeKB,
        type: entry.initiatorType,
      });
    }
  }

  // 按类型聚合
  const byType: Record<string, number> = {};
  for (const entry of entries) {
    const type = entry.initiatorType || 'other';
    byType[type] = (byType[type] || 0) + Math.round(entry.transferSize / 1024);
  }

  const largeCount = largeResources.length;
  let score: number;
  if (totalTransferKB <= 500) score = 100;
  else if (totalTransferKB <= 1500) score = 75;
  else if (totalTransferKB <= 3000) score = 50;
  else score = Math.max(10, 100 - Math.floor(totalTransferKB / 100));

  return {
    id: 'resource-size',
    title: '资源体积',
    score,
    rating: rating(score),
    value: `总传输 ${totalTransferKB}KB, ${largeCount} 个大资源(>100KB)`,
    details: { totalTransferKB, largeCount, byType, largeResources: largeResources.slice(0, 10) },
  };
}

/** 未压缩资源检测 */
function auditCompression(): AuditItem {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const uncompressed: { url: string; transferKB: number; decodedKB: number }[] = [];

  for (const entry of entries) {
    // transferSize ≈ decodedBodySize 说明未压缩（排除缓存命中）
    if (entry.transferSize > 1024 && entry.decodedBodySize > 0) {
      const ratio = entry.transferSize / entry.decodedBodySize;
      if (ratio > 0.9 && entry.decodedBodySize > 10 * 1024) {
        uncompressed.push({
          url: entry.name.slice(0, 100),
          transferKB: Math.round(entry.transferSize / 1024),
          decodedKB: Math.round(entry.decodedBodySize / 1024),
        });
      }
    }
  }

  const count = uncompressed.length;
  let score: number;
  if (count === 0) score = 100;
  else if (count <= 2) score = 70;
  else if (count <= 5) score = 45;
  else score = Math.max(10, 100 - count * 10);

  return {
    id: 'compression',
    title: '资源压缩',
    score,
    rating: rating(score),
    value: count === 0 ? '所有资源已压缩' : `${count} 个资源未开启 gzip/br 压缩`,
    details: { count, resources: uncompressed.slice(0, 10) },
  };
}

/** 字体加载检测 */
function auditFonts(): AuditItem {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const fonts = entries.filter(
    (e) => e.initiatorType === 'css' && /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(e.name),
  );

  const issues: string[] = [];

  // 检测字体文件大小
  const largeFonts = fonts.filter((f) => f.transferSize > 100 * 1024);
  if (largeFonts.length > 0) {
    issues.push(`${largeFonts.length} 个字体文件 >100KB`);
  }

  // 检测 font-display
  let missingFontDisplay = 0;
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule instanceof CSSFontFaceRule) {
            const display = rule.style.getPropertyValue('font-display');
            if (!display || display === 'auto') {
              missingFontDisplay++;
            }
          }
        }
      } catch {
        /* cross-origin stylesheet */
      }
    }
  } catch {
    /* ignore */
  }

  if (missingFontDisplay > 0) {
    issues.push(`${missingFontDisplay} 个 @font-face 缺少 font-display: swap`);
  }

  const totalIssues = largeFonts.length + missingFontDisplay;
  let score: number;
  if (totalIssues === 0) score = 100;
  else if (totalIssues <= 2) score = 70;
  else score = Math.max(20, 100 - totalIssues * 15);

  return {
    id: 'font-loading',
    title: '字体加载',
    score,
    rating: rating(score),
    value: totalIssues === 0 ? '字体加载良好' : issues.join('; '),
    details: { fontCount: fonts.length, largeFonts: largeFonts.length, missingFontDisplay },
  };
}

/** 主函数：运行全部审计 */
export function runPageAudit(): PageAuditReport {
  const audits: AuditItem[] = [
    auditDOMSize(),
    auditRenderBlocking(),
    auditImages(),
    auditResourceSize(),
    auditCompression(),
    auditFonts(),
  ];

  const summary = {
    good: audits.filter((a) => a.rating === 'good').length,
    warning: audits.filter((a) => a.rating === 'needs-improvement').length,
    poor: audits.filter((a) => a.rating === 'poor').length,
  };

  return {
    timestamp: Date.now(),
    url: location.href,
    audits,
    summary,
  };
}
