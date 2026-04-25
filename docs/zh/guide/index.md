# 简介

openLog 是一款实时移动端 H5 调试工具，帮助开发者通过 Web 仪表板直接监控控制台日志、网络请求、性能指标等数据。

## 架构

```
┌─────────────┐     WebSocket      ┌──────────────┐     HTTP      ┌───────────┐
│  SDK (H5)   │ ──────────────────▶│   Server     │◀────────────▶ │  Web UI   │
│  @openlogs/sdk│                    │  @openlogs/server│             │           │
└─────────────┘                    └──────────────┘              └───────────┘
                                          │
                                    MCP Protocol
                                          │
                                   ┌──────▼──────┐
                                   │  MCP Server  │
                                   │  @openlogs/mcp│
                                   └─────────────┘
```

## 包

| 包名 | 描述 |
|------|------|
| `@openlogs/types` | 共享 TypeScript 类型定义（单一事实来源） |
| `@openlogs/sdk` | 注入到 H5 页面的客户端 SDK |
| `@openlogs/server` | 用于数据采集的 WebSocket + HTTP 服务器 |
| `@openlogs/web` | 由服务器托管的 PC 端调试面板 (React) |
| `@openlogs/mcp` | 用于 AI 驱动调试的 MCP 服务器 |
| `@openlogs/cli` | 启动服务器 (`npx @openlogs/cli`) 和配置 AI 工具的 CLI 工具 |
| `@openlogs/eruda` | SDK 内部使用的 Eruda 构建包，用于本地面板 |
| `@openlogs/demo` | 用于开发和测试的演示页面 |

## 功能特性

- **控制台捕获** — log、warn、error、info、debug、trace，支持堆栈跟踪
- **网络监控** — Fetch 和 XHR 拦截，获取完整的请求/响应详情
- **性能监控** — Web Vitals、FPS、内存、长任务、资源计时
- **存储检查** — localStorage 和 sessionStorage 快照
- **DOM 快照** — 实时 DOM 树检查
- **截图** — 基于 html2canvas 的页面捕获
- **API 模拟** — 客户端请求模拟，支持节流
- **健康检查** — 自动化评分和诊断
- **多设备** — 同时支持多个已连接设备
- **多标签页** — 按浏览器标签页过滤数据
- **持久化** — 可选 SQLite 存储，支持配置保留时长
- **国际化** — 支持中英文界面
