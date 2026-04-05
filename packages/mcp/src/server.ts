import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { listDevices, getConsoleLogs, getNetworkRequests, watchLogs, getStorage, getPageContext, executeJs, takeScreenshot, reloadPage, setStorage, clearStorage, highlightElement, zenMode, networkThrottle, addMock, removeMock, clearMocks, healthCheck, aiAnalyze, startPerfRun, stopPerfRun, getPerfReport } from './tools/index.js';
import { startEmbeddedServer, stopEmbeddedServer, type EmbeddedServerConfig } from './launcher.js';

interface ToolArgs {
  [key: string]: unknown;
}

interface GetConsoleLogsArgs {
  deviceId: string;
  limit?: number;
  level?: 'log' | 'warn' | 'error' | 'info';
}

let isShuttingDown = false;

async function gracefulShutdown(server: Server, signal: string): Promise<void> {
  if (isShuttingDown) {
    console.error(`[${signal}] Already shutting down, forcing exit`);
    process.exit(1);
  }

  isShuttingDown = true;
  console.error(`[${signal}] Starting graceful shutdown...`);

  try {
    await server.close();
    console.error('[shutdown] MCP Server closed');

    // 停止内嵌服务器
    await stopEmbeddedServer();

    console.error('[shutdown] Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('[shutdown] Error during shutdown:', error);
    process.exit(1);
  }
}

function setupGlobalErrorHandlers(server: Server): void {
  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error('[uncaughtException]', error);
    gracefulShutdown(server, 'uncaughtException').catch(() => {
      process.exit(1);
    });
  });

  // 处理未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[unhandledRejection]', 'Unhandled Promise Rejection at:', promise, 'reason:', reason);
    gracefulShutdown(server, 'unhandledRejection').catch(() => {
      process.exit(1);
    });
  });

  // 处理 SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.error('[SIGINT] Received interrupt signal');
    gracefulShutdown(server, 'SIGINT').catch(() => {
      process.exit(1);
    });
  });

  // 处理 SIGTERM
  process.on('SIGTERM', () => {
    console.error('[SIGTERM] Received termination signal');
    gracefulShutdown(server, 'SIGTERM').catch(() => {
      process.exit(1);
    });
  });
}

