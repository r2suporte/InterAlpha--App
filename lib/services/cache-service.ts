import Redis from 'ioredis';
import { logger } from './logger-service';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  connectTimeout: number;
  lazyConnect: boolean;
  enableOfflineQueue: boolean;
  retryStrategy?: (times: number) => number | null;
}

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis() {
    if (process.env.NODE_ENV === 'test' || process.env.REDIS_DISABLED === 'true') {
      return;
    }

    try {
      const config: CacheConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: false,
        enableOfflineQueue: false,
        retryStrategy(times: number) {
          if (times > 1) return null;
          return 100;
        },
      };

      this.redis = new Redis(config);

      this.redis.on('connect', () => {
        logger.info('✅ Redis conectado com sucesso');
        this.isConnected = true;
      });

      this.redis.on('error', error => {
        logger.error('❌ Erro na conexão Redis:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.info('🔌 Conexão Redis fechada');
        this.isConnected = false;
      });
    } catch (error) {
      logger.error('❌ Erro ao inicializar Redis:', error as Error);
    }
  }

  /**
   * Verifica se o Redis está conectado
   */
  isRedisConnected(): boolean {
    return this.isConnected && this.redis !== null;
  }

  /**
   * Armazena dados no cache com TTL
   */
  async set(
    key: string,
    value: unknown,
    ttlSeconds: number = 300
  ): Promise<boolean> {
    if (!this.isRedisConnected()) {
      logger.warn('⚠️ Redis não conectado, operação de cache ignorada');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis!.setex(key, ttlSeconds, serializedValue);
      return true;
    } catch (error) {
      logger.error('❌ Erro ao armazenar no cache:', error as Error);
      return false;
    }
  }

  /**
   * Recupera dados do cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisConnected()) {
      return null;
    }

    try {
      const cachedValue = await this.redis!.get(key);
      if (cachedValue) {
        return JSON.parse(cachedValue) as T;
      }
      return null;
    } catch (error) {
      logger.error('❌ Erro ao recuperar do cache:', error as Error);
      return null;
    }
  }

  /**
   * Remove uma chave do cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isRedisConnected()) {
      return false;
    }

    try {
      const result = await this.redis!.del(key);
      return result > 0;
    } catch (error) {
      logger.error('❌ Erro ao deletar do cache:', error as Error);
      return false;
    }
  }

  /**
   * Remove múltiplas chaves do cache usando padrão
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isRedisConnected()) {
      return 0;
    }

    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length > 0) {
        return await this.redis!.del(...keys);
      }
      return 0;
    } catch (error) {
      logger.error('❌ Erro ao deletar padrão do cache:', error as Error);
      return 0;
    }
  }

  /**
   * Verifica se uma chave existe no cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isRedisConnected()) {
      return false;
    }

    try {
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('❌ Erro ao verificar existência no cache:', error as Error);
      return false;
    }
  }

  /**
   * Define TTL para uma chave existente
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isRedisConnected()) {
      return false;
    }

    try {
      const result = await this.redis!.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error('❌ Erro ao definir TTL:', error as Error);
      return false;
    }
  }

  /**
   * Obtém o TTL (em segundos) de uma chave
   */
  async getTTL(key: string): Promise<number | null> {
    if (!this.isRedisConnected()) {
      return null;
    }

    try {
      return await this.redis!.ttl(key);
    } catch (error) {
      logger.error('❌ Erro ao obter TTL:', error as Error);
      return null;
    }
  }

  /**
   * Incrementa um contador no cache
   */
  async increment(key: string, amount: number = 1): Promise<number | null> {
    if (!this.isRedisConnected()) {
      return null;
    }

    try {
      return await this.redis!.incrby(key, amount);
    } catch (error) {
      logger.error('❌ Erro ao incrementar contador:', error as Error);
      return null;
    }
  }

  /**
   * Armazena dados em uma lista
   */
  async listPush(key: string, value: unknown): Promise<boolean> {
    if (!this.isRedisConnected()) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis!.lpush(key, serializedValue);
      return true;
    } catch (error) {
      logger.error('❌ Erro ao adicionar à lista:', error as Error);
      return false;
    }
  }

  /**
   * Recupera dados de uma lista
   */
  async listRange<T>(
    key: string,
    start: number = 0,
    end: number = -1
  ): Promise<T[]> {
    if (!this.isRedisConnected()) {
      return [];
    }

    try {
      const values = await this.redis!.lrange(key, start, end);
      return values.map(value => JSON.parse(value) as T);
    } catch (error) {
      logger.error('❌ Erro ao recuperar lista:', error as Error);
      return [];
    }
  }

  /**
   * Limpa todo o cache (usar com cuidado)
   */
  async flushAll(): Promise<boolean> {
    if (!this.isRedisConnected()) {
      return false;
    }

    try {
      await this.redis!.flushall();
      return true;
    } catch (error) {
      logger.error('❌ Erro ao limpar cache:', error as Error);
      return false;
    }
  }

  /**
   * Fecha a conexão Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
  }

  /**
   * Obtém estatísticas do Redis
   */
  async getStats(): Promise<Record<string, unknown> | null> {
    if (!this.isRedisConnected()) {
      return null;
    }

    try {
      const memory = await this.redis!.info('memory');
      const stats = await this.redis!.info('stats');
      const keyspace = await this.redis!.info('keyspace');

      return {
        connected: this.isConnected,
        memory,
        stats,
        keyspace,
      } as Record<string, unknown>;
    } catch (error) {
      logger.error('❌ Erro ao obter estatísticas:', error as Error);
      return null;
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cache keys constants
export const CACHE_KEYS = {
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
} as const;

// Cache TTL constants (em segundos)
export const CACHE_TTL = {
  SHORT: 60, // 1 minuto
  MEDIUM: 300, // 5 minutos
  LONG: 900, // 15 minutos
  VERY_LONG: 3600, // 1 hora
  DAILY: 86400, // 24 horas
} as const;

export default cacheService;
