/**
 * Custom Next.js Server with WebSocket Support
 *
 * This file provides WebSocket support for Next.js applications.
 * Use this when running Next.js on a self-hosted Node.js server.
 *
 * Setup:
 * 1. Copy this file to the project root (or a custom location)
 * 2. Update package.json scripts:
 *    "dev": "node server.js",
 *    "start": "NODE_ENV=production node server.js"
 * 3. Run: npm run dev
 *
 * For production with pm2:
 *    pm2 start server.js --name "log-dashboard"
 *
 * For Docker:
 *    CMD ["node", "server.js"]
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: WebSocketServer } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Prepare Next.js
app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    try {
      // Parse URL
      const parsedUrl = parse(req.url, true);
      
      // Handle request with Next.js
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Attach WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  // Initialize WebSocket service
  const { getWSService } = require('./src/server/services/wsService');
  const wsService = getWSService();
  wsService.initialize(wss);

  // Handle WebSocket upgrade requests
  server.on('upgrade', (req, socket, head) => {
    // Only upgrade if the path is /api/ws
    if (req.url === '/api/ws') {
      try {
        console.log('[WebSocket] Handling upgrade request from', req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        
        wss.handleUpgrade(req, socket, head, (ws) => {
          // This emits the 'connection' event on the WebSocket server
          wss.emit('connection', ws, req);
        });
      } catch (error) {
        console.error('[WebSocket] Error handling upgrade:', error);
        socket.destroy();
      }
    } else {
      // Not a WebSocket request we care about
      console.log('[WebSocket] Ignoring upgrade request to', req.url);
      socket.destroy();
    }
  });

  // Handle server shutdown gracefully
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    
    // Close WebSocket connections
    wsService.shutdown();
    
    // Close server
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  });

  // Start server
  server.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   SOVD Log Dashboard Server Started        ║
║━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║   URL: http://${hostname}:${port}                    ║
║   WebSocket: ws://${hostname}:${port}/api/ws        ║
║   Environment: ${dev ? 'DEVELOPMENT' : 'PRODUCTION'}              ║
║   Mode: Self-hosted (Full WebSocket)       ║
╚════════════════════════════════════════════╝
    `);
  });
});

module.exports = { wss };
