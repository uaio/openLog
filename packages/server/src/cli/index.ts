import { createWebSocketServer } from '../ws/server.js';
import { createRoutes } from '../api/routes.js';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { networkInterfaces } from 'os';

export interface CLIOptions {
  port?: number;
}

export async function start(options: CLIOptions = {}) {
  const port = options.port || 3000;

  const app = express();
  const server = http.createServer(app);

  app.use(cors());

  const { deviceStore, logStore } = createWebSocketServer(server);
  app.use(createRoutes(deviceStore, logStore));
  app.use(express.static('public'));

  server.listen(port, '0.0.0.0', () => {
    const networkInterface = Object.values(networkInterfaces())
      .flat()
      .find(iface => iface?.family === 'IPv4' && !iface.internal);

    const localUrl = `http://localhost:${port}`;
    const networkUrl = networkInterface
      ? `http://${networkInterface.address}:${port}`
      : localUrl;

    console.log(`
AIConsole server running!

  Local:    ${localUrl}
  Network:  ${networkUrl}

  Open ${localUrl} in browser to view devices
    `);
  });

  return server;
}
