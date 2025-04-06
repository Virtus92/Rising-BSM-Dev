import { NextResponse } from 'next/server';

/**
 * Handle public request form submissions
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.service || !data.message) {
      return NextResponse.json(
        { success: false, message: 'Alle Pflichtfelder müssen ausgefüllt sein' },
        { status: 400 }
      );
    }

    // In a real implementation, you would save this to a database
    console.log('Received request:', data);

    // Mock saving the request and return success
    return NextResponse.json(
      { 
        success: true, 
        message: 'Anfrage erfolgreich gesendet',
        data: {
          id: Math.floor(Math.random() * 10000), // Mock ID
          createdAt: new Date().toISOString(),
          status: 'new'
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, message: 'Ein Fehler ist aufgetreten beim Verarbeiten der Anfrage' },
      { status: 500 }
    );
  }
}
