'use client'

/**
 * Componente de mapa da jornada do usuário
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  MousePointer,
  Eye,
  Target
} from 'lucide-react'

interface UserJourneyMapProps {
  className?: string
}

interface JourneyStep {
  id: string
  name: string
  description: string
  status: 'completed' | 'in-progress' | 'blocked' | 'pending'
  metrics: {
    users: number
    conversionRate: number
    avgTime: string
    dropoffRate: number
  }
  issues?: string[]
}

export function UserJourneyMap({ className }: UserJourneyMapProps) {
  // Mock data - substituir por dados reais
  const journeySteps: JourneyStep[] = [
    {
      id: '1',
      name: 'Descoberta',
      description: 'Usuário descobre o sistema',
      status: 'completed',
      metrics: {
        users: 1250,
        conversionRate: 85,
        avgTime: '2m 30s',
        dropoffRate: 15
      }
    },
    {
      id: '2',
      name: 'Registro',
      description: 'Criação de conta',
      status: 'in-progress',
      metrics: {
        users: 1063,
        conversionRate: 72,
        avgTime: '4m 15s',
        dropoffRate: 28
      },
      issues: ['Formulário muito longo', 'Validação de email lenta']
    },
    {
      id: '3',
      name: 'Onboarding',
      description: 'Primeiro uso do sistema',
      status: 'blocked',
      metrics: {
        users: 765,
        conversionRate: 58,
        avgTime: '8m 45s',
        dropoffRate: 42
      },
      issues: ['Tutorial confuso', 'Muitas etapas', 'Interface complexa']
    },
    {
      id: '4',
      name: 'Primeiro Valor',
      description: 'Usuário obtém primeiro resultado',
      status: 'pending',
      metrics: {
        users: 443,
        conversionRate: 35,
        avgTime: '12m 20s',
        dropoffRate: 65
      },
      issues: ['Funcionalidades não claras', 'Falta de orientação']
    },
    {
      id: '5',
      name: 'Adoção',
      description: 'Uso regular do sistema',
      status: 'completed',
      metrics: {
        users: 312,
        conversionRate: 89,
        avgTime: '25m 10s',
        dropoffRate: 11
      }
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500" />
      case 'blocked': return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />
      default: return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Jornada do Usuário</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {journeySteps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="flex items-start space-x-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(step.status)}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{step.name}</h3>
                        <Badge className={getStatusColor(step.status)}>
                          {step.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{step.metrics.users.toLocaleString()} usuários</span>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{step.description}</p>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">Conversão</span>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {step.metrics.conversionRate}%
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">Tempo Médio</span>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {step.metrics.avgTime}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Eye className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium">Usuários</span>
                        </div>
                        <div className="text-lg font-bold text-purple-600">
                          {step.metrics.users.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium">Abandono</span>
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          {step.metrics.dropoffRate}%
                        </div>
                      </div>
                    </div>

                    {/* Issues */}
                    {step.issues && step.issues.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-800">Problemas Identificados</span>
                        </div>
                        <ul className="space-y-1">
                          {step.issues.map((issue, issueIndex) => (
                            <li key={issueIndex} className="text-sm text-red-700 flex items-center space-x-2">
                              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow to next step */}
                {index < journeySteps.length - 1 && (
                  <div className="flex justify-center mt-4 mb-2">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((journeySteps[journeySteps.length - 1].metrics.users / journeySteps[0].metrics.users) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa de Conversão Geral</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {journeySteps.reduce((acc, step) => acc + parseFloat(step.metrics.avgTime), 0).toFixed(0)}m
                </div>
                <div className="text-sm text-muted-foreground">Tempo Total Médio</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {journeySteps.filter(step => step.issues && step.issues.length > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Etapas com Problemas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}