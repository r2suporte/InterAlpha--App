/**
 * @jest-environment node
 */

jest.mock('@/lib/services/cache-service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  },
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
  },
}));

import { NextRequest, NextResponse } from 'next/server';
import { cacheService, CACHE_TTL } from '@/lib/services/cache-service';
import {
  withCache,
  withUserCache,
  withPublicCache,
  withMetricsCache,
  CacheInvalidator,
} from '../../../lib/middleware/cache-middleware';

const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;

describe('lib/middleware/cache-middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withCache', () => {
    it('should not cache non-GET requests', async () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/test',
      } as unknown as NextRequest;

      const mockResponse = new NextResponse('OK', { status: 200 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache();
      const cachedHandler = middleware(handler);

      const result = await cachedHandler(mockRequest);

      expect(handler).toHaveBeenCalledWith(mockRequest);
      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('should return cached response on cache HIT', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/clientes',
        headers: new Map(),
      } as unknown as NextRequest;

      const cachedData = {
        data: [{ id: 1, name: 'Test' }],
        status: 200,
        headers: {},
        timestamp: Date.now(),
      };

      mockCacheService.get.mockResolvedValue(cachedData);

      const handler = jest.fn();
      const middleware = withCache();
      const cachedHandler = middleware(handler);

      const result = await cachedHandler(mockRequest);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
      expect(result.status).toBe(200);
    });

    it('should cache response on cache MISS', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/clientes',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockData = [{ id: 1, name: 'Cliente' }];
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue(mockData),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(handler).toHaveBeenCalledWith(mockRequest);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should not cache error responses', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/error',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Server error' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ error: 'Server error' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should not cache responses with sensitive params', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/data?token=secret123',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ data: 'test' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should use custom TTL', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ data: 'test' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const customTTL = 600;
      const middleware = withCache({ ttl: customTTL });
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        customTTL
      );
    });

    it('should use custom key generator', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const customKeyGenerator = jest.fn().mockReturnValue('custom-key');
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ data: 'test' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache({ keyGenerator: customKeyGenerator });
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(customKeyGenerator).toHaveBeenCalledWith(mockRequest);
      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('custom-key')
      );
    });

    it('should use custom shouldCache function', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const shouldCache = jest.fn().mockReturnValue(false);
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ data: 'test' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache({ shouldCache });
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(shouldCache).toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should handle varyBy header variation', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map([['accept-language', 'pt-BR']]),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ data: 'test' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache({ varyBy: ['header:accept-language'] });
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('accept-language:pt-BR')
      );
    });

    it('should handle varyBy user variation', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map([['authorization', 'Bearer token123']]),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ data: 'test' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache({ varyBy: ['user'] });
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('user:')
      );
    });

    it('should handle middleware errors gracefully', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockRejectedValue(new Error('Cache error'));

      const mockResponse = new NextResponse('OK', { status: 200 });
      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache();
      const cachedHandler = middleware(handler);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await cachedHandler(mockRequest);

      expect(consoleSpy).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(mockResponse);

      consoleSpy.mockRestore();
    });

    it('should add cache headers to response', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ data: 'test' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'X-Cache',
        expect.any(String)
      );
      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'X-Cache-Key',
        expect.any(String)
      );
    });
  });

  describe('withUserCache', () => {
    it('should create user-specific cache middleware', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/profile',
        headers: new Map([['authorization', 'Bearer user123']]),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ user: 'data' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ user: 'data' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withUserCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('user-api')
      );
    });

    it('should use MEDIUM TTL by default', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/profile',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ data: 'test' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withUserCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        CACHE_TTL.MEDIUM
      );
    });
  });

  describe('withPublicCache', () => {
    it('should create public cache middleware', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/public-data',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'public' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ data: 'public' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withPublicCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('public-api')
      );
    });

    it('should use LONG TTL for public cache', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/public-data',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'public' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ data: 'public' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withPublicCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        CACHE_TTL.LONG
      );
    });
  });

  describe('withMetricsCache', () => {
    it('should create metrics cache middleware', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/metrics?timeRange=1h',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ metrics: 'data' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ metrics: 'data' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withMetricsCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('metrics:')
      );
    });

    it('should include timeRange in cache key', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/metrics?timeRange=24h',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ metrics: 'data' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ metrics: 'data' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withMetricsCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('24h')
      );
    });

    it('should use SHORT TTL for metrics cache', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/metrics',
        headers: new Map(),
      } as unknown as NextRequest;

      mockCacheService.get.mockResolvedValue(null);

      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ metrics: 'data' }),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue({ metrics: 'data' }),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withMetricsCache();
      const cachedHandler = middleware(handler);

      await cachedHandler(mockRequest);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        CACHE_TTL.SHORT
      );
    });
  });

  describe('CacheInvalidator', () => {
    it('should invalidate user cache by userId', async () => {
      await CacheInvalidator.invalidateUserCache('user-123');

      expect(mockCacheService.deletePattern).toHaveBeenCalledWith(
        expect.stringContaining('user-123')
      );
    });

    it('should invalidate resource cache', async () => {
      await CacheInvalidator.invalidateResourceCache('clientes');

      expect(mockCacheService.deletePattern).toHaveBeenCalledWith(
        expect.stringContaining('clientes')
      );
    });

    it('should invalidate all API cache', async () => {
      await CacheInvalidator.invalidateAllApiCache();

      expect(mockCacheService.deletePattern).toHaveBeenCalledWith('api:*');
    });

    it('should invalidate metrics cache', async () => {
      await CacheInvalidator.invalidateMetricsCache();

      expect(mockCacheService.deletePattern).toHaveBeenCalledWith('metrics:*');
    });
  });

  describe('Integration', () => {
    it('should handle complete cache workflow', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/clientes',
        headers: new Map(),
      } as unknown as NextRequest;

      // First call - cache MISS
      mockCacheService.get.mockResolvedValueOnce(null);

      const mockData = [{ id: 1, name: 'Test' }];
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
        clone: jest.fn().mockReturnValue({
          json: jest.fn().mockResolvedValue(mockData),
        }),
        headers: {
          set: jest.fn(),
          entries: jest.fn().mockReturnValue([]),
        },
      };

      const handler = jest.fn().mockResolvedValue(mockResponse);
      const middleware = withCache();
      const cachedHandler = middleware(handler);

      const result1 = await cachedHandler(mockRequest);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(mockCacheService.set).toHaveBeenCalled();

      // Second call - cache HIT
      mockCacheService.get.mockResolvedValueOnce({
        data: mockData,
        status: 200,
        headers: {},
        timestamp: Date.now(),
      });

      const result2 = await cachedHandler(mockRequest);

      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
      expect(result2.status).toBe(200);
    });
  });
});
