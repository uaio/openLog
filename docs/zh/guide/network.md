# 网络监控

SDK 拦截 `fetch` 和 `XMLHttpRequest` 来捕获网络活动。

## 捕获的数据

- 请求方法、URL、请求头、请求体
- 响应状态、响应头、响应体（有大小限制）
- 请求耗时（计时）
- 失败请求的错误信息

## 功能特性

- **方法过滤** — 按 GET、POST、PUT、DELETE 等方法进行过滤
- **状态码过滤** — 按成功（2xx）、重定向（3xx）、客户端错误（4xx）、服务端错误（5xx）进行过滤
- **文本搜索** — 按 URL 搜索
- **请求详情** — 点击任意请求查看完整的请求头和请求体
- **节流模拟** — 可配置的网络节流
- **API Mock** — 对特定 URL 模式的响应进行覆盖

## 请求格式

```typescript
interface NetworkRequestEntry {
  id: string;
  deviceId: string;
  tabId: string;
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  type: 'fetch' | 'xhr';
  error?: string;
}
```
