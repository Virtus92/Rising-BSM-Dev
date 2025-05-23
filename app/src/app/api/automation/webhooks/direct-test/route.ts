/**
 * Direct Webhook Test Route - No frameworks, no abstractions
 * 
 * This bypasses all our existing code to test the raw fetch behavior
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl } = body;
    
    console.log('\n=== DIRECT ROUTE TEST ===');
    console.log('Testing URL:', webhookUrl);
    console.log('Runtime:', process.version);
    console.log('Fetch type:', typeof fetch);
    
    // Test 1: Most basic POST request
    console.log('\nTest 1: Basic POST');
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
      return NextResponse.json({
        test: 'basic-post',
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });
    } catch (error: any) {
      console.error('Basic POST error:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error stack:', error.stack);
      
      return NextResponse.json({
        test: 'basic-post',
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack
      }, { status: 500 });
    }
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to parse request',
      details: error.message
    }, { status: 400 });
  }
}

// Also test with GET to see if it's method-specific
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }
  
  console.log('\n=== GET REQUEST TEST ===');
  console.log('Testing URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('GET Response status:', response.status);
    
    return NextResponse.json({
      method: 'GET',
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error: any) {
    return NextResponse.json({
      method: 'GET',
      error: error.message,
      errorType: error.constructor.name
    }, { status: 500 });
  }
}
