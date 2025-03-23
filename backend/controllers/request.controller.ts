import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.utils.js';
import { formatDateSafely } from '../utils/formatters.js';
import { getAnfrageStatusInfo } from '../utils/helpers.js';
import { NotFoundError, ValidationError, BadRequestError } from '../utils/errors.js';
import { validateInput } from '../utils/validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/authenticated-request.js';
import { ResponseFactory } from '../utils/response.factory.js';
import config from '../config/index.js';

// Typen-Definitionen
interface RequestFilterOptions {
  status?: string;
  service?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Alle Anfragen mit optionaler Filterung abrufen
 */
export const getAllRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Filter-Parameter extrahieren
  const { 
    status, 
    service, 
    date, 
    search, 
    page = 1, 
    limit = config.DEFAULT_PAGE_SIZE 
  } = req.query as unknown as RequestFilterOptions;

  // Validieren und bereinigen der Paginierungsparameter
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(config.MAX_PAGE_SIZE, Math.max(1, Number(limit) || config.DEFAULT_PAGE_SIZE));
  const skip = (pageNumber - 1) * pageSize;

  // Filter-Bedingungen aufbauen
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (service) {
    where.service = service;
  }
  
  if (date) {
    where.createdAt = {
      gte: new Date(`${date}T00:00:00`),
      lt: new Date(`${date}T23:59:59`)
    };
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Abfragen parallel ausführen
  const [requests, totalCount] = await Promise.all([
    prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip
    }),
    prisma.contactRequest.count({ where })
  ]);

  // Anfragedaten mit expliziter Typisierung formatieren
  interface RequestRecord {
    id: number;
    name: string;
    email: string;
    service: string;
    createdAt: Date;
    status: string;
  }
  
  const formattedRequests = requests.map((request: RequestRecord) => {
    const statusInfo = getAnfrageStatusInfo(request.status);
    return {
      id: request.id,
      name: request.name,
      email: request.email,
      serviceLabel: request.service === 'facility' ? 'Facility Management' : 
                   request.service === 'moving' ? 'Umzüge & Transporte' : 
                   request.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
      formattedDate: formatDateSafely(request.createdAt, 'dd.MM.yyyy'),
      status: statusInfo.label,
      statusClass: statusInfo.className
    };
  });

  // Paginierungsdaten berechnen
  const totalPages = Math.ceil(totalCount / pageSize);

  // Mit ResponseFactory antworten
  ResponseFactory.paginated(
    res,
    formattedRequests,
    {
      current: pageNumber,
      limit: pageSize,
      total: totalPages,
      totalRecords: totalCount
    },
    'Anfragen erfolgreich abgerufen'
  );
});

/**
 * Anfrage anhand ID mit zugehörigen Daten abrufen
 */
export const getRequestById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  const requestId: number = Number(id);
  
  if (isNaN(requestId)) {
    throw new BadRequestError('Ungültige Anfrage-ID');
  }

  // Anfrage-Details abrufen
  const request = await prisma.contactRequest.findUnique({
    where: { id: requestId }
  });
  
  if (!request) {
    throw new NotFoundError(`Anfrage mit ID ${requestId} nicht gefunden`);
  }
  
  const statusInfo = getAnfrageStatusInfo(request.status);

  // Notizen für diese Anfrage abrufen
  const notes = await prisma.requestNote.findMany({
    where: { requestId },
    orderBy: { createdAt: 'desc' }
  });
  
  interface NoteRecord {
    id: number;
    text: string;
    createdAt: Date;
    userName: string;
  }
  
  // Anfragedaten für die Antwort formatieren
  const result = {
    request: {
      id: request.id,
      name: request.name,
      email: request.email,
      phone: request.phone || 'Nicht angegeben',
      serviceLabel: request.service === 'facility' ? 'Facility Management' : 
                    request.service === 'moving' ? 'Umzüge & Transporte' : 
                    request.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
      message: request.message,
      formattedDate: formatDateSafely(request.createdAt, 'dd.MM.yyyy'),
      status: request.status,
      statusLabel: statusInfo.label,
      statusClass: statusInfo.className
    },
    notes: notes.map((note: NoteRecord) => ({
      id: note.id,
      text: note.text,
      formattedDate: formatDateSafely(note.createdAt, 'dd.MM.yyyy, HH:mm'),
      benutzer: note.userName
    }))
  };
  
  // Mit ResponseFactory antworten
  ResponseFactory.success(res, result, 'Anfrage erfolgreich abgerufen');
});

