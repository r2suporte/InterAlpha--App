import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  createLazyComponent,
  useLazyData,
  LazySection,
  withLazyLoading,
  LazyPresets,
} from '@/lib/utils/lazy-loading';

// Mock do PageLoading
jest.mock('@/components/ui/loading', () => ({
  PageLoading: ({ text }: { text?: string }) => (
    <div data-testid="page-loading">{text || 'Loading...'}</div>
  ),
}));

// Mock do IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Componente de teste
const TestComponent = ({ message }: { message: string }) => (
  <div data-testid="test-component">{message}</div>
);

describe('Lazy Loading Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLazyComponent', () => {
    it('deve criar um componente lazy com sucesso', async () => {
      const LazyTestComponent = createLazyComponent(
        () => Promise.resolve({ default: TestComponent })
      );

      render(<LazyTestComponent message="Test Message" />);

      // Deve mostrar loading inicialmente
      expect(screen.getByTestId('page-loading')).toBeInTheDocument();

      // Aguardar o componente carregar
      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('deve usar fallback customizado', async () => {
      const customFallback = <div data-testid="custom-loading">Custom Loading</div>;
      
      const LazyTestComponent = createLazyComponent(
        () => Promise.resolve({ default: TestComponent }),
        { fallback: customFallback }
      );

      render(<LazyTestComponent message="Test" />);

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.getByText('Custom Loading')).toBeInTheDocument();
    });

    it('deve renderizar sem error boundary quando desabilitado', async () => {
      const LazyTestComponent = createLazyComponent(
        () => Promise.resolve({ default: TestComponent }),
        { errorBoundary: false }
      );

      render(<LazyTestComponent message="Test" />);

      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });
  });

  describe('useLazyData', () => {
    it('deve carregar dados com sucesso', async () => {
      const TestHookComponent = () => {
        const { data, loading, error } = useLazyData(
          () => Promise.resolve('test data')
        );

        if (loading) return <div data-testid="loading">Loading...</div>;
        if (error) return <div data-testid="error">Error: {error.message}</div>;
        return <div data-testid="data">{data}</div>;
      };

      render(<TestHookComponent />);

      // Deve mostrar loading inicialmente
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Aguardar dados carregarem
      await waitFor(() => {
        expect(screen.getByTestId('data')).toBeInTheDocument();
      });

      expect(screen.getByText('test data')).toBeInTheDocument();
    });

    it('deve lidar com erros', async () => {
      const TestHookComponent = () => {
        const { data, loading, error } = useLazyData(
          () => Promise.reject(new Error('Test error'))
        );

        if (loading) return <div data-testid="loading">Loading...</div>;
        if (error) return <div data-testid="error">Error: {error.message}</div>;
        return <div data-testid="data">{data}</div>;
      };

      render(<TestHookComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });
  });

  describe('LazySection', () => {
    it('deve renderizar children quando visível', () => {
      // Mock IntersectionObserver para simular elemento visível
      const mockObserve = jest.fn();
      const mockUnobserve = jest.fn();
      const mockDisconnect = jest.fn();

      window.IntersectionObserver = jest.fn().mockImplementation((callback) => {
        // Simular elemento visível imediatamente
        setTimeout(() => {
          callback([{ isIntersecting: true }]);
        }, 0);

        return {
          observe: mockObserve,
          unobserve: mockUnobserve,
          disconnect: mockDisconnect,
        };
      });

      render(
        <LazySection>
          <div data-testid="lazy-content">Lazy Content</div>
        </LazySection>
      );

      // Inicialmente deve mostrar fallback
      expect(screen.getByTestId('page-loading')).toBeInTheDocument();
    });

    it('deve usar fallback customizado', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Fallback</div>;

      render(
        <LazySection fallback={customFallback}>
          <div data-testid="lazy-content">Lazy Content</div>
        </LazySection>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });

    it('deve aplicar className customizada', () => {
      const { container } = render(
        <LazySection className="custom-class">
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('withLazyLoading', () => {
    it('deve envolver componente com lazy loading', async () => {
      const WrappedComponent = withLazyLoading(TestComponent);

      render(<WrappedComponent message="Wrapped Test" />);

      // Deve mostrar loading inicialmente
      expect(screen.getByTestId('page-loading')).toBeInTheDocument();

      // Aguardar o componente carregar
      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });

      expect(screen.getByText('Wrapped Test')).toBeInTheDocument();
    });

    it('deve usar opções customizadas', async () => {
      const customFallback = <div data-testid="wrapped-loading">Wrapped Loading</div>;
      
      const WrappedComponent = withLazyLoading(TestComponent, {
        fallback: customFallback,
      });

      render(<WrappedComponent message="Test" />);

      // Deve mostrar fallback customizado inicialmente
      expect(screen.getByTestId('wrapped-loading')).toBeInTheDocument();

      // Aguardar o componente carregar
      await waitFor(() => {
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
      });
    });
  });

  describe('LazyPresets', () => {
    it('deve ter preset para dashboard', () => {
      expect(LazyPresets.dashboard).toBeDefined();
      expect(LazyPresets.dashboard.errorBoundary).toBe(true);
      expect(LazyPresets.dashboard.retryDelay).toBe(2000);
      expect(LazyPresets.dashboard.maxRetries).toBe(3);
    });

    it('deve ter preset para form', () => {
      expect(LazyPresets.form).toBeDefined();
      expect(LazyPresets.form.errorBoundary).toBe(true);
      expect(LazyPresets.form.retryDelay).toBe(1000);
      expect(LazyPresets.form.maxRetries).toBe(2);
    });

    it('deve ter preset para table', () => {
      expect(LazyPresets.table).toBeDefined();
      expect(LazyPresets.table.errorBoundary).toBe(true);
      expect(LazyPresets.table.retryDelay).toBe(1500);
      expect(LazyPresets.table.maxRetries).toBe(3);
    });

    it('deve ter preset para chart', () => {
      expect(LazyPresets.chart).toBeDefined();
      expect(LazyPresets.chart.errorBoundary).toBe(true);
      expect(LazyPresets.chart.retryDelay).toBe(2000);
      expect(LazyPresets.chart.maxRetries).toBe(2);
    });

    it('deve ter preset crítico', () => {
      expect(LazyPresets.critical).toBeDefined();
      expect(LazyPresets.critical.errorBoundary).toBe(false);
      expect(LazyPresets.critical.maxRetries).toBe(1);
    });
  });

  describe('Estrutura e Exportações', () => {
    it('deve exportar todas as funções principais', () => {
      expect(createLazyComponent).toBeDefined();
      expect(useLazyData).toBeDefined();
      expect(LazySection).toBeDefined();
      expect(withLazyLoading).toBeDefined();
      expect(LazyPresets).toBeDefined();
    });

    it('deve ter presets com estrutura correta', () => {
      Object.values(LazyPresets).forEach(preset => {
        expect(preset).toHaveProperty('fallback');
        expect(preset).toHaveProperty('errorBoundary');
        expect(preset).toHaveProperty('maxRetries');
      });
    });
  });

  describe('Casos de Uso Específicos', () => {
    it('deve funcionar com componentes que recebem props', async () => {
      const ComponentWithProps = ({ title, count }: { title: string; count: number }) => (
        <div data-testid="props-component">
          {title}: {count}
        </div>
      );

      const LazyPropsComponent = createLazyComponent(
        () => Promise.resolve({ default: ComponentWithProps })
      );

      render(<LazyPropsComponent title="Counter" count={42} />);

      await waitFor(() => {
        expect(screen.getByTestId('props-component')).toBeInTheDocument();
      });

      expect(screen.getByText('Counter: 42')).toBeInTheDocument();
    });

    it('deve lidar com componentes sem props', async () => {
      const SimpleComponent = () => (
        <div data-testid="simple-component">Simple Component</div>
      );

      const LazySimpleComponent = createLazyComponent(
        () => Promise.resolve({ default: SimpleComponent })
      );

      render(<LazySimpleComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('simple-component')).toBeInTheDocument();
      });
    });
  });
});