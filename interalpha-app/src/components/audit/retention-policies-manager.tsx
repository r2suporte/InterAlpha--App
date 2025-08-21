'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, Plus, Settings, Play, Calendar } from 'lucide-react'

export function RetentionPoliciesManager() {
  const mockPolicies = [
    {
      id: '1',
      name: 'Política Padrão - Logs de Auditoria',
      description: 'Política padrão de retenção para logs de auditoria (365 dias)',
      dataType: 'audit_logs',
      retentionDays: 365,
      deleteAfterDays: 365,
      enabled: true,
      lastExecuted: '2024-01-15T02:00:00Z'
    },
    {
      id: '2',
      name: 'Política Padrão - Logs de Acesso',
      description: 'Política padrão de retenção para logs de acesso (180 dias)',
      dataType: 'access_logs',
      retentionDays: 180,
      deleteAfterDays: 180,
      enabled: true,
      lastExecuted: '2024-01-15T02:00:00Z'
    },
    {
      id: '3',
      name: 'Política Padrão - Eventos de Segurança',
      description: 'Política padrão de retenção para eventos de segurança (730 dias)',
      dataType: 'security_events',
      retentionDays: 730,
      deleteAfterDays: 730,
      enabled: true,
      lastExecuted: '2024-01-15T02:00:00Z'
    }
  ]

  const getDataTypeLabel = (dataType: string) => {
    switch (dataType) {
      case 'audit_logs': return 'Logs de Auditoria'
      case 'access_logs': return 'Logs de Acesso'
      case 'security_events': return 'Eventos de Segurança'
      default: return dataType
    }
  }

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'audit_logs': return 'default'
      case 'access_logs': return 'secondary'
      case 'security_events': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Políticas de Retenção</h3>
          <p className="text-sm text-muted-foreground">
            Configure a retenção e exclusão automática de dados
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Política
        </Button>
      </div>

      <div className="space-y-4">
        {mockPolicies.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>{policy.name}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {policy.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getDataTypeColor(policy.dataType) as any}>
                    {getDataTypeLabel(policy.dataType)}
                  </Badge>
                  <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                    {policy.enabled ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {policy.retentionDays}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dias de Retenção
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {policy.deleteAfterDays}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dias para Exclusão
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {policy.lastExecuted 
                      ? new Date(policy.lastExecuted).toLocaleDateString('pt-BR')
                      : 'Nunca'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Última Execução
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Próxima execução: {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Configurar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Executar Agora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}