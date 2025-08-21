'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { calculateProfitMargin, formatCurrency, formatPercentage, getMarginStatus } from '@/lib/utils/product-utils'
import { MARGIN_COLORS } from '@/lib/constants/products'

interface PriceCalculatorProps {
  initialCostPrice?: number
  initialSalePrice?: number
  onPricesChange?: (costPrice: number, salePrice: number, margin: number) => void
  disabled?: boolean
  showCard?: boolean
}

export default function PriceCalculator({
  initialCostPrice = 0,
  initialSalePrice = 0,
  onPricesChange,
  disabled = false,
  showCard = true
}: PriceCalculatorProps) {
  const [costPrice, setCostPrice] = useState(initialCostPrice)
  const [salePrice, setSalePrice] = useState(initialSalePrice)
  const [margin, setMargin] = useState(0)
  const [profitAmount, setProfitAmount] = useState(0)
  const [marginStatus, setMarginStatus] = useState<'positive' | 'negative' | 'zero'>('zero')

  // Recalcular quando os preços mudarem
  useEffect(() => {
    if (costPrice > 0 && salePrice > 0) {
      const calculatedMargin = calculateProfitMargin(costPrice, salePrice)
      const calculatedProfit = salePrice - costPrice
      const status = getMarginStatus(calculatedMargin)

      setMargin(calculatedMargin)
      setProfitAmount(calculatedProfit)
      setMarginStatus(status)

      // Notificar componente pai
      onPricesChange?.(costPrice, salePrice, calculatedMargin)
    } else {
      setMargin(0)
      setProfitAmount(0)
      setMarginStatus('zero')
      onPricesChange?.(costPrice, salePrice, 0)
    }
  }, [costPrice, salePrice, onPricesChange])

  // Atualizar quando props iniciais mudarem
  useEffect(() => {
    setCostPrice(initialCostPrice)
    setSalePrice(initialSalePrice)
  }, [initialCostPrice, initialSalePrice])

  const handleCostPriceChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setCostPrice(numValue)
  }

  const handleSalePriceChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setSalePrice(numValue)
  }

  const getMarginIcon = () => {
    switch (marginStatus) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getMarginBadge = () => {
    const colorClass = MARGIN_COLORS[marginStatus]
    
    return (
      <Badge className={`${colorClass} flex items-center gap-1`}>
        {getMarginIcon()}
        {formatPercentage(margin)}
      </Badge>
    )
  }

  const getMarginMessage = () => {
    if (costPrice <= 0 || salePrice <= 0) {
      return 'Insira os preços para calcular a margem'
    }

    if (marginStatus === 'negative') {
      return 'Preço de venda menor que o custo - prejuízo!'
    }

    if (marginStatus === 'zero') {
      return 'Sem margem de lucro - vendendo pelo preço de custo'
    }

    if (margin < 10) {
      return 'Margem baixa - considere aumentar o preço de venda'
    }

    if (margin < 20) {
      return 'Margem razoável - pode ser melhorada'
    }

    if (margin < 50) {
      return 'Boa margem de lucro'
    }

    return 'Excelente margem de lucro!'
  }

  const content = (
    <div className="space-y-4">
      {/* Inputs de Preços */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="costPrice">Preço de Custo</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
            <Input
              id="costPrice"
              type="number"
              step="0.01"
              min="0"
              value={costPrice || ''}
              onChange={(e) => handleCostPriceChange(e.target.value)}
              disabled={disabled}
              className="pl-10"
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salePrice">Preço de Venda</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
            <Input
              id="salePrice"
              type="number"
              step="0.01"
              min="0"
              value={salePrice || ''}
              onChange={(e) => handleSalePriceChange(e.target.value)}
              disabled={disabled}
              className="pl-10"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      {/* Resultados dos Cálculos */}
      {(costPrice > 0 || salePrice > 0) && (
        <div className="space-y-3 p-4 bg-gradient-to-r from-gray-50/50 to-transparent rounded-xl border border-gray-100/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Margem de Lucro:</span>
            {getMarginBadge()}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Lucro por Unidade:</span>
            <span className={`font-semibold ${
              profitAmount > 0 ? 'text-green-600' : 
              profitAmount < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {formatCurrency(profitAmount)}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className={`text-xs ${
              marginStatus === 'negative' ? 'text-red-600' :
              marginStatus === 'zero' ? 'text-yellow-600' :
              margin < 20 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {getMarginMessage()}
            </p>
          </div>
        </div>
      )}

      {/* Sugestões de Preços */}
      {costPrice > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">Sugestões de Preço:</Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSalePrice(costPrice * 1.2)}
              disabled={disabled}
              className="p-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              +20%<br />
              <span className="font-semibold">{formatCurrency(costPrice * 1.2)}</span>
            </button>
            <button
              type="button"
              onClick={() => setSalePrice(costPrice * 1.5)}
              disabled={disabled}
              className="p-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              +50%<br />
              <span className="font-semibold">{formatCurrency(costPrice * 1.5)}</span>
            </button>
            <button
              type="button"
              onClick={() => setSalePrice(costPrice * 2)}
              disabled={disabled}
              className="p-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors disabled:opacity-50"
            >
              +100%<br />
              <span className="font-semibold">{formatCurrency(costPrice * 2)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (!showCard) {
    return content
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          Calculadora de Preços
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}