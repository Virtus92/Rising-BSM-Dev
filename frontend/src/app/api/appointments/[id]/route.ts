// Serverinitialisierung zuerst importieren
import '@/lib/server/init';

import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiHandler, createApiResponse } from '@/lib/server/core/improved-api-handler';
import { DataTransformer } from '@/lib/server/core/data-transformer';

export const handlers = {
  GET: async (req: NextRequest, { params }) => {
    if (!params.id) {
      return createApiResponse(undefined, false, 'Appointment ID ist erforderlich', undefined, undefined, 400);
    }

    const appointmentId = parseInt(params.id as string, 10);
    if (isNaN(appointmentId)) {
      return createApiResponse(undefined, false, 'Ungültige Appointment ID', undefined, undefined, 400);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
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

    if (!appointment) {
      return createApiResponse(undefined, false, 'Termin nicht gefunden', undefined, undefined, 404);
    }

    return createApiResponse({
      appointment: DataTransformer.appointment(appointment)
    });
  },

  PUT: async (req: NextRequest, { params }, user) => {
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

    // Daten aktualisieren
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        title: body.title,
        customerId: body.customerId,
        projectId: body.projectId,
        appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : undefined,
        appointmentTime: body.appointmentTime,
        duration: body.duration,
        location: body.location,
        description: body.description,
        status: body.status,
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            company: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Aktivität loggen
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        userId: user.id,
        userName: user.name,
        action: 'updated',
        details: 'Termin aktualisiert',
        createdAt: new Date()
      }
    });

    return createApiResponse({
      appointment: DataTransformer.appointment(updatedAppointment)
    });
  },

  DELETE: async (req: NextRequest, { params }, user) => {
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

    // In einer realen Anwendung würden wir wahrscheinlich den Termin als gelöscht markieren,
    // anstatt ihn tatsächlich zu löschen. Hier führen wir ein echtes Löschen durch.
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    });

    // Aktivität loggen
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        userId: user.id,
        userName: user.name,
        action: 'deleted',
        details: 'Termin gelöscht/storniert',
        createdAt: new Date()
      }
    });

    return createApiResponse({
      id: appointmentId,
      deleted: true
    });
  }
};

export const GET = createApiHandler(handlers);
export const PUT = createApiHandler(handlers);
export const DELETE = createApiHandler(handlers);
