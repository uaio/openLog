# MCP 集成

openLog 包含一个 Model Context Protocol（MCP）服务器，使 AI 助手能够与调试数据进行交互。

## 设置

```bash
npx @openlogs/mcp
```

或者添加到你的 MCP 客户端配置中：

```json
{
  "mcpServers": {
    "openlog": {
      "command": "npx",
      "args": ["@openlogs/mcp"]
    }
  }
}
```

## 可用工具

| 工具 | 描述 |
|------|-------------|
| `list_devices` | 列出所有已连接的设备 |
| `focus_device` | 选择一个设备用于后续查询 |
| `get_logs` | 获取控制台日志，支持按级别过滤 |
| `get_network` | 获取网络请求历史 |
| `get_performance` | 获取性能指标和 Vitals 数据 |
| `get_storage` | 查看 localStorage/sessionStorage |
| `get_dom` | 获取 DOM 树快照 |
| `analyze_errors` | AI 驱动的错误模式分析 |
| `ensure_sdk` | 自动检测并将 SDK 注入到项目中 |

## 示例提示

通过 MCP 连接 AI 助手后，你可以这样提问：

- "显示设备 X 的最近错误"
- "哪些网络请求失败了？"
- "分析当前页面的性能"
- "localStorage 中存储了什么？"
- "帮我在 React 项目中设置 openLog"

## SDK 自动注入

`ensure_sdk` 工具可以自动检测你的项目框架并添加 openLog SDK：

```
> 使用 ensure_sdk 工具将 openLog 添加到我的项目中
```

支持的框架：React、Vue、Next.js、原生 HTML 等。
