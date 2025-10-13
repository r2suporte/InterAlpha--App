import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

describe('Avatar Component', () => {
  it('renders avatar with default classes', () => {
    render(<Avatar data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');
    
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass(
      'relative',
      'flex',
      'h-10',
      'w-10',
      'shrink-0',
      'overflow-hidden',
      'rounded-full'
    );
  });

  it('applies custom className', () => {
    render(<Avatar className="custom-avatar" data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');
    
    expect(avatar).toHaveClass('custom-avatar');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('passes through other props', () => {
    render(
      <Avatar 
        data-testid="avatar"
        id="test-avatar"
        data-custom="custom-value"
      />
    );
    const avatar = screen.getByTestId('avatar');
    
    expect(avatar).toHaveAttribute('id', 'test-avatar');
    expect(avatar).toHaveAttribute('data-custom', 'custom-value');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Avatar onClick={handleClick} data-testid="avatar" />);
    const avatar = screen.getByTestId('avatar');
    
    fireEvent.click(avatar);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders children correctly', () => {
    render(
      <Avatar data-testid="avatar">
        <div data-testid="avatar-child">Child content</div>
      </Avatar>
    );
    
    expect(screen.getByTestId('avatar-child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});

describe('AvatarImage Component', () => {
  it('renders avatar with image component', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarImage src="/test-image.jpg" alt="Test Avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    const avatar = screen.getByTestId('avatar');
    
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('relative', 'flex', 'shrink-0', 'overflow-hidden', 'rounded-full');
  });

  it('renders avatar with custom image className', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarImage className="custom-image" src="/test.jpg" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    const avatar = screen.getByTestId('avatar');
    
    expect(avatar).toBeInTheDocument();
  });
});

describe('AvatarFallback Component', () => {
  it('renders avatar with fallback component', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    const avatar = screen.getByTestId('avatar');
    
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('relative', 'flex', 'shrink-0', 'overflow-hidden', 'rounded-full');
  });

  it('renders avatar with custom fallback className', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback className="custom-fallback">AB</AvatarFallback>
      </Avatar>
    );
    const avatar = screen.getByTestId('avatar');
    
    expect(avatar).toBeInTheDocument();
  });
});

describe('Avatar Complete Structure', () => {
  it('renders complete avatar with image and fallback', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarImage src="/test-image.jpg" alt="Test Avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('relative', 'flex', 'shrink-0', 'overflow-hidden', 'rounded-full');
  });

  it('renders avatar with fallback when image is not available', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('relative', 'flex', 'shrink-0', 'overflow-hidden', 'rounded-full');
  });

  it('handles different avatar sizes with custom classes', () => {
    const { rerender } = render(
      <Avatar className="h-8 w-8" data-testid="small-avatar">
        <AvatarFallback>S</AvatarFallback>
      </Avatar>
    );
    
    let avatar = screen.getByTestId('small-avatar');
    expect(avatar).toHaveClass('h-8', 'w-8');
    
    rerender(
      <Avatar className="h-16 w-16" data-testid="large-avatar">
        <AvatarFallback>L</AvatarFallback>
      </Avatar>
    );
    
    avatar = screen.getByTestId('large-avatar');
    expect(avatar).toHaveClass('h-16', 'w-16');
  });

  it('handles avatar with initials fallback', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarImage src="/user.jpg" alt="John Doe" />
        <AvatarFallback data-testid="initials">JD</AvatarFallback>
      </Avatar>
    );
    
    const fallback = screen.getByTestId('initials');
    expect(fallback).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('handles avatar with icon fallback', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarImage src="/user.jpg" alt="User" />
        <AvatarFallback data-testid="icon-fallback">
          <svg data-testid="user-icon" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </AvatarFallback>
      </Avatar>
    );
    
    const fallback = screen.getByTestId('icon-fallback');
    const icon = screen.getByTestId('user-icon');
    
    expect(fallback).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });

  it('handles multiple avatars', () => {
    render(
      <div>
        <Avatar data-testid="avatar-1">
          <AvatarImage src="/user1.jpg" alt="User 1" />
          <AvatarFallback>U1</AvatarFallback>
        </Avatar>
        <Avatar data-testid="avatar-2">
          <AvatarImage src="/user2.jpg" alt="User 2" />
          <AvatarFallback>U2</AvatarFallback>
        </Avatar>
      </div>
    );
    
    expect(screen.getByTestId('avatar-1')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-2')).toBeInTheDocument();
    expect(screen.getByText('U1')).toBeInTheDocument();
    expect(screen.getByText('U2')).toBeInTheDocument();
  });

  it('handles avatar with custom styling', () => {
    render(
      <Avatar className="border-2 border-primary" data-testid="styled-avatar">
        <AvatarImage src="/user.jpg" alt="User" />
        <AvatarFallback className="bg-primary text-primary-foreground">JS</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('styled-avatar');
    expect(avatar).toHaveClass('border-2', 'border-primary');
    
    const fallback = screen.getByText('JS');
    expect(fallback).toHaveClass('bg-primary', 'text-primary-foreground');
  });
});