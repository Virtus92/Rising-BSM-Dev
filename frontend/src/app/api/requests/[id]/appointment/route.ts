import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';

const prisma = new PrismaClient();

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/requests/[id]/appointment
 * 
 * Erstellt einen Termin für eine Kontaktanfrage.
 */
export const POST = apiRouteHandler(async (request: NextRequest, params?: { [key: string]: string }) => {
  try {
    if (!params) {
      return formatError('Keine Anfrage-ID angegeben', 400);
    }

    const requestId = parseInt(params.id);
    if (isNaN(requestId)) {
      return formatError('Ungültige Anfrage-ID', 400);
    }

    // Überprüfen, ob die Anfrage existiert
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id: requestId },
      include: { customer: true }
    });

    if (!existingRequest) {
      return formatError('Kontaktanfrage nicht gefunden', 404);
    }

    // Daten aus dem Request-Body auslesen
    const body = await request.json();
    const { 
      title, 
      appointmentDate, 
      appointmentTime, 
      duration = 60, 
      location, 
      description, 
      status = 'planned', 
      note 
    } = body;

    if (!title || !appointmentDate) {
      return formatError('Titel und Datum sind erforderlich', 400);
    }

    // Begin transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Datum und Uhrzeit verarbeiten
      let finalAppointmentDate;
      if (appointmentDate && appointmentTime) {
        const [year, month, day] = appointmentDate.split('-').map(Number);
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        finalAppointmentDate = new Date(year, month - 1, day, hours, minutes);
      } else {
        // Nur Datum mit Standardzeit (10:00)
        const [year, month, day] = appointmentDate.split('-').map(Number);
        finalAppointmentDate = new Date(year, month - 1, day, 10, 0);
      }

      // Termin erstellen
      const appointment = await prisma.appointment.create({
        data: {
          title,
          customerId: existingRequest.customerId,
          appointmentDate: finalAppointmentDate,
          duration,
          location,
          description: description || existingRequest.message,
          status,
          createdBy: request.auth?.userId
        }
      });

      // Anfrage mit Termin verknüpfen
      const updatedRequest = await prisma.contactRequest.update({
        where: { id: requestId },
        data: {
          appointmentId: appointment.id,
          status: existingRequest.status === 'new' ? 'in_progress' : existingRequest.status,
          processorId: existingRequest.processorId || request.auth?.userId
        }
      });

      // Notiz zum Termin
      await prisma.appointmentNote.create({
        data: {
          appointmentId: appointment.id,
          userId: request.auth?.userId ?? 0,
          userName: request.auth?.name || 'Unbekannt',
          text: `Termin aus Kontaktanfrage erstellt: ${existingRequest.message}`
        }
      });

      // Log-Eintrag erstellen
      await prisma.requestLog.create({
        data: {
          requestId,
          userId: request.auth?.userId ?? 0,
          userName: request.auth?.name || 'Unbekannt',
          action: 'Termin erstellt',
          details: note || `Termin ${title} erstellt`
        }
      });

      return {
        appointment,
        request: updatedRequest
      };
    });

    return formatSuccess({
      appointment: {
        ...result.appointment,
        appointmentDate: result.appointment.appointmentDate.toISOString()
      },
      request: result.request
    }, 'Termin erfolgreich erstellt');
  } catch (error) {
    console.error('Error creating appointment for request:', error);
    return formatError(
      error instanceof Error ? error.message : 'Server-Fehler',
      500
    );
  }
}, { requiresAuth: true });
