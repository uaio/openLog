import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { listDevices, getConsoleLogs } from './tools/index.js';

export async function startMCPServer() {
  const server = new Server(
    {
      name: 'aiconsole-mcp',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

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
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'list_devices':
        return { content: [{ type: 'text', text: JSON.stringify(await listDevices.execute(args || {}), null, 2) }] };

      case 'get_console_logs':
        if (!args) {
          throw new Error('get_console_logs requires arguments');
        }
        return { content: [{ type: 'text', text: JSON.stringify(await getConsoleLogs.execute(args as any), null, 2) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('AIConsole MCP Server running on stdio');
}
