# MCP Integration

openLog includes a Model Context Protocol (MCP) server that enables AI assistants to interact with debugging data.

## Setup

```bash
npx @openlogs/mcp
```

Or add to your MCP client configuration:

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

## Available Tools

### Device Management

| Tool | Description |
|------|-------------|
| `list_devices` | List all connected devices |
| `focus_device` | Select a device for subsequent queries |
| `watch_logs` | Subscribe to real-time console log stream |
| `get_page_context` | Get comprehensive page context (console + network + performance + optional DOM) |
| `execute_js` | Execute JavaScript code on the device page |
| `take_screenshot` | Capture a screenshot of the device page |
| `reload_page` | Reload the device page |
| `highlight_element` | Highlight a DOM element on the device page |

### Data Query

| Tool | Description |
|------|-------------|
| `get_logs` | Retrieve console logs with level filtering |
| `get_network` | Get network request history |
| `get_performance` | Get performance metrics and vitals |
| `get_storage` | Inspect localStorage/sessionStorage |
| `get_dom` | Get DOM tree snapshot |

### Storage

| Tool | Description |
|------|-------------|
| `set_storage` | Set a key-value pair in localStorage/sessionStorage |
| `clear_storage` | Clear all entries in a storage type |

### Performance

| Tool | Description |
|------|-------------|
| `start_perf_run` | Start a performance benchmark session (enters Zen Mode) |
| `stop_perf_run` | Stop the benchmark and return scored results |
| `get_perf_report` | Get the last performance run session report |
| `zen_mode` | Enter or exit Zen Mode |

### Mocking

| Tool | Description |
|------|-------------|
| `add_mock` | Add a mock rule for matching network requests |
| `remove_mock` | Remove a mock rule by ID |
| `clear_mocks` | Remove all mock rules |
| `network_throttle` | Simulate network conditions (none/2g/3g/offline) |

### Health

| Tool | Description |
|------|-------------|
| `health_check` | Get automated health diagnostic score |

### Monitoring

| Tool | Description |
|------|-------------|
| `start_monitor` | Start a background monitoring session |
| `poll_monitor` | Poll a monitoring session for results |
| `stop_monitor` | Stop a running monitoring session |
| `list_monitors` | List all monitoring sessions |

### AI & Analysis

| Tool | Description |
|------|-------------|
| `analyze_errors` | AI-powered error pattern analysis |
| `ai_analyze` | AI-powered comprehensive error analysis |

### Development

| Tool | Description |
|------|-------------|
| `ensure_sdk` | Auto-detect and inject SDK into a project |
| `init_dev_session` | Initialize a development session |
| `get_checkpoints` | Get all checkpoint markers |
| `verify_checkpoint` | Verify a specific checkpoint |
| `start_openlog` | Start the openLog server |
| `stop_openlog` | Stop the openLog server |

## Example Prompts

With an AI assistant connected via MCP:

- "Show me the recent errors from device X"
- "What network requests are failing?"
- "Analyze the performance of the current page"
- "What's stored in localStorage?"
- "Help me set up openLog in my React project"

## SDK Auto-Injection

The `ensure_sdk` tool can automatically detect your project framework and add the openLog SDK:

```
> Use the ensure_sdk tool to add openLog to my project
```

It supports: React, Vue, Next.js, vanilla HTML, and more.
