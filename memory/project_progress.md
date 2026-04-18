# openLog 项目进度

> 更新时间: 2026-04-18

## 项目概况

**项目名称**: openLog
**定位**: 首款面向 AI Agent 的前端 H5 数据监控工具
**技术栈**: TypeScript, Vite, React, Node.js
**包管理**: pnpm (Monorepo + Turborepo)

## 架构

```
packages/
├── types/    — 统一数据标准（@openlog/types），唯一类型来源
├── sdk/      — 移动端 SDK（数据采集 + Eruda 集成）
├── server/   — Node.js 服务（WebSocket + REST API + CLI）
├── web/      — PC 调试面板（React）
├── mcp/      — MCP Server（AI 工具集，@modelcontextprotocol/sdk ^1.29.0）
├── eruda/    — Eruda 源码 clone（用于定制化）
└── demo/     — 演示页面
```

**数据流**: SDK → DataBus（统一事件总线）→ Reporter → WebSocket → Server → PC 面板 / MCP AI

## 已完成的核心功能

- ✅ H5 SDK：Console / Network / Storage / DOM / Performance / Screenshot / Error 采集
- ✅ Eruda 集成：替代自研浮球，overrideConsole: false 防止双重捕获
- ✅ PC 面板：9 个 Tab（控制台/网络/存储/Element/性能/跑分/Mock/健康/AI 分析）
- ✅ MCP 工具集：25+ 个工具（查日志/网络/存储/截图/远程执行/Mock/弱网模拟等）
- ✅ `ensure_sdk` 工具：自动检测项目框架 + SDK 注入
- ✅ `npx openlog init`：一键配置 Claude Code / Cursor / Windsurf MCP
- ✅ 7 个 Claude Code slash commands（setup/start/stop/status/logs/screenshot/clean）
- ✅ `@openlog[checkpoint]` 开发期埋点 + 自动验证 + 清除
- ✅ `POST /api/ingest` 外部数据接入
- ✅ 性能跑分系统（评分/等级/问题建议/历史对比）

## 技术债务

1. 单元测试覆盖不足
2. E2E 测试缺失
3. eruda 包 webpack 构建失败（不影响核心功能）
4. 构建命令需指定 filter：`pnpm --filter @openlog/types --filter @openlog/server --filter @openlog/mcp run build`
