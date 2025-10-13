import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Label } from '@/components/ui/label';

describe('Label Component', () => {
  it('renders label with default classes', () => {
    render(<Label data-testid="label">Test Label</Label>);
    const label = screen.getByTestId('label');
    
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass(
      'text-sm',
      'font-medium',
      'leading-none',
      'peer-disabled:cursor-not-allowed',
      'peer-disabled:opacity-70'
    );
  });

  it('renders label text correctly', () => {
    render(<Label>Test Label Text</Label>);
    
    expect(screen.getByText('Test Label Text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Label className="custom-label" data-testid="label">Label</Label>);
    const label = screen.getByTestId('label');
    
    expect(label).toHaveClass('custom-label');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Label with ref</Label>);
    
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('handles htmlFor attribute correctly', () => {
    render(<Label htmlFor="test-input" data-testid="label">Input Label</Label>);
    const label = screen.getByTestId('label');
    
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Label onClick={handleClick} data-testid="label">Clickable Label</Label>);
    const label = screen.getByTestId('label');
    
    fireEvent.click(label);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('works with form input association', () => {
    render(
      <div>
        <Label htmlFor="email-input">Email</Label>
        <input id="email-input" type="email" />
      </div>
    );
    
    const label = screen.getByText('Email');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', 'email-input');
    expect(input).toHaveAttribute('id', 'email-input');
  });

  it('handles disabled peer state styling', () => {
    render(
      <div>
        <Label htmlFor="disabled-input" data-testid="label">Disabled Input Label</Label>
        <input id="disabled-input" disabled className="peer" />
      </div>
    );
    
    const label = screen.getByTestId('label');
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
  });

  it('passes through other HTML attributes', () => {
    render(
      <Label 
        id="test-label"
        title="Label tooltip"
        data-testid="label"
        data-custom="custom-value"
      >
        Label with attributes
      </Label>
    );
    const label = screen.getByTestId('label');
    
    expect(label).toHaveAttribute('id', 'test-label');
    expect(label).toHaveAttribute('title', 'Label tooltip');
    expect(label).toHaveAttribute('data-custom', 'custom-value');
  });

  it('handles keyboard events', () => {
    const handleKeyDown = jest.fn();
    render(<Label onKeyDown={handleKeyDown} data-testid="label">Label</Label>);
    const label = screen.getByTestId('label');
    
    fireEvent.keyDown(label, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('renders as correct HTML element', () => {
    render(<Label data-testid="label">Test Label</Label>);
    const label = screen.getByTestId('label');
    
    expect(label.tagName).toBe('LABEL');
  });

  it('handles complex content', () => {
    render(
      <Label data-testid="label">
        <span>Required</span>
        <span className="text-red-500">*</span>
      </Label>
    );
    
    const label = screen.getByTestId('label');
    expect(label).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('maintains accessibility with screen readers', () => {
    render(
      <div>
        <Label htmlFor="accessible-input">Accessible Label</Label>
        <input 
          id="accessible-input" 
          type="text" 
          aria-describedby="help-text"
        />
        <div id="help-text">Help text for the input</div>
      </div>
    );
    
    const label = screen.getByText('Accessible Label');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', 'accessible-input');
    expect(input).toHaveAttribute('aria-describedby', 'help-text');
  });
});