/**
 * Anfrage-Status aktualisieren
 */
export const updateRequestStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id, status, note } = req.body;
  const requestId = Number(id);
  
  if (isNaN(requestId)) {
    throw new BadRequestError('Ungültige Anfrage-ID');
  }
  
  // Validierung
  if (!status) {
    throw new ValidationError('Status ist erforderlich', ['Status ist erforderlich']);
  }
  
  // Gültige Status-Werte prüfen
  if (!['neu', 'in_bearbeitung', 'beantwortet', 'geschlossen'].includes(status)) {
    throw new ValidationError('Ungültiger Status-Wert', 
      ['Status muss einer der folgenden sein: neu, in_bearbeitung, beantwortet, geschlossen']);
  }
  
  // Prüfen, ob Anfrage existiert
  const request = await prisma.contactRequest.findUnique({
    where: { id: requestId }
  });
  
  if (!request) {
    throw new NotFoundError(`Anfrage mit ID ${requestId} nicht gefunden`);
  }
  
  await prisma.$transaction(async (tx: any) => {
    // Status in der Datenbank aktualisieren
    await tx.contactRequest.update({
      where: { id: requestId },
      data: {
        status,
        updatedAt: new Date()
      }
    });
    
    // Notiz hinzufügen, falls vorhanden und Benutzer existiert
    if (note && note.trim() !== '' && req.user?.id) {
      await tx.requestNote.create({
        data: {
          requestId,
          userId: req.user.id,
          userName: req.user.name || 'Unbekannt',
          text: note
        }
      });
    }
    
    // Statusänderung protokollieren
    if (req.user?.id) {
      await tx.requestLog.create({
        data: {
          requestId,
          userId: req.user.id,
          userName: req.user.name || 'Unbekannt',
          action: 'status_changed',
          details: `Status geändert auf: ${status}`
        }
      });
    }
  });

  // Mit ResponseFactory antworten
  ResponseFactory.success(
    res, 
    { 
      requestId,
      status
    }, 
    'Anfrage-Status erfolgreich aktualisiert'
  );
});

/**
 * Eine Notiz zur Anfrage hinzufügen
 */
export const addRequestNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const requestId = Number(id);
  const { note } = req.body;
  
  if (isNaN(requestId)) {
    throw new BadRequestError('Ungültige Anfrage-ID');
  }
  
  if (!note || note.trim() === '') {
    throw new ValidationError('Notiz darf nicht leer sein', ['Notiz darf nicht leer sein']);
  }
  
  // Prüfen, ob Anfrage existiert
  const request = await prisma.contactRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new NotFoundError(`Anfrage mit ID ${requestId} nicht gefunden`);
  }
  
  // Notiz in die Datenbank einfügen - nur wenn userId existiert
  let createdNote;
  
  if (req.user?.id) {
    createdNote = await prisma.requestNote.create({
      data: {
        requestId,
        userId: req.user.id,
        userName: req.user?.name || 'Unbekannt',
        text: note
      }
    });
    
    // Hinzufügen der Notiz protokollieren
    await prisma.requestLog.create({
      data: {
        requestId,
        userId: req.user.id,
        userName: req.user.name || 'Unbekannt',
        action: 'note_added',
        details: 'Notiz zur Anfrage hinzugefügt'
      }
    });
  } else {
    // Fall behandeln, wenn keine Benutzer-ID verfügbar ist
    console.warn('Notiz ohne Benutzerkontext hinzugefügt');
  }

  // Mit ResponseFactory antworten
  ResponseFactory.created(
    res, 
    {
      requestId,
      noteId: createdNote?.id
    }, 
    'Notiz erfolgreich hinzugefügt'
  );
});

/**
 * Anfragedaten exportieren
 */
export const exportRequests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Mit ResponseFactory antworten
  ResponseFactory.status(
    res,
    'Exportfunktionalität wird auf TypeScript und Prisma migriert',
    501 // Not Implemented
  );
});