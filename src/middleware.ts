// /app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptText } from './lib/encrtption';

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Try to decrypt token early for captain guard
  let decrypted: { id: string; role: string; status?: string } | undefined;
  if (authToken) {
    try {
      decrypted = decryptText(authToken) as { id: string; role: string; status?: string };
    } catch (e) {}
  }

  // CAPTAIN GUARD: Trap captain on /captain before public route check
  if (
    decrypted?.role === 'captain' &&
    !(pathname === '/captain' || pathname.startsWith('/kot/') || pathname.startsWith('/bill/'))
  ) {
    return NextResponse.redirect(new URL('/captain', request.url));
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/superLogin', 
    '/hotels',
    '/partner',
    '/offers',
    '/explore',
    '/captainlogin',
    '/about-us',
    '/api/auth',
    '/captainlogin',
    '/partnerlogin',
    '/newlogin',
    '/demo'
  ];

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Handle root path redirects based on role
  if (pathname === '/') {
    if (authToken) {
      try {
        const decrypted = decryptText(authToken) as { 
          id: string; 
          role: string; 
          status?: string 
        };

        // Superadmin always redirects to /superadmin
        if (decrypted?.role === 'superadmin') {
          return NextResponse.redirect(new URL('/superadmin', request.url));
        }
        
        // Partner redirects to /admin
        if (decrypted?.role === 'partner') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        
        // Regular users stay on home page
        return NextResponse.next();
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
      allowed: ['/profile', '/my-orders'],
      redirect: '/'
    },
    partner: {
      allowed: ['/admin', '/partner', '/profile', '/admin/orders','/admin/captain-management'],
      redirect: '/'
    },
    superadmin: {
      allowed: ['/superadmin', '/admin', '/profile', '/superadmin/create-partner'],
      redirect: '/'
    },
    captain:{
      allowed:['/captain', '/captain/pos'],
      redirect:'/'
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
    inactivePartnerAllowedRoutes.includes(pathname);

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // If no auth token, redirect based on the route
  if (!authToken) {
    const isSuperadminRoute = pathname.startsWith('/superadmin');
    const redirectPath = isSuperadminRoute ? '/' : '/';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  try {
    const decrypted = decryptText(authToken) as { 
      id: string; 
      role: string; 
      status?: string 
    };
    
    if (!decrypted?.id || !decrypted?.role) {
      throw new Error('Invalid token structure');
    }

    // Captain route guard: trap captain on /captain
    if (decrypted.role === 'captain') {
      // Allow only the exact /captain path
      if (pathname !== '/captain') {
        return NextResponse.redirect(new URL('/captain', request.url));
      }
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
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     * - api/auth (auth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)',
  ],
};