/**
 * Tests for WSService (WebSocket Server Service)
 * Tests client session management, log broadcasting, and filtering logic
 */

import { WebSocket, Server } from 'ws'
import { EventEmitter } from 'events'

// Define interfaces for our mocks
interface MockWebSocket extends WebSocket {
  send: jest.Mock
  terminate: jest.Mock
  isAlive: boolean
}

interface MockServer extends Server {
  clients: Set<MockWebSocket>
}

// Mock WebSocket and Server for testing
jest.mock('ws', () => {
  return {
    WebSocket: class MockWebSocket extends EventEmitter {
      send = jest.fn()
      terminate = jest.fn()
      isAlive = true
    },
    Server: class MockServer extends EventEmitter {
      clients: Set<MockWebSocket> = new Set()
    },
  }
})

// Import WSService after mocking
import { getWSService } from '@/server/services/wsService'

describe('WSService - WebSocket Server Service', () => {
  let wsService: ReturnType<typeof getWSService>
  let mockWss: MockServer
  let mockClient: MockWebSocket

  beforeEach(() => {
    // Get fresh instance
    wsService = getWSService()

    // Create mock WebSocket server
    mockWss = new Server({ noServer: true }) as unknown as MockServer
    mockWss.clients = new Set()

    // Create mock client
    mockClient = new WebSocket('ws://localhost:3000') as unknown as MockWebSocket
    mockClient.send = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with WebSocket server', () => {
      expect(() => {
        wsService.initialize(mockWss)
      }).not.toThrow()
    })

    it('should start heartbeat on initialization', () => {
      const startHeartbeatSpy = jest.spyOn(wsService as unknown as { startHeartbeat: () => void }, 'startHeartbeat')
      wsService.initialize(mockWss)
      expect(startHeartbeatSpy).toHaveBeenCalled()
    })
  })

  describe('Client Session Management', () => {
    beforeEach(() => {
      wsService.initialize(mockWss)
    })

    it('should generate unique client IDs', () => {
      const generateClientIdFn = (wsService as unknown as { generateClientId: () => string }).generateClientId
      const id1 = generateClientIdFn.call(wsService)
      const id2 = generateClientIdFn.call(wsService)

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^client-/) // Should start with 'client-'
    })

    it('should get default filters for new clients', () => {
      const defaultFilters = (wsService as unknown as { getDefaultFilters: () => unknown }).getDefaultFilters()

      expect(defaultFilters).toEqual({
        levels: {},
        modules: {},
        searchText: '',
      })
    })

    it('should create session with filter state', () => {
      const clientId = (wsService as unknown as { generateClientId: () => string }).generateClientId()
      const filters = (wsService as unknown as { getDefaultFilters: () => unknown }).getDefaultFilters()

      expect(clientId).toBeDefined()
      expect(filters).toHaveProperty('levels')
      expect(filters).toHaveProperty('modules')
      expect(filters).toHaveProperty('searchText')
    })
  })

  describe('Filter Matching Logic', () => {
    beforeEach(() => {
      wsService.initialize(mockWss)
    })

    it('should match logs without level filter', () => {
      const log = {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        module: 'AUTH',
        level: 'ERROR',
        message: 'Test',
        traceId: 'trace-1',
        details: {},
      }

      const filters = {
        levels: {}, // Empty = match all
        modules: {},
        searchText: '',
      }

      const matches = (wsService as unknown as { matchesFilters: (log: unknown, filters: unknown) => boolean }).matchesFilters(log, filters)
      expect(matches).toBe(true)
    })

    it('should match logs with matching level filter', () => {
      const log = {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        module: 'AUTH',
        level: 'ERROR',
        message: 'Test',
        traceId: 'trace-1',
        details: {},
      }

      const filters = {
        levels: { ERROR: true, WARNING: false },
        modules: {},
        searchText: '',
      }

      const matches = (wsService as unknown as { matchesFilters: (log: unknown, filters: unknown) => boolean }).matchesFilters(log, filters)
      expect(matches).toBe(true)
    })

    it('should not match logs with non-matching level filter', () => {
      const log = {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        module: 'AUTH',
        level: 'DEBUG',
        message: 'Test',
        traceId: 'trace-1',
        details: {},
      }

      const filters = {
        levels: { ERROR: true, WARNING: true },
        modules: {},
        searchText: '',
      }

      const matches = (wsService as any).matchesFilters(log, filters)
      expect(matches).toBe(false)
    })

    it('should match logs with matching module filter', () => {
      const log = {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        module: 'AUTH',
        level: 'ERROR',
        message: 'Test',
        traceId: 'trace-1',
        details: {},
      }

      const filters = {
        levels: {},
        modules: { AUTH: true, ORDER: false },
        searchText: '',
      }

      const matches = (wsService as unknown as { matchesFilters: (log: unknown, filters: unknown) => boolean }).matchesFilters(log, filters)
      expect(matches).toBe(true)
    })

    it('should match logs with search text in message', () => {
      const log = {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        module: 'AUTH',
        level: 'ERROR',
        message: 'Authentication timeout',
        traceId: 'trace-1',
        details: {},
      }

      const filters = {
        levels: {},
        modules: {},
        searchText: 'timeout',
      }

      const matches = (wsService as unknown as { matchesFilters: (log: unknown, filters: unknown) => boolean }).matchesFilters(log, filters)
      expect(matches).toBe(true)
    })

    it('should match logs with search text in trace ID', () => {
      const log = {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        module: 'AUTH',
        level: 'ERROR',
        message: 'Error',
        traceId: 'trace-12345',
        details: {},
      }

      const filters = {
        levels: {},
        modules: {},
        searchText: 'trace-123',
      }

      const matches = (wsService as unknown as { matchesFilters: (log: unknown, filters: unknown) => boolean }).matchesFilters(log, filters)
      expect(matches).toBe(true)
    })

    it('should handle combined filters correctly', () => {
      const log = {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        module: 'AUTH',
        level: 'ERROR',
        message: 'Authentication failed',
        traceId: 'trace-1',
        details: {},
      }

      // Should match: ERROR level AND AUTH module
      const filters = {
        levels: { ERROR: true, WARNING: false },
        modules: { AUTH: true },
        searchText: '',
      }

      const matches = (wsService as unknown as { matchesFilters: (log: unknown, filters: unknown) => boolean }).matchesFilters(log, filters)
      expect(matches).toBe(true)

      // Should not match: ERROR level but PAYMENT module
      const filtersNoMatch = {
        levels: { ERROR: true },
        modules: { PAYMENT: true },
        searchText: '',
      }

      const matchesNo = (wsService as any).matchesFilters(log, filtersNoMatch)
      expect(matchesNo).toBe(false)
    })
  })

  describe('Log Broadcasting', () => {
    beforeEach(() => {
      wsService.initialize(mockWss)
    })

    it('should handle broadcast without errors', () => {
      const log = {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        module: 'AUTH',
        level: 'ERROR',
        message: 'Test',
        traceId: 'trace-1',
        details: {},
      }

      expect(() => {
        wsService.broadcastLog(log)
      }).not.toThrow()
    })

    it('should handle batch broadcast without errors', () => {
      const logs = [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          module: 'AUTH',
          level: 'ERROR',
          message: 'Test 1',
          traceId: 'trace-1',
          details: {},
        },
        {
          id: 'log-2',
          timestamp: new Date().toISOString(),
          module: 'ORDER',
          level: 'WARNING',
          message: 'Test 2',
          traceId: 'trace-2',
          details: {},
        },
      ]

      expect(() => {
        wsService.broadcastLogs(logs)
      }).not.toThrow()
    })
  })

  describe('Statistics', () => {
    beforeEach(() => {
      wsService.initialize(mockWss)
    })

    it('should return statistics object', () => {
      const stats = wsService.getStats()

      expect(stats).toBeDefined()
      expect(stats).toHaveProperty('clientCount')
      expect(typeof stats.clientCount).toBe('number')
    })

    it('should report zero clients initially', () => {
      const stats = wsService.getStats()
      expect(stats.clientCount).toBe(0)
    })
  })

  describe('Graceful Shutdown', () => {
    beforeEach(() => {
      wsService.initialize(mockWss)
    })

    it('should shutdown without errors', () => {
      expect(() => {
        wsService.shutdown()
      }).not.toThrow()
    })

    it('should be callable multiple times', () => {
      expect(() => {
        wsService.shutdown()
        wsService.shutdown()
      }).not.toThrow()
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = getWSService()
      const instance2 = getWSService()

      expect(instance1).toBe(instance2)
    })
  })
})
