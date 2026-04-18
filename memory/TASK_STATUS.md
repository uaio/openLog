# 任务状态

> 最后更新: 2026-04-18

## ✅ 已完成

### Eruda 集成 (2026-03-21)
- 替换自研浮球 → Eruda 移动端调试面板
- ErudaPlugin 订阅 DataBus，overrideConsole: false 防止双重捕获
- 删除自定义 FloatingBall / DragHandler / ClickDetector

### Claude Code 生态集成 (2026-04-18)
- MCP SDK 升级 ^0.5.0 → ^1.29.0（+ zod peer dep）
- 新增 `ensure_sdk` MCP 工具（自动检测框架 + SDK 注入）
- `start_openlog` 增强：启动时自动调用 ensure_sdk 检测
- MCP Prompt 重写：包含 Step 0 自动检测 SDK
- 新增 `/openlog:setup` slash command（一键从零到就绪）
- 文档整理：新增 debug-flow-guide.md，清理过时文档

## 📋 待处理

- [ ] 单元测试补充
- [ ] E2E 测试
- [ ] eruda 包 webpack 构建修复
- [ ] API 文档补充
