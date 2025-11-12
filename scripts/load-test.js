#!/usr/bin/env node

/**
 * Load Testing Script for SOVD Log Dashboard
 * Tests WebSocket connections, broadcasting, and filtering performance
 * 
 * Usage:
 *   npm run load-test
 *   npm run load-test -- --clients 500 --duration 60
 */

const WebSocket = require('ws')
const http = require('http')

// Configuration
const config = {
  serverUrl: process.env.SERVER_URL || 'ws://localhost:3000/api/ws',
  restUrl: process.env.REST_URL || 'http://localhost:3000',
  clients: parseInt(process.env.CLIENTS || '100'),
  duration: parseInt(process.env.DURATION || '30'), // seconds
  logInterval: parseInt(process.env.LOG_INTERVAL || '100'), // ms between log inserts
  rampUp: parseInt(process.env.RAMP_UP || '5'), // seconds to ramp up clients
}

// Parse command line arguments
process.argv.slice(2).forEach((arg) => {
  if (arg.startsWith('--clients=')) {
    config.clients = parseInt(arg.split('=')[1])
  } else if (arg.startsWith('--duration=')) {
    config.duration = parseInt(arg.split('=')[1])
  } else if (arg.startsWith('--log-interval=')) {
    config.logInterval = parseInt(arg.split('=')[1])
  }
})

// Statistics
const stats = {
  totalConnections: 0,
  successfulConnections: 0,
  failedConnections: 0,
  totalMessages: 0,
  messagesPerSecond: 0,
  startTime: Date.now(),
  clientsConnected: 0,
  errors: [],
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logError(message) {
  log(`❌ ${message}`, 'red')
  stats.errors.push(message)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan')
}

async function getRestHealth() {
  return new Promise((resolve) => {
    const url = new URL(`${config.restUrl}/api/health`)
    http
      .get(url, { timeout: 5000 }, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json)
          } catch {
            resolve(null)
          }
        })
      })
      .on('error', () => {
        resolve(null)
      })
  })
}

function createWebSocketClient(clientId) {
  return new Promise((resolve) => {
    const filters = {
      levels: { ERROR: true, WARNING: true, INFO: false, DEBUG: false },
      modules: {
        AUTH: Math.random() > 0.5,
        ORDER: Math.random() > 0.5,
        PAYMENT: Math.random() > 0.5,
        NOTIFICATION: Math.random() > 0.5,
      },
      searchText: '',
    }

    const client = {
      id: clientId,
      ws: null,
      filters: filters,
      connected: false,
      messagesReceived: 0,
      lastMessageTime: Date.now(),
    }

    try {
      const ws = new WebSocket(config.serverUrl)

      ws.on('open', () => {
        stats.successfulConnections++
        stats.clientsConnected++
        client.connected = true
        client.ws = ws

        // Send initial filter
        ws.send(
          JSON.stringify({
            type: 'filter',
            payload: filters,
          })
        )

        resolve(client)
      })

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data)
          if (message.type === 'log') {
            stats.totalMessages++
            client.messagesReceived++
            client.lastMessageTime = Date.now()
          }
        } catch (error) {
          // Ignore parse errors
        }
      })

      ws.on('error', (error) => {
        if (!client.connected) {
          stats.failedConnections++
          logError(
            `Client ${clientId} connection failed: ${error.message}`
          )
          resolve(client)
        }
      })

      ws.on('close', () => {
        if (client.connected) {
          stats.clientsConnected--
        }
      })

      // Timeout if connection doesn't open
      setTimeout(() => {
        if (!client.connected) {
          stats.failedConnections++
          try {
            ws.close()
          } catch {}
          resolve(client)
        }
      }, 5000)
    } catch (error) {
      stats.failedConnections++
      logError(`Client ${clientId} creation failed: ${error.message}`)
      resolve(client)
    }
  })
}

