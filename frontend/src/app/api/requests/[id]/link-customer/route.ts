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
 * POST /api/requests/[id]/link-customer
 * 
 * Verknüpft eine Kontaktanfrage mit einem bestehenden Kunden.
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
    const { customerId, note } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Kunden-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Überprüfen, ob der Kunde existiert
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Kunde nicht gefunden' },
        { status: 404 }
      );
    }

    // Begin transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Anfrage aktualisieren
      const updatedRequest = await prisma.contactRequest.update({
        where: { id: requestId },
        data: {
          customerId,
          status: existingRequest.status === 'new' ? 'in_progress' : existingRequest.status,
          processorId: existingRequest.processorId || parseInt(session.user.id)
        }
      });

      // Log-Eintrag erstellen
      await prisma.requestLog.create({
        data: {
          requestId,
          userId: parseInt(session.user.id),
          userName: session.user.name || 'Unbekannt',
          action: 'Mit Kunden verknüpft',
          details: note || `Mit Kunde ${customer.name} verknüpft`
        }
      });

      return {
        request: updatedRequest,
        customer
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
      message: 'Kontaktanfrage erfolgreich mit Kunden verknüpft',
      data: {
        ...result.request,
        statusLabel,
        statusClass,
        customerName: result.customer.name
      }
    });
  } catch (error) {
    console.error('Error linking request to customer:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}