export async function startMCPServer(config?: EmbeddedServerConfig): Promise<void> {
  // 启动内嵌服务器
  console.error('[openLog] Starting embedded server...');
  const { url } = await startEmbeddedServer(config);
  console.error(`[openLog] Embedded server running at ${url}`);

  const server = new Server(
    {
      name: 'openlog-mcp',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // 设置全局错误处理器
  setupGlobalErrorHandlers(server);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: listDevices.name,
          description: listDevices.description,
          inputSchema: listDevices.inputSchema
        },
        {
          name: getConsoleLogs.name,
          description: getConsoleLogs.description,
          inputSchema: getConsoleLogs.inputSchema
        },
        {
          name: getNetworkRequests.name,
          description: getNetworkRequests.description,
          inputSchema: getNetworkRequests.inputSchema
        },
        {
          name: watchLogs.name,
          description: watchLogs.description,
          inputSchema: watchLogs.inputSchema
        },
        {
          name: getStorage.name,
          description: getStorage.description,
          inputSchema: getStorage.inputSchema
        },
        {
          name: getPageContext.name,
          description: getPageContext.description,
          inputSchema: getPageContext.inputSchema
        },
        {
          name: executeJs.name,
          description: executeJs.description,
          inputSchema: executeJs.inputSchema
        },
        {
          name: takeScreenshot.name,
          description: takeScreenshot.description,
          inputSchema: takeScreenshot.inputSchema
        },
        {
          name: reloadPage.name,
          description: reloadPage.description,
          inputSchema: reloadPage.inputSchema
        },
        {
          name: setStorage.name,
          description: setStorage.description,
          inputSchema: setStorage.inputSchema
        },
        {
          name: clearStorage.name,
          description: clearStorage.description,
          inputSchema: clearStorage.inputSchema
        },
        {
          name: highlightElement.name,
          description: highlightElement.description,
          inputSchema: highlightElement.inputSchema
        },
        {
          name: zenMode.name,
          description: zenMode.description,
          inputSchema: zenMode.inputSchema
        },
        {
          name: networkThrottle.name,
          description: networkThrottle.description,
          inputSchema: networkThrottle.inputSchema
        },
        {
          name: addMock.name,
          description: addMock.description,
          inputSchema: addMock.inputSchema
        },
        {
          name: clearMocks.name,
          description: clearMocks.description,
          inputSchema: clearMocks.inputSchema
        },
        {
          name: removeMock.name,
          description: removeMock.description,
          inputSchema: removeMock.inputSchema
        },
        {
          name: startPerfRun.name,
          description: startPerfRun.description,
          inputSchema: startPerfRun.inputSchema
        },
        {
          name: stopPerfRun.name,
          description: stopPerfRun.description,
          inputSchema: stopPerfRun.inputSchema
        },
        {
          name: getPerfReport.name,
          description: getPerfReport.description,
          inputSchema: getPerfReport.inputSchema
        },
        {
          name: healthCheck.name,
          description: healthCheck.description,
          inputSchema: healthCheck.inputSchema
        },
        {
          name: aiAnalyze.name,
          description: aiAnalyze.description,
          inputSchema: aiAnalyze.inputSchema
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'list_devices':
          return { content: [{ type: 'text', text: JSON.stringify(await listDevices.execute(args || {}), null, 2) }] };

        case 'get_console_logs': {
          if (!args) {
            throw new Error('get_console_logs requires arguments');
          }
          // 验证必需参数
          if (!args.deviceId || typeof args.deviceId !== 'string') {
            throw new Error('get_console_logs requires a valid deviceId');
          }
          // 类型安全的参数构建
          const logsArgs: GetConsoleLogsArgs = {
            deviceId: args.deviceId,
            limit: typeof args.limit === 'number' ? args.limit : undefined,
            level: typeof args.level === 'string' && ['log', 'warn', 'error', 'info'].includes(args.level)
              ? args.level as 'log' | 'warn' | 'error' | 'info'
              : undefined
          };
          return { content: [{ type: 'text', text: JSON.stringify(await getConsoleLogs.execute(logsArgs), null, 2) }] };
        }

        case 'get_network_requests': {
          const networkArgs = {
            deviceId: typeof args?.deviceId === 'string' ? args.deviceId : undefined,
            limit: typeof args?.limit === 'number' ? args.limit : undefined,
            method: typeof args?.method === 'string' ? args.method : undefined,
            urlPattern: typeof args?.urlPattern === 'string' ? args.urlPattern : undefined,
            status: typeof args?.status === 'number' ? args.status : undefined
          };
          return { content: [{ type: 'text', text: JSON.stringify(await getNetworkRequests.execute(networkArgs), null, 2) }] };
        }

        case 'watch_logs': {
          // 解析 levels 数组
          let levels: ('log' | 'warn' | 'error' | 'info')[] | undefined;
          if (Array.isArray(args?.levels)) {
            const validLevels = ['log', 'warn', 'error', 'info'];
            levels = args.levels.filter((l: unknown): l is 'log' | 'warn' | 'error' | 'info' =>
              typeof l === 'string' && validLevels.includes(l)
            );
            if (levels.length === 0) levels = undefined;
          }

          const watchArgs = {
            deviceId: typeof args?.deviceId === 'string' ? args.deviceId : undefined,
            levels,
            since: typeof args?.since === 'number' ? args.since : undefined,
            limit: typeof args?.limit === 'number' ? args.limit : undefined
          };
          return { content: [{ type: 'text', text: JSON.stringify(await watchLogs.execute(watchArgs), null, 2) }] };
        }

        case 'get_storage': {
          const storageArgs = {
            deviceId: typeof args?.deviceId === 'string' ? args.deviceId : undefined,
            type: typeof args?.type === 'string' ? args.type as 'all' | 'localStorage' | 'sessionStorage' | 'cookies' : undefined
          };
          return { content: [{ type: 'text', text: JSON.stringify(await getStorage.execute(storageArgs), null, 2) }] };
        }

        case 'get_page_context': {
          const ctxArgs = {
            deviceId: typeof args?.deviceId === 'string' ? args.deviceId : undefined,
            logLimit: typeof args?.logLimit === 'number' ? args.logLimit : undefined,
            requestLimit: typeof args?.requestLimit === 'number' ? args.requestLimit : undefined,
            includeStorage: typeof args?.includeStorage === 'boolean' ? args.includeStorage : undefined
          };
          return { content: [{ type: 'text', text: JSON.stringify(await getPageContext.execute(ctxArgs), null, 2) }] };
        }

        case 'execute_js': {
          const jsArgs = args as { code: string; deviceId?: string };
          if (!jsArgs?.code) throw new Error('execute_js requires code argument');
          const result = await executeJs.execute(jsArgs);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'take_screenshot': {
          const ssArgs = args as { deviceId?: string };
          const ssResult = await takeScreenshot.execute(ssArgs);
          return { content: [{ type: 'text', text: JSON.stringify({ ...ssResult, dataUrl: ssResult.dataUrl.slice(0, 80) + '...' }, null, 2) }] };
        }

        case 'reload_page': {
          const r = await reloadPage.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'set_storage': {
          const sa = args as { key: string; value?: string; storageType?: string; deviceId?: string };
          if (!sa?.key) throw new Error('set_storage requires key argument');
          const r = await setStorage.execute(sa);
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'clear_storage': {
          const r = await clearStorage.execute(args as { storageType?: string; deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'highlight_element': {
          const ha = args as { selector: string; duration?: number; deviceId?: string };
          if (!ha?.selector) throw new Error('highlight_element requires selector argument');
          const r = await highlightElement.execute(ha);
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'zen_mode': {
          const za = args as { enabled: boolean; deviceId?: string };
          if (typeof za?.enabled !== 'boolean') throw new Error('zen_mode requires enabled (boolean)');
          const r = await zenMode.execute(za);
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'network_throttle': {
          const r = await networkThrottle.execute(args as { preset: string; deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'add_mock': {
          const r = await addMock.execute(args as { pattern: string; body: string; method?: string; status?: number; deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'clear_mocks': {
          const r = await clearMocks.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'remove_mock': {
          const r = await removeMock.execute(args as { mockId: string; deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'start_perf_run': {
          const r = await startPerfRun.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'stop_perf_run': {
          const r = await stopPerfRun.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'get_perf_report': {
          const r = await getPerfReport.execute(args as { deviceId?: string; sessionId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'health_check': {
          const r = await healthCheck.execute(args as { deviceId?: string });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        case 'ai_analyze': {
          const r = await aiAnalyze.execute(args as { deviceId?: string; logLimit?: number });
          return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      // 工具执行错误处理
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Tool Error] ${name}:`, errorMessage);
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: errorMessage, tool: name }, null, 2) }],
        isError: true
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('openLog MCP Server running on stdio');
}
