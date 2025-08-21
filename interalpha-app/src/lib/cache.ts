/**
 * Sistema de Cache Avançado para InterAlpha
 */

'use client'

import { Redis } from 'ioredis'
import React from 'react'
import React from 'react'
import React from 'react'
import React from 'react'
import React from 'react'

// Configuração do cache
export interface CacheConfig {
  defaultTTL: number // Time to live em segundos
  maxMemoryUsage: number // Máximo de memória em MB
  enableCompression: boolean
  enableMetrics: boolean
}

const defaultConfig: CacheConfig = {
  defaultTTL: 3600, // 1 hora
  maxMemoryUsage: 100, // 100MB
  enableCompression: true,
  enableMetrics: true
}

// Interface para cache entry
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  hits: number
  size: number
}

// Cache em memória para dados frequentemente acessados
export class MemoryCache {
  private cache = new Map<string, CacheEntry>()
  private config: CacheConfig
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    memoryUsage: 0
  }

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    
    // Limpeza automática a cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      hits: 0,
      size: this.calculateSize(value)
    }

    this.cache.set(key, entry)
    this.metrics.sets++
    this.updateMemoryUsage()
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      this.metrics.misses++
      return null
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key)
      this.metrics.misses++
      return null
    }

    entry.hits++
    this.metrics.hits++
    return entry.data
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.metrics.deletes++
      this.updateMemoryUsage()
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.metrics.memoryUsage = 0
  }

  getMetrics() {
    return {
      ...this.metrics,
      hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0,
      totalEntries: this.cache.size
    }
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2 // Aproximação em bytes
  }

  private updateMemoryUsage(): void {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      totalSize += entry.size
    }
    this.metrics.memoryUsage = totalSize / (1024 * 1024) // MB
  }

  private cleanup(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.cache.delete(key))
    this.updateMemoryUsage()

    // Se uso de memória ainda alto, remover entradas menos usadas
    if (this.metrics.memoryUsage > this.config.maxMemoryUsage) {
      this.evictLeastUsed()
    }
  }

  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.hits - b.hits)
    
    const toRemove = Math.ceil(entries.length * 0.1) // Remove 10%
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0])
    }
    
    this.updateMemoryUsage()
  }
}

// Cache distribuído com Redis
class RedisCache {
  private redis: Redis | null = null
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.initRedis()
  }

  private async initRedis(): Promise<void> {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null
      })
    } catch (error) {
      console.error('Erro ao conectar com Redis:', error)
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.redis) return

    try {
      const serialized = JSON.stringify(value)
      const finalTTL = ttl || this.config.defaultTTL
      
      await this.redis.setex(key, finalTTL, serialized)
    } catch (error) {
      console.error('Erro ao salvar no Redis:', error)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null

    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Erro ao buscar no Redis:', error)
      return null
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      const result = await this.redis.del(key)
      return result > 0
    } catch (error) {
      console.error('Erro ao deletar do Redis:', error)
      return false
    }
  }

  async clear(pattern?: string): Promise<void> {
    if (!this.redis) return

    try {
      const keys = await this.redis.keys(pattern || '*')
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Erro ao limpar Redis:', error)
    }
  }
}

// Cache híbrido (memória + Redis)
export class HybridCache {
  private memoryCache: MemoryCache
  private redisCache: RedisCache
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.memoryCache = new MemoryCache(config)
    this.redisCache = new RedisCache(config)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Salvar em ambos os caches
    this.memoryCache.set(key, value, ttl)
    await this.redisCache.set(key, value, ttl)
  }

  async get<T>(key: string): Promise<T | null> {
    // Tentar memória primeiro (mais rápido)
    let value = this.memoryCache.get<T>(key)
    
    if (value !== null) {
      return value
    }

    // Se não encontrou na memória, tentar Redis
    value = await this.redisCache.get<T>(key)
    
    if (value !== null) {
      // Salvar na memória para próximas consultas
      this.memoryCache.set(key, value)
    }

    return value
  }

  async delete(key: string): Promise<boolean> {
    const memoryDeleted = this.memoryCache.delete(key)
    const redisDeleted = await this.redisCache.delete(key)
    
    return memoryDeleted || redisDeleted
  }

  async clear(pattern?: string): Promise<void> {
    this.memoryCache.clear()
    await this.redisCache.clear(pattern)
  }

  getMetrics() {
    return this.memoryCache.getMetrics()
  }
}

// Cache específico para queries do banco
export class QueryCache extends HybridCache {
  constructor() {
    super({
      defaultTTL: 300, // 5 minutos para queries
      maxMemoryUsage: 50,
      enableCompression: true,
      enableMetrics: true
    })
  }

  async cacheQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Tentar buscar do cache primeiro
    const cached = await this.get<T>(queryKey)
    if (cached !== null) {
      return cached
    }

    // Se não encontrou, executar query e cachear resultado
    const result = await queryFn()
    await this.set(queryKey, result, ttl)
    
    return result
  }

  generateQueryKey(table: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = params[key]
        return obj
      }, {} as Record<string, any>)
    
    return `query:${table}:${JSON.stringify(sortedParams)}`
  }
}

// Instâncias globais
export const memoryCache = new MemoryCache()
export const hybridCache = new HybridCache()
export const queryCache = new QueryCache()

// Hook para usar cache em componentes React
export function useCache<T>(key: string, fetcher: () => Promise<T>, ttl?: number) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Tentar buscar do cache
        const cached = await hybridCache.get<T>(key)
        
        if (cached !== null && mounted) {
          setData(cached)
          setLoading(false)
          return
        }

        // Se não encontrou no cache, buscar dados
        const result = await fetcher()
        
        if (mounted) {
          setData(result)
          await hybridCache.set(key, result, ttl)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [key, ttl])

  const invalidate = React.useCallback(async () => {
    await hybridCache.delete(key)
    setData(null)
    setLoading(true)
  }, [key])

  return { data, loading, error, invalidate }
}