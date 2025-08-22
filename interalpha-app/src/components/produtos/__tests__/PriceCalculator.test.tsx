import { describe, it, expect, vi } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PriceCalculator from '../PriceCalculator'

describe('PriceCalculator', () => {
  it('should render with default values', () => {
    render(<PriceCalculator />)
    
    expect(screen.getByLabelText(/preço de custo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preço de venda/i)).toBeInTheDocument()
    expect(screen.getByText(/calculadora de preços/i)).toBeInTheDocument()
  })

  it('should calculate margin correctly', async () => {
    const onPricesChange = jest.fn()
    
    render(
      <PriceCalculator 
        onPricesChange={onPricesChange}
      />
    )
    
    const costPriceInput = screen.getByLabelText(/preço de custo/i)
    const salePriceInput = screen.getByLabelText(/preço de venda/i)
    
    // Inserir preços
    fireEvent.change(costPriceInput, { target: { value: '100' } })
    fireEvent.change(salePriceInput, { target: { value: '150' } })
    
    // Aguardar cálculo
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
    
    // Verificar callback
    expect(onPricesChange).toHaveBeenCalledWith(100, 150, 50)
  })

  it('should show negative margin warning', async () => {
    render(<PriceCalculator />)
    
    const costPriceInput = screen.getByLabelText(/preço de custo/i)
    const salePriceInput = screen.getByLabelText(/preço de venda/i)
    
    // Preço de venda menor que custo
    fireEvent.change(costPriceInput, { target: { value: '100' } })
    fireEvent.change(salePriceInput, { target: { value: '80' } })
    
    await waitFor(() => {
      expect(screen.getByText(/prejuízo/i)).toBeInTheDocument()
    })
  })

  it('should show price suggestions', async () => {
    render(<PriceCalculator />)
    
    const costPriceInput = screen.getByLabelText(/preço de custo/i)
    
    fireEvent.change(costPriceInput, { target: { value: '100' } })
    
    await waitFor(() => {
      expect(screen.getByText('+20%')).toBeInTheDocument()
      expect(screen.getByText('+50%')).toBeInTheDocument()
      expect(screen.getByText('+100%')).toBeInTheDocument()
    })
  })

  it('should apply price suggestion when clicked', async () => {
    render(<PriceCalculator />)
    
    const costPriceInput = screen.getByLabelText(/preço de custo/i)
    const salePriceInput = screen.getByLabelText(/preço de venda/i)
    
    fireEvent.change(costPriceInput, { target: { value: '100' } })
    
    // Clicar na sugestão +50%
    const suggestion50 = screen.getByText('+50%').closest('button')
    fireEvent.click(suggestion50!)
    
    await waitFor(() => {
      expect(salePriceInput).toHaveValue(150)
    })
  })

  it('should work without card wrapper', () => {
    render(<PriceCalculator showCard={false} />)
    
    expect(screen.queryByText(/calculadora de preços/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/preço de custo/i)).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<PriceCalculator disabled={true} />)
    
    const costPriceInput = screen.getByLabelText(/preço de custo/i)
    const salePriceInput = screen.getByLabelText(/preço de venda/i)
    
    expect(costPriceInput).toBeDisabled()
    expect(salePriceInput).toBeDisabled()
  })

  it('should update when initial values change', () => {
    const { rerender } = render(
      <PriceCalculator 
        initialCostPrice={50} 
        initialSalePrice={75} 
      />
    )
    
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    expect(screen.getByDisplayValue('75')).toBeInTheDocument()
    
    // Atualizar props
    rerender(
      <PriceCalculator 
        initialCostPrice={100} 
        initialSalePrice={150} 
      />
    )
    
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    expect(screen.getByDisplayValue('150')).toBeInTheDocument()
  })

  it('should show appropriate margin status colors', async () => {
    render(<PriceCalculator />)
    
    const costPriceInput = screen.getByLabelText(/preço de custo/i)
    const salePriceInput = screen.getByLabelText(/preço de venda/i)
    
    // Margem positiva
    fireEvent.change(costPriceInput, { target: { value: '100' } })
    fireEvent.change(salePriceInput, { target: { value: '150' } })
    
    await waitFor(() => {
      const marginBadge = screen.getByText('50%').closest('span')
      expect(marginBadge).toHaveClass('text-green-600')
    })
  })
})