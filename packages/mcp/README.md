# @openlog/mcp

> MCP (Model Context Protocol) server for openLog — 30+ AI-callable tools for real-device debugging.

## Installation

```bash
npm install @openlog/mcp
```

## Setup

### Auto-detection (Recommended)

```bash
npx @openlog/cli init
# Auto-detects Claude Code / Cursor / Windsurf and writes MCP config
```

### Manual Configuration

Add to your MCP config:

```json
{
  "mcpServers": {
    "openlog": {
      "command": "npx",
      "args": ["-y", "@openlog/cli", "--mcp"]
    }
  }
}
```

## Available Tools

### Device Management
| Tool | Description |
|------|-------------|
| `list_devices` | List all connected devices |
| `focus_device` | Focus on a specific device for subsequent operations |

### Data Retrieval
| Tool | Description |
|------|-------------|
| `get_console_logs` | Get console logs (filterable by level) |
| `get_network_requests` | Get network request history |
| `get_storage` | Get storage snapshot |
| `get_page_context` | Get current page URL and metadata |
| `get_checkpoints` | Get `@openlog[checkpoint]` verification data |

### Remote Actions
| Tool | Description |
|------|-------------|
| `execute_js` | Execute JavaScript on the device |
| `take_screenshot` | Capture current page screenshot |
| `reload_page` | Reload the page |
| `set_storage` | Set storage values |
| `clear_storage` | Clear storage |
| `highlight_element` | Highlight a DOM element |

### Monitoring
| Tool | Description |
|------|-------------|
| `watch_logs` | Watch real-time log stream |
| `start_monitor` | Start continuous monitoring |
| `poll_monitor` | Poll monitor for new data |
| `stop_monitor` | Stop monitoring |
| `list_monitors` | List active monitors |

### Performance & Testing
| Tool | Description |
|------|-------------|
| `start_perf_run` | Start performance benchmark |
| `stop_perf_run` | Stop and get benchmark results |
| `get_perf_report` | Get performance report |
| `health_check` | Run page health check |

### Network Simulation
| Tool | Description |
|------|-------------|
| `network_throttle` | Set network throttling |
| `add_mock` | Add API mock rule |
| `remove_mock` | Remove mock rule |
| `clear_mocks` | Clear all mock rules |

### AI & Analysis
| Tool | Description |
|------|-------------|
| `ai_analyze` | AI-powered analysis of collected data |
| `verify_checkpoint` | Verify development checkpoints |
| `zen_mode` | Minimal output mode |

### Lifecycle
| Tool | Description |
|------|-------------|
| `start_openlog` | Start the openLog server |
| `stop_openlog` | Stop the openLog server |
| `ensure_sdk` | Auto-detect and inject SDK into user project |

## Development

```bash
pnpm --filter @openlog/mcp dev    # Watch mode
pnpm --filter @openlog/mcp build  # Build
pnpm --filter @openlog/mcp test   # Run tests
```

## License

MIT © [openLog](https://github.com/uaio/openLog)
