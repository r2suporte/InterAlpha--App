/**
 * Actions para relatórios financeiros com dados de produtos
 */

'use server'

import { prisma } from '@/lib/prisma'
import { enrichProductsWithCalculations } from '@/lib/utils/product-utils'

export interface RelatorioFinanceiroComProdutos {
  periodo: {
    inicio: Date
    fim: Date
  }
  receita: {
    total: number
    servicos: number
    produtos: number
    percentualProdutos: number
  }
  produtos: {
    totalVendido: number
    quantidadeItens: number
    ticketMedio: number
    margemMedia: number
    maisVendidos: Array<{
      produto: any
      quantidadeVendida: number
      receitaGerada: number
      margemLucro: number
    }>
  }
  comparativo: {
    mesAnterior?: {
      receitaProdutos: number
      crescimento: number
    }
  }
}

/**
 * Obter relatório financeiro completo com dados de produtos
 */
export async function obterRelatorioFinanceiroComProdutos(
  ano: number, 
  mes: number
): Promise<RelatorioFinanceiroComProdutos> {
  try {
    const inicioMes = new Date(ano, mes - 1, 1)
    const fimMes = new Date(ano, mes, 0, 23, 59, 59)
    
    // Período do mês anterior para comparação
    const inicioMesAnterior = new Date(ano, mes - 2, 1)
    const fimMesAnterior = new Date(ano, mes - 1, 0, 23, 59, 59)

    // Buscar ordens do período com itens de produtos
    const ordensComItens = await prisma.ordemServico.findMany({
      where: {
        createdAt: {
          gte: inicioMes,
          lte: fimMes
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        pagamentos: {
          where: {
            status: 'PAGO'
          }
        }
      }
    })

    // Calcular receita de serviços
    const receitaServicos = ordensComItens.reduce((total, ordem) => {
      const pagamentosOrdem = ordem.pagamentos.reduce((sum, pag) => sum + pag.valor, 0)
      const valorProdutos = ordem.items.reduce((sum, item) => sum + item.totalPrice, 0)
      return total + Math.max(0, pagamentosOrdem - valorProdutos)
    }, 0)

    // Calcular receita de produtos
    const receitaProdutos = ordensComItens.reduce((total, ordem) => {
      return total + ordem.items.reduce((sum, item) => sum + item.totalPrice, 0)
    }, 0)

    const receitaTotal = receitaServicos + receitaProdutos

    // Calcular dados dos produtos
    const todosItens = ordensComItens.flatMap(ordem => ordem.items)
    const quantidadeItens = todosItens.reduce((sum, item) => sum + item.quantity, 0)
    const ticketMedio = quantidadeItens > 0 ? receitaProdutos / quantidadeItens : 0

    // Calcular margem média dos produtos vendidos
    const produtosComMargem = todosItens.map(item => {
      if (!item.product) return { margem: 0, receita: item.totalPrice }
      
      const produto = enrichProductsWithCalculations([item.product])[0]
      return {
        margem: produto.profitMargin,
        receita: item.totalPrice
      }
    })

    const margemMedia = produtosComMargem.length > 0 
      ? produtosComMargem.reduce((sum, p) => sum + (p.margem * p.receita), 0) / receitaProdutos
      : 0

    // Produtos mais vendidos
    const produtosPorId = new Map<string, {
      produto: any
      quantidadeVendida: number
      receitaGerada: number
      custoTotal: number
    }>()

    todosItens.forEach(item => {
      if (!item.product) return

      const existing = produtosPorId.get(item.productId) || {
        produto: item.product,
        quantidadeVendida: 0,
        receitaGerada: 0,
        custoTotal: 0
      }

      existing.quantidadeVendida += item.quantity
      existing.receitaGerada += item.totalPrice
      existing.custoTotal += item.product.costPrice * item.quantity

      produtosPorId.set(item.productId, existing)
    })

    const maisVendidos = Array.from(produtosPorId.values())
      .map(item => ({
        produto: enrichProductsWithCalculations([item.produto])[0],
        quantidadeVendida: item.quantidadeVendida,
        receitaGerada: item.receitaGerada,
        margemLucro: item.receitaGerada > 0 
          ? ((item.receitaGerada - item.custoTotal) / item.receitaGerada) * 100 
          : 0
      }))
      .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
      .slice(0, 10)

    // Comparativo com mês anterior
    const ordensAnterior = await prisma.ordemServico.findMany({
      where: {
        createdAt: {
          gte: inicioMesAnterior,
          lte: fimMesAnterior
        }
      },
      include: {
        items: true
      }
    })

    const receitaProdutosMesAnterior = ordensAnterior.reduce((total, ordem) => {
      return total + ordem.items.reduce((sum, item) => sum + item.totalPrice, 0)
    }, 0)

    const crescimento = receitaProdutosMesAnterior > 0 
      ? ((receitaProdutos - receitaProdutosMesAnterior) / receitaProdutosMesAnterior) * 100
      : 0

    return {
      periodo: {
        inicio: inicioMes,
        fim: fimMes
      },
      receita: {
        total: receitaTotal,
        servicos: receitaServicos,
        produtos: receitaProdutos,
        percentualProdutos: receitaTotal > 0 ? (receitaProdutos / receitaTotal) * 100 : 0
      },
      produtos: {
        totalVendido: receitaProdutos,
        quantidadeItens,
        ticketMedio,
        margemMedia,
        maisVendidos
      },
      comparativo: {
        mesAnterior: {
          receitaProdutos: receitaProdutosMesAnterior,
          crescimento
        }
      }
    }

  } catch (error) {
    console.error('Erro ao obter relatório financeiro com produtos:', error)
    throw new Error('Erro ao gerar relatório financeiro')
  }
}

/**
 * Obter estatísticas de produtos por período
 */
export async function obterEstatisticasProdutos(
  dataInicio: Date,
  dataFim: Date
) {
  try {
    const ordensComItens = await prisma.ordemServico.findMany({
      where: {
        createdAt: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    const todosItens = ordensComItens.flatMap(ordem => ordem.items)
    
    // Estatísticas gerais
    const totalProdutosVendidos = todosItens.reduce((sum, item) => sum + item.quantity, 0)
    const receitaTotalProdutos = todosItens.reduce((sum, item) => sum + item.totalPrice, 0)
    const custoTotalProdutos = todosItens.reduce((sum, item) => {
      return sum + (item.product?.costPrice || 0) * item.quantity
    }, 0)
    
    const margemBrutaTotal = receitaTotalProdutos - custoTotalProdutos
    const margemPercentual = receitaTotalProdutos > 0 
      ? (margemBrutaTotal / receitaTotalProdutos) * 100 
      : 0

    // Produtos únicos vendidos
    const produtosUnicos = new Set(todosItens.map(item => item.productId)).size

    // Ticket médio
    const ticketMedio = todosItens.length > 0 ? receitaTotalProdutos / todosItens.length : 0

    return {
      totalProdutosVendidos,
      receitaTotalProdutos,
      custoTotalProdutos,
      margemBrutaTotal,
      margemPercentual,
      produtosUnicos,
      ticketMedio,
      ordensComProdutos: ordensComItens.filter(ordem => ordem.items.length > 0).length
    }

  } catch (error) {
    console.error('Erro ao obter estatísticas de produtos:', error)
    throw new Error('Erro ao obter estatísticas de produtos')
  }
}

/**
 * Obter ranking de produtos mais lucrativos
 */
export async function obterRankingProdutosMaisLucrativos(
  dataInicio: Date,
  dataFim: Date,
  limite: number = 20
) {
  try {
    const itensVendidos = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: dataInicio,
            lte: dataFim
          }
        }
      },
      include: {
        product: true,
        order: {
          select: {
            id: true,
            titulo: true,
            createdAt: true
          }
        }
      }
    })

    // Agrupar por produto e calcular lucros
    const produtosPorId = new Map<string, {
      produto: any
      quantidadeVendida: number
      receitaTotal: number
      custoTotal: number
      lucroTotal: number
      margemMedia: number
      ultimaVenda: Date
    }>()

    itensVendidos.forEach(item => {
      if (!item.product) return

      const existing = produtosPorId.get(item.productId) || {
        produto: item.product,
        quantidadeVendida: 0,
        receitaTotal: 0,
        custoTotal: 0,
        lucroTotal: 0,
        margemMedia: 0,
        ultimaVenda: item.order.createdAt
      }

      const custoItem = item.product.costPrice * item.quantity
      const lucroItem = item.totalPrice - custoItem

      existing.quantidadeVendida += item.quantity
      existing.receitaTotal += item.totalPrice
      existing.custoTotal += custoItem
      existing.lucroTotal += lucroItem
      
      if (item.order.createdAt > existing.ultimaVenda) {
        existing.ultimaVenda = item.order.createdAt
      }

      produtosPorId.set(item.productId, existing)
    })

    // Calcular margem média e ordenar por lucro
    const ranking = Array.from(produtosPorId.values())
      .map(item => ({
        ...item,
        margemMedia: item.receitaTotal > 0 ? (item.lucroTotal / item.receitaTotal) * 100 : 0,
        produto: enrichProductsWithCalculations([item.produto])[0]
      }))
      .sort((a, b) => b.lucroTotal - a.lucroTotal)
      .slice(0, limite)

    return ranking

  } catch (error) {
    console.error('Erro ao obter ranking de produtos mais lucrativos:', error)
    throw new Error('Erro ao obter ranking de produtos')
  }
}

/**
 * Obter análise de sazonalidade de produtos
 */
export async function obterAnaliseSazonalidadeProdutos(ano: number) {
  try {
    const vendas = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: new Date(ano, 0, 1),
            lte: new Date(ano, 11, 31, 23, 59, 59)
          }
        }
      },
      include: {
        product: true,
        order: {
          select: {
            createdAt: true
          }
        }
      }
    })

    // Agrupar por mês
    const vendasPorMes = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      receita: 0,
      quantidade: 0,
      produtosUnicos: new Set<string>()
    }))

    vendas.forEach(item => {
      const mes = item.order.createdAt.getMonth()
      vendasPorMes[mes].receita += item.totalPrice
      vendasPorMes[mes].quantidade += item.quantity
      vendasPorMes[mes].produtosUnicos.add(item.productId)
    })

    return vendasPorMes.map(mes => ({
      mes: mes.mes,
      receita: mes.receita,
      quantidade: mes.quantidade,
      produtosUnicos: mes.produtosUnicos.size
    }))

  } catch (error) {
    console.error('Erro ao obter análise de sazonalidade:', error)
    throw new Error('Erro ao obter análise de sazonalidade')
  }
}