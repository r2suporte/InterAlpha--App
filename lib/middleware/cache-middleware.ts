import { NextRequest, NextResponse } from 'next/server';

import { CACHE_TTL, cacheService } from '@/lib/services/cache-service';
import { logger } from '@/lib/services/logger-service';

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (_req: NextRequest) => string;
  shouldCache?: (_req: NextRequest, _res: NextResponse) => boolean;
  varyBy?: string[];
}

/**
 * Middleware para cache automático de respostas de API
 */
export function withCache(options: CacheOptions = {}) {
  const {
    ttl = CACHE_TTL.MEDIUM,
    keyGenerator = defaultKeyGenerator,
    shouldCache = defaultShouldCache,
    varyBy = [],
  } = options;

  return function cacheMiddleware(handler: Function) {
    return async function cachedHandler(req: NextRequest, ...args: any[]) {
      // Só aplica cache para métodos GET
      if (req.method !== 'GET') {
        return handler(req, ...args);
      }

      // Gera chave do cache
      const cacheKey = keyGenerator(req);
      const varyKey = generateVaryKey(req, varyBy);
      const fullCacheKey = varyKey ? `${cacheKey}:${varyKey}` : cacheKey;

      try {
        // Tenta buscar do cache
        const cachedResponse = await cacheService.get<any>(fullCacheKey);
        if (cachedResponse) {
          logger.debug(`🎯 Cache HIT: ${fullCacheKey}`);
          return NextResponse.json(cachedResponse.data, {
            status: cachedResponse.status,
            headers: {
              ...cachedResponse.headers,
              'X-Cache': 'HIT',
              'X-Cache-Key': fullCacheKey,
            },
          });
        }

        logger.debug(`❌ Cache MISS: ${fullCacheKey}`);

        // Executa o handler original
        const response = await handler(req, ...args);

        // Verifica se deve cachear a resposta
        if (shouldCache(req, response) && response.status === 200) {
          const responseData = await response.clone().json();

          const cacheData = {
            data: responseData,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            timestamp: Date.now(),
          };

          // Armazena no cache
          await cacheService.set(fullCacheKey, cacheData, ttl);
          logger.debug(`💾 Cached: ${fullCacheKey} (TTL: ${ttl}s)`);

          // Adiciona headers de cache
          response.headers.set('X-Cache', 'MISS');
          response.headers.set('X-Cache-Key', fullCacheKey);
          response.headers.set('X-Cache-TTL', ttl.toString());
        }

        return response;
      } catch (error) {
        console.error('Erro no middleware de cache:', error);
        logger.error('❌ Erro no middleware de cache:', error as Error);
        // Em caso de erro, executa o handler sem cache
        return handler(req, ...args);
      }
    };
  };
}

/**
 * Gerador de chave padrão baseado na URL
 */
function defaultKeyGenerator(req: NextRequest): string {
  const url = new URL(req.url);
  const path = url.pathname;
  const searchParams = url.searchParams.toString();
  return `api:${path}${searchParams ? `:${searchParams}` : ''}`;
}

/**
 * Função padrão para determinar se deve cachear
 */
function defaultShouldCache(req: NextRequest, res: NextResponse): boolean {
  // Não cacheia se há erros
  if (res.status >= 400) {
    return false;
  }

  // Não cacheia se há parâmetros de autenticação sensíveis
  const url = new URL(req.url);
  const sensitiveParams = ['token', 'password', 'secret', 'key'];
  for (const param of sensitiveParams) {
    if (url.searchParams.has(param)) {
      return false;
    }
  }

  return true;
}

/**
 * Gera chave de variação baseada em headers ou parâmetros específicos
 */
function generateVaryKey(req: NextRequest, varyBy: string[]): string {
  if (varyBy.length === 0) return '';

  const varyValues: string[] = [];

  for (const vary of varyBy) {
    if (vary.startsWith('header:')) {
      const headerName = vary.substring(7);
      const headerValue = req.headers.get(headerName);
      if (headerValue) {
        varyValues.push(`${headerName}:${headerValue}`);
      }
    } else if (vary.startsWith('param:')) {
      const paramName = vary.substring(6);
      const url = new URL(req.url);
      const paramValue = url.searchParams.get(paramName);
      if (paramValue) {
        varyValues.push(`${paramName}:${paramValue}`);
      }
    } else if (vary === 'user') {
      // Varia por usuário (assumindo que há um header de autorização)
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        // Usa hash do token para não expor dados sensíveis
        const hash = Buffer.from(authHeader).toString('base64').substring(0, 8);
        varyValues.push(`user:${hash}`);
      }
    }
  }

  return varyValues.join('|');
}

/**
 * Middleware específico para cache de dados de usuário
 */
export function withUserCache(ttl: number = CACHE_TTL.MEDIUM) {
  return withCache({
    ttl,
    varyBy: ['user'],
    keyGenerator: req => {
      const url = new URL(req.url);
      return `user-api:${url.pathname}`;
    },
  });
}

/**
 * Middleware específico para cache de dados públicos
 */
export function withPublicCache(ttl: number = CACHE_TTL.LONG) {
  return withCache({
    ttl,
    keyGenerator: req => {
      const url = new URL(req.url);
      return `public-api:${url.pathname}`;
    },
  });
}

/**
 * Middleware para cache de métricas
 */
export function withMetricsCache(ttl: number = CACHE_TTL.SHORT) {
  return withCache({
    ttl,
    keyGenerator: req => {
      const url = new URL(req.url);
      const timeRange = url.searchParams.get('timeRange') || 'default';
      return `metrics:${url.pathname}:${timeRange}`;
    },
  });
}

/**
 * Utilitário para invalidar cache relacionado
 */
export class CacheInvalidator {
  static async invalidateUserCache(userId: string) {
    await cacheService.deletePattern(`user-api:*user:*${userId}*`);
  }

  static async invalidateResourceCache(resource: string) {
    await cacheService.deletePattern(`api:*${resource}*`);
  }

  static async invalidateAllApiCache() {
    await cacheService.deletePattern('api:*');
  }

  static async invalidateMetricsCache() {
    await cacheService.deletePattern('metrics:*');
  }
}

export default withCache;
