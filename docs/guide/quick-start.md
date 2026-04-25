# Quick Start

## Install and Run

The fastest way to start openLog:

```bash
npx @openlogs/cli
```

This starts the server on port 38291 and opens the web dashboard.

## Integrate SDK

Add the SDK to your H5 page:

### Via CDN (IIFE)

```html
<script src="https://unpkg.com/@openlogs/sdk/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({
    server: 'ws://localhost:38291',
    projectId: 'my-app',
  });
</script>
```

### Via npm

```bash
npm install @openlogs/sdk
```

```typescript
import OpenLog from '@openlogs/sdk';

new OpenLog({
  server: 'ws://localhost:38291',
  projectId: 'my-app',
});
```

## CLI Options

```bash
npx @openlogs/cli [options]

Options:
  -p, --port <number>       Server port (default: 38291)
  --no-open                 Don't auto-open browser
  --persist                 Enable SQLite persistence
  --db-path <path>          Database file path (default: ~/.openlog/data.db)
  --retention-days <days>   Data retention in days (default: 1)
  --api-key <key>           Require API key for access
  --cors-origin <origin>    Allowed CORS origins (comma-separated)
```

## Verify Connection

Once the SDK is initialized and the server is running:

1. Open the web dashboard (auto-opened or visit `http://localhost:38291`)
2. Your device should appear in the device list on the left
3. Console logs, network requests, and performance data will stream in real-time
