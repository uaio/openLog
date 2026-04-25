# API 模拟与网络限速

openLog 允许你直接从 PC 面板或 AI 工具模拟 API 响应和模拟网络条件——无需修改后端代码。

## API 模拟

### 工作原理

1. 从 PC 面板或通过 MCP 添加模拟规则（URL 模式 + 响应）
2. SDK 在网络层拦截匹配的请求
3. SDK 返回你的模拟响应，而不是访问真实服务器
4. 被模拟的请求仍然会显示在网络面板中（标记为已模拟）

### 添加模拟规则

**从 PC 面板（Mock 标签页）：**
- 输入 URL 正则表达式模式（例如 `/api/user.*`）
- 设置响应状态码、响应体和响应头
- 开启或关闭规则

**从 MCP（AI 工具）：**
```
add_mock: { urlPattern: "/api/login", status: 200, body: '{"token":"test"}' }
remove_mock: { id: "mock-xxx" }
clear_mocks: {}
```

**从 SDK 代码：**
```typescript
const id = logger.addMock('/api/user', {
  status: 200,
  body: JSON.stringify({ name: 'Mock User', email: 'test@example.com' }),
  headers: { 'Content-Type': 'application/json' },
});

// 稍后移除
logger.removeMock(id);

// 或清除所有
logger.clearMocks();
```

### 模拟规则格式

```typescript
interface MockRule {
  id: string;
  pattern: string;
  status: number;
  body: string;
  headers?: Record<string, string>;
}
```

### 模式匹配

`pattern` 字段是一个**正则表达式字符串**，用于匹配完整的请求 URL：

| 模式 | 匹配内容 |
|---------|---------|
| `/api/user` | 任何包含 `/api/user` 的 URL |
| `/api/user$` | 以 `/api/user` 结尾的 URL |
| `/api/(login\|register)` | `/api/login` 或 `/api/register` |
| `.*` | 所有请求（谨慎使用） |

## 网络限速

模拟慢速网络条件，用于测试加载状态、超时和离线行为。

### 可用预设

| 预设 | 延迟 | 下载速度 |
|--------|---------|----------------|
| `none` | 0ms | 无限制 |
| `4g` | 50ms | 4 Mbps |
| `3g` | 300ms | 750 Kbps |
| `offline` | — | 无连接 |

### 使用方法

**从 PC 面板（Console 标签页）：**
- 使用限速下拉菜单选择预设

**从 MCP：**
```
network_throttle: { preset: "3g" }
```

**从 SDK：**
```typescript
logger.setNetworkThrottle('3g');

// 禁用限速
logger.setNetworkThrottle('none');
```

### 限速工作原理

`NetworkThrottle` 模块通过添加人为延迟来包装原生 `fetch` 和 `XMLHttpRequest`：
- **延迟** — 在请求发送之前增加延迟
- **带宽** — 根据模拟的传输速度限制响应数据的传输
- **离线** — 以网络错误拒绝所有请求

> ⚠️ 限速仅在客户端生效。它模拟的是体验效果，不会影响实际网络条件。
