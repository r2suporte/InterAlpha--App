'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Apple, Building, AlertTriangle, Calendar, CheckCircle } from 'lucide-react'
import { GarantiaServico } from '@/types/ordem-servico-apple'

interface GarantiaCardProps {
  garantia: GarantiaServico
  className?: string
}

export function GarantiaCard({ garantia, className }: GarantiaCardProps) {
  const getGarantiaIcon = () => {
    switch (garantia.tipo) {
      case 'Garantia Apple':
        return <Apple className="h-5 w-5 text-gray-600" />
      case 'Garantia InterAlpha':
        return <Building className="h-5 w-5 text-blue-600" />
      case 'Fora de Garantia':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default:
        return <Shield className="h-5 w-5 text-gray-600" />
    }
  }

  const getGarantiaColor = () => {
    switch (garantia.tipo) {
      case 'Garantia Apple':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'Garantia InterAlpha':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Fora de Garantia':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const isGarantiaAtiva = () => {
    const hoje = new Date()
    return garantia.dataFim > hoje
  }

  const diasRestantes = () => {
    const hoje = new Date()
    const diff = garantia.dataFim.getTime() - hoje.getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getGarantiaIcon()}
            <span className="text-lg">Garantia</span>
          </div>
          <Badge className={getGarantiaColor()}>
            {garantia.tipo}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Garantia */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {isGarantiaAtiva() ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <span className="font-medium">
              {isGarantiaAtiva() ? 'Garantia Ativa' : 'Garantia Expirada'}
            </span>
          </div>
          <span className={`text-sm ${isGarantiaAtiva() ? 'text-green-600' : 'text-red-600'}`}>
            {isGarantiaAtiva() ? `${diasRestantes()} dias restantes` : 'Expirada'}
          </span>
        </div>

        {/* Período */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Período</label>
            <p className="text-sm">{garantia.periodo} dias</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Data de Fim</label>
            <p className="text-sm">{garantia.dataFim.toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Informações específicas por tipo de garantia */}
        {garantia.tipo === 'Garantia Apple' && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Apple className="h-4 w-4" />
              Garantia Apple
            </h4>
            {garantia.dataCompraDispositivo && (
              <div>
                <label className="text-xs font-medium text-gray-600">Data de Compra</label>
                <p className="text-sm">{garantia.dataCompraDispositivo.toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            {garantia.statusGarantiaApple && (
              <div>
                <label className="text-xs font-medium text-gray-600">Status Apple</label>
                <Badge 
                  variant={garantia.statusGarantiaApple === 'Ativa' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {garantia.statusGarantiaApple}
                </Badge>
              </div>
            )}
            {garantia.numeroSerieApple && (
              <div>
                <label className="text-xs font-medium text-gray-600">Número de Série</label>
                <p className="text-sm font-mono">{garantia.numeroSerieApple}</p>
              </div>
            )}
          </div>
        )}

        {garantia.tipo === 'Garantia InterAlpha' && garantia.servicoInterAlpha && (
          <div className="bg-blue-50 p-3 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-900 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Garantia InterAlpha
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <label className="text-xs font-medium text-blue-600">O.S. Anterior</label>
                <p className="font-mono">{garantia.servicoInterAlpha.numeroOS}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-blue-600">Data do Serviço</label>
                <p>{garantia.servicoInterAlpha.dataServico.toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-blue-600">Tipo de Serviço</label>
                <p>{garantia.servicoInterAlpha.tipoServico}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-blue-600">Técnico</label>
                <p>{garantia.servicoInterAlpha.tecnicoResponsavel}</p>
              </div>
            </div>
          </div>
        )}

        {garantia.tipo === 'Fora de Garantia' && (
          <div className="bg-orange-50 p-3 rounded-lg">
            <h4 className="font-medium text-orange-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Fora de Garantia
            </h4>
            <p className="text-sm text-orange-700 mt-1">
              Este dispositivo não possui garantia ativa. Todos os custos de reparo serão por conta do cliente.
            </p>
          </div>
        )}

        {/* Coberturas */}
        {garantia.coberturas.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-600">Coberturas</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {garantia.coberturas.map((cobertura, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {cobertura}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Exclusões */}
        {garantia.exclusoes.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-600">Exclusões</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {garantia.exclusoes.map((exclusao, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {exclusao}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Condições */}
        {garantia.condicoes.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-600">Condições</label>
            <ul className="text-xs text-gray-600 mt-1 space-y-1">
              {garantia.condicoes.map((condicao, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-gray-400">•</span>
                  <span>{condicao}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}