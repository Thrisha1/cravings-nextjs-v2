// /app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptText } from './lib/encrtption';

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Mobile|Android|iP(hone|od|ad)/.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  const isBrowser = userAgent.includes("Chrome");

  const requestHeaders = request.headers.get('user-agent') + "\n" ;
  const partsInParanthesis = requestHeaders.split('(')[1]?.split(')')[0] || '';

  const segments = partsInParanthesis.split(';').map(s => s.trim());
  const deviceName =  segments.length >= 3 ? segments[2] : null;


  // Handle QR scan deep links
  if (pathname.startsWith('/qrScan/')) {

    console.log('QR Scan detected:', pathname);

  // This logic is specifically for Android. We assume 'isMobile' is true and 'isIOS' is false.
  // The main challenge is that the Android app is a WebView of the same site.

  // --- Solution ---
  // We need to detect if the user is in the WebView or a standard mobile browser.
  // The recommended way is to inject a JavaScript interface from your Android app.
  //
  // In your Android app's Kotlin/Java code, add this:
  // webView.addJavascriptInterface(WebAppInterface(this), "AndroidApp")
  //
  // This makes the 'AndroidApp' object available in the window scope inside the WebView.

  // 1. Define URLs
  const playStoreUrl = `https://play.google.com/store/apps/details?id=com.notime.cravings&referrer=${encodeURIComponent(pathname)}`;

  // 2. Create an Android Intent URL.
  // This will try to open the app. If the app is not installed, the 'S.browser_fallback_url'
  // will redirect the user to the Play Store.
  // Note: The 'pathname' is used to pass the specific QR scan data to the app.
  const intentUrl = `intent://${pathname.substring(1)}#Intent;scheme=cravings;package=com.notime.cravings;S.browser_fallback_url=${encodeURIComponent(playStoreUrl)};end`;

  // 3. Create an optimized HTML response with client-side detection logic
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Redirecting...</title>
      <script>
        if (${isMobile}) {
          // --- User is inside your WebView App ---
          // The app is already open, so we let the WebView load the URL.
          // No redirection is needed. Your web app's routing should handle the path.
          console.log('Inside Cravings WebView. Loading content directly.');
          // window.location.href = "https://www.cravings.live${pathname}";
        } else {
          // --- User is in a standard mobile browser ---
          // Try to open the app via the intent URL.
          // If the app is not installed, the fallback URL (Play Store) will be used.
          console.log('In mobile browser. Attempting to open app or redirect to Play Store.');
          window.location.href = "${intentUrl}";
        }
      </script>
    </head>
    <body>
      <p>Opening Cravings app...</p>
      <pre>${requestHeaders}</pre>
      <p>Parts In Parenthesis: ${partsInParanthesis}</p>
      <p>Device Name: ${deviceName}</p>
      <p>Is Browser: ${isBrowser}</p>
      <p>If you are not redirected, please <a href="${intentUrl}">click
      <a href="${playStoreUrl}">If you are not redirected, click here to install the Cravings app.</a>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });

}

  // Rest of your existing middleware logic
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