import { NextRequest, NextResponse } from 'next/server';
import { getLogService } from '@/server/services/logService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/stats
 * Get aggregated statistics for the analytics dashboard
 *
 * Query Parameters:
 * - startTime: string (ISO format, optional, default: 24h ago)
 * - endTime: string (ISO format, optional, default: now)
 * - interval: string (optional: 5m, 15m, 1h, 1d, default: 1h)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const startTime = searchParams.get('startTime') || null;
    const endTime = searchParams.get('endTime') || null;
    const interval = searchParams.get('interval') || '1h';

    const logService = getLogService();
    const result = await logService.getStatistics({
      startTime,
      endTime,
      interval,
    });

    return NextResponse.json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'STATS_FETCH_ERROR',
          message: 'Failed to fetch statistics',
          details: isDev ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
