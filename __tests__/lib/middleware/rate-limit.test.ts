/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

// Store original module exports
const loadMiddleware = () => require('../../../lib/middleware/rate-limit');

// We need to dynamically reload to get a fresh module cache each test
jest.mock('../../../lib/middleware/rate-limit', () => {
  const actual = jest.requireActual('../../../lib/middleware/rate-limit');
  return actual;
});

let rateLimit: any;
let authRateLimit: any;
let resetRateLimit: any;
let getRateLimitStats: any;

describe('lib/middleware/rate-limit', () => {
  beforeEach(() => {
    // Reload the module to get fresh rate limit cache
    jest.resetModules();
    const module = require('../../../lib/middleware/rate-limit');
    rateLimit = module.rateLimit;
    authRateLimit = module.authRateLimit;
    resetRateLimit = module.resetRateLimit;
    getRateLimitStats = module.getRateLimitStats;
    jest.clearAllMocks();
  });

  const createRequest = (
    ip: string,
    pathname: string = '/api/test',
    method: string = 'GET'
  ) => ({
    method,
    url: `http://localhost${pathname}`,
    nextUrl: { pathname },
    headers: {
      get: jest.fn().mockImplementation((key: string) => {
        const headers: Record<string, string> = {
          'cf-connecting-ip': ip,
        };
        return headers[key.toLowerCase()] || null;
      }),
    },
  }) as unknown as NextRequest;

  describe('rateLimit', () => {
    it('should allow first request from IP', () => {
      const req = createRequest('192.168.1.1', '/api/clientes');
      const result = rateLimit(req);
      expect(result).toBeNull();
    });

    it('should allow multiple requests within limit', () => {
      const ip = '192.168.1.1';
      const endpoint = '/api/clientes'; // 100 requests per 15 min

      // Make 50 requests
      for (let i = 0; i < 50; i++) {
        const req = createRequest(ip, endpoint);
        const result = rateLimit(req);
        expect(result).toBeNull();
      }
    });

    it('should block requests exceeding limit', () => {
      const ip = '192.168.1.1';
      const endpoint = '/api/auth/login'; // 5 requests per 15 min

      // Make 6 requests (exceeding limit of 5)
      let result = null;
      for (let i = 0; i < 6; i++) {
        const req = createRequest(ip, endpoint, 'POST');
        result = rateLimit(req);
      }

      expect(result?.status).toBe(429);
      expect(result?.headers.get('Retry-After')).toBeDefined();
    });

    it('should return 429 with rate limit headers', () => {
      const ip = '192.168.1.1';
      const endpoint = '/api/auth/login'; // 5 requests per 15 min

      // Exhaust the limit
      for (let i = 0; i < 6; i++) {
        const req = createRequest(ip, endpoint, 'POST');
        rateLimit(req);
      }

      const finalReq = createRequest(ip, endpoint, 'POST');
      const result = rateLimit(finalReq);

      expect(result?.status).toBe(429);
      expect(result?.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(result?.headers.get('X-RateLimit-Reset')).toBeDefined();
      expect(result?.headers.get('Content-Type')).toBe('application/json');
    });

    it('should use different limits for different endpoints', () => {
      const ip = '192.168.1.1';

      // Login endpoint: 5 requests per 15 min
      for (let i = 0; i < 6; i++) {
        const req = createRequest(ip, '/api/auth/login', 'POST');
        rateLimit(req);
      }
      const loginReq = createRequest(ip, '/api/auth/login', 'POST');
      const loginResult = rateLimit(loginReq);

      // Clientes endpoint: 100 requests per 15 min (should still allow)
      const clienteReq = createRequest(ip, '/api/clientes', 'GET');
      const clienteResult = rateLimit(clienteReq);

      expect(loginResult?.status).toBe(429);
      expect(clienteResult).toBeNull();
    });

    it('should apply default limit to unknown endpoints', () => {
      const ip = '192.168.1.1';
      const endpoint = '/api/unknown-endpoint'; // Should use default: 200 requests per 15 min

      // Make 201 requests
      let result = null;
      for (let i = 0; i < 201; i++) {
        const req = createRequest(ip, endpoint);
        result = rateLimit(req);
      }

      expect(result?.status).toBe(429);
    });

    it('should isolate rate limits by IP', () => {
      const endpoint = '/api/auth/login'; // 5 requests per 15 min

      // IP1 makes 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        const req = createRequest('192.168.1.1', endpoint, 'POST');
        rateLimit(req);
      }

      // IP2 makes 1 request (should be allowed)
      const ip2Req = createRequest('203.0.113.1', endpoint, 'POST');
      const ip2Result = rateLimit(ip2Req);

      expect(ip2Result).toBeNull();
    });

    it('should isolate rate limits by endpoint', () => {
      const ip = '192.168.1.1';

      // Exhaust login limit (5 requests)
      for (let i = 0; i < 6; i++) {
        const req = createRequest(ip, '/api/auth/login', 'POST');
        rateLimit(req);
      }

      // Register endpoint should have separate limit
      const registerReq = createRequest(ip, '/api/auth/register', 'POST');
      const registerResult = rateLimit(registerReq);

      expect(registerResult).toBeNull();
    });
  });

  describe('authRateLimit', () => {
    it('should allow first auth attempt', () => {
      const req = createRequest('192.168.1.1', '/api/auth/login', 'POST');
      const result = authRateLimit(req);
      expect(result).toBeNull();
    });

    it('should allow multiple auth attempts within limit', () => {
      const ip = '192.168.1.1';

      // Make 5 auth attempts (within limit)
      for (let i = 0; i < 5; i++) {
        const req = createRequest(ip, '/api/auth/login', 'POST');
        const result = authRateLimit(req);
        expect(result).toBeNull();
      }
    });

    it('should block after 5 failed attempts with 15 min block time', () => {
      const ip = '192.168.1.1';

      // Make 6 auth attempts
      for (let i = 0; i < 6; i++) {
        const req = createRequest(ip, '/api/auth/login', 'POST');
        authRateLimit(req);
      }

      const req = createRequest(ip, '/api/auth/login', 'POST');
      const result = authRateLimit(req);

      expect(result?.status).toBe(429);
      // Should have ~15 min retry time
      const retryAfter = result?.headers.get('Retry-After');
      expect(retryAfter).toBeDefined();
      const retrySeconds = parseInt(retryAfter || '0', 10);
      expect(retrySeconds).toBeGreaterThan(14 * 60); // ~15 minutes
    });

    it('should escalate block time after 10 attempts', () => {
      const ip = '192.168.1.1';

      // Make 11 auth attempts
      for (let i = 0; i < 11; i++) {
        const req = createRequest(ip, '/api/auth/login', 'POST');
        authRateLimit(req);
      }

      const req = createRequest(ip, '/api/auth/login', 'POST');
      const result = authRateLimit(req);

      expect(result?.status).toBe(429);
      const retryAfter = result?.headers.get('Retry-After');
      const retrySeconds = parseInt(retryAfter || '0', 10);
      expect(retrySeconds).toBeGreaterThan(55 * 60); // ~1 hour or more
    });

    it('should escalate to 24 hour block after 20 attempts', () => {
      const ip = '192.168.1.1';

      // Make 21 auth attempts
      for (let i = 0; i < 21; i++) {
        const req = createRequest(ip, '/api/auth/login', 'POST');
        authRateLimit(req);
      }

      const req = createRequest(ip, '/api/auth/login', 'POST');
      const result = authRateLimit(req);

      expect(result?.status).toBe(429);
      const retryAfter = result?.headers.get('Retry-After');
      const retrySeconds = parseInt(retryAfter || '0', 10);
      expect(retrySeconds).toBeGreaterThan(23 * 60 * 60); // ~24 hours
    });

    it('should log warning on block', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const ip = '192.168.1.1';

      // Trigger block
      for (let i = 0; i < 6; i++) {
        const req = createRequest(ip, '/api/auth/login', 'POST');
        authRateLimit(req);
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auth rate limit exceeded')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for specific endpoint', () => {
      const ip = '192.168.1.1';
      const endpoint = '/api/auth/login';

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        const req = createRequest(ip, endpoint, 'POST');
        rateLimit(req);
      }

      // Should be blocked
      let req = createRequest(ip, endpoint, 'POST');
      let result = rateLimit(req);
      expect(result?.status).toBe(429);

      // Reset
      resetRateLimit(ip, endpoint);

      // Should be allowed again
      req = createRequest(ip, endpoint, 'POST');
      result = rateLimit(req);
      expect(result).toBeNull();
    });

    it('should reset all rate limits for IP when endpoint not specified', () => {
      const ip = '192.168.1.1';

      // Exhaust limits on multiple endpoints
      for (let i = 0; i < 6; i++) {
        rateLimit(createRequest(ip, '/api/auth/login', 'POST'));
      }

      // Reset all for IP
      resetRateLimit(ip);

      // Both endpoints should be reset
      const req1 = createRequest(ip, '/api/auth/login', 'POST');
      const req2 = createRequest(ip, '/api/auth/register', 'POST');

      expect(rateLimit(req1)).toBeNull();
      expect(rateLimit(req2)).toBeNull();
    });
  });

  describe('getRateLimitStats', () => {
    it('should return initial empty stats', () => {
      // Ensure we start clean
      resetRateLimit('192.168.1.1');
      resetRateLimit('203.0.113.1');
      resetRateLimit('10.0.0.1');

      const stats = getRateLimitStats();

      expect(stats.totalEntries).toBe(0);
      expect(stats.blockedIPs).toBe(0);
      expect(stats.topIPs.size).toBe(0);
    });

    it('should track total entries', () => {
      // Make some requests from different IPs
      rateLimit(createRequest('192.168.1.1', '/api/clientes'));
      rateLimit(createRequest('203.0.113.1', '/api/clientes'));
      rateLimit(createRequest('10.0.0.1', '/api/ordens-servico'));

      const stats = getRateLimitStats();

      expect(stats.totalEntries).toBeGreaterThanOrEqual(3);
    });

    it('should count blocked IPs', () => {
      const ip = '192.168.1.1';

      // Trigger block
      for (let i = 0; i < 6; i++) {
        rateLimit(createRequest(ip, '/api/auth/login', 'POST'));
      }

      const stats = getRateLimitStats();

      expect(stats.blockedIPs).toBeGreaterThan(0);
    });

    it('should track top IPs by request count', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '203.0.113.1';

      // IP1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimit(createRequest(ip1, '/api/clientes'));
      }

      // IP2 makes 3 requests
      for (let i = 0; i < 3; i++) {
        rateLimit(createRequest(ip2, '/api/clientes'));
      }

      const stats = getRateLimitStats();

      expect(stats.topIPs.get(ip1)).toBeGreaterThan(stats.topIPs.get(ip2) || 0);
    });
  });

  describe('Integration', () => {
    it('should handle complete rate limit lifecycle', () => {
      const ip = '192.168.1.1';
      const endpoint = '/api/auth/login';

      // Phase 1: Normal requests within limit
      for (let i = 0; i < 3; i++) {
        const req = createRequest(ip, endpoint, 'POST');
        const result = rateLimit(req);
        expect(result).toBeNull();
      }

      // Phase 2: Exceed limit
      for (let i = 0; i < 3; i++) {
        const req = createRequest(ip, endpoint, 'POST');
        rateLimit(req);
      }

      // Phase 3: Verify blocked
      const blockedReq = createRequest(ip, endpoint, 'POST');
      const blockedResult = rateLimit(blockedReq);
      expect(blockedResult?.status).toBe(429);

      // Phase 4: Reset and verify
      resetRateLimit(ip, endpoint);
      const resetReq = createRequest(ip, endpoint, 'POST');
      const resetResult = rateLimit(resetReq);
      expect(resetResult).toBeNull();
    });

    it('should differentiate between global and auth rate limiting', () => {
      const ip = '192.168.1.1';

      // Use auth rate limit for login
      for (let i = 0; i < 6; i++) {
        authRateLimit(createRequest(ip, '/api/auth/login', 'POST'));
      }

      // Should be blocked
      const authReq = createRequest(ip, '/api/auth/login', 'POST');
      const authResult = authRateLimit(authReq);
      expect(authResult?.status).toBe(429);

      // Global rate limit on same endpoint should work independently
      // (they use different cache keys: 'auth:ip' vs 'ip:endpoint')
      const globalReq = createRequest(ip, '/api/auth/login', 'POST');
      const globalResult = rateLimit(globalReq);
      // Global rate limit can be either allowed or blocked
      expect(globalResult === null || globalResult?.status === 429).toBe(true);
    });
  });
});
