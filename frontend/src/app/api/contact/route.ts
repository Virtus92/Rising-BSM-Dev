import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate the form data
    if (!data.name || !data.email || !data.service || !data.message) {
      return NextResponse.json(
        { success: false, message: 'Bitte füllen Sie alle erforderlichen Felder aus.' },
        { status: 400 }
      );
    }
    
    // Make a request to the backend running on port 5000
    const response = await fetch('http://localhost:5000/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        service: data.service,
        message: data.message
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || 'Ein Fehler ist aufgetreten.' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Ihre Nachricht wurde erfolgreich gesendet.',
      requestId: result.requestId
    });
    
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json(
      { success: false, message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    );
  }
}