async function connectClients() {
  log(`\n📡 Connecting ${config.clients} clients...`, 'bright')

  const clientsPerSecond = config.clients / config.rampUp
  const delay = 1000 / clientsPerSecond

  const clients = []

  for (let i = 0; i < config.clients; i++) {
    const client = await createWebSocketClient(i)
    if (client) {
      clients.push(client)
    }

    if ((i + 1) % 10 === 0) {
      process.stdout.write(
        `\r  Connected: ${i + 1}/${config.clients} (${stats.successfulConnections} success, ${stats.failedConnections} failed)`
      )
    }

    // Ramp up connections gradually
    if (i < config.clients - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  console.log(`\n✅ Connection phase complete`)
  return clients
}

function printStatistics(clients) {
  log('\n📊 Load Test Results', 'bright')
  log('═'.repeat(60), 'bright')

  const elapsed = (Date.now() - stats.startTime) / 1000
  const throughput = stats.totalMessages / elapsed

  log(`Duration: ${elapsed.toFixed(2)}s`, 'cyan')
  log(`Clients Connected: ${stats.clientsConnected}/${config.clients}`, 'cyan')
  log(`Connection Success Rate: ${((stats.successfulConnections / (stats.successfulConnections + stats.failedConnections)) * 100).toFixed(2)}%`, 'cyan')
  log(`Total Messages Received: ${stats.totalMessages}`, 'cyan')
  log(`Throughput: ${throughput.toFixed(2)} msg/sec`, 'cyan')

  if (clients && clients.length > 0) {
    const connectedClients = clients.filter((c) => c.connected)
    const avgMessagesPerClient =
      stats.totalMessages / Math.max(connectedClients.length, 1)
    const minMessages = Math.min(...connectedClients.map((c) => c.messagesReceived))
    const maxMessages = Math.max(...connectedClients.map((c) => c.messagesReceived))

    log(`Average Messages per Client: ${avgMessagesPerClient.toFixed(2)}`, 'cyan')
    log(`Min Messages: ${minMessages}`, 'cyan')
    log(`Max Messages: ${maxMessages}`, 'cyan')
  }

  log('═'.repeat(60), 'bright')
}

async function checkServer() {
  logInfo('Checking server health...')

  const health = await getRestHealth()

  if (!health) {
    logError('Server is not responding to health check')
    log('\nMake sure the server is running:', 'yellow')
    log('  node server.js', 'yellow')
    process.exit(1)
  }

  logSuccess(`Server is healthy`)
  logInfo(`Connected clients: ${health.clientCount || 0}`)
}

async function run() {
  log('\n🚀 SOVD Log Dashboard - Load Testing', 'bright')
  log('═'.repeat(60), 'bright')

  logInfo(`Server: ${config.serverUrl}`)
  logInfo(`Clients: ${config.clients}`)
  logInfo(`Duration: ${config.duration}s`)
  logInfo(`Ramp-up: ${config.rampUp}s`)

  // Check server
  await checkServer()

  // Connect clients
  const clients = await connectClients()

  // Wait for specified duration
  log(
    `\n⏱️  Running test for ${config.duration} seconds...`,
    'bright'
  )

  const startTime = Date.now()
  let lastReport = startTime

  while (Date.now() - startTime < config.duration * 1000) {
    const now = Date.now()

    // Report every 5 seconds
    if (now - lastReport > 5000) {
      const elapsed = (now - startTime) / 1000
      const throughput = stats.totalMessages / elapsed
      process.stdout.write(
        `\r  Elapsed: ${elapsed.toFixed(1)}s | Messages: ${stats.totalMessages} | Throughput: ${throughput.toFixed(2)} msg/s | Clients: ${stats.clientsConnected}`
      )
      lastReport = now
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('\n')

  // Graceful shutdown
  logInfo('Disconnecting clients...')
  for (const client of clients) {
    if (client.ws && client.connected) {
      try {
        client.ws.close()
      } catch {}
    }
  }

  // Print results
  printStatistics(clients)

  // Print server health after test
  logInfo('Server health check after test...')
  const finalHealth = await getRestHealth()
  if (finalHealth) {
    logSuccess(`Final server status - Connected clients: ${finalHealth.clientCount}`)
  }

  // Exit with appropriate code
  const success =
    stats.successfulConnections > 0 &&
    stats.totalMessages > 0 &&
    stats.errors.length === 0

  if (success) {
    log(
      '\n✅ Load test completed successfully',
      'green'
    )
    process.exit(0)
  } else {
    log('\n⚠️  Load test completed with issues', 'yellow')
    if (stats.errors.length > 0) {
      log('\nErrors:')
      stats.errors.slice(0, 5).forEach((error) => {
        log(`  - ${error}`, 'yellow')
      })
    }
    process.exit(1)
  }
}

// Run the test
run().catch((error) => {
  logError(`Unexpected error: ${error.message}`)
  process.exit(1)
})
