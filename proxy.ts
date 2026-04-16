import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { type JwtPayload, verify as jwtVerify } from 'jsonwebtoken';
import { getJwtSecret } from './lib/auth/jwt-secret';

import {
  authRateLimit,
  rateLimit,
} from './lib/middleware/rate-limit';
import {
  logSecurityEvent,
  securityAuditMiddleware,
} from './lib/middleware/security-audit';

const JWT_SECRET = getJwtSecret();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

type ClienteJwtPayload = JwtPayload & {
  clienteId: string;
  tipo: 'cliente';
};

function isClienteJwtPayload(payload: string | JwtPayload): payload is ClienteJwtPayload {
  if (typeof payload === 'string') {
    return false;
  }

  return (
    payload.tipo === 'cliente' &&
    typeof payload.clienteId === 'string' &&
    payload.clienteId.trim().length > 0
  );
}

function buildCspHeader(): string {
  const scriptSrc = IS_PRODUCTION
    ? "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com;"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com;";
  const connectSrc = IS_PRODUCTION
    ? "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com;"
    : "connect-src 'self' ws://localhost:3000 wss://localhost:3000 ws://127.0.0.1:3000 wss://127.0.0.1:3000 https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com;";

  return [
    "default-src 'self';",
    scriptSrc,
    "worker-src 'self' blob:;",
    connectSrc,
    "style-src 'self' 'unsafe-inline';",
    "img-src 'self' data: https: https://*.clerk.accounts.dev https://*.clerk.com;",
    "font-src 'self' data:;",
  ].join(' ');
}

// Define public routes (no Clerk authentication required)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/portal/cliente/login',
  '/api/auth/cliente/login',
  '/api/webhooks(.*)',
  '/api/health',
  '/api/cep(.*)',
  '/api/cnpj(.*)',
  '/api/cpf(.*)',
  '/_next(.*)',
  '/favicon.ico',
]);

// Define client portal routes (separate authentication system)
const isClientPortalRoute = createRouteMatcher([
  '/portal/cliente(.*)',
  '/api/portal/cliente(.*)',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // 1. Security audit (first line of defense)
  const securityResponse = securityAuditMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Rate limiting for API endpoints
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) {
      logSecurityEvent(request, 'rate_limit_exceeded', 'medium', {
        endpoint: pathname,
        method: request.method,
      });
      return rateLimitResponse;
    }
  }

  // 3. Auth-specific rate limiting
  const authRateLimitedEndpoints = [
    '/api/auth/register',
    '/api/auth/reset-password',
    '/api/auth/cliente/login',
    '/api/auth/cliente',
  ];
  const isAuthRateLimitedEndpoint =
    request.method === 'POST' &&
    authRateLimitedEndpoints.some(route => pathname.startsWith(route));

  if (isAuthRateLimitedEndpoint) {
    const authRateLimitResponse = authRateLimit(request);
    if (authRateLimitResponse) {
      logSecurityEvent(request, 'rate_limit_exceeded', 'high', {
        endpoint: pathname,
        method: request.method,
        type: 'authentication',
      });
      return authRateLimitResponse;
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  if (IS_PRODUCTION) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // CSP allowing Clerk domains
  response.headers.set(
    'Content-Security-Policy',
    buildCspHeader()
  );

  // 4. Allow public routes
  if (isPublicRoute(request)) {
    return response;
  }

  // 5. Client portal authentication (separate from Clerk)
  if (isClientPortalRoute(request)) {
    const clienteToken = request.cookies.get('cliente-token')?.value || null;

    if (!clienteToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Token de cliente necessário',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        );
      }

      return NextResponse.redirect(
        new URL('/portal/cliente/login', request.url)
      );
    }

    try {
      const decoded = jwtVerify(clienteToken, JWT_SECRET);
      if (!isClienteJwtPayload(decoded)) {
        throw new Error('invalid_cliente_payload');
      }
      return response;
    } catch {
      const redirectResponse = NextResponse.redirect(
        new URL('/portal/cliente/login', request.url)
      );
      redirectResponse.cookies.delete('cliente-token');
      return redirectResponse;
    }
  }

  // 6. Protect all other routes with Clerk
  await auth.protect();

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
