import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton Component', () => {
  it('renders skeleton with default classes', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass(
      'animate-pulse',
      'rounded-md',
      'bg-primary/10'
    );
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-skeleton" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toHaveClass('custom-skeleton');
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-primary/10');
  });

  it('passes through other HTML attributes', () => {
    render(
      <Skeleton 
        data-testid="skeleton"
        id="test-skeleton"
        data-custom="custom-value"
        style={{ width: '100px', height: '20px' }}
      />
    );
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toHaveAttribute('id', 'test-skeleton');
    expect(skeleton).toHaveAttribute('data-custom', 'custom-value');
    expect(skeleton).toHaveStyle({ width: '100px', height: '20px' });
  });

  it('renders as correct HTML element', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton.tagName).toBe('DIV');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Skeleton onClick={handleClick} data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    fireEvent.click(skeleton);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard events', () => {
    const handleKeyDown = jest.fn();
    render(<Skeleton onKeyDown={handleKeyDown} data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    fireEvent.keyDown(skeleton, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('renders with different sizes using custom classes', () => {
    const { rerender } = render(
      <Skeleton className="h-4 w-full" data-testid="skeleton" />
    );
    
    let skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-4', 'w-full');
    
    rerender(<Skeleton className="h-8 w-8 rounded-full" data-testid="skeleton" />);
    skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-8', 'w-8', 'rounded-full');
  });

  it('renders multiple skeletons', () => {
    render(
      <div>
        <Skeleton data-testid="skeleton-1" className="h-4 w-full mb-2" />
        <Skeleton data-testid="skeleton-2" className="h-4 w-3/4 mb-2" />
        <Skeleton data-testid="skeleton-3" className="h-4 w-1/2" />
      </div>
    );
    
    expect(screen.getByTestId('skeleton-1')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-2')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-3')).toBeInTheDocument();
  });

  it('renders skeleton with content (though typically empty)', () => {
    render(
      <Skeleton data-testid="skeleton">
        <span>Loading content...</span>
      </Skeleton>
    );
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('handles different skeleton shapes', () => {
    const { rerender } = render(
      <Skeleton className="h-12 w-12 rounded-full" data-testid="avatar-skeleton" />
    );
    
    let skeleton = screen.getByTestId('avatar-skeleton');
    expect(skeleton).toHaveClass('rounded-full');
    
    rerender(<Skeleton className="h-4 w-full rounded-md" data-testid="text-skeleton" />);
    skeleton = screen.getByTestId('text-skeleton');
    expect(skeleton).toHaveClass('rounded-md');
    
    rerender(<Skeleton className="h-32 w-full rounded-lg" data-testid="card-skeleton" />);
    skeleton = screen.getByTestId('card-skeleton');
    expect(skeleton).toHaveClass('rounded-lg');
  });

  it('maintains animation classes with custom styling', () => {
    render(
      <Skeleton 
        className="h-6 w-24 bg-gray-200 rounded-full" 
        data-testid="custom-skeleton" 
      />
    );
    const skeleton = screen.getByTestId('custom-skeleton');
    
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('h-6', 'w-24', 'bg-gray-200', 'rounded-full');
  });

  it('handles accessibility attributes', () => {
    render(
      <Skeleton 
        data-testid="skeleton"
        role="status"
        aria-label="Loading content"
        aria-live="polite"
      />
    );
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
  });
});