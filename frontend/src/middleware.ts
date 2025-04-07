/**
 * Global Middleware für Next.js
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAccessToken, isTokenExpired, refreshAccessToken } from '@/lib/auth';

/**
 * Middleware-Konfiguration für Next.js
 * 
 * Diese Middleware wird für alle Anfragen ausgeführt
 