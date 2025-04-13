// /app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptText } from '@/lib/encrtption';

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/superlogin'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Route access rules by role
  const roleAccessRules = {
    user: {
      allowed: ['/profile'],
      redirect: '/login'
    },
    partner: {
      allowed: ['/admin', '/partner', '/profile'],
      redirect: '/login'
    },
    superadmin: {
      allowed: ['/superadmin', '/admin', '/profile'],
      redirect: '/superLogin'
    }
  };

  // Check if trying to access a protected route
  const isProtectedRoute = Object.values(roleAccessRules)
    .some(rule => rule.allowed.some(route => pathname.startsWith(route)));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // If no auth token, redirect based on the route
  if (!authToken) {
    const isSuperadminRoute = pathname.startsWith('/superadmin');
    const redirectPath = isSuperadminRoute ? '/superlogin' : '/login';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  try {
    const decrypted = decryptText(authToken) as { id: string; role: string };
    
    if (!decrypted?.id || !decrypted?.role) {
      throw new Error('Invalid token structure');
    }

    const userRole = decrypted.role as keyof typeof roleAccessRules;
    const userRules = roleAccessRules[userRole] || roleAccessRules.user;

    // Check if user has access to the requested route
    const hasAccess = userRules.allowed.some(route => pathname.startsWith(route));
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL(userRules.redirect, request.url));
    }

    // Add user info to headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decrypted.id);
    requestHeaders.set('x-user-role', decrypted.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
    
  } catch (error) {
    console.error('Auth verification failed:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)',
  ],
};