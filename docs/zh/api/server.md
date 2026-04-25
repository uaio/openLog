# 服务器 API 参考

## HTTP 端点

所有端点返回 JSON。当配置了 `--api-key` 时，需包含 `X-API-Key` 请求头。

### 设备

```
GET /api/devices
```

返回已连接设备列表及其元数据。

### 日志

```
GET /api/logs?deviceId=<id>&limit=<n>
DELETE /api/logs?deviceId=<id>
```

### 网络请求

```
GET /api/network?deviceId=<id>&limit=<n>
```

### 性能

```
GET /api/performance?deviceId=<id>
GET /api/perf-runs?deviceId=<id>
```

### 存储

```
GET /api/storage?deviceId=<id>
```

### DOM

```
GET /api/dom?deviceId=<id>
```

### 截图

```
GET /api/screenshots?deviceId=<id>
```

### 健康检查

```
GET /api/health?deviceId=<id>
```

### 模拟规则

```
GET /api/mock-rules?deviceId=<id>
POST /api/mock-rules
DELETE /api/mock-rules/:id
```

## WebSocket 协议

通过 `ws://host:port` 连接（如果启用了认证，添加 `?apiKey=<key>`）。

### 入站消息（来自 SDK）

```json
{
  "type": "event",
  "deviceId": "device-xxx",
  "envelope": {
    "type": "console|network|storage|dom|performance|screenshot|perf_run",
    "tabId": "tab-xxx",
    "ts": 1234567890,
    "data": { ... }
  }
}
```

### 出站消息（发送到仪表盘）

格式与入站消息相同——服务器将事件广播给所有已连接的仪表盘客户端，按设备订阅进行过滤。

### 设备注册

```json
{
  "type": "register",
  "device": {
    "deviceId": "...",
    "projectId": "...",
    "ua": "...",
    "screen": "...",
    "url": "..."
  }
}
```
