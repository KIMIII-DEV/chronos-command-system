import { verifySession } from '../server/session';

/**
 * CHRONOS OSS - GLOBAL AUTH GUARD (A1.1)
 * Cloudflare Pages Middleware for security enforcement.
 */

export const onRequest: PagesFunction = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // 1. Set Security Headers (A6.2)
  const response = await next();
  const headers = new Headers(response.headers);
  
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co;");
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 2. Auth Protection for Private Layer
  if (url.pathname.startsWith('/private') || url.pathname.startsWith('/api/chronos')) {
    // Support both Header and Cookie for flexibility (A1.2)
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');
    
    let token = '';
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookieHeader) {
      const cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.trim().split('=')));
      token = cookies['session'];
    }

    if (!token) {
      return new Response('Unauthorized: Missing Token', { status: 401 });
    }

    const session = await verifySession(token);

    if (!session) {
      return new Response('Unauthorized: Invalid or Expired Session', { status: 401 });
    }

    // 3. RBAC Enforcement (A1.3)
    // If accessing admin-only routes
    if (url.pathname.startsWith('/api/admin') && session.role !== 'admin') {
      return new Response('Forbidden: Admin Clearance Required', { status: 403 });
    }
  }

  return new Response(response.body, {
    ...response,
    headers,
  });
};
