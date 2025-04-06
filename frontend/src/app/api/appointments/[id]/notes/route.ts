// Serverinitialisierung zuerst importieren
import '@/lib/server/init';

import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiHandler, createApiResponse } from '@/lib/server/core/improved-api-handler';
import { DataTransformer } from '@/lib/server/core/data-transformer';

/**
 * POST /api/appointments/[id]/notes
 * Fügt eine Notiz zu einem Termin hinzu
 */
export const POST = createApiHandler({
  POST: async (req: NextRequest, { params }, user) => {
    if (!params.id) {
      return createApiResponse(undefined, false, 'Appointment ID ist erforderlich', undefined, undefined, 400);
    }

    const appointmentId = parseInt(params.id as string, 10);
    if (isNaN(appointmentId)) {
      return createApiResponse(undefined, false, 'Ungültige Appointment ID', undefined, undefined, 400);
    }

    // Prüfen, ob der Termin existiert
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      return createApiResponse(undefined, false, 'Termin nicht gefunden', undefined, undefined, 404);
    }

    // Request-Body parsen
    const body = await req.json();

    if (!body.note) {
      return createApiResponse(undefined, false, 'Notiz-Text ist erforderlich', undefined, undefined, 400);
    }

    // Notiz erstellen
    const createdNote = await prisma.appointmentNote.create({
      data: {
        appointmentId,
        userId: user.id,
        userName: user.name,
        text: body.note,
        createdAt: new Date()
      }
    });

    // Aktivität loggen
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        userId: user.id,
        userName: user.name,
        action: 'note_added',
        details: 'Notiz hinzugefügt',
        createdAt: new Date()
      }
    });

    // Notizen abrufen, um die aktuelle Liste zurückzugeben
    const notes = await prisma.appointmentNote.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' }
    });

    return createApiResponse({
      note: DataTransformer.notes([createdNote])[0],
      notes: DataTransformer.notes(notes)
    });
  }
}, {
  requireAuth: true,
  services: ['LoggingService']
});
