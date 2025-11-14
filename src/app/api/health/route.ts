import { NextResponse } from 'next/server'
import { isConnected as isDatabaseConnected } from '@/server/db/client'
import { getLogStreamMonitor } from '@/server/services/logStreamMonitor'

export const runtime = 'nodejs'

// TypeScript interfaces for better type safety
interface HealthComponent {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checkedAt: string
  responseTime?: number
  error?: string
}

interface DatabaseHealth extends HealthComponent {
  connected: boolean
}

interface StreamHealth extends HealthComponent {
  isRunning: boolean
  lastCreateTime: string
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptimeSeconds: number
  mockMode: boolean
  components: {
    database: DatabaseHealth
    stream: StreamHealth
  }
  timestamp: string
  env: {
    nodeEnv: string
  }
}

interface HealthErrorResponse {
  success: false
  data: null
  error: {
    code: string
    message: string
  }
}

/**
 * Health check endpoint that monitors application components
 * Provides real-time status of database connectivity and log stream monitoring
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    // Perform health checks in parallel for better performance
    const [dbHealth, streamHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkStreamHealth()
    ])

    // Determine overall status based on component health
    const overallStatus = determineOverallStatus([dbHealth.status, streamHealth.status])
    
    const responseTime = Date.now() - startTime
    
    const healthData: HealthResponse = {
      status: overallStatus,
      uptimeSeconds: Math.floor(process.uptime()),
      mockMode: (process.env.MOCK_MODE === 'true') || (process.env.NEXT_PUBLIC_MOCK_MODE === 'true'),
      components: {
        database: dbHealth,
        stream: streamHealth
      },
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    }

    // Log performance metrics
    console.log(`[Health Check] Completed in ${responseTime}ms - Status: ${overallStatus}`)

    return NextResponse.json({ 
      success: true, 
      data: healthData, 
      error: null 
    })
  } catch (error) {
    return handleHealthError(error)
  }
}

/**
 * Check database health with timeout protection
 */
async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = Date.now()
  
  try {
    // Add timeout protection for database connection
    const connected = await Promise.race([
      isDatabaseConnected(),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ])
    
    const responseTime = Date.now() - startTime
    
    return {
      status: connected ? 'healthy' : 'unhealthy',
      connected,
      checkedAt: new Date().toISOString(),
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Database check failed'
    
    console.warn(`[Health Check] Database health check failed: ${errorMessage}`)
    
    return {
      status: 'unhealthy',
      connected: false,
      checkedAt: new Date().toISOString(),
      responseTime,
      error: errorMessage
    }
  }
}

/**
 * Check log stream monitor health
 */
async function checkStreamHealth(): Promise<StreamHealth> {
  const startTime = Date.now()
  
  try {
    const monitor = getLogStreamMonitor()
    const status = monitor.getStatus()
    
    const responseTime = Date.now() - startTime
    
    return {
      status: status.isRunning ? 'healthy' : 'degraded',
      isRunning: status.isRunning,
      lastCreateTime: status.lastCreateTime,
      checkedAt: new Date().toISOString(),
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Stream check failed'
    
    console.warn(`[Health Check] Stream health check failed: ${errorMessage}`)
    
    return {
      status: 'unhealthy',
      isRunning: false,
      lastCreateTime: '',
      checkedAt: new Date().toISOString(),
      responseTime,
      error: errorMessage
    }
  }
}

/**
 * Determine overall health status based on component statuses
 */
function determineOverallStatus(componentStatuses: string[]): 'healthy' | 'degraded' | 'unhealthy' {
  if (componentStatuses.includes('unhealthy')) {
    return 'unhealthy'
  }
  if (componentStatuses.includes('degraded')) {
    return 'degraded'
  }
  return 'healthy'
}

/**
 * Handle health check errors with proper typing and logging
 */
function handleHealthError(error: unknown): NextResponse<HealthErrorResponse> {
  const message = error instanceof Error ? error.message : 'Health check failed'
  const code = 'HEALTH_ERROR'
  
  // Log structured error for monitoring
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    message: 'Health check error',
    error: message,
    code,
    service: 'health-check'
  }))

  return NextResponse.json(
    { 
      success: false, 
      data: null, 
      error: { code, message } 
    },
    { status: 500 }
  )
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  })
}