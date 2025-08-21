/**
 * Serviço de cache avançado com invalidação inteligente
 */

import { redis, CacheKeys, CacheTTL } from '@/lib/redis'

export interface CacheOptions {
  ttl?: number
  tags?: string[]
  compress?: boolean
  version?: string
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalKeys: number
  memoryUsage: string
}

export class CacheService {
  private hitCount = 0
  private missCount = 0

  /**
   * Obter valor do cache com fallback
   */
  async get<T>(
    key: string, 
    fallback?: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T | null> {
    try {
      // Tentar obter do cache
      const cached = await redis.getJson<T>(key)
      
      if (cached !== null) {
        this.hitCount++
        return cached
      }

      this.missCount++

      // Se não encontrou e tem fallback, executar e cachear
      if (fallback) {
        const value = await fallback()
        if (value !== null && value !== undefined) {
          await this.set(key, value, options)
        }
        return value
      }

      return null
    } catch (error) {
      console.error('Cache GET error:', error)
      
      // Em caso de erro, tentar fallback
      if (fallback) {
        return await fallback()
      }
      
      return null
    }
  }

  /**
   * Definir valor no cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const ttl = options?.ttl || CacheTTL.MEDIUM
      
      // Armazenar valor
      const success = await redis.setJson(key, value, ttl)
      
      // Armazenar tags para invalidação
      if (options?.tags && success) {
        await this.setTags(key, options.tags)
      }
      
      return success
    } catch (error) {
      console.error('Cache SET error:', error)
      return false
    }
  }

  /**
   * Remover do cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      return await redis.del(key)
    } catch (error) {
      console.error('Cache DELETE error:', error)
      return false
    }
  }

  /**
   * Verificar se existe no cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await redis.exists(key)
    } catch (error) {
      console.error('Cache EXISTS error:', error)
      return false
    }
  }

  /**
   * Invalidar cache por tags
   */
  async invalidateByTags(tags: string[]): Promise<boolean> {
    try {
      const keysToDelete: string[] = []
      
      for (const tag of tags) {
        const tagKey = `tag:${tag}`
        const keys = await redis.getJson<string[]>(tagKey)
        if (keys) {
          keysToDelete.push(...keys)
        }
        // Remover a própria tag
        await redis.del(tagKey)
      }
      
      // Remover chaves únicas
      const uniqueKeys = [...new Set(keysToDelete)]
      
      if (uniqueKeys.length > 0) {
        for (const key of uniqueKeys) {
          await redis.del(key)
        }
      }
      
      return true
    } catch (error) {
      console.error('Cache invalidate by tags error:', error)
      return false
    }
  }

  /**
   * Invalidar cache por padrão
   */
  async invalidateByPattern(pattern: string): Promise<boolean> {
    try {
      return await redis.flushPattern(pattern)
    } catch (error) {
      console.error('Cache invalidate by pattern error:', error)
      return false
    }
  }

  /**
   * Cache com warm-up automático
   */
  async warmUp<T>(
    key: string,
    loader: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      // Verificar se já existe
      const existing = await redis.getJson<T>(key)
      if (existing !== null) {
        return existing
      }

      // Carregar dados
      const value = await loader()
      
      // Cachear com TTL longo para warm-up
      await this.set(key, value, {
        ...options,
        ttl: options?.ttl || CacheTTL.VERY_LONG
      })
      
      return value
    } catch (error) {
      console.error('Cache warm-up error:', error)
      throw error
    }
  }

