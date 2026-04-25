# Server API Reference

## HTTP Endpoints

All endpoints return JSON. When `--api-key` is configured, include `X-API-Key` header.

### Devices

```
GET /api/devices
```

Returns list of connected devices with metadata.

### Logs

```
GET /api/devices/:deviceId/logs?limit=<n>
DELETE /api/devices/:deviceId/logs
```

### Network Requests

```
GET /api/devices/:deviceId/network?limit=<n>
```

### Performance

```
GET /api/devices/:deviceId/performance
GET /api/devices/:deviceId/perf-run
```

### Storage

```
GET /api/devices/:deviceId/storage
```

### DOM

```
GET /api/devices/:deviceId/dom
```

### Screenshots

```
GET /api/devices/:deviceId/screenshot
```

### Health

```
GET /api/devices/:deviceId/health
```

### Mock Rules

```
GET /api/devices/:deviceId/mocks
POST /api/devices/:deviceId/mocks
DELETE /api/devices/:deviceId/mocks/:mockId
```

## WebSocket Protocol

Connect via `ws://host:port` (add `?apiKey=<key>` if auth is enabled).

### Incoming Messages (from SDK)

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

### Outgoing Messages (to dashboard)

Same format as incoming — server broadcasts events to all connected dashboard clients filtered by device subscription.

### Device Registration

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
