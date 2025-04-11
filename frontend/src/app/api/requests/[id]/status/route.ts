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
 * PATCH /api/requests/[id]/status
 * 
 * Aktualisiert den Status einer Kontaktanfrage.
 */
export async function PATCH(request: NextRequest, { params }: RequestParams) {
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
    const { status, note } = body;

    // Status validieren
    const validStatuses = ['new', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Ungültiger Status', 
          errors: [
            `Status muss einer der folgenden sein: ${validStatuses.join(', ')}`
          ]
        },
        { status: 400 }
      );
    }

    // Status aktualisieren
    const updatedRequest = await prisma.contactRequest.update({
      where: { id: requestId },
      data: { status }
    });

    // Wenn eine Notiz vorhanden ist, füge einen Log-Eintrag hinzu
    if (note) {
      await prisma.requestLog.create({
        data: {
          requestId,
          userId: parseInt(session.user.id),
          userName: session.user.name || 'Unbekannt',
          action: `Status geändert auf ${status}`,
          details: note
        }
      });
    }

    // Status-Label und CSS-Klasse bestimmen
    let statusLabel, statusClass;
    switch (status) {
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

    return NextResponse.json({
      success: true,
      message: 'Status erfolgreich aktualisiert',
      data: {
        ...updatedRequest,
        statusLabel,
        statusClass
      }
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}