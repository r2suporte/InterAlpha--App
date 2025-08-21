/**
 * Utilitários de Performance e Otimização
 */

'use client'

import React, { useCallback, useMemo, memo } from 'react'

// HOC para memoização de componentes pesados
export function withMemo<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  areEqual?: (prevProps: T, nextProps: T) => boolean
) {
  return memo(Component, areEqual)
}

// Hook para debounce de funções
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const timeoutId = setTimeout(() => callback(...args), delay)
      return () => clearTimeout(timeoutId)
    },
    [callback, delay]
  )

  return debouncedCallback as T
}

// Hook para throttle de funções
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  let lastCall = 0
  
  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        return callback(...args)
      }
    },
    [callback, delay]
  )

  return throttledCallback as T
}

// Utilitário para lazy loading de componentes
export function createLazyComponent<T extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFn)
  
  return (props: T) => {
    const FallbackComponent = fallback
    return (
      <React.Suspense fallback={FallbackComponent ? <FallbackComponent /> : <div>Loading...</div>}>
        <LazyComponent {...props} />
      </React.Suspense>
    )
  }
}

// Otimização de listas grandes com virtualização
export function useVirtualization(
  items: any[],
  itemHeight: number,
  containerHeight: number
) {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const buffer = Math.floor(visibleCount * 0.5)
    
    return {
      visibleCount,
      buffer,
      totalHeight: items.length * itemHeight,
      getVisibleItems: (scrollTop: number) => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
        const endIndex = Math.min(items.length, startIndex + visibleCount + buffer * 2)
        
        return {
          startIndex,
          endIndex,
          items: items.slice(startIndex, endIndex),
          offsetY: startIndex * itemHeight
        }
      }
    }
  }, [items, itemHeight, containerHeight])
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startMeasure(name: string): void {
    performance.mark(`${name}-start`)
  }

  endMeasure(name: string): number {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name, 'measure')[0]
    const duration = measure.duration

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(duration)

    return duration
  }

  getMetrics(name: string) {
    const measurements = this.metrics.get(name) || []
    if (measurements.length === 0) return null

    return {
      count: measurements.length,
      average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      latest: measurements[measurements.length - 1]
    }
  }

  getAllMetrics() {
    const result: Record<string, any> = {}
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name)
    }
    return result
  }
}

// Hook para monitoramento de performance
export function usePerformanceMonitor(name: string) {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    start: () => monitor.startMeasure(name),
    end: () => monitor.endMeasure(name),
    getMetrics: () => monitor.getMetrics(name)
  }
}