// Jest setup file for test utilities and mocks
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment
Object.assign(global, {
  TextEncoder,
  TextDecoder,
})

// Mock next/server for API route testing
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: jest.fn((data) => ({
      status: 200,
      json: () => Promise.resolve(data),
    })),
  },
}))

// Global test timeout
jest.setTimeout(10000)
