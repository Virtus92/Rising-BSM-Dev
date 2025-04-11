import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession, authOptions } from '@/app/api/auth/middleware/authMiddleware';

const prisma = new PrismaClient();

/**
 * GET /api/requests
 * 
 * Ruft eine Liste von Kontaktanfragen ab.
 */
export async function GET(request: NextRequest) {
  try {
    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // URL-Parameter abrufen
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    const processorId = searchParams.get('processorId') ? parseInt(searchParams.get('processorId')!) : undefined;
    const unassigned = searchParams.get('unassigned') === 'true';
    const notConverted = searchParams.get('notConverted') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    // Filterkriterien erstellen
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (service) {
      where.service = service;
    }

    if (processorId) {
      where.processorId = processorId;
    }

    if (unassigned) {
      where.processorId = null;
    }

    if (notConverted) {
      where.customerId = null;
    }

    // Gesamtanzahl der Anfragen zählen
    const total = await prisma.contactRequest.count({ where });

    // Anfragen abfragen
    const requests = await prisma.contactRequest.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        service: true,
        message: true,
        status: true,
        processorId: true,
        customerId: true,
        appointmentId: true,
        ipAddress: true,
        createdAt: true,
        updatedAt: true,
        processor: {
          select: {
            name: true
          }
        },
        customer: {
          select: {
            name: true
          }
        },
        appointment: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortDirection
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Daten formatieren
    const formattedRequests = requests.map(request => {
      const { processor, customer, appointment, ...rest } = request;
      
      // Status-Label und CSS-Klasse bestimmen
      let statusLabel, statusClass;
      switch (rest.status) {
        case 'new':
          statusLabel = 'Neu';
          statusClass = 'text-blue-500';
          break;
        case 'in_progress':
          statusLabel = 'In Bearbeitung';
          statusClass = 'text-yellow-500';
          break;
        case 'completed':
          statusLabel = 'Abgeschlossen';
          statusClass = 'text-green-500';
          break;
        case 'cancelled':
          statusLabel = 'Abgebrochen';
          statusClass = 'text-red-500';
          break;
        default:
          statusLabel = 'Unbekannt';
          statusClass = 'text-gray-500';
      }
      
      return {
        ...rest,
        statusLabel,
        statusClass,
        processorName: processor?.name || null,
        customerName: customer?.name || null,
        appointmentTitle: appointment?.title || null
      };
    });

    // Erfolgsantwort
    return NextResponse.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/requests
 * 
 * Erstellt eine neue Kontaktanfrage.
 */
export async function POST(request: NextRequest) {
  try {
    // Authentifizierung prüfen (optional, da auch für das öffentliche Formular)
    const session = await getServerSession(authOptions);
    
    // Daten aus Request-Body auslesen
    const body = await request.json();
    const { name, email, phone, service, message } = body;
    
    // Validierung
    if (!name || !email || !service || !message) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unvollständige Daten', 
          errors: ['Bitte füllen Sie alle Pflichtfelder aus'] 
        },
        { status: 400 }
      );
    }
    
    // IP-Adresse des Clients ermitteln (falls verfügbar)
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    
    // Neue Anfrage erstellen
    const newRequest = await prisma.contactRequest.create({
      data: {
        name,
        email,
        phone,
        service,
        message,
        status: 'new',
        ipAddress: ipAddress.split(',')[0], // Erste IP-Adresse bei mehreren
        processorId: session?.user?.id ? parseInt(session.user.id) : null
      }
    });
    
    // Erfolgsantwort
    return NextResponse.json({
      success: true,
      message: 'Kontaktanfrage erfolgreich erstellt',
      data: newRequest
    });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}
