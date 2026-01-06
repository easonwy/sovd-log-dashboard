import { NextResponse } from 'next/server';
import { getLogService } from '@/server/services/logService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/levels
 * Get distinct log levels from logs
 *
 * Returns a list of all unique log levels in the log system.
 * This endpoint is used to populate log level filter dropdowns.
 */
export async function GET() {
  try {
    const logService = getLogService();
    const levels = await logService.getDistinctLevels();

    return NextResponse.json({
      success: true,
      data: levels,
      error: null,
    });
  } catch (error) {
    console.error('Error fetching log levels:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'LEVELS_FETCH_ERROR',
          message: 'Failed to fetch log levels',
          details: isDev ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}
