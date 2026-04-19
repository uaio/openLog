# @openlog/web

> PC debug panel for openLog — React-based real-time monitoring dashboard.

This package provides the web-based debugging panel that displays real-time data from connected mobile devices.

## Features

### 9 Debug Tabs

| Tab | Description |
|-----|-------------|
| 📝 Console | Real-time log stream + remote JS execution + log export |
| 🌐 Network | Request waterfall with filtering |
| 💾 Storage | localStorage / sessionStorage / Cookie viewing & editing |
| 🌲 Element | DOM tree structure viewer |
| 📊 Performance | FPS chart + Web Vitals + Long Tasks + Resource timeline |
| 🏁 Benchmark | Performance scoring report (score + grade + recommendations) |
| 🎭 Mock | API Mock rule management |
| 🩺 Health | Page health check (composite score) |
| 🤖 AI Analysis | Aggregate data analysis & optimization suggestions |

## Architecture

```
src/
├── App.tsx              # Main app with tab routing
├── main.tsx             # Entry point
├── api/client.ts        # REST API client
├── components/          # Panel components (one per tab)
├── hooks/               # React hooks (WebSocket, devices, logs, etc.)
├── lib/                 # WebSocket manager
└── types/               # Local type definitions
```

## Development

```bash
# From monorepo root
pnpm --filter @openlog/web dev      # Vite dev server
pnpm --filter @openlog/web build    # Production build
pnpm --filter @openlog/web preview  # Preview production build
```

> **Note:** This package is not published to npm. The CLI (`@openlog/cli`) bundles the built output into its `public/` directory for distribution.

## Tech Stack

- React 18
- Vite
- Recharts (for performance charts)
- @tanstack/react-virtual (for virtualized log lists)

## License

MIT © [openLog](https://github.com/uaio/openLog)
