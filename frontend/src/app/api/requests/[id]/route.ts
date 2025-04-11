import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession, authOptions } from '@/app/api/auth/middleware/authMiddleware';

const prisma = new PrismaClient();

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * GET /api/requests/[id]
 * 
 * Ruft eine einzelne Kontaktanfrage ab.
 */
export async function GET(request: NextRequest, { params }: RequestParams) {
  try {
    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const requestId = parseInt(params.id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, message: 'Ungültige Anfrage-ID' },
        { status: 400 }
      );
    }

    // Anfrage mit Beziehungen abrufen
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id: requestId },
      include: {
        processor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true
          }
        },
        appointment: {
          select: {
            id: true,
            title: true,
            appointmentDate: true,
            status: true
          }
        },
        notes: {
          select: {
            id: true,
            userId: true,
            userName: true,
            text: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!contactRequest) {
      return NextResponse.json(
        { success: false, message: 'Kontaktanfrage nicht gefunden' },
        { status: 404 }
      );
    }

    // Status-Label und CSS-Klasse bestimmen
    let statusLabel, statusClass;
    switch (contactRequest.status) {
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

    // Formatierte Antwort
    const response = {
      id: contactRequest.id,
      name: contactRequest.name,
      email: contactRequest.email,
      phone: contactRequest.phone,
      service: contactRequest.service,
      message: contactRequest.message,
      status: contactRequest.status,
      statusLabel,
      statusClass,
      processorId: contactRequest.processorId,
      processorName: contactRequest.processor?.name,
      customerId: contactRequest.customerId,
      customerName: contactRequest.customer?.name,
      appointmentId: contactRequest.appointmentId,
      appointmentTitle: contactRequest.appointment?.title,
      ipAddress: contactRequest.ipAddress,
      createdAt: contactRequest.createdAt.toISOString(),
      updatedAt: contactRequest.updatedAt.toISOString(),
      notes: contactRequest.notes.map(note => ({
        id: note.id,
        requestId: contactRequest.id,
        userId: note.userId,
        userName: note.userName,
        text: note.text,
        createdAt: note.createdAt.toISOString()
      })),
      customer: contactRequest.customer,
      appointment: contactRequest.appointment ? {
        ...contactRequest.appointment,
        appointmentDate: contactRequest.appointment.appointmentDate.toISOString()
      } : null
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/requests/[id]
 * 
 * Aktualisiert eine Kontaktanfrage.
 */
export async function PUT(request: NextRequest, { params }: RequestParams) {
  try {
    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const requestId = parseInt(params.id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, message: 'Ungültige Anfrage-ID' },
        { status: 400 }
      );
    }

    // Überprüfen, ob die Anfrage existiert
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id: requestId }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, message: 'Kontaktanfrage nicht gefunden' },
        { status: 404 }
      );
    }

    // Daten aus dem Request-Body auslesen
    const body = await request.json();
    const updateData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      service: body.service,
      message: body.message,
      status: body.status,
      processorId: body.processorId,
      customerId: body.customerId,
      appointmentId: body.appointmentId
    };

    // Undefinierte Felder entfernen
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    // Anfrage aktualisieren
    const updatedRequest = await prisma.contactRequest.update({
      where: { id: requestId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Kontaktanfrage erfolgreich aktualisiert',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/requests/[id]
 * 
 * Löscht eine Kontaktanfrage.
 */
export async function DELETE(request: NextRequest, { params }: RequestParams) {
  try {
    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const requestId = parseInt(params.id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, message: 'Ungültige Anfrage-ID' },
        { status: 400 }
      );
    }

    // Überprüfen, ob die Anfrage existiert
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id: requestId }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, message: 'Kontaktanfrage nicht gefunden' },
        { status: 404 }
      );
    }

    // Zuerst alle Notizen löschen
    await prisma.requestNote.deleteMany({
      where: { requestId }
    });

    // Dann alle Logs löschen
    await prisma.requestLog.deleteMany({
      where: { requestId }
    });

    // Schließlich die Anfrage selbst löschen
    await prisma.contactRequest.delete({
      where: { id: requestId }
    });

    return NextResponse.json({
      success: true,
      message: 'Kontaktanfrage erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}