  /**
   * Cache com lock distribuído
   */
  async getWithLock<T>(
    key: string,
    loader: () => Promise<T>,
    options?: CacheOptions & { lockTtl?: number }
  ): Promise<T> {
    const lockKey = CacheKeys.LOCK(key)
    const lockTtl = options?.lockTtl || 30 // 30 segundos
    
    try {
      // Tentar obter do cache primeiro
      const cached = await redis.getJson<T>(key)
      if (cached !== null) {
        this.hitCount++
        return cached
      }

      // Tentar adquirir lock
      const lockAcquired = await redis.set(lockKey, '1', lockTtl)
      
      if (!lockAcquired) {
        // Se não conseguiu o lock, aguardar um pouco e tentar cache novamente
        await new Promise(resolve => setTimeout(resolve, 100))
        const retryCache = await redis.getJson<T>(key)
        if (retryCache !== null) {
          return retryCache
        }
        
        // Se ainda não tem, executar loader sem cache
        return await loader()
      }

      try {
        // Carregar dados
        const value = await loader()
        
        // Cachear resultado
        await this.set(key, value, options)
        
        this.missCount++
        return value
      } finally {
        // Liberar lock
        await redis.del(lockKey)
      }
    } catch (error) {
      console.error('Cache get with lock error:', error)
      throw error
    }
  }

  /**
   * Batch get - obter múltiplas chaves
   */
  async getBatch<T>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>()
    
    try {
      for (const key of keys) {
        const value = await redis.getJson<T>(key)
        result.set(key, value)
        
        if (value !== null) {
          this.hitCount++
        } else {
          this.missCount++
        }
      }
    } catch (error) {
      console.error('Cache batch get error:', error)
    }
    
    return result
  }

  /**
   * Batch set - definir múltiplas chaves
   */
  async setBatch<T>(items: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<boolean> {
    try {
      for (const item of items) {
        await this.set(item.key, item.value, item.options)
      }
      return true
    } catch (error) {
      console.error('Cache batch set error:', error)
      return false
    }
  }

  /**
   * Incrementar contador com TTL
   */
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      return await redis.increment(key, ttl)
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  /**
   * Rate limiting
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const key = CacheKeys.RATE_LIMIT(identifier, 'api')
      const current = await this.increment(key, windowSeconds)
      
      const remaining = Math.max(0, limit - current)
      const resetTime = Date.now() + (windowSeconds * 1000)
      
      return {
        allowed: current <= limit,
        remaining,
        resetTime
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      return { allowed: true, remaining: limit, resetTime: Date.now() }
    }
  }

  /**
   * Estatísticas do cache
   */
  async getStats(): Promise<CacheStats> {
    try {
      const totalRequests = this.hitCount + this.missCount
      const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0
      
      // Contar chaves totais
      const allKeys = await redis.keys('*')
      const totalKeys = allKeys.length
      
      return {
        hits: this.hitCount,
        misses: this.missCount,
        hitRate: Math.round(hitRate * 100) / 100,
        totalKeys,
        memoryUsage: 'N/A' // Seria necessário comando INFO do Redis
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return {
        hits: this.hitCount,
        misses: this.missCount,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 'Error'
      }
    }
  }

  /**
   * Limpar todo o cache
   */
  async clear(): Promise<boolean> {
    try {
      return await redis.flushPattern('*')
    } catch (error) {
      console.error('Cache clear error:', error)
      return false
    }
  }

  /**
   * Health check do cache
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health:check'
      const testValue = Date.now().toString()
      
      await redis.set(testKey, testValue, 10)
      const retrieved = await redis.get(testKey)
      await redis.del(testKey)
      
      return retrieved === testValue
    } catch (error) {
      console.error('Cache health check error:', error)
      return false
    }
  }

  /**
   * Definir tags para uma chave
   */
  private async setTags(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`
        const existingKeys = await redis.getJson<string[]>(tagKey) || []
        
        if (!existingKeys.includes(key)) {
          existingKeys.push(key)
          await redis.setJson(tagKey, existingKeys, CacheTTL.DAILY)
        }
      }
    } catch (error) {
      console.error('Set tags error:', error)
    }
  }

  /**
   * Reset das estatísticas
   */
  resetStats(): void {
    this.hitCount = 0
    this.missCount = 0
  }
}

// Singleton instance
export const cacheService = new CacheService()