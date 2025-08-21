/**
 * Cliente Redis para cache
 */

import { Redis } from 'ioredis'

class RedisClient {
  private client: Redis | null = null
  private isConnected = false

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000
      })

      this.client.on('connect', () => {
        console.log('Redis connected')
        this.isConnected = true
      })

      this.client.on('error', (error) => {
        console.error('Redis error:', error)
        this.isConnected = false
      })

      this.client.on('close', () => {
        console.log('Redis connection closed')
        this.isConnected = false
      })

    } catch (error) {
      console.error('Failed to initialize Redis:', error)
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null
    }

    try {
      return await this.client.get(key)
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      if (ttl) {
        await this.client.setex(key, ttl, value)
      } else {
        await this.client.set(key, value)
      }
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return []
    }

    try {
      return await this.client.keys(pattern)
    } catch (error) {
      console.error('Redis KEYS error:', error)
      return []
    }
  }

  async flushPattern(pattern: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      const keys = await this.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Redis FLUSH PATTERN error:', error)
      return false
    }
  }

  async increment(key: string, ttl?: number): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      const result = await this.client.incr(key)
      if (ttl && result === 1) {
        await this.client.expire(key, ttl)
      }
      return result
    } catch (error) {
      console.error('Redis INCR error:', error)
      return 0
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key)
    if (!value) return null

    try {
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Redis JSON parse error:', error)
      return null
    }
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value)
      return await this.set(key, jsonString, ttl)
    } catch (error) {
      console.error('Redis JSON stringify error:', error)
      return false
    }
  }

  isHealthy(): boolean {
    return this.isConnected
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
      this.isConnected = false
    }
  }
}

// Singleton instance
export const redis = new RedisClient()

// Cache key generators
export const CacheKeys = {
  // Products
  PRODUCT_LIST: (filters: string) => `products:list:${filters}`,
  PRODUCT_DETAIL: (id: string) => `product:${id}`,
  PRODUCT_SEARCH: (query: string) => `products:search:${query}`,
  PRODUCT_STATS: () => 'products:stats',
  
  // Categories
  CATEGORIES_ALL: () => 'categories:all',
  CATEGORY_DETAIL: (id: string) => `category:${id}`,
  CATEGORY_PRODUCTS: (id: string) => `category:${id}:products`,
  
  // Stock
  STOCK_ALERTS: () => 'stock:alerts',
  STOCK_REPORT: (filters: string) => `stock:report:${filters}`,
  LOW_STOCK_PRODUCTS: () => 'stock:low',
  
  // Dashboard
  DASHBOARD_METRICS: (period: number) => `dashboard:metrics:${period}`,
  DASHBOARD_PERFORMANCE: (days: number) => `dashboard:performance:${days}`,
  
  // Orders
  ORDER_DETAIL: (id: string) => `order:${id}`,
  ORDER_LIST: (filters: string) => `orders:list:${filters}`,
  
  // User specific
  USER_PRODUCTS: (userId: string, filters: string) => `user:${userId}:products:${filters}`,
  USER_ORDERS: (userId: string, filters: string) => `user:${userId}:orders:${filters}`,
  
  // API Rate limiting
  RATE_LIMIT: (ip: string, endpoint: string) => `rate:${ip}:${endpoint}`,
  
  // Session cache
  SESSION: (sessionId: string) => `session:${sessionId}`,
  
  // Temporary locks
  LOCK: (resource: string) => `lock:${resource}`
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 1800,          // 30 minutes
  VERY_LONG: 3600,     // 1 hour
  DAILY: 86400,        // 24 hours
  WEEKLY: 604800       // 7 days
}