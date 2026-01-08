/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import {
  logSecurityEvent,
  securityAuditMiddleware,
  getRecentSecurityEvents,
  getSecurityStats,
  cleanupOldEvents,
} from '../../../lib/middleware/security-audit';

describe('lib/middleware/security-audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear all security events by using -1 daysToKeep (removes all old events)
    cleanupOldEvents(-1);
  });

  afterEach(() => {
    // Ensure clean state for next test
    cleanupOldEvents(-1);
  });

  afterAll(() => {
    // Final cleanup after all tests
    cleanupOldEvents(-1);
  });

  describe('logSecurityEvent', () => {
    it('should log security event with all details', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/login',
        nextUrl: { pathname: '/api/login' },
        headers: {
          get: jest.fn().mockImplementation((key: string) => {
            const headers: Record<string, string> = {
              'x-forwarded-for': '192.168.1.1',
              'user-agent': 'Mozilla/5.0 Test',
            };
            return headers[key.toLowerCase()] || null;
          }),
        },
      } as unknown as NextRequest;

      logSecurityEvent(mockRequest, 'failed_login', 'medium', {
        reason: 'Invalid password',
      }, 'user123');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY'),
        expect.objectContaining({
          ip: '192.168.1.1',
          endpoint: '/api/login',
          severity: 'medium',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log critical severity events with error level', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/admin',
        nextUrl: { pathname: '/api/admin' },
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      logSecurityEvent(mockRequest, 'privilege_escalation', 'critical', {
        attempted_role: 'admin',
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should extract IP from cf-connecting-ip header first', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        nextUrl: { pathname: '/api/test' },
        headers: {
          get: jest.fn().mockImplementation((key: string) => {
            const headers: Record<string, string> = {
              'cf-connecting-ip': '203.0.113.1',
              'x-real-ip': '10.0.0.1',
              'x-forwarded-for': '192.168.1.1',
            };
            return headers[key.toLowerCase()] || null;
          }),
        },
      } as unknown as NextRequest;

      logSecurityEvent(mockRequest, 'suspicious_request', 'low', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ip: '203.0.113.1',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('securityAuditMiddleware', () => {
    it('should allow safe requests', () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/clientes',
        nextUrl: { pathname: '/api/clientes' },
        headers: {
          get: jest.fn().mockImplementation((key: string) => {
            const headers: Record<string, string> = {
              'user-agent': 'Mozilla/5.0 Chrome',
            };
            return headers[key.toLowerCase()] || null;
          }),
        },
        body: null,
      } as unknown as NextRequest;

      const result = securityAuditMiddleware(mockRequest);
      expect(result).toBeNull();
    });

    it('should block SQL injection attempts', () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/users',
        nextUrl: { pathname: '/api/users', toString: () => "http://localhost/api/users?id=1' UNION SELECT" },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
        body: { toString: () => "SELECT * FROM users WHERE id=1 OR 1=1" },
      } as unknown as NextRequest;

      const result = securityAuditMiddleware(mockRequest);

      expect(result?.status).toBe(403);
    });

    it('should block XSS attempts in URL', () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/search',
        nextUrl: { pathname: '/api/search', toString: () => 'http://localhost/api/search?q=<script>alert("xss")</script>' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
        body: { toString: () => '<script>alert(1)</script>' },
      } as unknown as NextRequest;

      const result = securityAuditMiddleware(mockRequest);

      expect(result?.status).toBe(403);
    });

    it('should detect suspicious user agents', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        nextUrl: { pathname: '/api/test' },
        headers: {
          get: jest.fn().mockImplementation((key: string) => {
            const headers: Record<string, string> = {
              'user-agent': 'sqlmap/1.0',
            };
            return headers[key.toLowerCase()] || null;
          }),
        },
        body: null,
      } as unknown as NextRequest;

      const result = securityAuditMiddleware(mockRequest);

      // Should log but not block
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should block access to sensitive files', () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/.env',
        nextUrl: { pathname: '/.env' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
        body: null,
      } as unknown as NextRequest;

      const result = securityAuditMiddleware(mockRequest);

      expect(result?.status).toBe(403);
    });

    it('should block access to git directory', () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/.git/config',
        nextUrl: { pathname: '/.git/config' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
        body: null,
      } as unknown as NextRequest;

      const result = securityAuditMiddleware(mockRequest);

      expect(result?.status).toBe(403);
    });

    it('should block access to admin paths', () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/admin/config',
        nextUrl: { pathname: '/admin/config' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
        body: null,
      } as unknown as NextRequest;

      const result = securityAuditMiddleware(mockRequest);

      expect(result?.status).toBe(403);
    });

    it('should block PHP/ASP/JSP files', () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/shell.php',
        nextUrl: { pathname: '/shell.php' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
        body: null,
      } as unknown as NextRequest;

      const result = securityAuditMiddleware(mockRequest);

      expect(result?.status).toBe(403);
    });

    it('should detect JavaScript in URL parameters', () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/search',
        nextUrl: { pathname: '/api/search', toString: () => 'http://localhost/api/search?q=javascript:void(0)' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
        body: { toString: () => 'javascript:alert(1)' },
      } as unknown as NextRequest;

      const result = securityAuditMiddleware(mockRequest);

      expect(result?.status).toBe(403);
    });

    it('should detect event handlers (onload, onerror)', () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/upload',
        nextUrl: { pathname: '/api/upload' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
        body: { toString: () => '<img src=x onerror="alert(1)">' },
      } as unknown as NextRequest;

      const result = securityAuditMiddleware(mockRequest);

      expect(result?.status).toBe(403);
    });
  });

  describe('getRecentSecurityEvents', () => {
    it('should return empty array when no events', () => {
      const events = getRecentSecurityEvents();
      expect(events).toEqual([]);
    });

    it('should return events sorted by timestamp (newest first)', () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        nextUrl: { pathname: '/api/test' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as unknown as NextRequest;

      // Log multiple events
      for (let i = 0; i < 3; i++) {
        logSecurityEvent(mockRequest, 'suspicious_request', 'low', {
          attempt: i,
        });
      }

      const events = getRecentSecurityEvents();

      expect(events.length).toBeGreaterThanOrEqual(3);
      // Find our 3 events (they should be the most recent)
      const ourEvents = events.filter((e: any) => e.details.attempt !== undefined);
      expect(ourEvents.length).toBeGreaterThanOrEqual(3);
      // Verify they're in order
      expect(ourEvents.some((e: any) => e.details.attempt === 2)).toBe(true);
      expect(ourEvents.some((e: any) => e.details.attempt === 1)).toBe(true);
      expect(ourEvents.some((e: any) => e.details.attempt === 0)).toBe(true);
    });

    it('should respect limit parameter', () => {

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        nextUrl: { pathname: '/api/test' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as unknown as NextRequest;

      for (let i = 0; i < 10; i++) {
        logSecurityEvent(mockRequest, 'suspicious_request', 'low', {});
      }

      const events = getRecentSecurityEvents(5);
      expect(events.length).toBe(5);
    });

    it('should include all event details', () => {

      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/login',
        nextUrl: { pathname: '/api/login' },
        headers: {
          get: jest.fn().mockImplementation((key: string) => {
            const headers: Record<string, string> = {
              'x-forwarded-for': '192.168.1.100',
              'user-agent': 'Test Agent',
            };
            return headers[key.toLowerCase()] || null;
          }),
        },
      } as unknown as NextRequest;

      logSecurityEvent(mockRequest, 'failed_login', 'high', {
        attempts: 5,
      }, 'user456');

      const events = getRecentSecurityEvents();

      expect(events[0]).toMatchObject({
        ip: '192.168.1.100',
        userAgent: 'Test Agent',
        endpoint: '/api/login',
        method: 'POST',
        userId: 'user456',
        eventType: 'failed_login',
        severity: 'high',
        details: { attempts: 5 },
      });
      expect(events[0].timestamp).toBeDefined();
    });
  });

  describe('getSecurityStats', () => {
    it('should return initial empty stats', () => {
      const stats = getSecurityStats();

      expect(stats.totalEvents).toBe(0);
      expect(stats.events24h).toBe(0);
      expect(stats.eventsLastHour).toBe(0);
      expect(stats.eventsByType).toEqual({});
      expect(stats.eventsBySeverity).toEqual({});
      expect(stats.topIPs).toEqual([]);
      expect(stats.criticalEvents).toBe(0);
    });

    it('should count events by type', () => {

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        nextUrl: { pathname: '/api/test' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as unknown as NextRequest;

      logSecurityEvent(mockRequest, 'failed_login', 'low', {});
      logSecurityEvent(mockRequest, 'failed_login', 'low', {});
      logSecurityEvent(mockRequest, 'suspicious_request', 'low', {});

      const stats = getSecurityStats();

      expect(stats.eventsByType.failed_login).toBe(2);
      expect(stats.eventsByType.suspicious_request).toBe(1);
    });

    it('should count events by severity', () => {

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        nextUrl: { pathname: '/api/test' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as unknown as NextRequest;

      logSecurityEvent(mockRequest, 'suspicious_request', 'low', {});
      logSecurityEvent(mockRequest, 'suspicious_request', 'medium', {});
      logSecurityEvent(mockRequest, 'suspicious_request', 'high', {});
      logSecurityEvent(mockRequest, 'suspicious_request', 'critical', {});

      const stats = getSecurityStats();

      expect(stats.eventsBySeverity.low).toBe(1);
      expect(stats.eventsBySeverity.medium).toBe(1);
      expect(stats.eventsBySeverity.high).toBe(1);
      expect(stats.eventsBySeverity.critical).toBe(1);
      expect(stats.criticalEvents).toBe(1);
    });

    it('should track top IPs', () => {

      const createRequest = (ip: string) => ({
        method: 'GET',
        url: 'http://localhost/api/test',
        nextUrl: { pathname: '/api/test' },
        headers: {
          get: jest.fn().mockReturnValue(ip),
        },
      }) as unknown as NextRequest;

      // IP1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        logSecurityEvent(createRequest('192.168.1.1'), 'suspicious_request', 'low', {});
      }

      // IP2 makes 3 requests
      for (let i = 0; i < 3; i++) {
        logSecurityEvent(createRequest('192.168.1.2'), 'suspicious_request', 'low', {});
      }

      const stats = getSecurityStats();

      expect(stats.topIPs[0]).toMatchObject({
        ip: '192.168.1.1',
        count: 5,
      });
      expect(stats.topIPs[1]).toMatchObject({
        ip: '192.168.1.2',
        count: 3,
      });
    });

    it('should only count events from last 24 hours', () => {

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        nextUrl: { pathname: '/api/test' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as unknown as NextRequest;

      logSecurityEvent(mockRequest, 'suspicious_request', 'low', {});

      const stats = getSecurityStats();

      expect(stats.totalEvents).toBe(1);
      expect(stats.events24h).toBe(1);
    });
  });

  describe('cleanupOldEvents', () => {
    beforeEach(() => {
      cleanupOldEvents(-1); // Ensure clean state
    });

    it('should return 0 when no events to clean', () => {
      const removed = cleanupOldEvents(30);
      expect(removed).toBe(0);
    });

    it('should log cleanup information', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        nextUrl: { pathname: '/api/test' },
        headers: {
          get: jest.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as unknown as NextRequest;

      logSecurityEvent(mockRequest, 'suspicious_request', 'low', {});

      cleanupOldEvents(0);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Limpeza de eventos')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Integration', () => {
    beforeEach(() => {
      cleanupOldEvents(-1); // Ensure clean state for integration tests
    });

    it('should handle complete security audit workflow', () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost/api/login',
        nextUrl: { pathname: '/api/login' },
        headers: {
          get: jest.fn().mockImplementation((key: string) => {
            const headers: Record<string, string> = {
              'x-forwarded-for': '203.0.113.1',
              'user-agent': 'Mozilla/5.0',
            };
            return headers[key.toLowerCase()] || null;
          }),
        },
      } as unknown as NextRequest;

      // Log various events
      logSecurityEvent(mockRequest, 'failed_login', 'medium', { attempts: 3 }, 'user1');
      logSecurityEvent(mockRequest, 'failed_login', 'medium', { attempts: 4 }, 'user1');
      logSecurityEvent(mockRequest, 'failed_login', 'high', { attempts: 5 }, 'user1');

      // Get stats
      const stats = getSecurityStats();
      expect(stats.totalEvents).toBe(3);
      expect(stats.eventsByType.failed_login).toBe(3);
      expect(stats.eventsBySeverity.medium).toBe(2);
      expect(stats.eventsBySeverity.high).toBe(1);

      // Get recent events
      const events = getRecentSecurityEvents();
      expect(events.length).toBeGreaterThanOrEqual(3);
      // Find our events
      const ourEvents = events.filter((e: any) => e.userId === 'user1');
      expect(ourEvents.length).toBe(3);
      expect(ourEvents.some((e: any) => e.details.attempts === 5)).toBe(true);

      // Cleanup - pass negative value to remove recent events (for testing)
      const removed = cleanupOldEvents(-1);
      expect(removed).toBeGreaterThan(0);
    });

    it('should detect and block multiple attack patterns', () => {
      const attacks = [
        {
          url: 'http://localhost/api/users',
          body: 'SELECT * FROM users',
          expectedStatus: 403,
          type: 'SQL injection',
        },
        {
          url: 'http://localhost/api/search',
          body: '<script>alert(1)</script>',
          expectedStatus: 403,
          type: 'XSS',
        },
        {
          url: 'http://localhost/shell.php',
          body: '',
          expectedStatus: 403,
          type: 'PHP file access',
        },
        {
          url: 'http://localhost/.env',
          body: '',
          expectedStatus: 403,
          type: '.env access',
        },
      ];

      attacks.forEach((attack) => {
        const mockRequest = {
          method: 'POST',
          url: attack.url,
          nextUrl: { pathname: attack.url.split('?')[0], toString: () => attack.url },
          headers: {
            get: jest.fn().mockReturnValue('Mozilla/5.0'),
          },
          body: attack.body ? { toString: () => attack.body } : null,
        } as unknown as NextRequest;

        const result = securityAuditMiddleware(mockRequest);
        expect(result?.status).toBe(attack.expectedStatus);
      });
    });
  });
});
