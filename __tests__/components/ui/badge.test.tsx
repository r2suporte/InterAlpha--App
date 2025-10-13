import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge, badgeVariants } from '@/components/ui/badge';

describe('Badge Component', () => {
  it('renders badge with default variant', () => {
    render(<Badge data-testid="badge">Default Badge</Badge>);
    const badge = screen.getByTestId('badge');
    
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-md',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold',
      'transition-colors',
      'border-transparent',
      'bg-primary',
      'text-primary-foreground'
    );
  });

  it('renders badge text correctly', () => {
    render(<Badge>Test Badge Text</Badge>);
    
    expect(screen.getByText('Test Badge Text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="custom-badge" data-testid="badge">Badge</Badge>);
    const badge = screen.getByTestId('badge');
    
    expect(badge).toHaveClass('custom-badge');
  });

  describe('Badge Variants', () => {
    it('renders default variant correctly', () => {
      render(<Badge variant="default" data-testid="badge">Default</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-primary',
        'text-primary-foreground',
        'shadow'
      );
    });

    it('renders secondary variant correctly', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-secondary',
        'text-secondary-foreground'
      );
    });

    it('renders destructive variant correctly', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-destructive',
        'text-destructive-foreground',
        'shadow'
      );
    });

    it('renders outline variant correctly', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
      const badge = screen.getByTestId('badge');
      
      expect(badge).toHaveClass('text-foreground');
      expect(badge).not.toHaveClass('border-transparent');
    });
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Badge onClick={handleClick} data-testid="badge">Clickable Badge</Badge>);
    const badge = screen.getByTestId('badge');
    
    fireEvent.click(badge);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard events', () => {
    const handleKeyDown = jest.fn();
    render(<Badge onKeyDown={handleKeyDown} data-testid="badge">Badge</Badge>);
    const badge = screen.getByTestId('badge');
    
    fireEvent.keyDown(badge, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('passes through other HTML attributes', () => {
    render(
      <Badge 
        id="test-badge"
        title="Badge tooltip"
        data-testid="badge"
        data-custom="custom-value"
      >
        Badge with attributes
      </Badge>
    );
    const badge = screen.getByTestId('badge');
    
    expect(badge).toHaveAttribute('id', 'test-badge');
    expect(badge).toHaveAttribute('title', 'Badge tooltip');
    expect(badge).toHaveAttribute('data-custom', 'custom-value');
  });

  it('renders as correct HTML element', () => {
    render(<Badge data-testid="badge">Test Badge</Badge>);
    const badge = screen.getByTestId('badge');
    
    expect(badge.tagName).toBe('DIV');
  });

  it('handles complex content', () => {
    render(
      <Badge data-testid="badge">
        <span>Count:</span>
        <span className="ml-1">5</span>
      </Badge>
    );
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('Count:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles focus styles correctly', () => {
    render(<Badge data-testid="badge" tabIndex={0}>Focusable Badge</Badge>);
    const badge = screen.getByTestId('badge');
    
    expect(badge).toHaveClass(
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-ring',
      'focus:ring-offset-2'
    );
  });

  it('handles hover states for variants', () => {
    const { rerender } = render(<Badge variant="default" data-testid="badge">Default</Badge>);
    let badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('hover:bg-primary/80');

    rerender(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('hover:bg-secondary/80');

    rerender(<Badge variant="destructive" data-testid="badge">Destructive</Badge>);
    badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('hover:bg-destructive/80');
  });

  describe('badgeVariants function', () => {
    it('returns correct classes for default variant', () => {
      const classes = badgeVariants({ variant: 'default' });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
    });

    it('returns correct classes for secondary variant', () => {
      const classes = badgeVariants({ variant: 'secondary' });
      expect(classes).toContain('bg-secondary');
      expect(classes).toContain('text-secondary-foreground');
    });

    it('returns correct classes for destructive variant', () => {
      const classes = badgeVariants({ variant: 'destructive' });
      expect(classes).toContain('bg-destructive');
      expect(classes).toContain('text-destructive-foreground');
    });

    it('returns correct classes for outline variant', () => {
      const classes = badgeVariants({ variant: 'outline' });
      expect(classes).toContain('text-foreground');
    });

    it('returns default variant when no variant specified', () => {
      const classes = badgeVariants();
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
    });
  });

  it('handles multiple badges in a container', () => {
    render(
      <div>
        <Badge variant="default">Badge 1</Badge>
        <Badge variant="secondary">Badge 2</Badge>
        <Badge variant="destructive">Badge 3</Badge>
        <Badge variant="outline">Badge 4</Badge>
      </div>
    );
    
    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    expect(screen.getByText('Badge 2')).toBeInTheDocument();
    expect(screen.getByText('Badge 3')).toBeInTheDocument();
    expect(screen.getByText('Badge 4')).toBeInTheDocument();
  });
});