# 控制台日志

SDK 拦截 `console.log`、`console.warn`、`console.error`、`console.info`、`console.debug` 和 `console.trace` 调用。

## 功能特性

- **级别过滤** — 在 Web 面板中按 log/warn/error/info/debug 级别进行过滤
- **堆栈追踪** — error 和 trace 日志包含完整的调用堆栈
- **速率限制** — 防止日志洪泛（默认：100 条/秒）
- **缓冲传输** — 日志会批量发送以提高网络效率
- **持久化** — 可选存储到 SQLite 中以供后续检索

## 工作原理

1. SDK 在初始化时修补 `console.*` 方法
2. 每次调用都会被捕获，包含时间戳、级别、序列化消息和可选的堆栈信息
3. 数据被发送到内部 DataBus
4. Reporter 订阅 DataBus 并通过 WebSocket 发送到服务器
5. 服务器将数据广播到已连接的 Web 面板客户端

## 消息格式

```typescript
interface ConsoleLogEntry {
  id: string;
  deviceId: string;
  tabId: string;
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  stack?: string;
}
```
