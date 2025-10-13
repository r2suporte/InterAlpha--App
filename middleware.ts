import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify as jwtVerify } from 'jsonwebtoken';

import { verifyJWT } from './lib/auth/jwt';
import { authRateLimit, rateLimit } from './lib/middleware/rate-limit';
import {
  logSecurityEvent,
  securityAuditMiddleware,
} from './lib/middleware/security-audit';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Auditoria de segurança (primeira linha de defesa)
  const securityResponse = securityAuditMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }

  // 2. Aplicar rate limiting primeiro
  // Aplicar rate limiting apenas para endpoints da API
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) {
      // Log do rate limit excedido
      logSecurityEvent(request, 'rate_limit_exceeded', 'medium', {
        endpoint: request.nextUrl.pathname,
        method: request.method,
      });
      return rateLimitResponse;
    }
  }

  // 3. Rate limiting específico para endpoints de autenticação (somente API e métodos POST)
  const authRateLimitedEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/reset-password',
    '/api/auth/cliente/login',
    '/api/auth/cliente/register',
  ];
  const isAuthRateLimitedEndpoint =
    request.method === 'POST' &&
    authRateLimitedEndpoints.some(route => pathname.startsWith(route));

  if (isAuthRateLimitedEndpoint) {
    const authRateLimitResponse = authRateLimit(request);
    if (authRateLimitResponse) {
      logSecurityEvent(request, 'rate_limit_exceeded', 'high', {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        type: 'authentication',
      });
      return authRateLimitResponse;
    }
  }

  // Adicionar headers de segurança
  const response = NextResponse.next();

  // Headers de segurança básicos
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSP básico para prevenir XSS
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/portal/cliente/login',
    '/portal/cliente/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/cliente/login',
    '/api/auth/cliente/register',
    '/api/webhooks',
    '/_next',
    '/favicon.ico',
    '/api/health',
  ];

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(
    route => pathname === route || pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return response;
  }

  // 4. Fluxo específico para portal do cliente: aceitar "cliente-token" em vez de "auth-token"
  const isClientPortalRoute =
    pathname.startsWith('/portal/cliente') ||
    pathname.startsWith('/api/portal/cliente');

  if (isClientPortalRoute) {
    const clienteToken = request.cookies.get('cliente-token')?.value || null;

    if (!clienteToken) {
      // Sem token do cliente
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
      const decoded = jwtVerify(clienteToken, JWT_SECRET) as any;

      // Verificar expiração
      if (decoded?.exp && decoded.exp < Date.now() / 1000) {
        logSecurityEvent(request, 'invalid_token', 'low', {
          reason: 'Client token expired',
        });
        const redirectResponse = pathname.startsWith('/api/')
          ? NextResponse.json(
              {
                error: 'Token inválido ou expirado',
                code: 'INVALID_TOKEN',
                timestamp: new Date().toISOString(),
              },
              { status: 401 }
            )
          : NextResponse.redirect(
              new URL('/portal/cliente/login', request.url)
            );
        redirectResponse.cookies.delete('cliente-token');
        return redirectResponse;
      }

      // Validar tipo do token
      if (decoded?.tipo !== 'cliente') {
        logSecurityEvent(request, 'invalid_token', 'medium', {
          reason: 'Invalid client token type',
        });

        const redirectResponse = pathname.startsWith('/api/')
          ? NextResponse.json(
              {
                error: 'Token inválido ou expirado',
                code: 'INVALID_TOKEN',
                timestamp: new Date().toISOString(),
              },
              { status: 401 }
            )
          : NextResponse.redirect(
              new URL('/portal/cliente/login', request.url)
            );
        redirectResponse.cookies.delete('cliente-token');
        return redirectResponse;
      }

      // Para APIs do portal do cliente, anexar headers úteis
      if (pathname.startsWith('/api/')) {
        const requestHeaders = new Headers(request.headers);
        if (decoded?.clienteId) {
          requestHeaders.set('x-cliente-id', String(decoded.clienteId));
        }
        requestHeaders.set('x-user-role', 'cliente');
        requestHeaders.set('x-user-email', decoded?.email || '');

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }

      // Para páginas do portal do cliente, seguir fluxo normal
      return response;
    } catch (error) {
      logSecurityEvent(request, 'invalid_token', 'medium', {
        reason: 'Invalid client token signature or format',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Token inválido ou expirado',
            code: 'INVALID_TOKEN',
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        );
      }

      const redirectResponse = NextResponse.redirect(
        new URL('/portal/cliente/login', request.url)
      );
      redirectResponse.cookies.delete('cliente-token');
      return redirectResponse;
    }
  }

  // Verificar token de autenticação
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    // Redirecionar para login se não houver token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Token de autenticação necessário',
          code: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const loginUrl = pathname.startsWith('/portal/cliente')
      ? '/portal/cliente/login'
      : '/auth/login';
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  try {
    // Verificar se o token é válido
    const payload = await verifyJWT(token);

    // Verificar se o token não expirou
    if (payload.exp && payload.exp < Date.now() / 1000) {
      // Token expirado - log e limpar cookie
      logSecurityEvent(
        request,
        'invalid_token',
        'low',
        {
          reason: 'Token expired',
          userId: payload.userId,
        },
        payload.userId
      );

      throw new Error('Token expirado');
    }

    // Adicionar informações do usuário aos headers para as rotas da API
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-role', payload.role);
      requestHeaders.set('x-user-email', payload.email || '');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return response;
  } catch (error) {
    // Token inválido ou expirado - log de segurança
    logSecurityEvent(request, 'invalid_token', 'medium', {
      reason: 'Invalid token signature or format',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    console.warn('Token inválido ou expirado:', error);

    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Token inválido ou expirado',
          code: 'INVALID_TOKEN',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const loginUrl = pathname.startsWith('/portal/cliente')
      ? '/portal/cliente/login'
      : '/auth/login';
    const redirectResponse = NextResponse.redirect(
      new URL(loginUrl, request.url)
    );

    // Limpar cookie de autenticação inválido
    redirectResponse.cookies.delete('auth-token');

    return redirectResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
