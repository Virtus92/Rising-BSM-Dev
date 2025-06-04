import { NextRequest, NextResponse } from 'next/server';
import { runCompleteDiagnostics } from '@/diagnostic-api-keys';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Running Complete API Key System Diagnostics...');
    const diagnosticResults = await runCompleteDiagnostics();
    
    return NextResponse.json({
      success: true,
      message: 'API Key system diagnostics completed. Check server logs for detailed results.',
      diagnostics: diagnosticResults
    });
    
  } catch (error) {
    console.error('❌ Comprehensive diagnostics failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'API Key system diagnostics failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
