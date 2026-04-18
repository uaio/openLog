// @openlog/cli — CLI entry point
// Actual CLI logic lives in bin/openlog.js
// This module re-exports for programmatic use
export { start } from '@openlog/server/cli';
export { init } from '@openlog/server/cli/init';
