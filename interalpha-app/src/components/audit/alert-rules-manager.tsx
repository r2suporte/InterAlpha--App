'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Plus, Settings, Play, Pause } from 'lucide-react'

export function AlertRulesManager() {
  const mockRules = [
    {
      id: '1',
      name: 'Múltiplas Tentativas de Login Falhadas',
      description: 'Alerta quando há mais de 5 tentativas de login falhadas em 15 minutos',
      enabled: true,
      triggerCount: 12,
      lastTriggered: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Eventos Críticos de Segurança',
      description: 'Alerta imediato para eventos de segurança críticos',
      enabled: true,
      triggerCount: 3,
      lastTriggered: '2024-01-14T15:45:00Z'
    },
    {
      id: '3',
      name: 'Acesso Fora do Horário Comercial',
      description: 'Alerta para acessos entre 22h e 6h',
      enabled: false,
      triggerCount: 0,
      lastTriggered: null
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Regras de Alerta Ativas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as regras de alerta do sistema
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      <div className="space-y-4">
        {mockRules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{rule.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rule.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                    {rule.enabled ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Disparos: {rule.triggerCount}</span>
                  {rule.lastTriggered && (
                    <span>
                      Último: {new Date(rule.lastTriggered).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Configurar
                  </Button>
                  <Button variant="outline" size="sm">
                    {rule.enabled ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Ativar
                      </>
                    )}
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