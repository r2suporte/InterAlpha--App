'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, CheckCircle, AlertCircle, Plus, Settings, Trash2, RefreshCw, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface CalendarIntegration {
  id: string
  googleCalendarId: string
  displayName: string
  isActive: boolean
  syncEnabled: boolean
  lastSyncAt: string | null
  createdAt: string
  config: {
    syncDirection: 'import' | 'export' | 'bidirectional'
    eventTypes: string[]
    autoCreateEvents: boolean
    conflictResolution: 'skip' | 'overwrite' | 'merge'
    reminderSettings: {
      enabled: boolean
      defaultMinutes: number
      methods: string[]
    }
  }
}

interface AvailabilityCheck {
  startTime: string
  endTime: string
}

export function CalendarIntegrationsManager() {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [availabilityCheck, setAvailabilityCheck] = useState<AvailabilityCheck>({
    startTime: '',
    endTime: ''
  })
  const [availabilityResult, setAvailabilityResult] = useState<any>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/calendar/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data)
      }
    } catch (error) {
      console.error('Erro ao carregar integrações:', error)
      toast.error('Erro ao carregar integrações de calendário')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectGoogle = async () => {
    setIsConnecting(true)
    
    try {
      const response = await fetch('/api/calendar/auth')
      if (response.ok) {
        const { authUrl } = await response.json()
        window.location.href = authUrl
      } else {
        toast.error('Erro ao iniciar conexão com Google Calendar')
      }
    } catch (error) {
      console.error('Erro ao conectar com Google:', error)
      toast.error('Erro ao conectar com Google Calendar')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleToggleIntegration = async (integrationId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/calendar/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          integrationId,
          isActive
        })
      })

      if (response.ok) {
        toast.success(`Integração ${isActive ? 'ativada' : 'desativada'} com sucesso`)
        loadIntegrations()
      } else {
        toast.error('Erro ao alterar status da integração')
      }
    } catch (error) {
      console.error('Erro ao alterar integração:', error)
      toast.error('Erro ao alterar integração')
    }
  }

  const handleRemoveIntegration = async (integrationId: string) => {
    if (!confirm('Tem certeza que deseja remover esta integração?')) return

    try {
      const response = await fetch('/api/calendar/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          integrationId
        })
      })

      if (response.ok) {
        toast.success('Integração removida com sucesso')
        loadIntegrations()
      } else {
        toast.error('Erro ao remover integração')
      }
    } catch (error) {
      console.error('Erro ao remover integração:', error)
      toast.error('Erro ao remover integração')
    }
  }

  const handleSyncAll = async () => {
    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all' })
      })

      if (response.ok) {
        toast.success('Sincronização iniciada com sucesso')
        loadIntegrations()
      } else {
        toast.error('Erro ao iniciar sincronização')
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      toast.error('Erro ao sincronizar eventos')
    }
  }

  const handleCheckAvailability = async () => {
    if (!availabilityCheck.startTime || !availabilityCheck.endTime) {
      toast.error('Preencha os horários de início e fim')
      return
    }

    setCheckingAvailability(true)
    
    try {
      const response = await fetch('/api/calendar/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availabilityCheck)
      })

      if (response.ok) {
        const result = await response.json()
        setAvailabilityResult(result)
      } else {
        toast.error('Erro ao verificar disponibilidade')
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error)
      toast.error('Erro ao verificar disponibilidade')
    } finally {
      setCheckingAvailability(false)
    }
  }

  const getSyncDirectionBadge = (direction: string) => {
    switch (direction) {
      case 'import':
        return <Badge variant="secondary">Importar</Badge>
      case 'export':
        return <Badge variant="outline">Exportar</Badge>
      case 'bidirectional':
        return <Badge variant="default">Bidirecional</Badge>
      default:
        return <Badge variant="secondary">{direction}</Badge>
    }
  }

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Nunca'
    
    const date = new Date(lastSyncAt)
    return date.toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrações de Calendário</h2>
          <p className="text-gray-600">Gerencie sincronização com Google Calendar</p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleSyncAll} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar Tudo
          </Button>
          
          <Button onClick={handleConnectGoogle} disabled={isConnecting}>
            <Plus className="h-4 w-4 mr-2" />
            {isConnecting ? 'Conectando...' : 'Conectar Google Calendar'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="availability">Verificar Disponibilidade</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma integração configurada</h3>
                <p className="text-gray-600 text-center mb-4">
                  Conecte seu Google Calendar para sincronizar eventos automaticamente
                </p>
                <Button onClick={handleConnectGoogle} disabled={isConnecting}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isConnecting ? 'Conectando...' : 'Conectar Google Calendar'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        {integration.displayName}
                      </CardTitle>
                      <Switch
                        checked={integration.isActive}
                        onCheckedChange={(checked) => 
                          handleToggleIntegration(integration.id, checked)
                        }
                      />
                    </div>
                    <CardDescription>Google Calendar</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      {integration.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sincronização:</span>
                      {getSyncDirectionBadge(integration.config.syncDirection)}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Última sync:</span>
                      <span className="font-medium text-xs">
                        {formatLastSync(integration.lastSyncAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Auto-criar eventos:</span>
                      {integration.config.autoCreateEvents ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-4 w-4 mr-1" />
                        Config
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveIntegration(integration.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Verificar Disponibilidade
              </CardTitle>
              <CardDescription>
                Verifique se há conflitos em um horário específico
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Início
                  </label>
                  <input
                    type="datetime-local"
                    value={availabilityCheck.startTime}
                    onChange={(e) => setAvailabilityCheck({
                      ...availabilityCheck,
                      startTime: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fim
                  </label>
                  <input
                    type="datetime-local"
                    value={availabilityCheck.endTime}
                    onChange={(e) => setAvailabilityCheck({
                      ...availabilityCheck,
                      endTime: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <Button 
                onClick={handleCheckAvailability}
                disabled={checkingAvailability}
                className="w-full"
              >
                {checkingAvailability ? 'Verificando...' : 'Verificar Disponibilidade'}
              </Button>

              {availabilityResult && (
                <div className="mt-4 p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    {availabilityResult.available ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className="font-medium">
                      {availabilityResult.available ? 'Disponível' : 'Conflito detectado'}
                    </span>
                  </div>
                  
                  {!availabilityResult.available && availabilityResult.conflicts.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Eventos conflitantes:</p>
                      <ul className="text-sm space-y-1">
                        {availabilityResult.conflicts.map((conflict: string, index: number) => (
                          <li key={index} className="text-red-600">• {conflict}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}