// Serverinitialisierung zuerst importieren
import '@/lib/server/init';

import { NextRequest, NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/server/core/api-handler';
import { withAuth } from '@/lib/server/core/auth';
import { ILoggingService } from '@/lib/server/interfaces/ILoggingService';
import { IUserService } from '@/lib/server/interfaces/IUserService';
import { ICustomerService } from '@/lib/server/interfaces/ICustomerService';
import { IProjectService } from '@/lib/server/interfaces/IProjectService';

// Dienste, die für diese Route aufgelöst werden sollen
const SERVICES_TO_RESOLVE = [
  'LoggingService', 
  'UserService', 
  'CustomerService', 
  'ProjectService'
];

/**
 * GET /api/dashboard/search
 * Durchsucht Kunden, Projekte und andere Entitäten
 */
export const GET = withAuth(
  async (req: NextRequest, user, services) => {
    const { 
      logger,
      UserService,
      CustomerService,
      ProjectService 
    } = services as {
      logger: ILoggingService;
      UserService: IUserService;
      CustomerService: ICustomerService;
      ProjectService: IProjectService;
    };
    
    // Abfrageparameter abrufen
    const { searchParams } = req.nextUrl;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Filter für bestimmte Typen
    const types = searchParams.get('types')?.split(',') || [];
    
    logger.debug('Dashboard-Suchanfrage empfangen', { query, limit, types });
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Suchparameter (q) ist erforderlich',
        meta: {
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }
    
    try {
      // Parallele Suche in verschiedenen Entitäten
      const [customers, projects, users] = await Promise.all([
        // Nur durchführen, wenn kein Typfilter oder wenn Kunden eingeschlossen sind
        (!types.length || types.includes('customer')) ? 
          CustomerService.search(query, limit) : [],
          
        // Nur durchführen, wenn kein Typfilter oder wenn Projekte eingeschlossen sind
        (!types.length || types.includes('project')) ? 
          ProjectService.search(query, limit) : [],
          
        // Nur durchführen, wenn kein Typfilter oder wenn Benutzer eingeschlossen sind
        (!types.length || types.includes('user')) ? 
          UserService.search(query, limit) : []
      ]);
      
      // Suchergebnisse konvertieren
      const results = [
        // Kunden
        ...customers.map(customer => ({
          id: customer.id,
          type: 'customer',
          title: customer.name,
          subtitle: customer.email || customer.phone || '',
          url: `/customers/${customer.id}`
        })),
        
        // Projekte
        ...projects.map(project => ({
          id: project.id,
          type: 'project',
          title: project.title,
          subtitle: project.description?.substring(0, 100) || '',
          url: `/projects/${project.id}`
        })),
        
        // Benutzer
        ...users.map(user => ({
          id: user.id,
          type: 'user',
          title: user.name,
          subtitle: user.email,
          url: `/users/${user.id}`
        }))
      ];
      
      // Ergebnisse nach Relevanz sortieren (nur Beispiel, echte Implementierung würde kompliziertere Logik verwenden)
      const sortedResults = results
        .sort((a, b) => {
          // Priorisiere Elemente, bei denen der Suchbegriff am Anfang des Titels steht
          const aStartsWithQuery = a.title.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
          const bStartsWithQuery = b.title.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
          
          if (aStartsWithQuery !== bStartsWithQuery) {
            return bStartsWithQuery - aStartsWithQuery;
          }
          
          // Ansonsten alphabetisch sortieren
          return a.title.localeCompare(b.title);
        })
        .slice(0, limit);
      
      logger.info('Dashboard-Suche erfolgreich', {
        query,
        resultCount: sortedResults.length,
        customerCount: customers.length,
        projectCount: projects.length,
        userCount: users.length
      });
      
      return NextResponse.json({
        success: true,
        data: {
          results: sortedResults
        },
        meta: {
          timestamp: new Date().toISOString(),
          total: sortedResults.length,
          query
        }
      });
    } catch (error: any) {
      logger.error('Fehler bei der Dashboard-Suche', error, { query });
      
      const statusCode = error.statusCode || 500;
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Interner Serverfehler bei der Suche',
          meta: {
            timestamp: new Date().toISOString(),
            query
          }
        },
        { status: statusCode }
      );
    }
  },
  SERVICES_TO_RESOLVE
);
