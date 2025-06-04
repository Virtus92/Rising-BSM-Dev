import { NextRequest, NextResponse } from 'next/server';
import { testApiKeySystem } from '@/test-api-keys';

export async function GET(request: NextRequest) {
  try {
    console.log('Running API Key System Diagnostics...');
    await testApiKeySystem();
    
    return NextResponse.json({
      success: true,
      message: 'API Key system diagnostics completed successfully. Check server logs for details.'
    });
    
  } catch (error) {
    console.error('Diagnostics failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'API Key system diagnostics failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
