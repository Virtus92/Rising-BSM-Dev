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
 * POST /api/requests/[id]/convert
 * 
 * Konvertiert eine Kontaktanfrage in einen Kunden.
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

    // Überprüfen, ob die Anfrage existiert und noch nicht konvertiert wurde
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id: requestId }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, message: 'Kontaktanfrage nicht gefunden' },
        { status: 404 }
      );
    }

    if (existingRequest.customerId) {
      return NextResponse.json(
        { success: false, message: 'Anfrage wurde bereits zu einem Kunden konvertiert' },
        { status: 400 }
      );
    }

    // Daten aus dem Request-Body auslesen
    const body = await request.json();
    const { 
      requestId: bodyRequestId, // Ignorieren, da wir die ID aus der URL nehmen
      customerData = {}, 
      note, 
      createAppointment = false, 
      appointmentData = {} 
    } = body;

    // Begin transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Kundendaten zusammenstellen
      const customerCreateData = {
        name: customerData.name || existingRequest.name,
        email: customerData.email || existingRequest.email,
        phone: customerData.phone || existingRequest.phone,
        company: customerData.company,
        address: customerData.address,
        postalCode: customerData.postalCode,
        city: customerData.city,
        country: customerData.country || 'Deutschland',
        type: customerData.type || 'private',
        newsletter: customerData.newsletter || false,
        source: 'contact_request',
        status: 'active',
        createdBy: parseInt(session.user.id),
        updatedBy: parseInt(session.user.id)
      };

      // Kunden erstellen
      const customer = await prisma.customer.create({
        data: customerCreateData
      });

      // Anfrage aktualisieren
      const updatedRequest = await prisma.contactRequest.update({
        where: { id: requestId },
        data: {
          customerId: customer.id,
          status: 'completed',
          processorId: parseInt(session.user.id)
        }
      });

      // Notiz/Log hinzufügen
      await prisma.requestLog.create({
        data: {
          requestId,
          userId: parseInt(session.user.id),
          userName: session.user.name || 'Unbekannt',
          action: 'In Kunden konvertiert',
          details: note || `Kunde ${customer.name} wurde aus Anfrage erstellt`
        }
      });

      // Optional: Termin erstellen
      let appointment = null;
      if (createAppointment && appointmentData) {
        // Datum und Uhrzeit verarbeiten
        let appointmentDate;
        if (appointmentData.appointmentDate && appointmentData.appointmentTime) {
          const [year, month, day] = appointmentData.appointmentDate.split('-').map(Number);
          const [hours, minutes] = appointmentData.appointmentTime.split(':').map(Number);
          appointmentDate = new Date(year, month - 1, day, hours, minutes);
        } else {
          // Standarddatum (morgen um 10 Uhr)
          appointmentDate = new Date();
          appointmentDate.setDate(appointmentDate.getDate() + 1);
          appointmentDate.setHours(10, 0, 0, 0);
        }

        appointment = await prisma.appointment.create({
          data: {
            title: appointmentData.title || `Termin mit ${customer.name}`,
            customerId: customer.id,
            appointmentDate,
            duration: appointmentData.duration || 60,
            location: appointmentData.location,
            description: appointmentData.description || existingRequest.message,
            status: appointmentData.status || 'planned',
            createdBy: parseInt(session.user.id)
          }
        });

        // Anfrage mit Termin verknüpfen
        await prisma.contactRequest.update({
          where: { id: requestId },
          data: { appointmentId: appointment.id }
        });

        // Notiz zum Termin
        await prisma.appointmentNote.create({
          data: {
            appointmentId: appointment.id,
            userId: parseInt(session.user.id),
            userName: session.user.name || 'Unbekannt',
            text: `Termin aus Kontaktanfrage erstellt: ${existingRequest.message}`
          }
        });
      }

      return { customer, appointment, request: updatedRequest };
    });

    return NextResponse.json({
      success: true,
      message: 'Kontaktanfrage erfolgreich in Kunden konvertiert',
      data: {
        customer: result.customer,
        appointment: result.appointment,
        request: result.request
      }
    });
  } catch (error) {
    console.error('Error converting request to customer:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}