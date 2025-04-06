// Serverinitialisierung zuerst importieren
import '@/lib/server/init';

import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiHandler, createApiResponse } from '@/lib/server/core/improved-api-handler';

/**
 * GET /api/requests
 * Ruft alle Anfragen mit optionaler Filterung und Paginierung ab
 */
export const handlers = {
  GET: async (req: NextRequest) => {
    // Abfrageparameter extrahieren
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';
    
    // Anfrage für Gesamtzahl
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Zähle alle passenden Datensätze
    const totalCount = await prisma.request.count({
      where: whereClause
    });
    
    // Berechne Paginierungsinformationen
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;
    
    // Abfrage ausführen
    const requests = await prisma.request.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortDirection
      },
      skip,
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            type: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        notes: {
          orderBy: {
            created_at: 'desc'
          },
          select: {
            id: true,
            text: true,
            created_at: true,
            userId: true,
            userName: true
          }
        }
      }
    });
    
    // Formatiere die Antwort
    const formattedRequests = requests.map(request => ({
      id: request.id,
      title: request.title,
      description: request.description,
      status: request.status,
      priority: request.priority,
      customerId: request.customerId,
      customerName: request.customer?.name || 'Kein Kunde',
      assignedUserId: request.assignedUserId,
      assignedUserName: request.assignedUser?.name || null,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      notes: (request.notes || []).map(note => ({
        id: note.id,
        text: note.text,
        createdAt: note.created_at,
        userId: note.userId,
        userName: note.userName
      }))
    }));

    return createApiResponse({
      requests: formattedRequests,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages
      }
    });
  },

  POST: async (req: NextRequest, params, user) => {
    const body = await req.json();
    
    // Validierung der erforderlichen Felder
    if (!body.title || !body.description) {
      return createApiResponse(
        undefined, 
        false, 
        'Title and description are required', 
        undefined, 
        undefined, 
        400
      );
    }
    
    const request = await prisma.request.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status || 'new',
        priority: body.priority || 'medium',
        customerId: body.customerId || null,
        assignedUserId: body.assignedUserId || null,
        created_by: user?.id || null,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    return createApiResponse({ request });
  }
};

export const GET = createApiHandler(handlers, {
  requireAuth: true,
  services: ['LoggingService']
});

export const POST = createApiHandler(handlers, {
  requireAuth: true,
  services: ['LoggingService']
});
