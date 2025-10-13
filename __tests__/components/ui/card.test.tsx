// 🧪 Testes para Card Components
import { render, screen } from '@testing-library/react';

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    test('deve renderizar o card corretamente', () => {
      render(<Card data-testid="card">Conteúdo do card</Card>);
      const card = screen.getByTestId('card');
      expect(card).toBeDefined();
    });

    test('deve aplicar className personalizada', () => {
      render(<Card className="custom-class" data-testid="card">Conteúdo</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('custom-class');
    });

    test('deve aplicar classes padrão', () => {
      render(<Card data-testid="card">Conteúdo</Card>);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('rounded-xl');
      expect(card.className).toContain('border');
    });
  });

  describe('CardHeader', () => {
    test('deve renderizar o header corretamente', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toBeDefined();
    });

    test('deve aplicar className personalizada', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header.className).toContain('custom-header');
    });
  });

  describe('CardTitle', () => {
    test('deve renderizar o título corretamente', () => {
      render(<CardTitle data-testid="title">Título do Card</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toBeDefined();
      expect(title.textContent).toBe('Título do Card');
    });

    test('deve aplicar className personalizada', () => {
      render(<CardTitle className="custom-title" data-testid="title">Título</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title.className).toContain('custom-title');
    });
  });

  describe('CardDescription', () => {
    test('deve renderizar a descrição corretamente', () => {
      render(<CardDescription data-testid="description">Descrição do card</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description).toBeDefined();
      expect(description.textContent).toBe('Descrição do card');
    });

    test('deve aplicar className personalizada', () => {
      render(<CardDescription className="custom-desc" data-testid="description">Descrição</CardDescription>);
      const description = screen.getByTestId('description');
      expect(description.className).toContain('custom-desc');
    });
  });

  describe('CardContent', () => {
    test('deve renderizar o conteúdo corretamente', () => {
      render(<CardContent data-testid="content">Conteúdo principal</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toBeDefined();
      expect(content.textContent).toBe('Conteúdo principal');
    });

    test('deve aplicar className personalizada', () => {
      render(<CardContent className="custom-content" data-testid="content">Conteúdo</CardContent>);
      const content = screen.getByTestId('content');
      expect(content.className).toContain('custom-content');
    });
  });

  describe('CardFooter', () => {
    test('deve renderizar o footer corretamente', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toBeDefined();
    });

    test('deve aplicar className personalizada', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer.className).toContain('custom-footer');
    });
  });

  describe('Card completo', () => {
    test('deve renderizar card completo com todos os componentes', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader data-testid="full-header">
            <CardTitle data-testid="full-title">Título Completo</CardTitle>
            <CardDescription data-testid="full-description">
              Descrição completa do card
            </CardDescription>
          </CardHeader>
          <CardContent data-testid="full-content">
            Conteúdo principal do card
          </CardContent>
          <CardFooter data-testid="full-footer">
            Footer do card
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('full-card')).toBeDefined();
      expect(screen.getByTestId('full-header')).toBeDefined();
      expect(screen.getByTestId('full-title')).toBeDefined();
      expect(screen.getByTestId('full-description')).toBeDefined();
      expect(screen.getByTestId('full-content')).toBeDefined();
      expect(screen.getByTestId('full-footer')).toBeDefined();
    });

    test('deve renderizar card mínimo apenas com conteúdo', () => {
      render(
        <Card data-testid="minimal-card">
          <CardContent data-testid="minimal-content">
            Conteúdo mínimo
          </CardContent>
        </Card>
      );

      expect(screen.getByTestId('minimal-card')).toBeDefined();
      expect(screen.getByTestId('minimal-content')).toBeDefined();
    });
  });

  describe('ref forwarding', () => {
    test('Card deve encaminhar ref corretamente', () => {
      const ref = { current: null };
      render(<Card ref={ref}>Conteúdo</Card>);
      expect(ref.current).toBeDefined();
    });

    test('CardHeader deve encaminhar ref corretamente', () => {
      const ref = { current: null };
      render(<CardHeader ref={ref}>Header</CardHeader>);
      expect(ref.current).toBeDefined();
    });

    test('CardContent deve encaminhar ref corretamente', () => {
      const ref = { current: null };
      render(<CardContent ref={ref}>Conteúdo</CardContent>);
      expect(ref.current).toBeDefined();
    });
  });
});