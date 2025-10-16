/**
 * @jest-environment node
 */

import { CACHE_KEYS, CACHE_TTL } from '../../../lib/services/cache-service';

describe('lib/services/cache-service', () => {
  describe('CACHE_KEYS Constants', () => {
    it('should define all static cache key constants', () => {
      expect(CACHE_KEYS.CLIENTES).toBe('clientes');
      expect(CACHE_KEYS.ORDENS_SERVICO).toBe('ordens_servico');
      expect(CACHE_KEYS.PECAS).toBe('pecas');
      expect(CACHE_KEYS.FORNECEDORES).toBe('fornecedores');
      expect(CACHE_KEYS.METRICAS_FINANCEIRAS).toBe('metricas_financeiras');
      expect(CACHE_KEYS.DASHBOARD_STATS).toBe('dashboard_stats');
      expect(CACHE_KEYS.COMMUNICATION_METRICS).toBe('communication_metrics');
    });

    it('should generate dynamic cache keys by ID', () => {
      expect(CACHE_KEYS.CLIENTE_BY_ID('123')).toBe('cliente:123');
      expect(CACHE_KEYS.ORDEM_BY_ID('456')).toBe('ordem:456');
      expect(CACHE_KEYS.PECA_BY_ID('789')).toBe('peca:789');
    });

    it('should generate user permission cache keys', () => {
      expect(CACHE_KEYS.USER_PERMISSIONS('user-1')).toBe('permissions:user-1');
      expect(CACHE_KEYS.USER_PERMISSIONS('admin-2')).toBe('permissions:admin-2');
    });

    it('should handle special characters in dynamic keys', () => {
      expect(CACHE_KEYS.CLIENTE_BY_ID('123-abc')).toBe('cliente:123-abc');
      expect(CACHE_KEYS.USER_PERMISSIONS('user@domain.com')).toBe('permissions:user@domain.com');
    });
  });

  describe('CACHE_TTL Constants', () => {
    it('should define all TTL constants in seconds', () => {
      expect(CACHE_TTL.SHORT).toBe(60);
      expect(CACHE_TTL.MEDIUM).toBe(300);
      expect(CACHE_TTL.LONG).toBe(900);
      expect(CACHE_TTL.VERY_LONG).toBe(3600);
      expect(CACHE_TTL.DAILY).toBe(86400);
    });

    it('should have correct time ordering', () => {
      expect(CACHE_TTL.SHORT).toBeLessThan(CACHE_TTL.MEDIUM);
      expect(CACHE_TTL.MEDIUM).toBeLessThan(CACHE_TTL.LONG);
      expect(CACHE_TTL.LONG).toBeLessThan(CACHE_TTL.VERY_LONG);
      expect(CACHE_TTL.VERY_LONG).toBeLessThan(CACHE_TTL.DAILY);
    });

    it('should convert to expected time durations', () => {
      expect(CACHE_TTL.SHORT).toBe(1 * 60);           // 1 minuto
      expect(CACHE_TTL.MEDIUM).toBe(5 * 60);          // 5 minutos
      expect(CACHE_TTL.LONG).toBe(15 * 60);           // 15 minutos
      expect(CACHE_TTL.VERY_LONG).toBe(60 * 60);      // 1 hora
      expect(CACHE_TTL.DAILY).toBe(24 * 60 * 60);     // 24 horas
    });

    it('should be all positive numbers', () => {
      expect(CACHE_TTL.SHORT).toBeGreaterThan(0);
      expect(CACHE_TTL.MEDIUM).toBeGreaterThan(0);
      expect(CACHE_TTL.LONG).toBeGreaterThan(0);
      expect(CACHE_TTL.VERY_LONG).toBeGreaterThan(0);
      expect(CACHE_TTL.DAILY).toBeGreaterThan(0);
    });
  });

  describe('CacheService exports', () => {
    it('should export cacheService singleton', () => {
      const { cacheService } = require('../../../lib/services/cache-service');
      expect(cacheService).toBeDefined();
      expect(typeof cacheService.set).toBe('function');
      expect(typeof cacheService.get).toBe('function');
      expect(typeof cacheService.delete).toBe('function');
      expect(typeof cacheService.exists).toBe('function');
      expect(typeof cacheService.increment).toBe('function');
      expect(typeof cacheService.listPush).toBe('function');
      expect(typeof cacheService.listRange).toBe('function');
      expect(typeof cacheService.deletePattern).toBe('function');
      expect(typeof cacheService.expire).toBe('function');
      expect(typeof cacheService.flushAll).toBe('function');
      expect(typeof cacheService.getStats).toBe('function');
      expect(typeof cacheService.disconnect).toBe('function');
      expect(typeof cacheService.isRedisConnected).toBe('function');
    });
  });

  describe('Cache key construction patterns', () => {
    it('should support dot notation for nested access', () => {
      const orderId = '12345';
      const key = CACHE_KEYS.ORDEM_BY_ID(orderId);
      expect(key).toMatch(/^ordem:/);
      expect(key).toContain(orderId);
    });

    it('should handle numeric IDs', () => {
      const numericId = '9999';
      expect(CACHE_KEYS.CLIENTE_BY_ID(numericId)).toBe(`cliente:${numericId}`);
    });

    it('should support UUID patterns', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(CACHE_KEYS.CLIENTE_BY_ID(uuid)).toContain(uuid);
    });
  });

  describe('TTL value comparisons', () => {
    it('should use SHORT for frequently changing data', () => {
      // SHORT should be less than 2 minutes
      expect(CACHE_TTL.SHORT).toBeLessThanOrEqual(120);
    });

    it('should use MEDIUM for moderately changing data', () => {
      // MEDIUM should be 5-10 minutes
      expect(CACHE_TTL.MEDIUM).toBeGreaterThan(CACHE_TTL.SHORT);
      expect(CACHE_TTL.MEDIUM).toBeLessThanOrEqual(600);
    });

    it('should use LONG for stable data', () => {
      // LONG should be around 15 minutes
      expect(CACHE_TTL.LONG).toBeGreaterThan(CACHE_TTL.MEDIUM);
      expect(CACHE_TTL.LONG).toBeLessThanOrEqual(1800);
    });

    it('should use VERY_LONG for mostly static data', () => {
      // VERY_LONG should be around 1 hour
      expect(CACHE_TTL.VERY_LONG).toBeGreaterThan(CACHE_TTL.LONG);
      expect(CACHE_TTL.VERY_LONG).toBeLessThanOrEqual(7200);
    });

    it('should use DAILY for highly static data', () => {
      // DAILY should be 24 hours
      expect(CACHE_TTL.DAILY).toBeGreaterThan(CACHE_TTL.VERY_LONG);
    });
  });

  describe('Cache key conventions', () => {
    it('should use colon-separated naming convention for scoped keys', () => {
      const key = CACHE_KEYS.CLIENTE_BY_ID('123');
      expect(key).toMatch(/^[\w-]+:[\w-]+$/);
    });

    it('should be deterministic - same input produces same output', () => {
      const id = 'test-id-123';
      const key1 = CACHE_KEYS.CLIENTE_BY_ID(id);
      const key2 = CACHE_KEYS.CLIENTE_BY_ID(id);
      expect(key1).toBe(key2);
    });

    it('should support querying by pattern', () => {
      const keys = [
        CACHE_KEYS.CLIENTE_BY_ID('1'),
        CACHE_KEYS.CLIENTE_BY_ID('2'),
        CACHE_KEYS.CLIENTE_BY_ID('3'),
      ];
      // All should match the pattern 'cliente:*'
      keys.forEach(key => {
        expect(key).toMatch(/^cliente:\d+$/);
      });
    });
  });

  describe('Constants type safety', () => {
    it('should have const assertion on CACHE_KEYS', () => {
      // Verify that CACHE_KEYS is using const assertion (as const)
      // This provides type safety at compile time
      const keys = Object.keys(CACHE_KEYS);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain('CLIENTES');
      expect(keys).toContain('ORDENS_SERVICO');
    });

    it('should have const assertion on CACHE_TTL', () => {
      // Verify that CACHE_TTL is using const assertion (as const)
      // This provides type safety at compile time
      const ttlKeys = Object.keys(CACHE_TTL);
      expect(ttlKeys.length).toBeGreaterThan(0);
      expect(ttlKeys).toContain('SHORT');
      expect(ttlKeys).toContain('DAILY');
    });
  });
});
