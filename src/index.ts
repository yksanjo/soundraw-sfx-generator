import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { generateSfx } from './tools/generate-sfx.js';
import { GenerateSfxInput } from './types/index.js';
import { logger } from './utils/logger.js';

const server = new Server(
  {
    name: 'soundraw-sfx-generator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_sfx',
        description: 'Generate game sound effects based on description. Uses DeepSeek for parameter mapping and Soundraw for audio generation. Returns audio URL, share link, and optional game engine integration code.',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Description of the sound effect (e.g., "sword swing whoosh", "ui button click")',
            },
            category: {
              type: 'string',
              enum: ['combat', 'ui', 'ambient', 'nature', 'mechanical', 'magical', 'footsteps', 'impacts', 'vehicles', 'weather'],
              description: 'SFX category for better parameter mapping',
            },
            duration_seconds: {
              type: 'number',
              minimum: 1,
              maximum: 30,
              description: 'Duration in seconds (1-30, default: 5)',
            },
            intensity: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Intensity level',
            },
            engine: {
              type: 'string',
              enum: ['unreal', 'unity', 'godot'],
              description: 'Game engine for integration code snippets',
            },
            file_format: {
              type: 'string',
              enum: ['m4a', 'mp3', 'wav'],
              description: 'Audio file format (default: m4a)',
            },
          },
          required: ['description'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'generate_sfx') {
      const result = await generateSfx(args as GenerateSfxInput);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    logger.error('Tool execution failed', { tool: name, error });
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Soundraw SFX Generator MCP Server started');
}

main().catch((error) => {
  logger.error('Server failed to start', { error });
  process.exit(1);
});
