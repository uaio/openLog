# Introduction

openLog is a real-time mobile H5 debugging tool that helps developers monitor console logs, network requests, performance metrics, and more — directly from a web dashboard.

## Architecture

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

## Packages

| Package | Description |
|---------|-------------|
| `@openlogs/types` | Shared TypeScript type definitions (single source of truth) |
| `@openlogs/sdk` | Client SDK injected into H5 pages |
| `@openlogs/server` | WebSocket + HTTP server for data collection |
| `@openlogs/web` | PC debug panel (React) served by the server |
| `@openlogs/mcp` | MCP server for AI-powered debugging |
| `@openlogs/cli` | CLI tool to start the server (`npx @openlogs/cli`) and configure AI tools |
| `@openlogs/eruda` | Bundled Eruda build used internally by the SDK (private) |
| `@openlogs/demo` | Demo & test pages for development |

## Features

- **Console Capture** — log, warn, error, info, debug, trace with stack traces
- **Network Monitoring** — Fetch and XHR interception with full request/response details
- **Performance** — Web Vitals, FPS, memory, long tasks, resource timing
- **Storage Inspection** — localStorage and sessionStorage snapshots
- **DOM Snapshots** — Live DOM tree inspection
- **Screenshots** — html2canvas-based page captures
- **API Mocking** — Client-side request mocking with throttling
- **Health Checks** — Automated scoring and diagnostics
- **Multi-device** — Support multiple connected devices simultaneously
- **Multi-tab** — Filter data by browser tab
- **Persistence** — Optional SQLite storage with configurable retention
- **i18n** — English and Chinese UI
