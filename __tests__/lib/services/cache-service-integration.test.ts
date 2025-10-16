/**
 * @jest-environment node
 */

import { CACHE_KEYS, CACHE_TTL, cacheService } from '../../../lib/services/cache-service';

/**
 * Cache Service Integration Tests
 * 
 * These tests verify the cache service behavior when Redis is available.
 * Note: These tests require Redis to be running locally on default port 6379
 * or configured via environment variables (REDIS_HOST, REDIS_PORT, etc)
 */

describe('lib/services/cache-service - Integration Tests', () => {
  // Dynamically determine if Redis is available
  const isRedisAvailable = () => {
    try {
      return cacheService.isRedisConnected();
    } catch {
      return false;
    }
  };

  // Use test.skip for tests that require Redis when it's not available
  const testWithRedis = isRedisAvailable() ? test : test.skip;

  afterAll(async () => {
    // Cleanup - disconnect from Redis
    if (cacheService.isRedisConnected()) {
      await cacheService.disconnect();
    }
  });

  describe('Key naming conventions', () => {
    it('should provide consistent CACHE_KEYS', () => {
      // Static keys
      expect(CACHE_KEYS.CLIENTES).toBe('clientes');
      expect(CACHE_KEYS.ORDENS_SERVICO).toBe('ordens_servico');
      expect(CACHE_KEYS.PECAS).toBe('pecas');
      expect(CACHE_KEYS.DASHBOARD_STATS).toBe('dashboard_stats');
      expect(CACHE_KEYS.METRICAS_FINANCEIRAS).toBe('metricas_financeiras');
      expect(CACHE_KEYS.COMMUNICATION_METRICS).toBe('communication_metrics');
      expect(CACHE_KEYS.FORNECEDORES).toBe('fornecedores');
    });

    it('should generate dynamic keys with IDs', () => {
      expect(CACHE_KEYS.CLIENTE_BY_ID('123')).toBe('cliente:123');
      expect(CACHE_KEYS.ORDEM_BY_ID('456')).toBe('ordem:456');
      expect(CACHE_KEYS.PECA_BY_ID('789')).toBe('peca:789');
      expect(CACHE_KEYS.USER_PERMISSIONS('user-1')).toBe('permissions:user-1');
    });

    it('should support UUID patterns in keys', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(CACHE_KEYS.CLIENTE_BY_ID(uuid)).toBe(`cliente:${uuid}`);
      expect(CACHE_KEYS.ORDEM_BY_ID(uuid)).toBe(`ordem:${uuid}`);
    });

    it('should handle special characters in keys', () => {
      expect(CACHE_KEYS.CLIENTE_BY_ID('123-abc')).toBe('cliente:123-abc');
      expect(CACHE_KEYS.CLIENTE_BY_ID('client_123')).toBe('cliente:client_123');
      expect(CACHE_KEYS.USER_PERMISSIONS('admin@company.com')).toBe('permissions:admin@company.com');
    });
  });

  describe('TTL values', () => {
    it('should provide all required TTL constants', () => {
      expect(CACHE_TTL.SHORT).toBe(60);
      expect(CACHE_TTL.MEDIUM).toBe(300);
      expect(CACHE_TTL.LONG).toBe(900);
      expect(CACHE_TTL.VERY_LONG).toBe(3600);
      expect(CACHE_TTL.DAILY).toBe(86400);
    });

    it('should have proper TTL ordering', () => {
      expect(CACHE_TTL.SHORT < CACHE_TTL.MEDIUM).toBe(true);
      expect(CACHE_TTL.MEDIUM < CACHE_TTL.LONG).toBe(true);
      expect(CACHE_TTL.LONG < CACHE_TTL.VERY_LONG).toBe(true);
      expect(CACHE_TTL.VERY_LONG < CACHE_TTL.DAILY).toBe(true);
    });

    it('should match expected time durations', () => {
      expect(CACHE_TTL.SHORT).toBe(60); // 1 minuto
      expect(CACHE_TTL.MEDIUM).toBe(5 * 60); // 5 minutos
      expect(CACHE_TTL.LONG).toBe(15 * 60); // 15 minutos
      expect(CACHE_TTL.VERY_LONG).toBe(60 * 60); // 1 hora
      expect(CACHE_TTL.DAILY).toBe(24 * 60 * 60); // 24 horas
    });

    it('should all be positive numbers', () => {
      expect(CACHE_TTL.SHORT).toBeGreaterThan(0);
      expect(CACHE_TTL.MEDIUM).toBeGreaterThan(0);
      expect(CACHE_TTL.LONG).toBeGreaterThan(0);
      expect(CACHE_TTL.VERY_LONG).toBeGreaterThan(0);
      expect(CACHE_TTL.DAILY).toBeGreaterThan(0);
    });
  });

  describe('Service initialization', () => {
    it('should export cacheService singleton', () => {
      expect(cacheService).toBeDefined();
      expect(typeof cacheService).toBe('object');
    });

    it('should have all required methods', () => {
      const requiredMethods = [
        'set',
        'get',
        'delete',
        'exists',
        'increment',
        'listPush',
        'listRange',
        'deletePattern',
        'expire',
        'flushAll',
        'getStats',
        'disconnect',
        'isRedisConnected',
      ];

      requiredMethods.forEach(method => {
        expect(typeof (cacheService as any)[method]).toBe('function');
      });
    });
  });

  describe('Service state', () => {
    it('should report connection status', () => {
      const isConnected = cacheService.isRedisConnected();
      expect(typeof isConnected).toBe('boolean');
    });

    testWithRedis('should be connected when Redis is available', () => {
      const isConnected = cacheService.isRedisConnected();
      expect(isConnected).toBe(true);
    });
  });

  describe('Cache operations flow', () => {
    testWithRedis('should complete SET->GET cycle', async () => {
      const testKey = 'test:integration:' + Date.now();
      const testData = { id: '123', name: 'Test Item', timestamp: Date.now() };

      // Set value
      const setResult = await cacheService.set(testKey, testData, CACHE_TTL.MEDIUM);
      expect(setResult).toBe(true);

      // Get value
      const getValue = await cacheService.get(testKey);
      expect(getValue).toEqual(testData);

      // Delete value
      const deleteResult = await cacheService.delete(testKey);
      expect(deleteResult).toBe(true);

      // Verify deleted
      const getDeleted = await cacheService.get(testKey);
      expect(getDeleted).toBeNull();
    });

    testWithRedis('should handle different data types', async () => {
      // String
      const stringKey = 'string:' + Date.now();
      await cacheService.set(stringKey, 'test string', CACHE_TTL.SHORT);
      let value = await cacheService.get(stringKey);
      expect(value).toBe('test string');
      await cacheService.delete(stringKey);

      // Number
      const numberKey = 'number:' + Date.now();
      await cacheService.set(numberKey, 42, CACHE_TTL.SHORT);
      value = await cacheService.get(numberKey);
      expect(value).toBe(42);
      await cacheService.delete(numberKey);

      // Boolean
      const boolKey = 'bool:' + Date.now();
      await cacheService.set(boolKey, true, CACHE_TTL.SHORT);
      value = await cacheService.get(boolKey);
      expect(value).toBe(true);
      await cacheService.delete(boolKey);

      // Array
      const arrayKey = 'array:' + Date.now();
      const arrayData = [1, 2, { id: '123' }];
      await cacheService.set(arrayKey, arrayData, CACHE_TTL.SHORT);
      value = await cacheService.get(arrayKey);
      expect(value).toEqual(arrayData);
      await cacheService.delete(arrayKey);

      // Object
      const objectKey = 'object:' + Date.now();
      const objectData = { a: 1, b: { c: 2 }, d: [3, 4] };
      await cacheService.set(objectKey, objectData, CACHE_TTL.SHORT);
      value = await cacheService.get(objectKey);
      expect(value).toEqual(objectData);
      await cacheService.delete(objectKey);
    });

    testWithRedis('should support EXISTS check', async () => {
      const testKey = 'exists:test:' + Date.now();

      // Should not exist initially
      let exists = await cacheService.exists(testKey);
      expect(exists).toBe(false);

      // Create it
      await cacheService.set(testKey, 'value', CACHE_TTL.SHORT);
      exists = await cacheService.exists(testKey);
      expect(exists).toBe(true);

      // Delete it
      await cacheService.delete(testKey);
      exists = await cacheService.exists(testKey);
      expect(exists).toBe(false);
    });

    testWithRedis('should support EXPIRE operation', async () => {
      const testKey = 'expire:test:' + Date.now();

      // Create with long TTL
      await cacheService.set(testKey, 'value', 3600);

      // Change TTL
      const result = await cacheService.expire(testKey, 60);
      expect(result).toBe(true);

      // Cleanup
      await cacheService.delete(testKey);
    });

    testWithRedis('should support INCREMENT operation', async () => {
      const counterKey = 'counter:test:' + Date.now();

      // Increment by 1
      let result = await cacheService.increment(counterKey);
      expect(result).toBe(1);

      // Increment by 5
      result = await cacheService.increment(counterKey, 5);
      expect(result).toBe(6);

      // Decrement by 3
      result = await cacheService.increment(counterKey, -3);
      expect(result).toBe(3);

      // Cleanup
      await cacheService.delete(counterKey);
    });

    testWithRedis('should support LIST operations', async () => {
      const listKey = 'list:test:' + Date.now();

      // Push values
      await cacheService.listPush(listKey, { id: '1' });
      await cacheService.listPush(listKey, { id: '2' });
      await cacheService.listPush(listKey, { id: '3' });

      // Get range
      const items = await cacheService.listRange(listKey, 0, -1);
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);

      // Cleanup
      await cacheService.delete(listKey);
    });

    testWithRedis('should support DELETE PATTERN', async () => {
      const prefix = 'pattern:test:' + Date.now() + ':';

      // Create multiple keys
      await cacheService.set(prefix + 'key1', 'value1', CACHE_TTL.SHORT);
      await cacheService.set(prefix + 'key2', 'value2', CACHE_TTL.SHORT);
      await cacheService.set(prefix + 'key3', 'value3', CACHE_TTL.SHORT);

      // Delete by pattern
      const deleted = await cacheService.deletePattern(prefix + '*');
      expect(deleted).toBeGreaterThanOrEqual(3);

      // Verify all deleted
      const exists1 = await cacheService.exists(prefix + 'key1');
      const exists2 = await cacheService.exists(prefix + 'key2');
      const exists3 = await cacheService.exists(prefix + 'key3');
      expect(exists1).toBe(false);
      expect(exists2).toBe(false);
      expect(exists3).toBe(false);
    });
  });

  describe('Real-world usage patterns', () => {
    testWithRedis('should cache cliente data with appropriate TTL', async () => {
      const clienteId = 'cliente:123';
      const clienteData = {
        id: '123',
        name: 'Empresa XYZ',
        email: 'contato@xyz.com',
        phone: '11999999999',
      };

      await cacheService.set(CACHE_KEYS.CLIENTE_BY_ID('123'), clienteData, CACHE_TTL.LONG);
      const cached = await cacheService.get(CACHE_KEYS.CLIENTE_BY_ID('123'));
      expect(cached).toEqual(clienteData);

      await cacheService.delete(CACHE_KEYS.CLIENTE_BY_ID('123'));
    });

    testWithRedis('should cache user permissions', async () => {
      const userId = 'user-123';
      const permissions = ['read', 'write', 'delete'];

      await cacheService.set(CACHE_KEYS.USER_PERMISSIONS(userId), permissions, CACHE_TTL.VERY_LONG);
      const cached = await cacheService.get(CACHE_KEYS.USER_PERMISSIONS(userId));
      expect(cached).toEqual(permissions);

      await cacheService.delete(CACHE_KEYS.USER_PERMISSIONS(userId));
    });

    testWithRedis('should track metrics with counters', async () => {
      const metricsKey = 'metrics:requests:' + Date.now();

      // Track requests
      await cacheService.increment(metricsKey);
      await cacheService.increment(metricsKey);
      await cacheService.increment(metricsKey);

      // Should have value or be trackable
      const exists = await cacheService.exists(metricsKey);
      expect(exists).toBe(true);

      await cacheService.delete(metricsKey);
    });
  });

  describe('Statistics', () => {
    testWithRedis('should retrieve cache statistics', async () => {
      const stats = await cacheService.getStats();
      if (stats) {
        expect(stats.connected).toBeDefined();
      }
    });
  });
});
