# SDK API 参考

## 安装

```bash
npm install @openlogs/sdk
```

或通过 CDN：

```html
<script src="https://unpkg.com/@openlogs/sdk/dist/openlog.iife.js"></script>
```

## 初始化

### ES Module

```typescript
import { OpenLog } from '@openlogs/sdk';

const logger = new OpenLog({
  projectId: 'my-app',
  server: 'ws://192.168.1.100:38291',
});
```

### IIFE（CDN）

```html
<script>
  OpenLog.init({
    projectId: 'my-app',
    server: 'ws://192.168.1.100:38291',
  });
</script>
```

## 配置选项

```typescript
interface OpenLogOptions {
  /** 必填。用于设备分组的项目标识符 */
  projectId: string;
  /** WebSocket 服务器地址（例如 'ws://192.168.1.100:38291'） */
  server?: string;
  /** 服务器端口简写（server 的替代方案）。SDK 推断 ws://[页面主机名]:port */
  port?: number;
  /** UI 语言：'zh'（默认）或 'en' */
  lang?: 'zh' | 'en';
  /** 心跳间隔，单位毫秒（默认：30000） */
  heartbeatInterval?: number;
  /** Eruda 设备端面板配置 */
  eruda?: ErudaConfig;
  /** 网络拦截配置 */
  network?: NetworkInterceptorConfig;
  /** 启用全局错误捕获（默认：true） */
  captureErrors?: boolean;
  /** DOM 快照配置 */
  dom?: {
    enabled?: boolean;
    initialDelay?: number;
  };
  /** 性能监控配置 */
  performance?: {
    enabled?: boolean;
  };
}
```

### ErudaConfig

```typescript
interface ErudaConfig {
  /** 启用 Eruda 面板（默认：true） */
  enabled?: boolean;
  /** 显示的工具：['console', 'elements', 'network', ...] */
  tool?: string[];
  /** 移动端自动缩放（默认：true） */
  autoScale?: boolean;
  /** 使用 Shadow DOM 隔离（默认：true） */
  useShadowDom?: boolean;
  /** 默认设置 */
  defaults?: {
    transparency?: number;
    displaySize?: number;
    theme?: string;
  };
}
```

### NetworkInterceptorConfig

```typescript
interface NetworkInterceptorConfig {
  /** 启用网络拦截（默认：true） */
  enabled?: boolean;
  /** 请求体最大捕获大小，单位字节（默认：10240） */
  maxRequestBodySize?: number;
  /** 响应体最大捕获大小，单位字节（默认：10240） */
  maxResponseBodySize?: number;
  /** 要忽略的 URL 模式（正则表达式字符串） */
  ignoreUrls?: string[];
}
```

## 实例方法

### `takeScreenshot()`

使用 html2canvas 截取当前页面的屏幕截图。

```typescript
await logger.takeScreenshot();
```

### `startPerfRun()`

启动性能基准测试会话。自动进入禅模式（禁用高开销采集器以避免干扰）。

```typescript
logger.startPerfRun();
```

### `stopPerfRun()`

停止基准测试并返回评分结果。

```typescript
const session = await logger.stopPerfRun();
// session.score.total — 0-100 综合评分
// session.score.grade — 'A' | 'B' | 'C' | 'D' | 'F'
// session.score.issues — 问题描述数组
```

### `getPerfReport()`

返回最近一次性能测试会话（或 `null`）。

```typescript
const report = logger.getPerfReport();
```

### `setNetworkThrottle(preset)`

模拟网络条件。

```typescript
logger.setNetworkThrottle('3g');
logger.setNetworkThrottle('4g');
logger.setNetworkThrottle('offline');
logger.setNetworkThrottle('none');
```

可用预设：`'none'` | `'3g'` | `'4g'` | `'offline'`

### `addMock(urlPattern, response)`

为匹配的网络请求添加模拟规则。

```typescript
const mockId = logger.addMock('/api/user', {
  status: 200,
  body: JSON.stringify({ name: 'Test User' }),
  headers: { 'Content-Type': 'application/json' },
});
```

### `removeMock(id)`

根据 ID 移除模拟规则。

```typescript
logger.removeMock(mockId);
```

### `clearMocks()`

移除所有模拟规则。

```typescript
logger.clearMocks();
```

### `getMocks()`

返回所有活跃的模拟规则。

```typescript
const rules = logger.getMocks();
```

### `enterZenMode()`

停止所有高开销采集器（FPS、网络、存储、DOM）。仅保留控制台 + 错误捕获活跃。在性能基准测试期间使用。

```typescript
logger.enterZenMode();
```

### `exitZenMode()`

在禅模式之后恢复所有采集器。

```typescript
logger.exitZenMode();
```

### `isZenMode()`

返回禅模式是否处于活跃状态。

```typescript
if (logger.isZenMode()) { /* ... */ }
```

### `enableRemote()` / `disableRemote()`

切换与服务器的 WebSocket 连接。

```typescript
logger.disableRemote();
logger.enableRemote();
```

### `isRemoteEnabled()`

检查远程上报是否处于活跃状态。

```typescript
const connected = logger.isRemoteEnabled();
```

### `destroy()`

完全销毁 SDK：恢复原始 `console.*`，断开 WebSocket 连接，停止所有采集器，销毁 Eruda。

```typescript
logger.destroy();
```

## 静态方法

### `OpenLog.init(options)`（仅限 IIFE）

使用 CDN 构建时，`OpenLog.init()` 创建并返回单例实例：

```javascript
const logger = OpenLog.init({ projectId: 'my-app' });
```

## 数据类型

### PerfRunSession

```typescript
interface PerfRunSession {
  sessionId: string;
  deviceId: string;
  tabId: string;
  startTime: number;
  endTime: number;
  duration: number;
  snapshot: PerformanceReport;
  score: PerfRunScore;
  audit?: PageAuditReport;
}
```

### PerfRunScore

```typescript
interface PerfRunScore {
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  items: PerfScoreItem[];
  issues: string[];
  summary: string;
}
```

### MockRule

```typescript
interface MockRule {
  id: string;
  pattern: string;
  status: number;
  body: string;
  headers?: Record<string, string>;
}
```

## 事件与数据流

SDK 使用内部 **DataBus**（发布/订阅事件总线）作为唯一数据源：

```
console.log() → 拦截 → DataBus.emit('console', ...) → Reporter → WebSocket → 服务器
                                                         → ErudaPlugin → Eruda 面板
```

所有采集器（Console、Network、Storage、DOM、Performance、Error、Screenshot）都会向 DataBus 发射事件。Reporter 订阅事件并转发到服务器。ErudaPlugin 订阅事件并在本地显示。
