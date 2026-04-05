import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** openLog 内嵌服务器配置 */
export interface EmbeddedServerConfig {
  /** 服务器端口，默认 38291 */
  port?: number;
  /** 是否自动打开浏览器，默认 true */
  openBrowser?: boolean;
  /** 是否启动服务器，默认 true */
  startServer?: boolean;
}

let serverProcess: ChildProcess | null = null;
let isShuttingDown = false;

/**
 * 启动内嵌的 openLog Server
 */
export async function startEmbeddedServer(config: EmbeddedServerConfig = {}): Promise<{ port: number; url: string }> {
  const port = config.port || parseInt(process.env.OPENLOG_PORT || '38291', 10);
  const shouldStartServer = config.startServer !== false;
  const shouldOpenBrowser = config.openBrowser !== false;

  // 检查服务器是否已经在运行
  const isRunning = await checkServerRunning(port);
  if (isRunning) {
    console.error(`[openLog] Server already running at http://localhost:${port}`);
    return { port, url: `http://localhost:${port}` };
  }

  if (!shouldStartServer) {
    throw new Error(`openLog Server is not running at http://localhost:${port}. Please start it manually with 'npx openlog'`);
  }

  // 启动服务器进程
  const serverPath = join(__dirname, '../../server/dist/cli/index.js');

  console.error(`[openLog] Starting embedded server on port ${port}...`);

  serverProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      PORT: String(port),
      OPENLOG_EMBEDDED: 'true'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // 转发服务器输出到 stderr
  serverProcess.stdout?.on('data', (data) => {
    console.error(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.on('error', (error) => {
    console.error('[openLog] Failed to start server:', error.message);
  });

  serverProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      console.error(`[openLog] Server exited with code ${code}`);
    }
  });

  // 等待服务器就绪
  await waitForServer(port, 10000);

  const url = `http://localhost:${port}`;
  console.error(`[openLog] Server started at ${url}`);

  // 自动打开浏览器
  if (shouldOpenBrowser) {
    console.error(`[openLog] Opening browser...`);
    try {
      await open(url);
    } catch (error) {
      console.error(`[openLog] Failed to open browser: ${(error as Error).message}`);
    }
  }

  return { port, url };
}

/**
 * 停止内嵌服务器
 */
export async function stopEmbeddedServer(): Promise<void> {
  if (serverProcess && !isShuttingDown) {
    isShuttingDown = true;
    console.error('[openLog] Stopping embedded server...');

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.error('[openLog] Force killing server...');
        serverProcess?.kill('SIGKILL');
        resolve();
      }, 5000);

      serverProcess?.on('exit', () => {
        clearTimeout(timeout);
        console.error('[openLog] Server stopped');
        resolve();
      });

      serverProcess?.kill('SIGTERM');
    });
  }
}

/**
 * 检查服务器是否在运行
 */
async function checkServerRunning(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/api/devices`, {
      method: 'HEAD'
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 等待服务器就绪
 */
async function waitForServer(port: number, timeout: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await checkServerRunning(port)) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  throw new Error(`Server did not start within ${timeout}ms`);
}

/**
 * 设置进程退出时的清理
 */
export function setupExitHandlers(): void {
  const cleanup = async () => {
    await stopEmbeddedServer();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
