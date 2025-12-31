import { NextResponse } from 'next/server';
import { getLogService } from '@/server/services/logService';

export const runtime = 'nodejs';

/**
 * GET /api/v1/modules
 * Get distinct modules from logs
 *
 * Returns a list of all unique module names in the log system.
 * This endpoint is used to populate filter dropdowns.
 */
export async function GET() {
  try {
    const logService = getLogService();
    const modules = await logService.getDistinctModules();

    return NextResponse.json({
      success: true,
      data: modules,
      error: null,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'MODULES_FETCH_ERROR',
          message: 'Failed to fetch modules',
          details: isDev ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}
