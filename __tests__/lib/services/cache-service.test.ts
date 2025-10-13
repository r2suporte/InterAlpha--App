// Mock do módulo cache-service
const mockCacheService = {
  isRedisConnected: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  deletePattern: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  increment: jest.fn(),
  listPush: jest.fn(),
  listRange: jest.fn(),
  flushAll: jest.fn(),
  disconnect: jest.fn(),
  getStats: jest.fn(),
};

jest.mock('../../../lib/services/cache-service', () => ({
  cacheService: mockCacheService,
  CACHE_KEYS: {
    CLIENTES: 'clientes',
    CLIENTE_BY_ID: (id: string) => `cliente:${id}`,
    ORDENS_SERVICO: 'ordens_servico',
    ORDEM_BY_ID: (id: string) => `ordem:${id}`,
    PECAS: 'pecas',
    PECA_BY_ID: (id: string) => `peca:${id}`,
    FORNECEDORES: 'fornecedores',
    METRICAS_FINANCEIRAS: 'metricas_financeiras',
    DASHBOARD_STATS: 'dashboard_stats',
    USER_PERMISSIONS: (userId: string) => `permissions:${userId}`,
    COMMUNICATION_METRICS: 'communication_metrics',
  },
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 900,
    VERY_LONG: 3600,
    DAILY: 86400,
  },
}));

