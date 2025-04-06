import { NextRequest, NextResponse } from 'next/server';
import { openApiDocument } from '@/lib/server/core/openapi';
import { config } from '@/lib/server/config/env';

/**
 * GET /api/docs
 * Liefert die OpenAPI-Dokumentation als JSON
 */
export async function GET(req: NextRequest) {
  // In Produktion kann optional ein API-Key für den Zugriff verlangt werden
  if (config.isProduction) {
    const apiKey = req.headers.get('x-api-key');
    const docsApiKey = process.env.DOCS_API_KEY;
    
    if (docsApiKey && apiKey !== docsApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ungültiger API-Schlüssel',
          meta: { timestamp: new Date().toISOString() }
        },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.json(openApiDocument);
}
