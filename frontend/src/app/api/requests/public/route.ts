import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/requests/public
 * 
 * Erstellt eine neue öffentliche Kontaktanfrage (ohne Authentifizierung).
 */
export async function POST(request: NextRequest) {
  try {
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
    
    // E-Mail-Format validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Ungültige E-Mail-Adresse', 
          errors: ['Die angegebene E-Mail-Adresse hat ein ungültiges Format'] 
        },
        { status: 400 }
      );
    }
    
    // IP-Adresse des Clients ermitteln (falls verfügbar)
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    
    // Anti-Spam-Maßnahme: Überprüfe, ob in den letzten 5 Minuten bereits eine Anfrage von dieser IP kam
    const recentRequest = await prisma.contactRequest.findFirst({
      where: {
        ipAddress: ipAddress.split(',')[0],
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // 5 Minuten
        }
      }
    });
    
    if (recentRequest) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Zu viele Anfragen', 
          errors: ['Bitte warten Sie einige Minuten, bevor Sie eine weitere Anfrage senden'] 
        },
        { status: 429 }
      );
    }
    
    // Neue Anfrage erstellen
    const newRequest = await prisma.contactRequest.create({
      data: {
        name,
        email,
        phone,
        service,
        message,
        status: 'new',
        ipAddress: ipAddress.split(',')[0] // Erste IP-Adresse bei mehreren
      }
    });
    
    // Erfolgsantwort
    return NextResponse.json({
      success: true,
      message: 'Vielen Dank für Ihre Anfrage! Wir werden uns in Kürze bei Ihnen melden.',
      data: {
        id: newRequest.id,
        createdAt: newRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating public request:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Entschuldigung, beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.'
      },
      { status: 500 }
    );
  }
}
