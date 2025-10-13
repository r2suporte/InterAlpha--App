import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert Component', () => {
  it('renders alert with default variant', () => {
    render(<Alert data-testid="alert">Alert content</Alert>);
    const alert = screen.getByTestId('alert');
    
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveClass(
      'relative',
      'w-full',
      'rounded-lg',
      'border',
      'px-4',
      'py-3',
      'text-sm',
      'bg-background',
      'text-foreground'
    );
  });

  it('renders alert content correctly', () => {
    render(<Alert>Test alert content</Alert>);
    
    expect(screen.getByText('Test alert content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Alert className="custom-alert" data-testid="alert">Alert</Alert>);
    const alert = screen.getByTestId('alert');
    
    expect(alert).toHaveClass('custom-alert');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Alert ref={ref}>Alert with ref</Alert>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  describe('Alert Variants', () => {
    it('renders default variant correctly', () => {
      render(<Alert variant="default" data-testid="alert">Default Alert</Alert>);
      const alert = screen.getByTestId('alert');
      
      expect(alert).toHaveClass('bg-background', 'text-foreground');
    });

    it('renders destructive variant correctly', () => {
      render(<Alert variant="destructive" data-testid="alert">Destructive Alert</Alert>);
      const alert = screen.getByTestId('alert');
      
      expect(alert).toHaveClass(
        'border-destructive/50',
        'text-destructive',
        'dark:border-destructive'
      );
    });
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Alert onClick={handleClick} data-testid="alert">Clickable Alert</Alert>);
    const alert = screen.getByTestId('alert');
    
    fireEvent.click(alert);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('passes through other HTML attributes', () => {
    render(
      <Alert 
        id="test-alert"
        data-testid="alert"
        data-custom="custom-value"
      >
        Alert with attributes
      </Alert>
    );
    const alert = screen.getByTestId('alert');
    
    expect(alert).toHaveAttribute('id', 'test-alert');
    expect(alert).toHaveAttribute('data-custom', 'custom-value');
  });

  it('renders as correct HTML element', () => {
    render(<Alert data-testid="alert">Test Alert</Alert>);
    const alert = screen.getByTestId('alert');
    
    expect(alert.tagName).toBe('DIV');
  });

  it('handles SVG icon styling classes', () => {
    render(
      <Alert data-testid="alert">
        <svg data-testid="alert-icon">
          <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z" />
        </svg>
        <div>Alert with icon</div>
      </Alert>
    );
    const alert = screen.getByTestId('alert');
    
    expect(alert).toHaveClass(
      '[&>svg]:absolute',
      '[&>svg]:left-4',
      '[&>svg]:top-4',
      '[&>svg]:text-foreground',
      '[&>svg~*]:pl-7',
      '[&>svg+div]:translate-y-[-3px]'
    );
  });
});

describe('AlertTitle Component', () => {
  it('renders alert title correctly', () => {
    render(<AlertTitle data-testid="alert-title">Alert Title</AlertTitle>);
    const title = screen.getByTestId('alert-title');
    
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass(
      'mb-1',
      'font-medium',
      'leading-none',
      'tracking-tight'
    );
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AlertTitle className="custom-title" data-testid="alert-title">Title</AlertTitle>);
    const title = screen.getByTestId('alert-title');
    
    expect(title).toHaveClass('custom-title');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<AlertTitle ref={ref}>Title with ref</AlertTitle>);
    
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it('renders as correct HTML element', () => {
    render(<AlertTitle data-testid="alert-title">Test Title</AlertTitle>);
    const title = screen.getByTestId('alert-title');
    
    expect(title.tagName).toBe('H5');
  });

  it('passes through other HTML attributes', () => {
    render(
      <AlertTitle 
        id="test-title"
        data-testid="alert-title"
        data-custom="custom-value"
      >
        Title with attributes
      </AlertTitle>
    );
    const title = screen.getByTestId('alert-title');
    
    expect(title).toHaveAttribute('id', 'test-title');
    expect(title).toHaveAttribute('data-custom', 'custom-value');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<AlertTitle onClick={handleClick} data-testid="alert-title">Clickable Title</AlertTitle>);
    const title = screen.getByTestId('alert-title');
    
    fireEvent.click(title);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('AlertDescription Component', () => {
  it('renders alert description correctly', () => {
    render(<AlertDescription data-testid="alert-description">Alert Description</AlertDescription>);
    const description = screen.getByTestId('alert-description');
    
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm', '[&_p]:leading-relaxed');
    expect(screen.getByText('Alert Description')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AlertDescription className="custom-description" data-testid="alert-description">Description</AlertDescription>);
    const description = screen.getByTestId('alert-description');
    
    expect(description).toHaveClass('custom-description');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLParagraphElement>();
    render(<AlertDescription ref={ref}>Description with ref</AlertDescription>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders as correct HTML element', () => {
    render(<AlertDescription data-testid="alert-description">Test Description</AlertDescription>);
    const description = screen.getByTestId('alert-description');
    
    expect(description.tagName).toBe('DIV');
  });

  it('passes through other HTML attributes', () => {
    render(
      <AlertDescription 
        id="test-description"
        data-testid="alert-description"
        data-custom="custom-value"
      >
        Description with attributes
      </AlertDescription>
    );
    const description = screen.getByTestId('alert-description');
    
    expect(description).toHaveAttribute('id', 'test-description');
    expect(description).toHaveAttribute('data-custom', 'custom-value');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<AlertDescription onClick={handleClick} data-testid="alert-description">Clickable Description</AlertDescription>);
    const description = screen.getByTestId('alert-description');
    
    fireEvent.click(description);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles paragraph content styling', () => {
    render(
      <AlertDescription data-testid="alert-description">
        <p>First paragraph</p>
        <p>Second paragraph</p>
      </AlertDescription>
    );
    const description = screen.getByTestId('alert-description');
    
    expect(description).toHaveClass('[&_p]:leading-relaxed');
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });
});

describe('Alert Complete Structure', () => {
  it('renders complete alert with title and description', () => {
    render(
      <Alert data-testid="complete-alert">
        <AlertTitle data-testid="alert-title">Warning</AlertTitle>
        <AlertDescription data-testid="alert-description">
          This is a warning message that requires your attention.
        </AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByTestId('complete-alert');
    const title = screen.getByTestId('alert-title');
    const description = screen.getByTestId('alert-description');
    
    expect(alert).toBeInTheDocument();
    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('This is a warning message that requires your attention.')).toBeInTheDocument();
  });

  it('renders destructive alert with icon', () => {
    render(
      <Alert variant="destructive" data-testid="destructive-alert">
        <svg data-testid="alert-icon" viewBox="0 0 24 24">
          <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z" />
        </svg>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try again.
        </AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByTestId('destructive-alert');
    const icon = screen.getByTestId('alert-icon');
    
    expect(alert).toHaveClass('text-destructive');
    expect(icon).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('handles multiple alerts', () => {
    render(
      <div>
        <Alert variant="default">
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>Information message</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Error message</AlertDescription>
        </Alert>
      </div>
    );
    
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Information message')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});