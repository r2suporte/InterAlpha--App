'use client';

import React, { ComponentType, Suspense } from 'react';

import { PageLoading } from '@/components/ui/loading';

interface LazyComponentOptions {
  fallback?: React.ReactNode;
  errorBoundary?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

interface LazyComponentState {
  hasError: boolean;
  retryCount: number;
}

class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void; maxRetries: number },
  LazyComponentState
> {
  constructor(props: {
    children: React.ReactNode;
    onRetry: () => void;
    maxRetries: number;
  }) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): LazyComponentState {
    return { hasError: true, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.props.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        retryCount: prevState.retryCount + 1,
      }));
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600">
              Erro ao carregar componente
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ocorreu um erro ao carregar este componente.
            </p>
          </div>
          {this.state.retryCount < this.props.maxRetries && (
            <button
              onClick={this.handleRetry}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Tentar novamente ({this.state.retryCount + 1}/
              {this.props.maxRetries})
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Cria um componente lazy com opções de configuração
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): ComponentType<React.ComponentProps<T>> {
  const {
    fallback = <PageLoading text="Carregando componente..." />,
    errorBoundary = true,
    retryDelay = 1000,
    maxRetries = 3,
  } = options;

  const LazyComponent = React.lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (attempt: number = 1) => {
        importFn()
          .then(resolve)
          .catch(error => {
            if (attempt < maxRetries) {
              console.warn(
                `Lazy loading attempt ${attempt} failed, retrying in ${retryDelay}ms...`
              );
              setTimeout(() => attemptImport(attempt + 1), retryDelay);
            } else {
              console.error(
                'Lazy loading failed after maximum retries:',
                error
              );
              reject(error);
            }
          });
      };

      attemptImport();
    });
  });

  const WrappedComponent: ComponentType<React.ComponentProps<T>> = props => {
    const [retryKey, setRetryKey] = React.useState(0);

    const handleRetry = React.useCallback(() => {
      setRetryKey(prev => prev + 1);
    }, []);

    const content = (
      <Suspense fallback={fallback}>
        <LazyComponent key={retryKey} {...(props as any)} />
      </Suspense>
    );

    if (errorBoundary) {
      return (
        <LazyErrorBoundary onRetry={handleRetry} maxRetries={maxRetries}>
          {content}
        </LazyErrorBoundary>
      );
    }

    return content;
  };

  WrappedComponent.displayName = `LazyComponent(Component)`;

  return WrappedComponent;
}

/**
 * Hook para lazy loading de dados
 */
export function useLazyData<T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Componente para lazy loading de seções
 */
interface LazySectionProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
  className?: string;
}

export function LazySection({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  fallback = <PageLoading />,
  className,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

/**
 * HOC para adicionar lazy loading a qualquer componente
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: LazyComponentOptions = {}
) {
  return createLazyComponent(
    () => Promise.resolve({ default: Component }),
    options
  );
}

/**
 * Presets comuns para lazy loading
 */
export const LazyPresets = {
  // Para dashboards e páginas complexas
  dashboard: {
    fallback: <PageLoading text="Carregando dashboard..." />,
    errorBoundary: true,
    retryDelay: 2000,
    maxRetries: 3,
  },

  // Para formulários
  form: {
    fallback: <PageLoading text="Carregando formulário..." />,
    errorBoundary: true,
    retryDelay: 1000,
    maxRetries: 2,
  },

  // Para tabelas e listas
  table: {
    fallback: <PageLoading text="Carregando dados..." />,
    errorBoundary: true,
    retryDelay: 1500,
    maxRetries: 3,
  },

  // Para gráficos e visualizações
  chart: {
    fallback: <PageLoading text="Carregando gráficos..." />,
    errorBoundary: true,
    retryDelay: 2000,
    maxRetries: 2,
  },

  // Para componentes críticos (sem retry)
  critical: {
    fallback: <PageLoading text="Carregando..." />,
    errorBoundary: false,
    maxRetries: 1,
  },
};

export default {
  createLazyComponent,
  useLazyData,
  LazySection,
  withLazyLoading,
  LazyPresets,
};
