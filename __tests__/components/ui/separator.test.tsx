import React from 'react';
import { render, screen } from '@testing-library/react';
import { Separator } from '@/components/ui/separator';

describe('Separator Component', () => {
  it('renders separator with default horizontal orientation', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('shrink-0', 'bg-border', 'h-[1px]', 'w-full');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders separator with vertical orientation', () => {
    render(<Separator orientation="vertical" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('shrink-0', 'bg-border', 'h-full', 'w-[1px]');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });

  it('applies custom className', () => {
    render(<Separator className="custom-separator" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    
    expect(separator).toHaveClass('custom-separator');
    expect(separator).toHaveClass('shrink-0', 'bg-border');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Separator ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('handles decorative prop correctly', () => {
    const { rerender } = render(<Separator decorative={true} data-testid="separator" />);
    let separator = screen.getByTestId('separator');
    
    expect(separator).toHaveAttribute('role', 'none');
    
    rerender(<Separator decorative={false} data-testid="separator" />);
    separator = screen.getByTestId('separator');
    
    expect(separator).toHaveAttribute('role', 'separator');
  });

  it('defaults to decorative=true', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    
    expect(separator).toHaveAttribute('role', 'none');
  });

  it('passes through other HTML attributes', () => {
    render(
      <Separator 
        data-testid="separator"
        id="test-separator"
        data-custom="custom-value"
      />
    );
    const separator = screen.getByTestId('separator');
    
    expect(separator).toHaveAttribute('id', 'test-separator');
    expect(separator).toHaveAttribute('data-custom', 'custom-value');
  });

  it('renders as correct HTML element', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    
    expect(separator.tagName).toBe('DIV');
  });

  describe('Orientation Styles', () => {
    it('applies correct classes for horizontal orientation', () => {
      render(<Separator orientation="horizontal" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      
      expect(separator).toHaveClass('h-[1px]', 'w-full');
      expect(separator).not.toHaveClass('h-full', 'w-[1px]');
    });

    it('applies correct classes for vertical orientation', () => {
      render(<Separator orientation="vertical" data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      
      expect(separator).toHaveClass('h-full', 'w-[1px]');
      expect(separator).not.toHaveClass('h-[1px]', 'w-full');
    });
  });

  describe('Accessibility', () => {
    it('has correct role for decorative separator', () => {
      render(<Separator decorative={true} data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      
      expect(separator).toHaveAttribute('role', 'none');
    });

    it('has correct role for semantic separator', () => {
      render(<Separator decorative={false} data-testid="separator" />);
      const separator = screen.getByTestId('separator');
      
      expect(separator).toHaveAttribute('role', 'separator');
    });
  });

  describe('Usage Scenarios', () => {
    it('renders in a content layout', () => {
      render(
        <div>
          <div>Content above</div>
          <Separator data-testid="separator" />
          <div>Content below</div>
        </div>
      );
      
      const separator = screen.getByTestId('separator');
      expect(separator).toBeInTheDocument();
      expect(screen.getByText('Content above')).toBeInTheDocument();
      expect(screen.getByText('Content below')).toBeInTheDocument();
    });

    it('renders multiple separators', () => {
      render(
        <div>
          <Separator data-testid="separator-1" />
          <Separator orientation="vertical" data-testid="separator-2" />
          <Separator className="my-4" data-testid="separator-3" />
        </div>
      );
      
      expect(screen.getByTestId('separator-1')).toBeInTheDocument();
      expect(screen.getByTestId('separator-2')).toBeInTheDocument();
      expect(screen.getByTestId('separator-3')).toBeInTheDocument();
    });

    it('renders with custom styling', () => {
      render(
        <Separator 
          className="bg-red-500 h-2" 
          data-testid="custom-separator" 
        />
      );
      const separator = screen.getByTestId('custom-separator');
      
      expect(separator).toHaveClass('bg-red-500', 'h-2');
      expect(separator).toHaveClass('shrink-0'); // Base classes should still be present
    });
  });
});