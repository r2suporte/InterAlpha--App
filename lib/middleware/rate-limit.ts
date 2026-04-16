import { NextRequest, NextResponse } from 'next/server';

/**
 * 🛡️ Rate Limiting Middleware - InterAlpha App
 *
 * Proteção contra ataques de força bruta e spam
 * Implementa rate limiting baseado em IP e endpoint
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

// Cache em memória para rate limiting (em produção, usar Redis)
const rateLimitCache = new Map<string, RateLimitEntry>();

// Configurações de rate limiting por endpoint
const RATE_LIMITS = {
  // Endpoints de autenticação - mais restritivos
  '/api/auth/login': { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 tentativas por 15 min
  '/api/auth/register': { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 registros por hora
  '/api/auth/reset-password': { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 resets por hora

  // Endpoints de cliente
  '/api/auth/cliente/login': { requests: 5, windowMs: 15 * 60 * 1000 },
  '/api/auth/cliente': { requests: 2, windowMs: 60 * 60 * 1000 },

  // APIs gerais - menos restritivos
  '/api/clientes': { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 req por 15 min
  '/api/ordens-servico': { requests: 100, windowMs: 15 * 60 * 1000 },
  '/api/pagamentos': { requests: 50, windowMs: 15 * 60 * 1000 },

  // Webhooks - mais permissivos
  '/api/webhooks': { requests: 1000, windowMs: 15 * 60 * 1000 },

  // Default para outros endpoints
  default: { requests: 200, windowMs: 15 * 60 * 1000 },
};

/**
 * Obtém o IP real do cliente considerando proxies
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

/**
 * Obtém a configuração de rate limit para um endpoint
 */
function getRateLimitConfig(pathname: string) {
  // Procura por match exato primeiro
  if (RATE_LIMITS[pathname as keyof typeof RATE_LIMITS]) {
    return RATE_LIMITS[pathname as keyof typeof RATE_LIMITS];
  }

  // Procura por match de padrão
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }

  return RATE_LIMITS.default;
}

/**
 * Limpa entradas expiradas do cache
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitCache.entries()) {
    if (now > entry.resetTime) {
      rateLimitCache.delete(key);
    }
  }
}

/**
 * Middleware principal de rate limiting
 */
export function rateLimit(request: NextRequest): NextResponse | null {
  const ip = getClientIP(request);
  const {pathname} = request.nextUrl;
  const config = getRateLimitConfig(pathname);
  const now = Date.now();

  // Limpa entradas expiradas periodicamente
  if (Math.random() < 0.01) {
    // 1% de chance
    cleanupExpiredEntries();
  }

  const key = `${ip}:${pathname}`;
  const entry = rateLimitCache.get(key);

  if (!entry) {
    // Primeira requisição para este IP/endpoint
    rateLimitCache.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
    });
    return null; // Permite a requisição
  }

  if (now > entry.resetTime) {
    // Janela de tempo expirou, reseta o contador
    entry.count = 1;
    entry.resetTime = now + config.windowMs;
    entry.blocked = false;
    return null; // Permite a requisição
  }

  if (entry.blocked) {
    // IP ainda está bloqueado
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Muitas tentativas. Tente novamente mais tarde.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': config.requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      }
    );
  }

  entry.count++;

  if (entry.count > config.requests) {
    // Limite excedido, bloqueia o IP
    entry.blocked = true;

    // Log do bloqueio para monitoramento
    console.warn(
      `Rate limit exceeded for IP ${ip} on ${pathname}. Count: ${entry.count}/${config.requests}`
    );

    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Muitas tentativas. Tente novamente mais tarde.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': config.requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      }
    );
  }

  // Adiciona headers informativos
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', config.requests.toString());
  response.headers.set(
    'X-RateLimit-Remaining',
    (config.requests - entry.count).toString()
  );
  response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

  return null; // Permite a requisição
}

/**
 * Middleware específico para endpoints de autenticação
 * Implementa bloqueio progressivo (backoff exponencial)
 */
export function authRateLimit(request: NextRequest): NextResponse | null {
  const ip = getClientIP(request);
  const now = Date.now();

  const key = `auth:${ip}`;
  const entry = rateLimitCache.get(key);

  if (!entry) {
    rateLimitCache.set(key, {
      count: 1,
      resetTime: now + 15 * 60 * 1000, // 15 minutos
      blocked: false,
    });
    return null;
  }

  if (now > entry.resetTime) {
    // Reset após período de bloqueio
    entry.count = 1;
    entry.resetTime = now + 15 * 60 * 1000;
    entry.blocked = false;
    return null;
  }

  entry.count++;

  // Bloqueio progressivo baseado no número de tentativas
  let blockTime = 0;
  if (entry.count > 5) blockTime = 15 * 60 * 1000; // 15 min após 5 tentativas
  if (entry.count > 10) blockTime = 60 * 60 * 1000; // 1 hora após 10 tentativas
  if (entry.count > 20) blockTime = 24 * 60 * 60 * 1000; // 24 horas após 20 tentativas

  if (blockTime > 0) {
    entry.blocked = true;
    entry.resetTime = now + blockTime;

    console.warn(
      `Auth rate limit exceeded for IP ${ip}. Count: ${entry.count}. Blocked for ${blockTime / 1000}s`
    );

    return new NextResponse(
      JSON.stringify({
        error: 'Authentication rate limit exceeded',
        message:
          'Muitas tentativas de login falharam. Conta temporariamente bloqueada.',
        retryAfter: Math.ceil(blockTime / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(blockTime / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Função para resetar rate limit de um IP (para uso administrativo)
 */
export function resetRateLimit(ip: string, endpoint?: string) {
  if (endpoint) {
    const key = `${ip}:${endpoint}`;
    rateLimitCache.delete(key);
  } else {
    // Remove todas as entradas para este IP
    for (const key of rateLimitCache.keys()) {
      if (key.startsWith(`${ip}:`)) {
        rateLimitCache.delete(key);
      }
    }
  }
}

/**
 * Função para obter estatísticas de rate limiting
 */
export function getRateLimitStats() {
  const stats = {
    totalEntries: rateLimitCache.size,
    blockedIPs: 0,
    topIPs: new Map<string, number>(),
  };

  for (const [key, entry] of rateLimitCache.entries()) {
    if (entry.blocked) {
      stats.blockedIPs++;
    }

    const ip = key.split(':')[0];
    stats.topIPs.set(ip, (stats.topIPs.get(ip) || 0) + entry.count);
  }

  return stats;
}
