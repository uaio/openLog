# AIConsole 文档中心

欢迎来到 AIConsole 文档中心！这里包含了项目的所有文档。

---

## 🚀 快速导航

### 新手必读

1. **[快速开始](./getting-started.md)** - 5 分钟了解项目并启动
2. **[完整验证流程](./verification.md)** - 验证所有功能是否正常工作
3. **[项目状态](./project-status.md)** - 当前开发进度和技术栈

### 开发指南

4. **[任务状态](./tasks.md)** - 21 个任务的详细完成状态
5. **[跨电脑开发](./cross-machine.md)** - 在不同电脑间无缝切换
6. **[测试指南](./TESTING_GUIDE.md)** - 测试流程和问题排查

### 设计文档

7. **[设计规范](./superpowers/specs/2026-03-18-aiconsole-design.md)** - 完整技术设计
8. **[实现计划](./superpowers/plans/2026-03-19-mvp-implementation.md)** - 详细实现步骤

---

## 📖 按场景查找文档

### 场景 1：我是新开发者，想了解项目
→ 阅读 [快速开始](./getting-started.md)

### 场景 2：我想验证系统是否正常
→ 阅读 [完整验证流程](./verification.md)

### 场景 3：我想继续开发新功能
→ 阅读 [项目状态](./project-status.md) 和 [跨电脑开发](./cross-machine.md)

### 场景 4：我想了解技术细节
→ 阅读 [设计规范](./superpowers/specs/2026-03-18-aiconsole-design.md)

### 场景 5：我想了解具体任务实现
→ 阅读 [任务状态](./tasks.md) 和 [实现计划](./superpowers/plans/2026-03-19-mvp-implementation.md)

---

## 🔗 文档依赖关系

```
快速开始 (getting-started.md)
    │
    ├─→ 项目状态 (project-status.md)
    │       │
    │       ├─→ 任务状态 (tasks.md)
    │       │       │
    │       │       └─→ 实现计划 (plans/)
    │       │
    │       └─→ 设计规范 (specs/)
    │
    ├─→ 完整验证 (verification.md)
    │
    └─→ 跨电脑开发 (cross-machine.md)
```

---

## 🎯 常见问题快速链接

| 问题 | 查看文档 |
|------|----------|
| 如何启动服务器？ | [快速开始](./getting-started.md#启动服务器) |
| 如何验证功能？ | [完整验证流程](./verification.md) |
| 项目用了什么技术？ | [项目状态](./project-status.md#技术栈) |
| 如何继续开发？ | [跨电脑开发](./cross-machine.md) |
| 如何运行测试？ | [测试指南](./TESTING_GUIDE.md) |
| 设备 ID 如何生成？ | [设计规范](./superpowers/specs/2026-03-18-aiconsole-design.md#设备标识机制) |
| WebSocket 协议是什么？ | [设计规范](./superpowers/specs/2026-03-18-aiconsole-design.md#websocket-通信协议) |

---

**文档最后更新**: 2026-03-19
**项目版本**: 0.1.0 MVP
