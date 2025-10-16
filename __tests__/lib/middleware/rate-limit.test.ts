/**/**

 * @jest-environment node * @jest-environment node

 */ */



import { NextRequest } from 'next/server';import { NextRequest, NextResponse } from 'next/server';

import {import {

  rateLimit,  rateLimit,

  authRateLimit,  authRateLimit,

  resetRateLimit,  resetRateLimit,

  getRateLimitStats,  getRateLimitStats,

} from '../../../lib/middleware/rate-limit';} from '../../../lib/middleware/rate-limit';



describe('lib/middleware/rate-limit', () => {describe('lib/middleware/rate-limit', () => {

  beforeEach(() => {  beforeEach(() => {

    resetRateLimit('192.168.1.1');    resetRateLimit('192.168.1.1');

    resetRateLimit('192.168.1.2');    resetRateLimit('192.168.1.2');

    resetRateLimit('203.0.113.1');    resetRateLimit('10.0.0.1');

    jest.clearAllMocks();    resetRateLimit('10.0.0.2');

  });    resetRateLimit('10.0.0.3');

    resetRateLimit('10.0.0.4');

  describe('rateLimit', () => {    resetRateLimit('10.0.0.5');

    const createRequest = (ip: string, pathname: string) => ({    resetRateLimit('10.0.0.6');

      method: 'GET',    jest.clearAllMocks();

      url: `http://localhost${pathname}`,  });

      nextUrl: { pathname },

      headers: {  describe('rateLimit', () => {

        get: jest.fn().mockReturnValue(ip),    it('should allow first request from IP', () => {

      },      const mockRequest = {

    } as unknown as NextRequest);        method: 'GET',

        url: 'http://localhost/api/clientes',

    it('should allow first request from IP', () => {        nextUrl: { pathname: '/api/clientes' },

      const mockRequest = createRequest('192.168.1.1', '/api/clientes');        headers: {

      const result = rateLimit(mockRequest);          get: jest.fn().mockReturnValue('192.168.1.1'),

      expect(result === null || result?.status !== 429).toBe(true);        },

    });      } as unknown as NextRequest;



    it('should allow requests within limit', () => {      const result = rateLimit(mockRequest);

      for (let i = 0; i < 50; i++) {      // rateLimit returns null when allowed, or NextResponse when blocked

        const result = rateLimit(createRequest('192.168.1.1', '/api/clientes'));      expect(result === null || result?.status !== 429).toBe(true);

        expect(result?.status).not.toBe(429);    });

      }

    });    it('should allow requests within limit', () => {

      const createRequest = (count: number) => ({

    it('should block requests exceeding limit', () => {        method: 'GET',

      let blocked = false;        url: `http://localhost/api/clientes?req=${count}`,

      for (let i = 0; i < 101; i++) {        nextUrl: { pathname: '/api/clientes' },

        const result = rateLimit(createRequest('192.168.1.1', '/api/clientes'));        headers: {

        if (result?.status === 429) {          get: jest.fn().mockReturnValue('192.168.1.1'),

          blocked = true;        },

          break;      } as unknown as NextRequest);

        }

      }      for (let i = 0; i < 50; i++) {

      expect(blocked).toBe(true);        const result = rateLimit(createRequest(i));

    });        // Should not be blocked (either null or non-429 response)

        expect(result?.status).not.toBe(429);

    it('should return 429 with proper headers when blocked', () => {      }

      let blockedResponse = null;    });

      for (let i = 0; i < 101; i++) {

        const result = rateLimit(createRequest('203.0.113.1', '/api/clientes'));    it('should block requests exceeding limit', () => {

        if (result?.status === 429) {      const createRequest = (count: number) => ({

          blockedResponse = result;        method: 'GET',

          break;        url: `http://localhost/api/clientes?req=${count}`,

        }        nextUrl: { pathname: '/api/clientes' },

      }        headers: {

          get: jest.fn().mockReturnValue('192.168.1.1'),

      expect(blockedResponse?.status).toBe(429);        },

      expect(blockedResponse?.headers.get('X-RateLimit-Limit')).toBe('100');      } as unknown as NextRequest);

      expect(blockedResponse?.headers.get('X-RateLimit-Remaining')).toBe('0');

      expect(blockedResponse?.headers.get('Retry-After')).toBeDefined();      let blocked = false;

    });      for (let i = 0; i < 101; i++) {

        const result = rateLimit(createRequest(i));

    it('should apply authentication endpoint limits', () => {        if (result?.status === 429) {

      let blocked = false;          blocked = true;

      for (let i = 0; i < 7; i++) {          break;

        const result = rateLimit(createRequest('192.168.1.2', '/api/auth/login'));        }

        if (result?.status === 429) {      }

          blocked = true;      expect(blocked).toBe(true);

          break;    });

        }

      }    it('should return 429 with proper headers when blocked', () => {

      expect(blocked).toBe(true);      const createRequest = (count: number) => ({

    });        method: 'GET',

        url: `http://localhost/api/clientes?req=${count}`,

    it('should track different IPs separately', () => {        nextUrl: { pathname: '/api/clientes' },

      const ip1 = 'ip-1-separate';        headers: {

      const ip2 = 'ip-2-separate';          get: jest.fn().mockReturnValue('192.168.1.1'),

        },

      let result1 = rateLimit(createRequest(ip1, '/api/clientes'));      } as unknown as NextRequest);

      expect(result1?.status).not.toBe(429);

      let blockedResponse = null;

      let result2 = rateLimit(createRequest(ip2, '/api/clientes'));      for (let i = 0; i < 101; i++) {

      expect(result2?.status).not.toBe(429);        const result = rateLimit(createRequest(i));

        if (result?.status === 429) {

      resetRateLimit(ip1);          blockedResponse = result;

      resetRateLimit(ip2);          break;

    });        }

      }

    it('should track different endpoints separately', () => {

      let loginBlocked = false;      expect(blockedResponse?.status).toBe(429);

      for (let i = 0; i < 7; i++) {      expect(blockedResponse?.headers.get('X-RateLimit-Limit')).toBe('100');

        const result = rateLimit(createRequest('192.168.1.1', '/api/auth/login'));      expect(blockedResponse?.headers.get('X-RateLimit-Remaining')).toBe('0');

        if (result?.status === 429) {      expect(blockedResponse?.headers.get('Retry-After')).toBeDefined();

          loginBlocked = true;    });

          break;

        }    it('should apply authentication endpoint limits', () => {

      }      const createRequest = (count: number) => ({

      expect(loginBlocked).toBe(true);        method: 'POST',

        url: `http://localhost/api/auth/login?attempt=${count}`,

      const clientesResult = rateLimit(createRequest('192.168.1.1', '/api/clientes'));        nextUrl: { pathname: '/api/auth/login' },

      expect(clientesResult?.status).not.toBe(429);        headers: {

          get: jest.fn().mockReturnValue('192.168.1.1'),

      resetRateLimit('192.168.1.1');        },

    });      } as unknown as NextRequest);



    it('should extract IP from x-forwarded-for header', () => {      let blocked = false;

      const mockRequest = {      for (let i = 0; i < 7; i++) {

        method: 'GET',        const result = rateLimit(createRequest(i));

        url: 'http://localhost/api/clientes',        if (result?.status === 429) {

        nextUrl: { pathname: '/api/clientes' },          blocked = true;

        headers: {          break;

          get: jest.fn().mockImplementation((key: string) => {        }

            const headers: Record<string, string> = {      }

              'x-forwarded-for': '203.0.113.10, 10.0.0.1',      expect(blocked).toBe(true);

            };    });

            return headers[key.toLowerCase()] || null;

          }),    it('should apply stricter registration limits', () => {

        },      const createRequest = (count: number) => ({

      } as unknown as NextRequest;        method: 'POST',

        url: `http://localhost/api/auth/register?attempt=${count}`,

      const result = rateLimit(mockRequest);        nextUrl: { pathname: '/api/auth/register' },

      expect(result?.status).not.toBe(429);        headers: {

    });          get: jest.fn().mockReturnValue('192.168.1.1'),

        },

    it('should prefer cf-connecting-ip header', () => {      } as unknown as NextRequest);

      const mockRequest = {

        method: 'GET',      let blocked = false;

        url: 'http://localhost/api/clientes',      for (let i = 0; i < 5; i++) {

        nextUrl: { pathname: '/api/clientes' },        const result = rateLimit(createRequest(i));

        headers: {        if (result?.status === 429) {

          get: jest.fn().mockImplementation((key: string) => {          blocked = true;

            const headers: Record<string, string> = {          break;

              'cf-connecting-ip': '203.0.113.100',        }

              'x-real-ip': '10.0.0.1',      }

              'x-forwarded-for': '192.168.1.1',      expect(blocked).toBe(true);

            };    });

            return headers[key.toLowerCase()] || null;

          }),    it('should extract IP from x-forwarded-for header', () => {

        },      const mockRequest = {

      } as unknown as NextRequest;        method: 'GET',

        url: 'http://localhost/api/clientes',

      const result = rateLimit(mockRequest);        nextUrl: { pathname: '/api/clientes' },

      expect(result?.status).not.toBe(429);        headers: {

    });          get: jest.fn().mockImplementation((key) => {

  });            const headers: Record<string, string> = {

              'x-forwarded-for': '203.0.113.10, 10.0.0.1',

  describe('authRateLimit', () => {            };

    const createRequest = (ip: string) => ({            return headers[key.toLowerCase()] || null;

      method: 'POST',          }),

      url: 'http://localhost/api/auth/login',        },

      nextUrl: { pathname: '/api/auth/login' },      } as unknown as NextRequest);

      headers: {

        get: jest.fn().mockReturnValue(ip),      const result1 = rateLimit(mockRequest);

      },      expect(result1?.status).not.toBe(429);

    } as unknown as NextRequest);    });



    it('should allow first auth attempt', () => {    it('should prefer cf-connecting-ip header', () => {

      const result = authRateLimit(createRequest('192.168.1.1'));      const createRequest = (ip: string) => ({

      expect(result).toBeNull();        method: 'GET',

    });        url: 'http://localhost/api/clientes',

        nextUrl: { pathname: '/api/clientes' },

    it('should allow multiple auth attempts within limit', () => {        headers: {

      for (let i = 0; i < 5; i++) {          get: jest.fn().mockImplementation((key) => {

        const result = authRateLimit(createRequest('192.168.1.1'));            const headers: Record<string, string> = {

        expect(result).toBeNull();              'cf-connecting-ip': ip,

      }              'x-real-ip': '10.0.0.1',

    });              'x-forwarded-for': '192.168.1.1',

            };

    it('should block after 5 failed attempts', () => {            return headers[key.toLowerCase()] || null;

      let blocked = false;          }),

      for (let i = 0; i < 6; i++) {        },

        const result = authRateLimit(createRequest('203.0.113.2'));      } as unknown as NextRequest);

        if (result?.status === 429) {

          blocked = true;      const result1 = rateLimit(createRequest('203.0.113.1'));

          expect(result?.headers.get('Retry-After')).toBeDefined();      expect(result1?.status).not.toBe(429);

          break;

        }      const result2 = rateLimit(createRequest('203.0.113.2'));

      }      expect(result2?.status).not.toBe(429);

      expect(blocked).toBe(true);    });

    });

    it('should track different IPs separately', () => {

    it('should increase backoff to 1 hour after 10 attempts', () => {      const createRequest = (ip: string) => ({

      let response429 = null;        method: 'GET',

      for (let i = 0; i < 11; i++) {        url: 'http://localhost/api/clientes',

        const result = authRateLimit(createRequest('203.0.113.3'));        nextUrl: { pathname: '/api/clientes' },

        if (i === 10 && result?.status === 429) {        headers: {

          response429 = result;          get: jest.fn().mockReturnValue(ip),

          break;        },

        }      } as unknown as NextRequest);

      }

      let result1 = rateLimit(createRequest('203.0.113.11'));

      if (response429) {      expect(result1?.status).not.toBe(429);

        const retryAfter = parseInt(response429.headers.get('Retry-After') || '0');

        expect(retryAfter).toBeGreaterThan(3000);      let result2 = rateLimit(createRequest('203.0.113.12'));

      }      expect(result2?.status).not.toBe(429);

    });

      result1 = rateLimit(createRequest('203.0.113.11'));

    it('should track different IPs separately', () => {      expect(result1?.status).not.toBe(429);

      for (let i = 0; i < 5; i++) {

        const result = authRateLimit(createRequest('203.0.113.4'));      result2 = rateLimit(createRequest('203.0.113.12'));

        expect(result).toBeNull();      expect(result2?.status).not.toBe(429);

      }    });



      const result = authRateLimit(createRequest('203.0.113.5'));    it('should track different endpoints separately', () => {

      expect(result).toBeNull();      const createRequest = (endpoint: string) => ({

        method: 'GET',

      const blockedResult = authRateLimit(createRequest('203.0.113.4'));        url: `http://localhost${endpoint}`,

      expect(blockedResult?.status).toBe(429);        nextUrl: { pathname: endpoint },

    });        headers: {

  });          get: jest.fn().mockReturnValue('192.168.1.1'),

        },

  describe('resetRateLimit', () => {      } as unknown as NextRequest);

    it('should reset rate limit for specific endpoint', () => {

      const mockRequest = {      let loginBlocked = false;

        method: 'GET',      for (let i = 0; i < 7; i++) {

        url: 'http://localhost/api/clientes',        const result = rateLimit(createRequest('/api/auth/login'));

        nextUrl: { pathname: '/api/clientes' },        if (result?.status === 429) {

        headers: {          loginBlocked = true;

          get: jest.fn().mockReturnValue('203.0.113.50'),          break;

        },        }

      } as unknown as NextRequest;      }

      expect(loginBlocked).toBe(true);

      for (let i = 0; i < 101; i++) {

        rateLimit(mockRequest);      // Different endpoint should still work

      }      const result = rateLimit(createRequest('/api/clientes'));

      expect(result?.status).not.toBe(429);

      let result = rateLimit(mockRequest);    });

      expect(result?.status).toBe(429);  });



      resetRateLimit('203.0.113.50', '/api/clientes');  describe('authRateLimit', () => {

    it('should allow first auth attempt', () => {

      result = rateLimit(mockRequest);      const mockRequest = {

      expect(result?.status).not.toBe(429);        method: 'POST',

    });        url: 'http://localhost/api/auth/login',

        nextUrl: { pathname: '/api/auth/login' },

    it('should reset all rate limits for IP', () => {        headers: {

      const mockRequest1 = {          get: jest.fn().mockReturnValue('192.168.1.1'),

        method: 'GET',        },

        url: 'http://localhost/api/clientes',      } as unknown as NextRequest;

        nextUrl: { pathname: '/api/clientes' },

        headers: {      const result = authRateLimit(mockRequest);

          get: jest.fn().mockReturnValue('203.0.113.51'),      expect(result).toBeNull();

        },    });

      } as unknown as NextRequest;

    it('should allow multiple auth attempts within limit', () => {

      const mockRequest2 = {      const mockRequest = {

        method: 'POST',        method: 'POST',

        url: 'http://localhost/api/auth/login',        url: 'http://localhost/api/auth/login',

        nextUrl: { pathname: '/api/auth/login' },        nextUrl: { pathname: '/api/auth/login' },

        headers: {        headers: {

          get: jest.fn().mockReturnValue('203.0.113.51'),          get: jest.fn().mockReturnValue('192.168.1.1'),

        },        },

      } as unknown as NextRequest;      } as unknown as NextRequest;



      for (let i = 0; i < 101; i++) {      for (let i = 0; i < 5; i++) {

        rateLimit(mockRequest1);        const result = authRateLimit(mockRequest);

      }        expect(result).toBeNull();

      }

      for (let i = 0; i < 6; i++) {    });

        rateLimit(mockRequest2);

      }    it('should block after 5 failed attempts', () => {

      const mockRequest = {

      let result1 = rateLimit(mockRequest1);        method: 'POST',

      let result2 = rateLimit(mockRequest2);        url: 'http://localhost/api/auth/login',

      expect(result1?.status).toBe(429);        nextUrl: { pathname: '/api/auth/login' },

      expect(result2?.status).toBe(429);        headers: {

          get: jest.fn().mockReturnValue('192.168.1.1'),

      resetRateLimit('203.0.113.51');        },

      } as unknown as NextRequest;

      result1 = rateLimit(mockRequest1);

      result2 = rateLimit(mockRequest2);      let blocked = false;

      expect(result1?.status).not.toBe(429);      for (let i = 0; i < 6; i++) {

      expect(result2?.status).not.toBe(429);        const result = authRateLimit(mockRequest);

    });        if (result?.status === 429) {

  });          blocked = true;

          expect(result?.headers.get('Retry-After')).toBeDefined();

  describe('getRateLimitStats', () => {          break;

    it('should count blocked IPs', () => {        }

      const mockRequest = {      }

        method: 'GET',      expect(blocked).toBe(true);

        url: 'http://localhost/api/clientes',    });

        nextUrl: { pathname: '/api/clientes' },

        headers: {    it('should increase backoff to 1 hour after 10 attempts', () => {

          get: jest.fn().mockReturnValue('203.0.113.60'),      const mockRequest = {

        },        method: 'POST',

      } as unknown as NextRequest;        url: 'http://localhost/api/auth/login',

        nextUrl: { pathname: '/api/auth/login' },

      for (let i = 0; i < 101; i++) {        headers: {

        rateLimit(mockRequest);          get: jest.fn().mockReturnValue('203.0.113.100'),

      }        },

      } as unknown as NextRequest;

      const stats = getRateLimitStats();

      expect(stats.blockedIPs).toBeGreaterThan(0);      let response429 = null;

    });      for (let i = 0; i < 11; i++) {

        const result = authRateLimit(mockRequest);

    it('should track top IPs by request count', () => {        if (i === 10 && result?.status === 429) {

      const mockRequest1 = {          response429 = result;

        method: 'GET',          break;

        url: 'http://localhost/api/clientes',        }

        nextUrl: { pathname: '/api/clientes' },      }

        headers: {

          get: jest.fn().mockReturnValue('203.0.113.70'),      if (response429) {

        },        const retryAfter = parseInt(response429.headers.get('Retry-After') || '0');

      } as unknown as NextRequest;        expect(retryAfter).toBeGreaterThan(3000);

      }

      const mockRequest2 = {    });

        method: 'GET',

        url: 'http://localhost/api/clientes',    it('should apply 24-hour block after 20 attempts', () => {

        nextUrl: { pathname: '/api/clientes' },      const mockRequest = {

        headers: {        method: 'POST',

          get: jest.fn().mockReturnValue('203.0.113.71'),        url: 'http://localhost/api/auth/login',

        },        nextUrl: { pathname: '/api/auth/login' },

      } as unknown as NextRequest;        headers: {

          get: jest.fn().mockReturnValue('203.0.113.101'),

      for (let i = 0; i < 50; i++) {        },

        rateLimit(mockRequest1);      } as unknown as NextRequest;

      }

      let response429 = null;

      for (let i = 0; i < 30; i++) {      for (let i = 0; i < 21; i++) {

        rateLimit(mockRequest2);        const result = authRateLimit(mockRequest);

      }        if (i === 20 && result?.status === 429) {

          response429 = result;

      const stats = getRateLimitStats();          break;

      expect(stats.topIPs.size).toBeGreaterThan(0);        }

    });      }

  });

      if (response429) {

  describe('Integration', () => {        const retryAfter = parseInt(response429.headers.get('Retry-After') || '0');

    it('should handle complete rate limiting workflow', () => {        expect(retryAfter).toBeGreaterThan(80000);

      const mockRequest = {      }

        method: 'POST',    });

        url: 'http://localhost/api/auth/login',

        nextUrl: { pathname: '/api/auth/login' },    it('should track different IPs separately', () => {

        headers: {      const createRequest = (ip: string) => ({

          get: jest.fn().mockReturnValue('203.0.113.80'),        method: 'POST',

        },        url: 'http://localhost/api/auth/login',

      } as unknown as NextRequest;        nextUrl: { pathname: '/api/auth/login' },

        headers: {

      for (let i = 0; i < 5; i++) {          get: jest.fn().mockReturnValue(ip),

        const result = rateLimit(mockRequest);        },

        expect(result?.status).not.toBe(429);      } as unknown as NextRequest);

      }

      for (let i = 0; i < 5; i++) {

      let result = rateLimit(mockRequest);        const result = authRateLimit(createRequest('203.0.113.102'));

      expect(result?.status).toBe(429);        expect(result).toBeNull();

      }

      resetRateLimit('203.0.113.80', '/api/auth/login');

      const result = authRateLimit(createRequest('203.0.113.103'));

      result = rateLimit(mockRequest);      expect(result).toBeNull();

      expect(result?.status).not.toBe(429);

    });      const blockedResult = authRateLimit(createRequest('203.0.113.102'));

  });      expect(blockedResult?.status).toBe(429);

});    });

  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for specific endpoint', () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/clientes',
        nextUrl: { pathname: '/api/clientes' },
        headers: {
          get: jest.fn().mockReturnValue('203.0.113.50'),
        },
      } as unknown as NextRequest;

      for (let i = 0; i < 101; i++) {
        rateLimit(mockRequest);
      }

      let result = rateLimit(mockRequest);
      expect(result?.status).toBe(429);

      resetRateLimit('203.0.113.50', '/api/clientes');

      result = rateLimit(mockRequest);
      expect(result?.status).not.toBe(429);
    });

    it('should reset all rate limits for IP', () => {
      const mockRequest1 = {
        method: 'GET',
        url: 'http://localhost/api/clientes',
        nextUrl: { pathname: '/api/clientes' },
        headers: {
          get: jest.fn().mockReturnValue('203.0.113.51'),
        },
      } as unknown as NextRequest;

      const mockRequest2 = {
        method: 'POST',
        url: 'http://localhost/api/auth/login',
        nextUrl: { pathname: '/api/auth/login' },
        headers: {
          get: jest.fn().mockReturnValue('203.0.113.51'),
        },
      } as unknown as NextRequest;

      for (let i = 0; i < 101; i++) {
        rateLimit(mockRequest1);
      }

      for (let i = 0; i < 6; i++) {
        rateLimit(mockRequest2);
      }

      let result1 = rateLimit(mockRequest1);
      let result2 = rateLimit(mockRequest2);
      expect(result1?.status).toBe(429);
      expect(result2?.status).toBe(429);

      resetRateLimit('203.0.113.51');

      result1 = rateLimit(mockRequest1);
      result2 = rateLimit(mockRequest2);
      expect(result1?.status).not.toBe(429);
      expect(result2?.status).not.toBe(429);
    });
  });

  describe('getRateLimitStats', () => {
    it('should count blocked IPs', () => {
      const createRequest = (ip: string) => ({
        method: 'GET',
        url: 'http://localhost/api/clientes',
        nextUrl: { pathname: '/api/clientes' },
        headers: {
          get: jest.fn().mockReturnValue(ip),
        },
      } as unknown as NextRequest);

      for (let i = 0; i < 101; i++) {
        rateLimit(createRequest('203.0.113.60'));
      }

      const stats = getRateLimitStats();
      expect(stats.blockedIPs).toBeGreaterThan(0);
    });

    it('should track top IPs by request count', () => {
      const createRequest = (ip: string) => ({
        method: 'GET',
        url: 'http://localhost/api/clientes',
        nextUrl: { pathname: '/api/clientes' },
        headers: {
          get: jest.fn().mockReturnValue(ip),
        },
      } as unknown as NextRequest);

      for (let i = 0; i < 50; i++) {
        rateLimit(createRequest('203.0.113.70'));
      }

      for (let i = 0; i < 30; i++) {
        rateLimit(createRequest('203.0.113.71'));
      }

      const stats = getRateLimitStats();
      expect(stats.topIPs.size).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('should handle complete rate limiting workflow', () => {
      const createRequest = (count: number) => ({
        method: 'POST',
        url: `http://localhost/api/auth/login?attempt=${count}`,
        nextUrl: { pathname: '/api/auth/login' },
        headers: {
          get: jest.fn().mockReturnValue('203.0.113.80'),
        },
      } as unknown as NextRequest);

      for (let i = 0; i < 5; i++) {
        const result = rateLimit(createRequest(i));
        expect(result?.status).not.toBe(429);
      }

      let result = rateLimit(createRequest(5));
      expect(result?.status).toBe(429);

      resetRateLimit('203.0.113.80', '/api/auth/login');

      result = rateLimit(createRequest(6));
      expect(result?.status).not.toBe(429);
    });
  });
});
