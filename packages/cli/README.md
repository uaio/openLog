# @openlogs/cli

> CLI for openLog — start the server, configure AI tools, one-command setup.

## Installation

```bash
# Use directly with npx (zero install)
npx @openlogs/cli

# Or install globally
npm install -g @openlogs/cli
```

## Commands

### Start Server

```bash
openlog              # Start with default port (38291)
openlog -p 8080     # Custom port
openlog --host myapp.example.com  # Public/cloud deployment
```

On startup, the CLI prints:
- All available LAN IP addresses
- SDK snippet ready to copy
- PC panel URL

### Configure AI Tools

```bash
openlog init                # Auto-detect installed AI tools
openlog init --for=claude   # Configure for Claude Code
openlog init --for=cursor   # Configure for Cursor
openlog init --for=windsurf # Configure for Windsurf
```

The `init` command:
1. Detects installed AI tools
2. Writes MCP server configuration
3. For Claude Code: installs slash commands (`/openlog:start`, `/openlog:stop`, etc.)

### MCP Mode (Internal)

```bash
openlog --mcp   # Start in MCP server mode (used by AI tools)
```

## Claude Code Slash Commands

After running `openlog init`, these commands are available in Claude Code:

| Command | Description |
|---------|-------------|
| `/openlog:setup` | One-click zero-to-ready setup |
| `/openlog:start` | Start monitoring + WS connection |
| `/openlog:stop` | Stop monitoring |
| `/openlog:status` | Check device connection status |
| `/openlog:logs` | View logs + checkpoint trace |
| `/openlog:screenshot` | Capture current page |
| `/openlog:clean` | Remove all `@openlog` debug logs |

## Development

```bash
pnpm --filter @openlogs/cli dev    # Watch mode
pnpm --filter @openlogs/cli build  # Build
pnpm --filter @openlogs/cli test   # Run tests
```

## License

MIT © [openLog](https://github.com/uaio/openLog)
