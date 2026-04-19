import { startEmbeddedServer, stopEmbeddedServer } from '../launcher.js';
import { wsClient } from '../ws-client.js';
import { API_BASE_URL } from '../config.js';
import { ensureSdk } from './ensure_sdk.js';

export const startOpenlog = {
  name: 'start_openlog',
  description:
    'Start the openLog monitoring server, establish WebSocket connection, and auto-detect whether the user project has the SDK integrated. Returns server addresses and SDK status.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      port: { type: 'number' as const, description: 'Server port (default 38291)' },
      openBrowser: {
        type: 'boolean' as const,
        description: 'Auto-open browser panel (default true)',
      },
      projectDir: {
        type: 'string' as const,
        description: 'User project directory to check for SDK (defaults to cwd)',
      },
    },
    required: [],
  },
  async execute(args: {
    port?: number;
    openBrowser?: boolean;
    projectDir?: string;
  }): Promise<unknown> {
    const { url } = await startEmbeddedServer({
      port: args.port,
      openBrowser: args.openBrowser ?? true,
    });

    wsClient.connect(API_BASE_URL);

    // Auto-detect SDK status in the user's project
    const sdkStatus = await ensureSdk.execute({
      projectDir: args.projectDir,
      mode: 'auto',
    });

    return {
      status: 'started',
      url,
      sdkStatus,
      message: sdkStatus.detected
        ? `openLog server started at ${url}. SDK is already integrated. Use list_devices to check connected devices.`
        : `openLog server started at ${url}. SDK is NOT yet integrated in the project. Follow the instructions in sdkStatus to inject it.`,
    };
  },
};

export const stopOpenlog = {
  name: 'stop_openlog',
  description: '停止 openLog 监控服务并断开 WebSocket 连接。在不再需要监控时调用。',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
  async execute(_args: Record<string, never>): Promise<unknown> {
    wsClient.disconnect();
    await stopEmbeddedServer();

    return {
      status: 'stopped',
      message: 'openLog 服务已关闭，WebSocket 连接已断开。',
    };
  },
};
