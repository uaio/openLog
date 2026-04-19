# @openlog/types

> Shared TypeScript type definitions for the openLog ecosystem.

## Overview

This package defines the unified **Envelope** data format used across all openLog packages. It is the single source of truth for event types, protocol messages, and constants.

## Installation

```bash
npm install @openlog/types
```

## Usage

```typescript
import type { Envelope, ConsoleEventData, NetworkEventData } from '@openlog/types';
import { EVENT_TYPES, PLATFORMS } from '@openlog/types';
```

## Key Exports

| Export | Description |
|--------|-------------|
| `Envelope` | Base envelope wrapper for all events |
| `DeviceInfo` | Device metadata (deviceId, projectId, ua, screen, etc.) |
| `ConsoleEventData` | Console log event payload |
| `NetworkEventData` | Network request event payload |
| `ErrorEventData` | Error capture event payload |
| `PerformanceEventData` | Performance metrics payload |
| `StorageEventData` | Storage change event payload |
| `EVENT_TYPES` | Enum of all supported event types |
| `PLATFORMS` | Enum of platform identifiers |

## Envelope Format

```typescript
interface Envelope {
  v: string;              // Schema version ("1")
  platform: string;       // "web" | "react-native" | "flutter" | "miniprogram" | "unknown"
  device: DeviceInfo;     // Device metadata
  tabId: string;          // Tab/session identifier
  ts: number;             // Unix timestamp (ms)
  type: string;           // Event type
  data: unknown;          // Event-specific payload
}
```

## License

MIT © [openLog](https://github.com/uaio/openLog)
