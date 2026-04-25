# @openlogs/server

> Node.js WebSocket + REST API server for openLog — the real-time communication hub between mobile devices, PC panel, and AI tools.

## Installation

```bash
npm install @openlogs/server
```

## Usage

### Programmatic

```typescript
import { createServer } from '@openlogs/server';

const server = createServer({ port: 38291 });
// Server is now running with WebSocket + REST API
```

### Via CLI

```bash
npx @openlogs/cli           # Starts server with auto-detected LAN IPs
npx @openlogs/cli -p 8080   # Custom port
```

## REST API

| Method | Path | Description |
|--------|------|-------------|
| **POST** | `/api/ingest` | External data ingestion |
| GET | `/api/devices` | List connected devices |
| GET | `/api/devices/:id/logs` | Get console logs |
| GET | `/api/devices/:id/network` | Get network requests |
| GET | `/api/devices/:id/storage` | Get storage snapshot |
| GET | `/api/devices/:id/performance` | Get performance data |
| GET | `/api/devices/:id/health` | Health check |
| POST | `/api/devices/:id/execute` | Remote JS execution |
| POST | `/api/devices/:id/screenshot` | Trigger screenshot |
| POST | `/api/devices/:id/network-throttle` | Network throttling |
| POST | `/api/devices/:id/mocks` | Add Mock rule |
| DELETE | `/api/devices/:id/mocks/:mockId` | Delete Mock rule |
| POST | `/api/devices/:id/perf-run/start` | Start benchmark |
| POST | `/api/devices/:id/perf-run/stop` | Stop benchmark |
| GET | `/api/devices/:id/perf-run` | Benchmark history |

## WebSocket Protocol

The server acts as a relay hub between:
- **Mobile SDK** → pushes real-time data (logs, network, storage, etc.)
- **PC Panel** → receives data + sends commands (execute JS, reload, mock)
- **MCP Tools** → queries data + sends commands via AI agents

## Architecture

```
Express HTTP Server
├── REST API routes (/api/*)
├── Static file serving (PC panel)
└── WebSocket Server
    ├── Device connections (SDK)
    ├── Panel connections (Web)
    └── Data stores (in-memory)
        ├── DeviceStore
        ├── LogStore
        ├── NetworkStore
        ├── StorageStore
        ├── PerformanceStore
        └── PerfRunStore
```

## Development

```bash
pnpm --filter @openlogs/server dev    # Watch mode
pnpm --filter @openlogs/server build  # Build
pnpm --filter @openlogs/server test   # Run tests
```

## License

MIT © [openLog](https://github.com/uaio/openLog)
