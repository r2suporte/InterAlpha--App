import { render, screen } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Default Badge</Badge>)
    
    const badge = screen.getByText('Default Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-primary')
  })

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>)
    
    const badge = screen.getByText('Secondary Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-secondary')
  })

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive">Error Badge</Badge>)
    
    const badge = screen.getByText('Error Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-destructive')
  })

  it('renders with success variant', () => {
    render(<Badge variant="success">Success Badge</Badge>)
    
    const badge = screen.getByText('Success Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100')
  })

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning Badge</Badge>)
    
    const badge = screen.getByText('Warning Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-yellow-100')
  })

  it('renders with info variant', () => {
    render(<Badge variant="info">Info Badge</Badge>)
    
    const badge = screen.getByText('Info Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>)
    
    const badge = screen.getByText('Custom Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('custom-class')
  })

  it('renders with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>)
    
    const badge = screen.getByText('Outline Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('text-foreground')
  })
})