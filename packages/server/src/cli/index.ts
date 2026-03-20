import { createWebSocketServer } from '../ws/server.js';
import { createRoutes } from '../api/routes.js';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { networkInterfaces } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

  // 获取当前文件的目录路径
  const currentFilename = fileURLToPath(import.meta.url);
  const currentDirname = dirname(currentFilename);

  // 提供静态文件：指向 web 包的 dist 目录
  // 从 packages/server/dist/cli/ 向上三级到 packages/，然后进入 web/dist
  const webDistPath = join(currentDirname, '../../../web/dist');
  app.use(express.static(webDistPath));

  // 全局异常处理
  const handleError = (error: Error, context: string) => {
    console.error(`[${context}]`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  };

  process.on('uncaughtException', (error) => {
    handleError(error, 'uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    handleError(
      reason instanceof Error ? reason : new Error(String(reason)),
      'unhandledRejection'
    );
  });

  // 进程信号处理
  const shutdown = async (signal: string) => {
    console.log(`\n收到 ${signal} 信号，正在关闭服务器...`);

    try {
      // 关闭 HTTP 服务器
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log('服务器已关闭');
      process.exit(0);
    } catch (error) {
      console.error('关闭服务器时出错:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // 启动服务器，添加错误处理
  await new Promise<void>((resolve, reject) => {
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`端口 ${port} 已被占用，请使用其他端口或关闭占用该端口的程序`));
      } else {
        reject(new Error(`服务器启动失败: ${error.message}`));
      }
    });

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

  按 Ctrl+C 停止服务器
      `);

      resolve();
    });
  });

  return server;
}
