import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IProjectService } from '@/lib/server/interfaces/IProjectService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/projects/[id]/notes
 * Holt alle Notizen für ein bestimmtes Projekt
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    // Projekt-ID aus der URL extrahieren
    const urlParts = req.url.split('/');
    const projectId = parseInt(urlParts[urlParts.length - 2]);
    
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Projekt-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const notes = await projectService.getProjectNotes(projectId);
    
    return NextResponse.json({
      success: true,
      data: notes,
      meta: {
        projectId,
        count: notes.length,
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

/**
 * POST /api/projects/[id]/notes
 * Fügt eine neue Notiz zu einem Projekt hinzu
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const projectService = container.resolve<IProjectService>('ProjectService');
    
    // Projekt-ID aus der URL extrahieren
    const urlParts = req.url.split('/');
    const projectId = parseInt(urlParts[urlParts.length - 2]);
    
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Projekt-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const { text } = await req.json();
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notiztext ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const note = await projectService.addNote(
      projectId,
      user.id,
      user.name || `User ${user.id}`,
      text
    );
    
    return NextResponse.json(
      {
        success: true,
        data: note,
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 201 }
    );
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
