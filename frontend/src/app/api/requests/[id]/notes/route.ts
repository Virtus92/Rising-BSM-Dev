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
 * POST /api/requests/[id]/notes
 * 
 * Fügt eine Notiz zu einer Kontaktanfrage hinzu.
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
    const { text } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Notiztext ist erforderlich' },
        { status: 400 }
      );
    }

    // Notiz erstellen
    const newNote = await prisma.requestNote.create({
      data: {
        requestId,
        userId: parseInt(session.user.id),
        userName: session.user.name || 'Unbekannt',
        text
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notiz erfolgreich hinzugefügt',
      data: {
        ...newNote,
        createdAt: newNote.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding note to request:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/requests/[id]/notes
 * 
 * Ruft alle Notizen einer Kontaktanfrage ab.
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

    // Notizen abrufen
    const notes = await prisma.requestNote.findMany({
      where: { requestId },
      orderBy: { createdAt: 'desc' }
    });

    // Formatierte Antwort
    const formattedNotes = notes.map(note => ({
      id: note.id,
      requestId: note.requestId,
      userId: note.userId,
      userName: note.userName,
      text: note.text,
      createdAt: note.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: formattedNotes
    });
  } catch (error) {
    console.error('Error fetching request notes:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}