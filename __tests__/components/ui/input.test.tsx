import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('renders input with default classes', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass(
      'flex',
      'h-9',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-transparent',
      'px-3',
      'py-1'
    );
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toHaveClass('custom-input');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');

    rerender(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} data-testid="input" />);
    const input = screen.getByTestId('input');
    
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('test value');
  });

  it('handles placeholder text', () => {
    render(<Input placeholder="Enter text here" data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toHaveAttribute('placeholder', 'Enter text here');
  });

  it('handles disabled state', () => {
    render(<Input disabled data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('handles required attribute', () => {
    render(<Input required data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toBeRequired();
  });

  it('handles readonly attribute', () => {
    render(<Input readOnly data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toHaveAttribute('readonly');
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(
      <Input 
        onFocus={handleFocus} 
        onBlur={handleBlur} 
        data-testid="input" 
      />
    );
    const input = screen.getByTestId('input');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard events', () => {
    const handleKeyDown = jest.fn();
    const handleKeyUp = jest.fn();
    
    render(
      <Input 
        onKeyDown={handleKeyDown} 
        onKeyUp={handleKeyUp} 
        data-testid="input" 
      />
    );
    const input = screen.getByTestId('input');
    
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
    
    fireEvent.keyUp(input, { key: 'Enter' });
    expect(handleKeyUp).toHaveBeenCalledTimes(1);
  });

  it('passes through other HTML attributes', () => {
    render(
      <Input 
        id="test-input"
        name="testName"
        maxLength={10}
        minLength={2}
        data-testid="input"
      />
    );
    const input = screen.getByTestId('input');
    
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('name', 'testName');
    expect(input).toHaveAttribute('maxlength', '10');
    expect(input).toHaveAttribute('minlength', '2');
  });

  it('handles file input type correctly', () => {
    render(<Input type="file" data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveClass('file:border-0', 'file:bg-transparent');
  });

  it('handles controlled input', () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('');
      return (
        <Input 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="input"
        />
      );
    };

    render(<TestComponent />);
    const input = screen.getByTestId('input');
    
    expect(input).toHaveValue('');
    
    fireEvent.change(input, { target: { value: 'controlled value' } });
    expect(input).toHaveValue('controlled value');
  });

  it('handles uncontrolled input with defaultValue', () => {
    render(<Input defaultValue="default text" data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toHaveValue('default text');
    
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(input).toHaveValue('new value');
  });
});