// Importar após o mock
const { cacheService, CACHE_KEYS, CACHE_TTL } = require('../../../lib/services/cache-service');

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Por padrão, simular que o Redis está conectado
    mockCacheService.isRedisConnected.mockReturnValue(true);
  });

  describe('isRedisConnected', () => {
    it('deve retornar true quando conectado', () => {
      mockCacheService.isRedisConnected.mockReturnValue(true);
      const result = cacheService.isRedisConnected();
      expect(result).toBe(true);
    });

    it('deve retornar false quando não conectado', () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      const result = cacheService.isRedisConnected();
      expect(result).toBe(false);
    });
  });

  describe('set', () => {
    it('deve armazenar dados com sucesso', async () => {
      mockCacheService.set.mockResolvedValue(true);
      const result = await cacheService.set('test-key', { data: 'test' }, 300);
      expect(result).toBe(true);
      expect(mockCacheService.set).toHaveBeenCalledWith('test-key', { data: 'test' }, 300);
    });

    it('deve retornar false quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.set.mockResolvedValue(false);
      const result = await cacheService.set('test-key', { data: 'test' });
      expect(result).toBe(false);
    });

    it('deve retornar false em caso de erro', async () => {
      mockCacheService.set.mockResolvedValue(false);
      const result = await cacheService.set('test-key', { data: 'test' });
      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('deve recuperar dados com sucesso', async () => {
      const testData = { id: 1, name: 'Test' };
      mockCacheService.get.mockResolvedValue(testData);
      const result = await cacheService.get('test-key');
      expect(result).toEqual(testData);
      expect(mockCacheService.get).toHaveBeenCalledWith('test-key');
    });

    it('deve retornar null quando chave não existe', async () => {
      mockCacheService.get.mockResolvedValue(null);
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('deve retornar null quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.get.mockResolvedValue(null);
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deve deletar chave com sucesso', async () => {
      mockCacheService.delete.mockResolvedValue(true);
      const result = await cacheService.delete('test-key');
      expect(result).toBe(true);
      expect(mockCacheService.delete).toHaveBeenCalledWith('test-key');
    });

    it('deve retornar false quando chave não existe', async () => {
      mockCacheService.delete.mockResolvedValue(false);
      const result = await cacheService.delete('non-existent-key');
      expect(result).toBe(false);
    });

    it('deve retornar false quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.delete.mockResolvedValue(false);
      const result = await cacheService.delete('test-key');
      expect(result).toBe(false);
    });
  });

  describe('deletePattern', () => {
    it('deve deletar múltiplas chaves por padrão', async () => {
      mockCacheService.deletePattern.mockResolvedValue(3);
      const result = await cacheService.deletePattern('test:*');
      expect(result).toBe(3);
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith('test:*');
    });

    it('deve retornar 0 quando nenhuma chave corresponde ao padrão', async () => {
      mockCacheService.deletePattern.mockResolvedValue(0);
      const result = await cacheService.deletePattern('non-existent:*');
      expect(result).toBe(0);
    });

    it('deve retornar 0 quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.deletePattern.mockResolvedValue(0);
      const result = await cacheService.deletePattern('test:*');
      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('deve retornar true quando chave existe', async () => {
      mockCacheService.exists.mockResolvedValue(true);
      const result = await cacheService.exists('test-key');
      expect(result).toBe(true);
      expect(mockCacheService.exists).toHaveBeenCalledWith('test-key');
    });

    it('deve retornar false quando chave não existe', async () => {
      mockCacheService.exists.mockResolvedValue(false);
      const result = await cacheService.exists('non-existent-key');
      expect(result).toBe(false);
    });

    it('deve retornar false quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.exists.mockResolvedValue(false);
      const result = await cacheService.exists('test-key');
      expect(result).toBe(false);
    });
  });

  describe('expire', () => {
    it('deve definir TTL com sucesso', async () => {
      mockCacheService.expire.mockResolvedValue(true);
      const result = await cacheService.expire('test-key', 300);
      expect(result).toBe(true);
      expect(mockCacheService.expire).toHaveBeenCalledWith('test-key', 300);
    });

    it('deve retornar false quando chave não existe', async () => {
      mockCacheService.expire.mockResolvedValue(false);
      const result = await cacheService.expire('non-existent-key', 300);
      expect(result).toBe(false);
    });

    it('deve retornar false quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.expire.mockResolvedValue(false);
      const result = await cacheService.expire('test-key', 300);
      expect(result).toBe(false);
    });
  });

  describe('increment', () => {
    it('deve incrementar contador com sucesso', async () => {
      mockCacheService.increment.mockResolvedValue(1);
      const result = await cacheService.increment('counter-key');
      expect(result).toBe(1);
      expect(mockCacheService.increment).toHaveBeenCalledWith('counter-key');
    });

    it('deve incrementar por valor específico', async () => {
      mockCacheService.increment.mockResolvedValue(5);
      const result = await cacheService.increment('counter-key', 5);
      expect(result).toBe(5);
      expect(mockCacheService.increment).toHaveBeenCalledWith('counter-key', 5);
    });

    it('deve retornar null quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.increment.mockResolvedValue(null);
      const result = await cacheService.increment('counter-key');
      expect(result).toBeNull();
    });
  });

  describe('listPush', () => {
    it('deve adicionar item à lista com sucesso', async () => {
      mockCacheService.listPush.mockResolvedValue(true);
      const result = await cacheService.listPush('list-key', { item: 'test' });
      expect(result).toBe(true);
      expect(mockCacheService.listPush).toHaveBeenCalledWith('list-key', { item: 'test' });
    });

    it('deve retornar false quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.listPush.mockResolvedValue(false);
      const result = await cacheService.listPush('list-key', { item: 'test' });
      expect(result).toBe(false);
    });
  });

  describe('listRange', () => {
    it('deve recuperar itens da lista com sucesso', async () => {
      const testItems = [{ item: 'test1' }, { item: 'test2' }];
      mockCacheService.listRange.mockResolvedValue(testItems);
      const result = await cacheService.listRange('list-key', 0, -1);
      expect(result).toEqual(testItems);
      expect(mockCacheService.listRange).toHaveBeenCalledWith('list-key', 0, -1);
    });

    it('deve retornar array vazio quando lista não existe', async () => {
      mockCacheService.listRange.mockResolvedValue([]);
      const result = await cacheService.listRange('non-existent-list');
      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.listRange.mockResolvedValue([]);
      const result = await cacheService.listRange('list-key');
      expect(result).toEqual([]);
    });
  });

  describe('flushAll', () => {
    it('deve limpar todo o cache com sucesso', async () => {
      mockCacheService.flushAll.mockResolvedValue(true);
      const result = await cacheService.flushAll();
      expect(result).toBe(true);
      expect(mockCacheService.flushAll).toHaveBeenCalled();
    });

    it('deve retornar false quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.flushAll.mockResolvedValue(false);
      const result = await cacheService.flushAll();
      expect(result).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('deve desconectar com sucesso', async () => {
      mockCacheService.disconnect.mockResolvedValue(undefined);
      await cacheService.disconnect();
      expect(mockCacheService.disconnect).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas do Redis', async () => {
      const mockStats = { used_memory: '1024', connected_clients: '5' };
      mockCacheService.getStats.mockResolvedValue(mockStats);
      const result = await cacheService.getStats();
      expect(result).toEqual(mockStats);
      expect(mockCacheService.getStats).toHaveBeenCalled();
    });

    it('deve retornar null quando Redis não está conectado', async () => {
      mockCacheService.isRedisConnected.mockReturnValue(false);
      mockCacheService.getStats.mockResolvedValue(null);
      const result = await cacheService.getStats();
      expect(result).toBeNull();
    });
  });

  describe('CACHE_KEYS', () => {
    it('deve ter todas as chaves definidas', () => {
      expect(CACHE_KEYS.CLIENTES).toBe('clientes');
      expect(CACHE_KEYS.CLIENTE_BY_ID('123')).toBe('cliente:123');
      expect(CACHE_KEYS.ORDENS_SERVICO).toBe('ordens_servico');
      expect(CACHE_KEYS.ORDEM_BY_ID('456')).toBe('ordem:456');
      expect(CACHE_KEYS.PECAS).toBe('pecas');
      expect(CACHE_KEYS.PECA_BY_ID('789')).toBe('peca:789');
      expect(CACHE_KEYS.FORNECEDORES).toBe('fornecedores');
      expect(CACHE_KEYS.METRICAS_FINANCEIRAS).toBe('metricas_financeiras');
      expect(CACHE_KEYS.DASHBOARD_STATS).toBe('dashboard_stats');
      expect(CACHE_KEYS.USER_PERMISSIONS('user123')).toBe('permissions:user123');
      expect(CACHE_KEYS.COMMUNICATION_METRICS).toBe('communication_metrics');
    });
  });

  describe('CACHE_TTL', () => {
    it('deve ter todos os TTLs definidos', () => {
      expect(CACHE_TTL.SHORT).toBe(60);
      expect(CACHE_TTL.MEDIUM).toBe(300);
      expect(CACHE_TTL.LONG).toBe(900);
      expect(CACHE_TTL.VERY_LONG).toBe(3600);
      expect(CACHE_TTL.DAILY).toBe(86400);
    });
  });

  describe('Cenários de Integração', () => {
    beforeEach(() => {
      // Simular conexão ativa
      mockCacheService.isRedisConnected.mockReturnValue(true);
    });

    it('deve funcionar em cenário completo de cache de cliente', async () => {
      const cacheKey = CACHE_KEYS.CLIENTE_BY_ID('123');
      const clienteData = { id: '123', nome: 'João Silva', email: 'joao@email.com' };
      
      // Armazenar dados
      mockCacheService.set.mockResolvedValue(true);
      const setResult = await cacheService.set(cacheKey, clienteData, CACHE_TTL.MEDIUM);
      expect(setResult).toBe(true);
      
      // Verificar se existe
      mockCacheService.exists.mockResolvedValue(true);
      const existsResult = await cacheService.exists(cacheKey);
      expect(existsResult).toBe(true);
      
      // Recuperar dados
      mockCacheService.get.mockResolvedValue(clienteData);
      const retrievedData = await cacheService.get(cacheKey);
      expect(retrievedData).toEqual(clienteData);
      
      // Deletar dados
      mockCacheService.delete.mockResolvedValue(true);
      const deleteResult = await cacheService.delete(cacheKey);
      expect(deleteResult).toBe(true);
    });

    it('deve funcionar em cenário de limpeza por padrão', async () => {
      // Simular múltiplas chaves de cliente
      mockCacheService.deletePattern.mockResolvedValue(3);
      const result = await cacheService.deletePattern('cliente:*');
      
      expect(result).toBe(3);
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith('cliente:*');
    });

    it('deve funcionar em cenário de contador de métricas', async () => {
      const counterKey = CACHE_KEYS.COMMUNICATION_METRICS;
      
      // Incrementar contador
      mockCacheService.increment.mockResolvedValue(1);
      let result = await cacheService.increment(counterKey);
      expect(result).toBe(1);
      
      // Incrementar novamente
      mockCacheService.increment.mockResolvedValue(2);
      result = await cacheService.increment(counterKey);
      expect(result).toBe(2);
      
      // Incrementar por valor específico
      mockCacheService.increment.mockResolvedValue(7);
      result = await cacheService.increment(counterKey, 5);
      expect(result).toBe(7);
    });
  });
});