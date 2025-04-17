import { NextResponse } from 'next/server';
import { bootstrap } from '@/infrastructure/common/bootstrap';

export async function GET() {
  try {
    await bootstrap();
    return NextResponse.json({ success: true, message: 'Bootstrap completed successfully' });
  } catch (error) {
    console.error('Error during bootstrap:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: 'Bootstrap failed', error: errorMessage }, { status: 500 });
  }
}