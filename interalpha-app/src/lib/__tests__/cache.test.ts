import { MemoryCache, QueryCache } from '../cache'

// Mock do Redis para testes
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
  }))
})

describe('MemoryCache', () => {
  let cache: MemoryCache

  beforeEach(() => {
    cache = new MemoryCache({ defaultTTL: 1 }) // 1 segundo para testes
  })

  it('should store and retrieve values', () => {
    cache.set('test-key', 'test-value')
    
    const value = cache.get('test-key')
    expect(value).toBe('test-value')
  })

  it('should return null for non-existent keys', () => {
    const value = cache.get('non-existent-key')
    expect(value).toBeNull()
  })

  it('should expire values after TTL', async () => {
    cache.set('expire-key', 'expire-value', 0.1) // 0.1 segundos
    
    // Imediatamente deve estar disponível
    expect(cache.get('expire-key')).toBe('expire-value')
    
    // Após 200ms deve ter expirado
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(cache.get('expire-key')).toBeNull()
  })

  it('should delete values', () => {
    cache.set('delete-key', 'delete-value')
    expect(cache.get('delete-key')).toBe('delete-value')
    
    const deleted = cache.delete('delete-key')
    expect(deleted).toBe(true)
    expect(cache.get('delete-key')).toBeNull()
  })

  it('should clear all values', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    
    cache.clear()
    
    expect(cache.get('key1')).toBeNull()
    expect(cache.get('key2')).toBeNull()
  })

  it('should track metrics', () => {
    cache.set('metrics-key', 'metrics-value')
    cache.get('metrics-key') // hit
    cache.get('non-existent') // miss
    
    const metrics = cache.getMetrics()
    
    expect(metrics.hits).toBe(1)
    expect(metrics.misses).toBe(1)
    expect(metrics.sets).toBe(1)
    expect(metrics.hitRate).toBe(0.5)
  })
})

describe('QueryCache', () => {
  let queryCache: QueryCache

  beforeEach(() => {
    queryCache = new QueryCache()
  })

  it('should generate consistent query keys', () => {
    const params1 = { id: 1, name: 'test' }
    const params2 = { name: 'test', id: 1 } // Different order
    
    const key1 = queryCache.generateQueryKey('users', params1)
    const key2 = queryCache.generateQueryKey('users', params2)
    
    expect(key1).toBe(key2)
  })

  it('should cache query results', async () => {
    const mockQueryFn = jest.fn().mockResolvedValue({ id: 1, name: 'Test User' })
    
    // Primeira chamada deve executar a query
    const result1 = await queryCache.cacheQuery('test-query', mockQueryFn)
    expect(mockQueryFn).toHaveBeenCalledTimes(1)
    expect(result1).toEqual({ id: 1, name: 'Test User' })
    
    // Segunda chamada deve usar o cache
    const result2 = await queryCache.cacheQuery('test-query', mockQueryFn)
    expect(mockQueryFn).toHaveBeenCalledTimes(1) // Não deve chamar novamente
    expect(result2).toEqual({ id: 1, name: 'Test User' })
  })

  it('should handle query errors', async () => {
    const mockQueryFn = jest.fn().mockRejectedValue(new Error('Query failed'))
    
    await expect(queryCache.cacheQuery('error-query', mockQueryFn)).rejects.toThrow('Query failed')
    expect(mockQueryFn).toHaveBeenCalledTimes(1)
  })
})