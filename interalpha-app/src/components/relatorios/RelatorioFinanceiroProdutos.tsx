/**
 * Componente RelatorioFinanceiroProdutos - Relatório financeiro com dados de produtos
 */

'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  ShoppingCart,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import { RelatorioFinanceiroComProdutos } from '@/app/actions/relatorios-produtos'
import { formatCurrency } from '@/lib/utils/product-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface RelatorioFinanceiroProdutosProps {
  relatorio: RelatorioFinanceiroComProdutos
  isLoading?: boolean
}

export function RelatorioFinanceiroProdutos({ 
  relatorio, 
  isLoading = false 
}: RelatorioFinanceiroProdutosProps) {
  const [selectedMetric, setSelectedMetric] = useState<'receita' | 'margem' | 'quantidade'>('receita')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const { receita, produtos, comparativo } = relatorio

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Receita Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(receita.total)}
            </div>
            <p className="text-xs text-gray-500">
              {receita.percentualProdutos.toFixed(1)}% de produtos
            </p>
          </CardContent>
        </Card>

        {/* Receita de Produtos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Produtos</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(receita.produtos)}
            </div>
            <div className="flex items-center text-xs">
              {comparativo.mesAnterior && (
                <>
                  {comparativo.mesAnterior.crescimento >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={
                    comparativo.mesAnterior.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
                  }>
                    {Math.abs(comparativo.mesAnterior.crescimento).toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-1">vs mês anterior</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quantidade Vendida */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {produtos.quantidadeItens.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Ticket médio: {formatCurrency(produtos.ticketMedio)}
            </p>
          </CardContent>
        </Card>

        {/* Margem Média */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {produtos.margemMedia.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              Lucro médio por produto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Receita */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Distribuição de Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Serviços */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Serviços</span>
                <span className="font-medium">{formatCurrency(receita.servicos)}</span>
              </div>
              <Progress 
                value={(receita.servicos / receita.total) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">
                {((receita.servicos / receita.total) * 100).toFixed(1)}% do total
              </p>
            </div>

            <Separator />

            {/* Produtos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Produtos</span>
                <span className="font-medium">{formatCurrency(receita.produtos)}</span>
              </div>
              <Progress 
                value={(receita.produtos / receita.total) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">
                {((receita.produtos / receita.total) * 100).toFixed(1)}% do total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos Mais Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {produtos.maisVendidos.length > 0 ? (
            <div className="space-y-4">
              {produtos.maisVendidos.slice(0, 5).map((item, index) => (
                <div key={item.produto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm">{item.produto.partNumber}</h4>
                      <p className="text-xs text-gray-600 truncate">
                        {item.produto.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.quantidadeVendida} un.
                      </Badge>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(item.receitaGerada)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Margem: {item.margemLucro.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
              
              {produtos.maisVendidos.length > 5 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  E mais {produtos.maisVendidos.length - 5} produto(s)...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Nenhum produto vendido no período
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Análise de Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise de Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ticket Médio por Item</span>
              <span className="font-medium">{formatCurrency(produtos.ticketMedio)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Margem Bruta Total</span>
              <span className="font-medium text-green-600">
                {formatCurrency(receita.produtos * (produtos.margemMedia / 100))}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Produtos Únicos Vendidos</span>
              <span className="font-medium">{produtos.maisVendidos.length}</span>
            </div>

            {comparativo.mesAnterior && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Crescimento Mensal</span>
                  <div className="flex items-center gap-1">
                    {comparativo.mesAnterior.crescimento >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      comparativo.mesAnterior.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(comparativo.mesAnterior.crescimento).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Oportunidades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Oportunidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {receita.percentualProdutos < 20 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">Aumentar Venda de Produtos</p>
                <p className="text-xs text-blue-600 mt-1">
                  Produtos representam apenas {receita.percentualProdutos.toFixed(1)}% da receita. 
                  Considere estratégias para aumentar as vendas.
                </p>
              </div>
            )}
            
            {produtos.margemMedia < 30 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">Melhorar Margem</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Margem média de {produtos.margemMedia.toFixed(1)}% pode ser otimizada. 
                  Revise preços ou custos dos produtos.
                </p>
              </div>
            )}
            
            {produtos.quantidadeItens > 0 && produtos.maisVendidos.length < 5 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Diversificar Portfólio</p>
                <p className="text-xs text-green-600 mt-1">
                  Poucos produtos sendo vendidos. Considere ampliar o catálogo 
                  ou promover produtos menos vendidos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}