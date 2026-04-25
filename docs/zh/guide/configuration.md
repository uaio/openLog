# 配置

## SDK 选项

```typescript
interface OpenLogConfig {
  /** WebSocket 服务器地址 */
  server: string;
  /** 项目标识符，用于设备分组 */
  projectId: string;
  /** 启用/禁用控制台拦截（默认：true） */
  console?: boolean;
  /** 启用/禁用网络拦截（默认：true） */
  network?: boolean;
  /** 启用/禁用性能监控（默认：true） */
  performance?: boolean;
  /** 启用/禁用存储快照（默认：true） */
  storage?: boolean;
  /** 启用/禁用错误捕获（默认：true） */
  error?: boolean;
  /** 启用 Eruda 页内控制台（默认：false） */
  eruda?: boolean;
  /** 每秒最大日志速率限制（默认：100） */
  rateLimit?: number;
}
```

## 服务器配置

服务器可以通过 CLI 参数或环境变量进行配置：

| 选项 | 环境变量 | 默认值 | 描述 |
|------|---------|--------|------|
| `--port` | `OPENLOG_PORT` | 38291 | 服务器端口 |
| `--persist` | `OPENLOG_PERSIST` | false | 启用 SQLite 持久化 |
| `--db-path` | `OPENLOG_DB_PATH` | `~/.openlog/data.db` | 数据库文件路径 |
| `--retention-days` | `OPENLOG_RETENTION` | 1 | 数据保留天数 |
| `--api-key` | `OPENLOG_API_KEY` | — | 访问 API 密钥 |
| `--cors-origin` | `OPENLOG_CORS` | `*` | 允许的 CORS 来源 |

## 持久化

启用 `--persist` 后，日志、网络请求、性能会话和设备信息将存储在 SQLite 中，使用 WAL 模式以提升性能。超过保留期的数据会每小时自动清理。

## API 密钥认证

设置 `--api-key` 后，所有 HTTP API 请求必须包含以下请求头：

```
X-API-Key: <your-key>
```

WebSocket 连接必须将密钥作为查询参数：

```
ws://localhost:38291?apiKey=<your-key>
```

## 国际化 (i18n)

openLog 支持中英文，包括 SDK（Eruda 面板）和 PC Web 面板。

### SDK 语言

初始化时设置 `lang` 选项：

```typescript
new OpenLog({
  projectId: 'my-app',
  lang: 'en',   // 'zh'（默认）或 'en'
});
```

### PC 面板语言

Web 面板会自动检测浏览器语言。用户也可以通过面板顶部的语言切换按钮手动切换。

语言偏好会保存到 `localStorage`（`openlog_lang`）。

### 添加语言

SDK 和 Web 面板都使用简单的键值对本地化系统：
- SDK：`packages/sdk/src/i18n/`
- Web：`packages/web/src/i18n/`（实现了 `Locale` TypeScript 接口）

## 多标签页支持

当用户在同一设备上打开多个浏览器标签页时，每个标签页会获得一个唯一的 `tabId`。PC 面板可以按标签页过滤数据：
- **TabFilter 组件** — 面板顶部的下拉菜单，显示所有活跃标签页
- **按标签页过滤** — 控制台日志和网络请求可以过滤到特定标签页
- **标签页识别** — 每个标签页会报告其 URL，方便识别对应的页面

`tabId` 在 SDK 初始化时自动生成，并包含在发送到服务器的每个数据包中。
