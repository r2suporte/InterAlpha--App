import { NextRequest, NextResponse } from 'next/server';
/* eslint-disable no-magic-numbers */

import cacheService from '@/lib/services/cache-service';

/**
 * Rate limiting distribuido com Redis + fallback local em memoria.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

const LOCAL_RATE_LIMIT_CACHE = new Map<string, RateLimitEntry>();

const RATE_LIMITS = {
  '/api/auth/login': { requests: 5, windowMs: 15 * 60 * 1000 },
  '/api/auth/register': { requests: 3, windowMs: 60 * 60 * 1000 },
  '/api/auth/reset-password': { requests: 3, windowMs: 60 * 60 * 1000 },
  '/api/auth/cliente/login': { requests: 5, windowMs: 15 * 60 * 1000 },
  '/api/auth/cliente/register': { requests: 2, windowMs: 60 * 60 * 1000 },
  '/api/auth/cliente': { requests: 5, windowMs: 15 * 60 * 1000 },
  '/api/clientes': { requests: 100, windowMs: 15 * 60 * 1000 },
  '/api/ordens-servico': { requests: 100, windowMs: 15 * 60 * 1000 },
  '/api/pagamentos': { requests: 50, windowMs: 15 * 60 * 1000 },
  '/api/webhooks': { requests: 1000, windowMs: 15 * 60 * 1000 },
  default: { requests: 200, windowMs: 15 * 60 * 1000 },
} as const;

const AUTH_ATTEMPTS_WINDOW_SECONDS = 15 * 60;
const AUTH_BLOCK_LEVEL_1_THRESHOLD = 5;
const AUTH_BLOCK_LEVEL_2_THRESHOLD = 10;
const AUTH_BLOCK_LEVEL_3_THRESHOLD = 20;
const AUTH_BLOCK_LEVEL_1_MS = 15 * 60 * 1000;
const AUTH_BLOCK_LEVEL_2_MS = 60 * 60 * 1000;
const AUTH_BLOCK_LEVEL_3_MS = 24 * 60 * 60 * 1000;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

function getRateLimitConfig(pathname: string): RateLimitConfig {
  if (RATE_LIMITS[pathname as keyof typeof RATE_LIMITS]) {
    return RATE_LIMITS[pathname as keyof typeof RATE_LIMITS];
  }

  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }

  return RATE_LIMITS.default;
}

function createRateLimitedResponse(
  error: string,
  message: string,
  retryAfterSeconds: number,
  config?: RateLimitConfig,
  resetAt?: number
): NextResponse {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Retry-After': retryAfterSeconds.toString(),
  };

  if (config && resetAt) {
    headers['X-RateLimit-Limit'] = config.requests.toString();
    headers['X-RateLimit-Remaining'] = '0';
    headers['X-RateLimit-Reset'] = resetAt.toString();
  }

  return new NextResponse(
    JSON.stringify({
      error,
      message,
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers,
    }
  );
}

async function evaluateDistributedWindow(
  key: string,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  count: number;
  retryAfterSeconds: number;
  resetAt: number;
} | null> {
  if (!cacheService.isRedisConnected()) {
    return null;
  }

  const count = await cacheService.increment(key, 1);
  if (count === null) {
    return null;
  }

  const windowSeconds = Math.ceil(config.windowMs / 1000);
  if (count === 1) {
    await cacheService.expire(key, windowSeconds);
  }

  const ttl = await cacheService.getTTL(key);
  const retryAfterSeconds = ttl && ttl > 0 ? ttl : windowSeconds;

  return {
    allowed: count <= config.requests,
    count,
    retryAfterSeconds,
    resetAt: Date.now() + retryAfterSeconds * 1000,
  };
}

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of LOCAL_RATE_LIMIT_CACHE.entries()) {
    if (now > entry.resetTime) {
      LOCAL_RATE_LIMIT_CACHE.delete(key);
    }
  }
}

function evaluateLocalWindow(
  key: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  count: number;
  retryAfterSeconds: number;
  resetAt: number;
} {
  const now = Date.now();
  const existing = LOCAL_RATE_LIMIT_CACHE.get(key);

  if (!existing || now > existing.resetTime) {
    const resetAt = now + config.windowMs;
    LOCAL_RATE_LIMIT_CACHE.set(key, {
      count: 1,
      resetTime: resetAt,
      blocked: false,
    });

    return {
      allowed: true,
      count: 1,
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
      resetAt,
    };
  }

  existing.count += 1;

  if (existing.count > config.requests) {
    existing.blocked = true;
  }

  return {
    allowed: !existing.blocked,
    count: existing.count,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((existing.resetTime - now) / 1000)
    ),
    resetAt: existing.resetTime,
  };
}

function resolveAuthBlockTimeMs(count: number): number {
  if (count > AUTH_BLOCK_LEVEL_3_THRESHOLD) return AUTH_BLOCK_LEVEL_3_MS;
  if (count > AUTH_BLOCK_LEVEL_2_THRESHOLD) return AUTH_BLOCK_LEVEL_2_MS;
  if (count > AUTH_BLOCK_LEVEL_1_THRESHOLD) return AUTH_BLOCK_LEVEL_1_MS;
  return 0;
}

async function evaluateDistributedAuth(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds: number; count: number } | null> {
  if (!cacheService.isRedisConnected()) {
    return null;
  }

  const now = Date.now();
  const attemptsKey = `rl:auth:attempts:${ip}`;
  const blockKey = `rl:auth:block:${ip}`;

  const activeBlock = await cacheService.get<{ blockedUntil: number }>(blockKey);
  if (activeBlock?.blockedUntil && activeBlock.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((activeBlock.blockedUntil - now) / 1000),
      count: 0,
    };
  }

  const attempts = await cacheService.increment(attemptsKey, 1);
  if (attempts === null) {
    return null;
  }

  if (attempts === 1) {
    await cacheService.expire(attemptsKey, AUTH_ATTEMPTS_WINDOW_SECONDS);
  }

  const blockTimeMs = resolveAuthBlockTimeMs(attempts);
  if (blockTimeMs > 0) {
    const blockedUntil = now + blockTimeMs;
    await cacheService.set(
      blockKey,
      { blockedUntil },
      Math.ceil(blockTimeMs / 1000)
    );

    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(blockTimeMs / 1000),
      count: attempts,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    count: attempts,
  };
}

function evaluateLocalAuth(ip: string): {
  allowed: boolean;
  retryAfterSeconds: number;
  count: number;
} {
  const now = Date.now();
  const key = `auth:${ip}`;
  const entry = LOCAL_RATE_LIMIT_CACHE.get(key);

  if (!entry) {
    LOCAL_RATE_LIMIT_CACHE.set(key, {
      count: 1,
      resetTime: now + AUTH_ATTEMPTS_WINDOW_SECONDS * 1000,
      blocked: false,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
      count: 1,
    };
  }

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + AUTH_ATTEMPTS_WINDOW_SECONDS * 1000;
    entry.blocked = false;

    return {
      allowed: true,
      retryAfterSeconds: 0,
      count: entry.count,
    };
  }

  entry.count += 1;

  const blockTimeMs = resolveAuthBlockTimeMs(entry.count);
  if (blockTimeMs > 0) {
    entry.blocked = true;
    entry.resetTime = now + blockTimeMs;

    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(blockTimeMs / 1000),
      count: entry.count,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    count: entry.count,
  };
}

export async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  const { pathname } = request.nextUrl;
  const config = getRateLimitConfig(pathname);

  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  const distributedKey = `rl:${ip}:${pathname}`;
  const distributedResult = await evaluateDistributedWindow(distributedKey, config);

  const result =
    distributedResult || evaluateLocalWindow(`${ip}:${pathname}`, config);

  if (!result.allowed) {
    return createRateLimitedResponse(
      'Rate limit exceeded',
      'Muitas tentativas. Tente novamente mais tarde.',
      result.retryAfterSeconds,
      config,
      result.resetAt
    );
  }

  return null;
}

export async function authRateLimit(
  request: NextRequest
): Promise<NextResponse | null> {
  const ip = getClientIP(request);

  const distributedResult = await evaluateDistributedAuth(ip);
  const result = distributedResult || evaluateLocalAuth(ip);

  if (!result.allowed) {
    return createRateLimitedResponse(
      'Authentication rate limit exceeded',
      'Muitas tentativas de login falharam. Conta temporariamente bloqueada.',
      result.retryAfterSeconds
    );
  }

  return null;
}

export async function resetRateLimit(ip: string, endpoint?: string): Promise<void> {
  if (endpoint) {
    LOCAL_RATE_LIMIT_CACHE.delete(`${ip}:${endpoint}`);
    await cacheService.delete(`rl:${ip}:${endpoint}`);
    return;
  }

  for (const key of LOCAL_RATE_LIMIT_CACHE.keys()) {
    if (key.startsWith(`${ip}:`) || key === `auth:${ip}`) {
      LOCAL_RATE_LIMIT_CACHE.delete(key);
    }
  }

  await cacheService.deletePattern(`rl:${ip}:*`);
  await cacheService.delete(`rl:auth:attempts:${ip}`);
  await cacheService.delete(`rl:auth:block:${ip}`);
}

export function getRateLimitStats() {
  const stats = {
    totalEntries: LOCAL_RATE_LIMIT_CACHE.size,
    blockedIPs: 0,
    topIPs: new Map<string, number>(),
    distributed: cacheService.isRedisConnected(),
  };

  for (const [key, entry] of LOCAL_RATE_LIMIT_CACHE.entries()) {
    if (entry.blocked) {
      stats.blockedIPs++;
    }

    const ip = key.split(':')[0];
    stats.topIPs.set(ip, (stats.topIPs.get(ip) || 0) + entry.count);
  }

  return stats;
}
