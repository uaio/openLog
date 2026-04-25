# SDK API 参考

## `new OpenLog(config)`

初始化 openLog SDK。

```typescript
import OpenLog from '@openlogs/sdk';

const logger = new OpenLog({
  server: 'ws://localhost:38291',
  projectId: 'my-app',
});
```

### 返回值

```typescript
interface OpenLogInstance {
  /** 销毁实例并恢复原始的 console/fetch/XHR */
  destroy(): void;
  /** 获取生成的设备 ID */
  deviceId: string;
  /** 获取当前标签页 ID */
  tabId: string;
}
```

## DataBus

采集器使用的内部事件总线。可用于高级场景：

```typescript
import { DataBus } from '@openlogs/sdk/core/DataBus';

const bus = new DataBus();

// 订阅事件
const unsub = bus.on('console', (entry) => {
  console.log('已捕获:', entry.message);
});

// 发射事件
bus.emit('console', { id: '1', level: 'log', message: 'hello', timestamp: Date.now(), args: [] });

// 取消订阅
unsub();

// 清除所有监听器
bus.clear();
```

## 事件类型

```typescript
type DataBusEventMap = {
  console: DataBusConsoleEntry;
  network: NetworkRequestEntry;
  storage: StorageSnapshot;
  dom: DOMSnapshot;
  performance: PerformanceReport;
  screenshot: ScreenshotData;
  perf_run: PerfRunSession;
};
```
