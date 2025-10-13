import { useCallback, useEffect, useState } from 'react';

import { CACHE_TTL, cacheService } from '@/lib/services/cache-service';

interface UseCacheOptions {
  ttl?: number;
  enabled?: boolean;
  refetchOnMount?: boolean;
  staleWhileRevalidate?: boolean;
}

interface UseCacheReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
  setData: (data: T) => Promise<void>;
}

/**
 * Hook personalizado para gerenciar cache com React
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheReturn<T> {
  const {
    ttl = CACHE_TTL.MEDIUM,
    enabled = true,
    refetchOnMount = true,
    staleWhileRevalidate = true,
  } = options;

  const [data, setDataState] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (useCache: boolean = true) => {
      if (!enabled) return;

      setIsLoading(true);
      setError(null);

      try {
        // Tenta buscar do cache primeiro
        if (useCache) {
          const cachedData = await cacheService.get<T>(key);
          if (cachedData) {
            setDataState(cachedData);

            // Se staleWhileRevalidate está ativo, busca dados frescos em background
            if (staleWhileRevalidate) {
              fetchData(false).catch(console.error);
            }
            setIsLoading(false);
            return;
          }
        }

        // Busca dados frescos
        const freshData = await fetcher();
        setDataState(freshData);

        // Armazena no cache
        await cacheService.set(key, freshData, ttl);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        console.error('Erro ao buscar dados:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [key, fetcher, ttl, enabled, staleWhileRevalidate]
  );

  const refetch = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  const invalidate = useCallback(async () => {
    await cacheService.delete(key);
    await refetch();
  }, [key, refetch]);

  const setData = useCallback(
    async (newData: T) => {
      setDataState(newData);
      await cacheService.set(key, newData, ttl);
    },
    [key, ttl]
  );

  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    setData,
  };
}

/**
 * Hook para cache de listas com invalidação automática
 */
export function useCacheList<T>(
  key: string,
  fetcher: () => Promise<T[]>,
  options: UseCacheOptions = {}
) {
  const cacheResult = useCache(key, fetcher, options);

  const addItem = useCallback(
    async (item: T) => {
      if (cacheResult.data) {
        const newData = [...cacheResult.data, item];
        await cacheResult.setData(newData);
      }
    },
    [cacheResult]
  );

  const updateItem = useCallback(
    async (index: number, item: T) => {
      if (cacheResult.data) {
        const newData = [...cacheResult.data];
        newData[index] = item;
        await cacheResult.setData(newData);
      }
    },
    [cacheResult]
  );

  const removeItem = useCallback(
    async (index: number) => {
      if (cacheResult.data) {
        const newData = cacheResult.data.filter((_, i) => i !== index);
        await cacheResult.setData(newData);
      }
    },
    [cacheResult]
  );

  return {
    ...cacheResult,
    addItem,
    updateItem,
    removeItem,
  };
}

/**
 * Hook para cache de métricas com auto-refresh
 */
export function useCacheMetrics<T>(
  key: string,
  fetcher: () => Promise<T>,
  refreshInterval: number = 30000 // 30 segundos
) {
  const cacheResult = useCache(key, fetcher, {
    ttl: CACHE_TTL.SHORT,
    staleWhileRevalidate: true,
  });

  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      cacheResult.refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [cacheResult.refetch, refreshInterval]);

  return cacheResult;
}

/**
 * Hook para cache com dependências
 */
export function useCacheWithDeps<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: any[],
  options: UseCacheOptions = {}
) {
  const cacheResult = useCache(key, fetcher, {
    ...options,
    refetchOnMount: false,
  });

  useEffect(() => {
    cacheResult.refetch();
  }, deps);

  return cacheResult;
}

/**
 * Hook para invalidar múltiplas chaves de cache
 */
export function useCacheInvalidation() {
  const invalidatePattern = useCallback(async (pattern: string) => {
    await cacheService.deletePattern(pattern);
  }, []);

  const invalidateKeys = useCallback(async (keys: string[]) => {
    await Promise.all(keys.map(key => cacheService.delete(key)));
  }, []);

  const clearAllCache = useCallback(async () => {
    await cacheService.flushAll();
  }, []);

  return {
    invalidatePattern,
    invalidateKeys,
    clearAllCache,
  };
}
