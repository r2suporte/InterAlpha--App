import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProdutosPage from '../page'

// Mock dos componentes
vi.mock('@/components/produtos/ProductsStats', () => ({
  default: () => <div data-testid="products-stats">ProductsStats</div>
}))

vi.mock('@/components/produtos/ProductsTable', () => ({
  default: () => <div data-testid="products-table">ProductsTable</div>
}))

describe('ProdutosPage', () => {
  it('should render page header', async () => {
    render(await ProdutosPage())
    
    expect(screen.getByText(/gestão de produtos/i)).toBeInTheDocument()
    expect(screen.getByText(/gerencie seu catálogo/i)).toBeInTheDocument()
  })

  it('should render new product button', async () => {
    render(await ProdutosPage())
    
    const newProductButton = screen.getByRole('link', { name: /novo produto/i })
    expect(newProductButton).toBeInTheDocument()
    expect(newProductButton).toHaveAttribute('href', '/produtos/novo')
  })

  it('should render ProductsStats component', async () => {
    render(await ProdutosPage())
    
    expect(screen.getByTestId('products-stats')).toBeInTheDocument()
  })

  it('should render ProductsTable component', async () => {
    render(await ProdutosPage())
    
    expect(screen.getByTestId('products-table')).toBeInTheDocument()
  })

  it('should have proper page structure', async () => {
    render(await ProdutosPage())
    
    // Verificar estrutura da página
    const mainContainer = screen.getByText(/gestão de produtos/i).closest('div')
    expect(mainContainer).toHaveClass('space-y-8')
  })
})