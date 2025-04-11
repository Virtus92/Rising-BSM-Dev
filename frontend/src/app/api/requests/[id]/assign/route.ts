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
 * POST /api/requests/[id]/assign
 * 
 * Weist eine Kontaktanfrage einem Benutzer zu.
 */
export async function POST(request: NextRequest, { params }: RequestParams) {
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
    const { userId, note } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Benutzer-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Überprüfen, ob der Benutzer existiert
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Begin transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Anfrage aktualisieren
      const updatedRequest = await prisma.contactRequest.update({
        where: { id: requestId },
        data: {
          processorId: userId,
          status: existingRequest.status === 'new' ? 'in_progress' : existingRequest.status
        }
      });

      // Log-Eintrag erstellen
      await prisma.requestLog.create({
        data: {
          requestId,
          userId: parseInt(session.user.id),
          userName: session.user.name || 'Unbekannt',
          action: 'Anfrage zugewiesen',
          details: note || `Anfrage an ${user.name} zugewiesen`
        }
      });

      return {
        request: updatedRequest,
        user
      };
    });

    // Status-Label und CSS-Klasse bestimmen
    let statusLabel, statusClass;
    switch (result.request.status) {
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
      message: 'Kontaktanfrage erfolgreich zugewiesen',
      data: {
        ...result.request,
        statusLabel,
        statusClass,
        processorName: result.user.name
      }
    });
  } catch (error) {
    console.error('Error assigning request:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}
