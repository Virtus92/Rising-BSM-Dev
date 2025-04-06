import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IProjectService } from '@/lib/server/interfaces/IProjectService';
import { withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/projects/statistics
 * Holt Projektstatistiken (Nur für Admin und Manager)
 */
export const GET = withRoles(['admin', 'manager'], async (req: NextRequest) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    const statistics = await projectService.getProjectStatistics();
    
    return NextResponse.json({
      success: true,
      data: statistics,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Interner Serverfehler',
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});
