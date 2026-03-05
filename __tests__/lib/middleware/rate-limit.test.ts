/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

let rateLimit: (request: NextRequest) => Promise<any>;
let authRateLimit: (request: NextRequest) => Promise<any>;
let resetRateLimit: (ip: string, endpoint?: string) => Promise<void>;
let getRateLimitStats: () => {
  totalEntries: number;
  blockedIPs: number;
  topIPs: Map<string, number>;
  distributed: boolean;
};

describe('lib/middleware/rate-limit', () => {
  beforeEach(() => {
    jest.resetModules();
    const middlewareModule = require('../../../lib/middleware/rate-limit');
    ({ rateLimit, authRateLimit, resetRateLimit, getRateLimitStats } =
      middlewareModule);
    jest.clearAllMocks();
  });

  const createRequest = (
    ip: string,
    pathname: string = '/api/test',
    method: string = 'GET'
  ) =>
    ({
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
    it('permite primeira requisicao', async () => {
      const result = await rateLimit(createRequest('192.168.1.1', '/api/clientes'));
      expect(result).toBeNull();
    });

    it('bloqueia ao exceder limite do endpoint', async () => {
      const ip = '192.168.1.1';
      const endpoint = '/api/auth/login'; // limite 5

      let result = null;
      for (let i = 0; i < 6; i++) {
        result = await rateLimit(createRequest(ip, endpoint, 'POST'));
      }

      expect(result?.status).toBe(429);
      expect(result?.headers.get('Retry-After')).toBeDefined();
      expect(result?.headers.get('X-RateLimit-Limit')).toBe('5');
    });

    it('isola por endpoint e ip', async () => {
      const ip1 = '192.168.1.10';
      const ip2 = '192.168.1.11';

      for (let i = 0; i < 6; i++) {
        await rateLimit(createRequest(ip1, '/api/auth/login', 'POST'));
      }

      const blocked = await rateLimit(createRequest(ip1, '/api/auth/login', 'POST'));
      const allowedOtherIp = await rateLimit(createRequest(ip2, '/api/auth/login', 'POST'));
      const allowedOtherEndpoint = await rateLimit(createRequest(ip1, '/api/clientes', 'GET'));

      expect(blocked?.status).toBe(429);
      expect(allowedOtherIp).toBeNull();
      expect(allowedOtherEndpoint).toBeNull();
    });
  });

  describe('authRateLimit', () => {
    it('permite tentativas iniciais', async () => {
      const ip = '203.0.113.1';
      for (let i = 0; i < 5; i++) {
        const result = await authRateLimit(createRequest(ip, '/api/auth/login', 'POST'));
        expect(result).toBeNull();
      }
    });

    it('bloqueia com backoff progressivo', async () => {
      const ip = '203.0.113.2';
      for (let i = 0; i < 6; i++) {
        await authRateLimit(createRequest(ip, '/api/auth/login', 'POST'));
      }

      const blocked = await authRateLimit(createRequest(ip, '/api/auth/login', 'POST'));
      expect(blocked?.status).toBe(429);
      const retryAfter = Number(blocked?.headers.get('Retry-After') || '0');
      expect(retryAfter).toBeGreaterThan(14 * 60);
    });
  });

  describe('resetRateLimit', () => {
    it('reseta limite do endpoint especifico', async () => {
      const ip = '10.0.0.1';
      const endpoint = '/api/auth/login';

      for (let i = 0; i < 6; i++) {
        await rateLimit(createRequest(ip, endpoint, 'POST'));
      }

      const blockedBeforeReset = await rateLimit(createRequest(ip, endpoint, 'POST'));
      expect(blockedBeforeReset?.status).toBe(429);

      await resetRateLimit(ip, endpoint);
      const allowedAfterReset = await rateLimit(createRequest(ip, endpoint, 'POST'));
      expect(allowedAfterReset).toBeNull();
    });
  });

  describe('getRateLimitStats', () => {
    it('retorna estatisticas locais com mapa de IPs', async () => {
      await rateLimit(createRequest('172.16.0.1', '/api/clientes'));
      await rateLimit(createRequest('172.16.0.1', '/api/clientes'));
      await rateLimit(createRequest('172.16.0.2', '/api/clientes'));

      const stats = getRateLimitStats();
      expect(stats.totalEntries).toBeGreaterThanOrEqual(2);
      expect(stats.topIPs.get('172.16.0.1')).toBeGreaterThan(
        stats.topIPs.get('172.16.0.2') || 0
      );
      expect(typeof stats.distributed).toBe('boolean');
    });
  });
});
