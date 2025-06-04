import { NextRequest, NextResponse } from 'next/server';
import { autoFixApiKeySystem } from '@/fix-api-keys';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Running API Key System Auto-Fix...');
    const fixResults = await autoFixApiKeySystem();
    
    return NextResponse.json({
      success: fixResults.errors.length === 0,
      message: 'API Key system auto-fix completed. Check server logs for detailed results.',
      fixes: fixResults
    });
    
  } catch (error) {
    console.error('❌ Auto-fix failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'API Key system auto-fix failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
