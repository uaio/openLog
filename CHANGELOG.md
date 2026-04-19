# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-01

### Added

- Initial release of openLog monorepo
- `@openlog/sdk` — Mobile H5 SDK with console, network, storage, DOM, performance, error, and screenshot collectors
- `@openlog/server` — Node.js WebSocket + REST API server
- `@openlog/web` — PC debug panel with 9 tabs (Console, Network, Storage, Element, Performance, Benchmark, Mock, Health, AI Analysis)
- `@openlog/mcp` — MCP Server with 30+ AI-callable tools
- `@openlog/cli` — CLI entry point with `npx @openlog/cli` and `npx @openlog/cli init`
- `@openlog/types` — Shared TypeScript type definitions (Envelope v1 format)
- `POST /api/ingest` — External data ingestion API
- `@openlog[checkpoint]` instrumentation and verification system
- Claude Code slash commands (`/openlog:start`, `/openlog:stop`, `/openlog:logs`, etc.)
- Multi-AI tool support (Claude Code, Cursor, Windsurf)
- Built-in Eruda on-device debug panel
- Real-time WebSocket communication
- Network throttling and API mocking
- Performance benchmarking with composite scoring
- Health check system
