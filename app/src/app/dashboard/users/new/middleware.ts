import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if this is an SPA navigation (client-side) using the Next.js router
  // or a direct navigation/refresh
  const isClientNavigation = request.headers.get('x-nextjs-data') !== null;
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  
  if (isClientNavigation || isApiRoute) {
    // For client-side navigation and API requests, we should just pass through
    // and let the frontend handle showing the modal
    return NextResponse.next();
  } else {
    // For direct navigation (browser URL, refresh, bookmark), redirect to the user list
    // with a query parameter to open the modal
    const url = new URL('/dashboard/users?openNewUserModal=true', request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/dashboard/users/new'],
};
