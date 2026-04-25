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

### 设备管理

| 工具 | 描述 |
|------|-------------|
| `list_devices` | 列出所有已连接的设备 |
| `focus_device` | 选择一个设备用于后续查询 |
| `watch_logs` | 订阅实时控制台日志流 |
| `get_page_context` | 获取综合页面上下文（控制台 + 网络 + 性能 + 可选 DOM） |
| `execute_js` | 在设备页面上执行 JavaScript 代码 |
| `take_screenshot` | 对设备页面进行截图 |
| `reload_page` | 重新加载设备页面 |
| `highlight_element` | 在设备页面上高亮显示 DOM 元素 |

### 数据查询

| 工具 | 描述 |
|------|-------------|
| `get_logs` | 获取控制台日志，支持按级别过滤 |
| `get_network` | 获取网络请求历史 |
| `get_performance` | 获取性能指标和 Vitals 数据 |
| `get_storage` | 查看 localStorage/sessionStorage |
| `get_dom` | 获取 DOM 树快照 |

### 存储

| 工具 | 描述 |
|------|-------------|
| `set_storage` | 在 localStorage/sessionStorage 中设置键值对 |
| `clear_storage` | 清除存储类型中的所有条目 |

### 性能

| 工具 | 描述 |
|------|-------------|
| `start_perf_run` | 启动性能基准测试会话（进入 Zen Mode） |
| `stop_perf_run` | 停止基准测试并返回评分结果 |
| `get_perf_report` | 获取最近一次性能测试会话报告 |
| `zen_mode` | 进入或退出 Zen Mode |

### Mock

| 工具 | 描述 |
|------|-------------|
| `add_mock` | 添加网络请求匹配的 mock 规则 |
| `remove_mock` | 按 ID 移除 mock 规则 |
| `clear_mocks` | 移除所有 mock 规则 |
| `network_throttle` | 模拟网络条件（none/2g/3g/offline） |

### 健康检查

| 工具 | 描述 |
|------|-------------|
| `health_check` | 获取自动化健康诊断评分 |

### 监控

| 工具 | 描述 |
|------|-------------|
| `start_monitor` | 启动后台监控会话 |
| `poll_monitor` | 轮询监控会话以获取结果 |
| `stop_monitor` | 停止正在运行的监控会话 |
| `list_monitors` | 列出所有监控会话 |

### AI 与分析

| 工具 | 描述 |
|------|-------------|
| `analyze_errors` | AI 驱动的错误模式分析 |
| `ai_analyze` | AI 驱动的综合错误分析 |

### 开发

| 工具 | 描述 |
|------|-------------|
| `ensure_sdk` | 自动检测并将 SDK 注入到项目中 |
| `init_dev_session` | 初始化开发会话 |
| `get_checkpoints` | 获取所有检查点标记 |
| `verify_checkpoint` | 验证指定的检查点 |
| `start_openlog` | 启动 openLog 服务器 |
| `stop_openlog` | 停止 openLog 服务器 |

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
