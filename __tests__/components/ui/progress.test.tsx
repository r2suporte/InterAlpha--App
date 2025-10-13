import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from '@/components/ui/progress';

describe('Progress Component', () => {
  it('renders progress with default value', () => {
    render(<Progress data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveClass(
      'relative',
      'h-2',
      'w-full',
      'overflow-hidden',
      'rounded-full',
      'bg-primary/20'
    );
  });

  it('renders progress with specific value', () => {
    render(<Progress value={50} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveClass('relative', 'h-2', 'w-full');
  });

  it('applies custom className', () => {
    render(<Progress className="custom-progress" data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    
    expect(progress).toHaveClass('custom-progress');
    expect(progress).toHaveClass('relative', 'h-2', 'w-full');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Progress ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('passes through other HTML attributes', () => {
    render(
      <Progress 
        data-testid="progress"
        id="test-progress"
        data-custom="custom-value"
      />
    );
    const progress = screen.getByTestId('progress');
    
    expect(progress).toHaveAttribute('id', 'test-progress');
    expect(progress).toHaveAttribute('data-custom', 'custom-value');
  });

  it('renders as correct HTML element', () => {
    render(<Progress data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    
    expect(progress.tagName).toBe('DIV');
  });

  describe('Progress Values', () => {
    it('handles 0% progress', () => {
      render(<Progress value={0} data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveClass('relative', 'h-2', 'w-full');
    });

    it('handles 100% progress', () => {
      render(<Progress value={100} data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveClass('relative', 'h-2', 'w-full');
    });

    it('handles partial progress values', () => {
      const values = [25, 50, 75];
      
      values.forEach(value => {
        const { unmount } = render(<Progress value={value} data-testid="progress" />);
        const progress = screen.getByTestId('progress');
        
        expect(progress).toBeInTheDocument();
        expect(progress).toHaveClass('relative', 'h-2', 'w-full');
        unmount();
      });
    });

    it('handles undefined value', () => {
      render(<Progress data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveClass('relative', 'h-2', 'w-full');
    });
  });

  describe('Progress Indicator', () => {
    it('renders progress indicator', () => {
      render(<Progress value={50} data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      const indicator = progress.querySelector('[data-state]');
      
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass('h-full', 'w-full', 'flex-1', 'bg-primary', 'transition-all');
    });

    it('applies correct transform style for progress value', () => {
      render(<Progress value={30} data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      const indicator = progress.querySelector('[data-state]');
      
      expect(indicator).toHaveStyle('transform: translateX(-70%)');
    });

    it('applies correct transform style for 0% progress', () => {
      render(<Progress value={0} data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      const indicator = progress.querySelector('[data-state]');
      
      expect(indicator).toHaveStyle('transform: translateX(-100%)');
    });

    it('applies correct transform style for 100% progress', () => {
      render(<Progress value={100} data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      const indicator = progress.querySelector('[data-state]');
      
      expect(indicator).toHaveStyle('transform: translateX(-0%)');
    });

    it('handles undefined value in indicator', () => {
      render(<Progress data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      const indicator = progress.querySelector('[data-state]');
      
      expect(indicator).toHaveStyle('transform: translateX(-100%)');
    });
  });

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<Progress data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      
      expect(progress).toHaveAttribute('role', 'progressbar');
    });

    it('has correct ARIA attributes', () => {
      render(<Progress value={75} data-testid="progress" />);
      const progress = screen.getByTestId('progress');
      
      expect(progress).toHaveAttribute('aria-valuemin', '0');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Usage Scenarios', () => {
    it('renders in a loading context', () => {
      render(
        <div>
          <div>Loading...</div>
          <Progress value={45} data-testid="progress" />
          <div>45% complete</div>
        </div>
      );
      
      const progress = screen.getByTestId('progress');
      expect(progress).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('45% complete')).toBeInTheDocument();
    });

    it('renders multiple progress bars', () => {
      render(
        <div>
          <Progress value={30} data-testid="progress-1" />
          <Progress value={60} data-testid="progress-2" />
          <Progress value={90} data-testid="progress-3" />
        </div>
      );
      
      expect(screen.getByTestId('progress-1')).toBeInTheDocument();
      expect(screen.getByTestId('progress-2')).toBeInTheDocument();
      expect(screen.getByTestId('progress-3')).toBeInTheDocument();
    });

    it('renders with custom styling', () => {
      render(
        <Progress 
          value={80}
          className="h-4 bg-gray-200" 
          data-testid="custom-progress" 
        />
      );
      const progress = screen.getByTestId('custom-progress');
      
      expect(progress).toHaveClass('h-4', 'bg-gray-200');
      expect(progress).toHaveClass('relative', 'w-full'); // Base classes should still be present
    });

    it('handles dynamic value updates', () => {
      const { rerender } = render(<Progress value={20} data-testid="progress" />);
      let progress = screen.getByTestId('progress');
      
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveClass('relative', 'h-2', 'w-full');
      
      rerender(<Progress value={80} data-testid="progress" />);
      progress = screen.getByTestId('progress');
      
      expect(progress).toBeInTheDocument();
      expect(progress).toHaveClass('relative', 'h-2', 'w-full');
    });
  });
});