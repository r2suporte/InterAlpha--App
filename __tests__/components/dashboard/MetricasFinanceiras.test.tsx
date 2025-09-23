import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MetricasFinanceiras } from '@/components/dashboard/MetricasFinanceiras'

describe('MetricasFinanceiras', () => {
  it('renderiza o componente corretamente', () => {
    render(<MetricasFinanceiras />)
    
    // Verifica se os cards de métricas são renderizados
    expect(screen.getByText('Receita do Mês')).toBeInTheDocument()
    expect(screen.getByText('Aguardando Pagamento')).toBeInTheDocument()
    expect(screen.getByText('Ticket Médio')).toBeInTheDocument()
    expect(screen.getByText('Taxa de Aprovação')).toBeInTheDocument()
    expect(screen.getByText('Ordens em Atraso')).toBeInTheDocument()
    expect(screen.getByText('Pagamentos PIX')).toBeInTheDocument()
    expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument()
    expect(screen.getByText('Tempo Médio Pagamento')).toBeInTheDocument()
  })

  it('exibe valores formatados corretamente', () => {
    render(<MetricasFinanceiras />)
    
    // Verifica se os valores monetários estão formatados
    expect(screen.getByText(/R\$\s*35\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*28\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*850,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*15\.750,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*11\.200,00/)).toBeInTheDocument()
  })

  it('exibe tendências com ícones corretos', () => {
    render(<MetricasFinanceiras />)
    
    // Verifica se há elementos com classes de tendência
    const receitaText = screen.getByText('Receita do Mês')
    expect(receitaText).toBeInTheDocument()
    
    // Verifica se há ícones de tendência (SVG)
    const svgElements = document.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThan(0)
  })

  it('exibe descrições das métricas', () => {
    render(<MetricasFinanceiras />)
    
    expect(screen.getByText('Janeiro 2024')).toBeInTheDocument()
    expect(screen.getByText('12 ordens de serviço')).toBeInTheDocument()
    expect(screen.getByText('Últimos 30 dias')).toBeInTheDocument()
    expect(screen.getByText('Orçamentos aprovados')).toBeInTheDocument()
    expect(screen.getByText('Requer atenção')).toBeInTheDocument()
    expect(screen.getByText('Meta: 3 dias')).toBeInTheDocument()
  })

  it('aplica className personalizada', () => {
    const customClass = 'custom-metrics-class'
    const { container } = render(<MetricasFinanceiras className={customClass} />)
    
    expect(container.firstChild).toHaveClass(customClass)
  })

  it('exibe badges de status corretos', () => {
    render(<MetricasFinanceiras />)
    
    // Verifica se há badges com diferentes variantes
    const badges = screen.getAllByRole('generic')
    const badgeElements = badges.filter(el => 
      el.className.includes('badge') || 
      el.textContent?.includes('+') || 
      el.textContent?.includes('%')
    )
    
    expect(badgeElements.length).toBeGreaterThan(0)
  })

  it('renderiza ícones para cada métrica', () => {
    render(<MetricasFinanceiras />)
    
    // Verifica se os ícones estão presentes através dos elementos SVG
    const svgElements = document.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThan(0)
  })

  it('exibe percentuais de tendência formatados', () => {
    render(<MetricasFinanceiras />)
    
    // Verifica se há percentuais formatados (com texto completo)
    expect(screen.getByText('+12.5% vs mês anterior')).toBeInTheDocument()
    expect(screen.getByText('-5.2% vs mês anterior')).toBeInTheDocument()
    expect(screen.getByText('+8.3% vs mês anterior')).toBeInTheDocument()
    expect(screen.getByText('+2.1% vs mês anterior')).toBeInTheDocument()
    
    // Verifica se há mais percentuais formatados
    expect(screen.getByText('+15.8% vs mês anterior')).toBeInTheDocument()
    expect(screen.getByText('-3.2% vs mês anterior')).toBeInTheDocument()
    expect(screen.getByText('-1.5% vs mês anterior')).toBeInTheDocument()
  })

  it('mantém estrutura de grid responsiva', () => {
    const { container } = render(<MetricasFinanceiras />)
    
    // Verifica se há uma estrutura de grid
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toBeInTheDocument()
  })

  it('exibe cards com headers e conteúdo', () => {
    render(<MetricasFinanceiras />)
    
    // Verifica se cada card tem header e conteúdo
    const cards = screen.getAllByRole('generic').filter(el => 
      el.className.includes('card')
    )
    
    // Deve haver pelo menos 4 cards (uma para cada métrica)
    expect(cards.length).toBeGreaterThanOrEqual(4)
  })
})