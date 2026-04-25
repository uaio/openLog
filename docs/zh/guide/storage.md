# 存储监控

openLog 捕获浏览器存储的实时快照，让你可以远程查看和修改数据。

## 捕获的存储类型

| 存储类型 | 读取 | 写入（从 PC 端） |
|-------------|------|-----------------|
| localStorage | ✅ | ✅ |
| sessionStorage | ✅ | ✅ |
| Cookies | ✅ | — |

## 工作原理

1. SDK 的 `StorageReader` 定期对所有存储进行快照
2. 快照包含键值对和总字节数
3. 数据通过 WebSocket 发送到服务器
4. PC 面板以可编辑的表格形式展示存储数据
5. PC 面板可以向设备发送 `set_storage` / `clear_storage` 命令

## PC 面板功能

- **查看所有键** — 显示 localStorage 和 sessionStorage 的完整条目列表
- **编辑值** — 点击即可实时修改任意键的值
- **删除键** — 移除单个条目
- **清空全部** — 清除某种存储类型的所有数据
- **大小指示器** — 显示每种存储类型的已用字节数
- **Cookie 展示** — document.cookie 的只读视图

## MCP 工具

| 工具 | 描述 |
|------|-------------|
| `get_storage` | 获取当前存储快照 |
| `set_storage` | 在 localStorage/sessionStorage 中设置键值对 |
| `clear_storage` | 清除某种存储类型的所有条目 |

## 数据格式

```typescript
interface StorageSnapshot {
  deviceId: string;
  tabId: string;
  timestamp: number;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: string;
  localStorageSize: number;
  sessionStorageSize: number;
}
```

## 配置

存储监控默认启用。没有单独的开关 —— 它是核心 SDK 采集器的一部分。

SDK 通过轮询机制自动检测存储变化，以确保跨浏览器兼容性（因为 `storage` 事件只在不同标签页之间触发，不会在同一标签页内触发）。
