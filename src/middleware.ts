// /app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptText } from '@/lib/encrtption';

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/superlogin', '/hotels', '/partner', '/offers','/explore'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Special case: Redirect partners from root to /admin
  if (pathname === '/') {
    if (authToken) {
      try {
        const decrypted = decryptText(authToken) as { id: string; role: string; status?: string };
        if (decrypted?.role === 'partner') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      } catch (error) {
        console.error('Error decrypting token:', error);
        // Continue with normal flow if there's an error
      }
    }
    return NextResponse.next();
  }

  // Route access rules by role
  const roleAccessRules = {
    user: {
      allowed: ['/profile'],
      redirect: '/login'
    },
    partner: {
      allowed: ['/admin', '/partner', '/profile', '/admin/orders'],
      redirect: '/login'
    },
    superadmin: {
      allowed: ['/superadmin', '/admin', '/profile'],
      redirect: '/superLogin'
    }
  };

  // Allowed routes for inactive partners (exact matches only)
  const inactivePartnerAllowedRoutes = [
    '/admin',        // Only exact match, not /admin/*
    '/profile',
    '/offers',
    '/explore',
    '/',
    '/login',
    '/partner'
  ];

  // Check if trying to access a protected route
  const isProtectedRoute = Object.values(roleAccessRules)
    .some(rule => rule.allowed.some(route => pathname.startsWith(route))) ||
    inactivePartnerAllowedRoutes.includes(pathname); // Note: using includes() for exact match

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // If no auth token, redirect based on the route
  if (!authToken) {
    const isSuperadminRoute = pathname.startsWith('/superadmin');
    const redirectPath = isSuperadminRoute ? '/superLogin' : '/login';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  try {
    const decrypted = decryptText(authToken) as { id: string; role: string; status?: string };
    
    if (!decrypted?.id || !decrypted?.role) {
      throw new Error('Invalid token structure');
    }

    const userRole = decrypted.role as keyof typeof roleAccessRules;
    const userRules = roleAccessRules[userRole] || roleAccessRules.user;

    // Special handling for inactive partners
    if (userRole === 'partner' && decrypted.status === 'inactive') {
      // For inactive partners, only allow exact matches to the allowed routes
      const isAllowedRoute = inactivePartnerAllowedRoutes.includes(pathname);
      
      // Special case: allow /admin but not /admin/*
      if (pathname.startsWith('/admin/') || (pathname === '/admin' && !isAllowedRoute)) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      
      if (!isAllowedRoute) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } else {
      // Normal role-based access check for active users
      const hasAccess = userRules.allowed.some(route => pathname.startsWith(route));
      if (!hasAccess) {
        return NextResponse.redirect(new URL(userRules.redirect, request.url));
      }
    }

    // Add user info to headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decrypted.id);
    requestHeaders.set('x-user-role', decrypted.role);
    if (decrypted.status) {
      requestHeaders.set('x-user-status', decrypted.status);
    }

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