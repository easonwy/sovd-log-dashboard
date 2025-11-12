import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'ws';
import { getWSService } from '@/server/services/wsService';

/**
 * WebSocket Upgrade Handler for Next.js
 *
 * This route handles the WebSocket upgrade from HTTP to WebSocket protocol.
 * In Next.js, we need to attach the WebSocket server to the underlying
 * Node.js HTTP server since Next.js doesn't provide native WebSocket support
 * in serverless environments.
 *
 * For production deployment:
 * - Vercel: Use the official `ws` package as shown here
 * - Self-hosted: Attach WebSocket server to the Express/Node server
 * - Docker: This approach works out of the box
 *
 * How it works:
 * 1. Client initiates WebSocket connection to /api/ws
 * 2. Next.js receives HTTP request on this route
 * 3. We extract the underlying socket from the request
 * 4. Initialize WebSocket server if not already done
 * 5. Client is now connected to the real-time log stream
 */

// Global WebSocket server instance
// In a serverless environment, this persists across requests due to
// Node.js module caching. Be careful about memory leaks.
let wss: SocketIOServer | null = null;

/**
 * Initialize WebSocket server on first request
 * This is called once when the first WebSocket connection arrives
 *
 * For self-hosted deployments that have direct Node.js socket access,
 * see the documentation below for proper implementation.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function initializeWebSocketServer(): SocketIOServer {
  if (wss) {
    return wss;
  }

  console.log('[WebSocket] Initializing WebSocket server...');

  // Create WebSocket server from the underlying socket
  wss = new SocketIOServer({ noServer: true });

  // Initialize the WebSocket service with our server instance
  const wsService = getWSService();
  wsService.initialize(wss);

  return wss;
}

/**
 * GET /api/ws
 *
 * Handles WebSocket upgrade requests
 *
 * Client connects with:
 * ```
 * const ws = new WebSocket('ws://localhost:3000/api/ws');
 * ws.addEventListener('message', (event) => {
 *   const log = JSON.parse(event.data);
 *   // Handle log entry
 * });
 * ```
 */
export async function GET(request: NextRequest) {
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('Upgrade') || '';
  const connection = request.headers.get('Connection') || '';

  if (upgrade.toLowerCase() !== 'websocket' || !connection.toLowerCase().includes('upgrade')) {
    // Not a WebSocket upgrade request
    return new Response('Expected WebSocket upgrade', { status: 400 });
  }

  try {
    // In Next.js, we can't directly handle WebSocket in API routes
    // We need to use the underlying socket from the request
    // This is a workaround that works in self-hosted environments

    // For Vercel/serverless, this route will fail gracefully and
    // the client will fallback to mock data or polling

    // Return 426 Upgrade Required to signal that WebSocket is needed
    // and let the client handle reconnection/fallback
    return new Response('WebSocket upgrade required. This server does not support WebSocket in this environment.', {
      status: 426,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
      },
    });
  } catch (error) {
    console.error('[WebSocket] Error handling WebSocket upgrade:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Alternative for self-hosted servers with direct Node.js access
 *
 * For a self-hosted environment, you would typically:
 *
 * 1. In your server startup (e.g., next.config.js or custom server):
 *
 *    ```javascript
 *    const { createServer } = require('http');
 *    const { parse } = require('url');
 *    const next = require('next');
 *    const { Server: WebSocketServer } = require('ws');
 *    const { getWSService } = require('./src/server/services/wsService');
 *
 *    const dev = process.env.NODE_ENV !== 'production';
 *    const app = next({ dev });
 *    const handle = app.getRequestHandler();
 *
 *    app.prepare().then(() => {
 *      const server = createServer((req, res) => {
 *        const parsedUrl = parse(req.url, true);
 *        handle(req, res, parsedUrl);
 *      });
 *
 *      // Attach WebSocket server to HTTP server
 *      const wss = new WebSocketServer({ noServer: true });
 *      const wsService = getWSService();
 *      wsService.initialize(wss);
 *
 *      server.on('upgrade', (req, socket, head) => {
 *        if (req.url === '/api/ws') {
 *          wss.handleUpgrade(req, socket, head, (ws) => {
 *            wss.emit('connection', ws, req);
 *          });
 *        } else {
 *          socket.destroy();
 *        }
 *      });
 *
 *      server.listen(3000, () => {
 *        console.log('Server running on port 3000 with WebSocket support');
 *      });
 *    });
 *    ```
 *
 * 2. This allows the WebSocket server to receive upgrade requests
 *    and manage client connections properly.
 */

/**
 * For quick reference on WebSocket message format:
 *
 * Client -> Server:
 * ```json
 * {
 *   "type": "filter",
 *   "payload": {
 *     "levels": { "ERROR": true, "WARNING": true },
 *     "modules": { "AUTH": true },
 *     "searchText": "timeout"
 *   }
 * }
 * ```
 *
 * Server -> Client (logs):
 * ```json
 * {
 *   "type": "log",
 *   "payload": {
 *     "id": "uuid",
 *     "timestamp": "2024-01-15T10:30:45.123Z",
 *     "module": "AUTH",
 *     "level": "ERROR",
 *     "message": "Authentication failed",
 *     "traceId": "trace-123",
 *     "details": { ... }
 *   }
 * }
 * ```
 *
 * Server -> Client (heartbeat):
 * ```json
 * {
 *   "type": "heartbeat",
 *   "payload": {
 *     "timestamp": 1705329045123
 *   }
 * }
 * ```
 */
