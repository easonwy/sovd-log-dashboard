/**
 * Custom Next.js Server (SSE-based streaming)
 *
 * This server runs the Next.js app and starts the LogStreamMonitor.
 * WebSocket logic has been removed in favor of Server-Sent Events (SSE).
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

function makeBanner(title, lines) {
  const width = Math.max(title.length, ...lines.map((l) => l.length));
  const top = `╔${'═'.repeat(width + 2)}╗`;
  const bottom = `╚${'═'.repeat(width + 2)}╝`;
  const content = [`║ ${title.padEnd(width, ' ')} ║`, ...lines.map((l) => `║ ${l.padEnd(width, ' ')} ║`)].join('\n');
  return `${top}\n${content}\n${bottom}`;
}

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Prepare Next.js
app.prepare().then(() => {
  // In development, register ts-node so we can require TypeScript sources
  if (dev) {
    try {
      require('ts-node').register({
        project: './tsconfig.json',
        transpileOnly: true,
        compilerOptions: { module: 'CommonJS', moduleResolution: 'node' }
      });
      console.log('[Dev] ts-node registered for TypeScript requires');
    } catch (e) {
      console.warn('[Dev] ts-node not available; will require built JS only');
    }

    // Try to register tsconfig-paths so tsconfig "paths" aliases work in dev
    try {
      // This auto-loads paths and baseUrl from tsconfig.json
      require('tsconfig-paths/register');
      console.log('[Dev] tsconfig-paths registered for alias resolution');
    } catch (e) {
      console.warn('[Dev] tsconfig-paths not available; path aliases may not resolve');
    }
  }

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

  // Start log stream monitor to broadcast new database entries
  let logStreamMonitor = null;
  try {
    // Try to load from .next build output first
    try {
      const { getLogStreamMonitor } = require('./.next/server/src/server/services/logStreamMonitor.js');
      logStreamMonitor = getLogStreamMonitor();
      console.log('[LogStreamMonitor] Loaded from build output');
    } catch (buildError) {
      // Fall back to source TypeScript
      if (dev) {
        const { getLogStreamMonitor } = require('./src/server/services/logStreamMonitor.ts');
        logStreamMonitor = getLogStreamMonitor();
        console.log('[LogStreamMonitor] Loaded from TypeScript source');
      } else {
        throw buildError;
      }
    }
    
    // Start monitor with a slight delay to ensure server is fully ready
    setTimeout(() => {
      if (logStreamMonitor) {
        logStreamMonitor.start();
        console.log('[LogStreamMonitor] Started after server initialization');
      }
    }, 1000);
  } catch (error) {
    console.warn('[LogStreamMonitor] Could not load monitor:', error.message);
  }


  // Handle server shutdown gracefully
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    
    // Stop log stream monitor
    if (logStreamMonitor) {
      logStreamMonitor.stop();
    }
    
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
    const banner = makeBanner('SOVD Log Dashboard Server Started', [
      `URL: http://${hostname}:${port}`,
      `Environment: ${dev ? 'DEVELOPMENT' : 'PRODUCTION'}`,
      'Streaming: SSE via /api/sse',
    ]);
    console.log(banner);
  });
});
