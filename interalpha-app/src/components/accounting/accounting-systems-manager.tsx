'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertCircle, CheckCircle, Plus, Settings, Trash2, TestTube } from 'lucide-react'
import { toast } from 'sonner'

interface AccountingSystem {
  id: string
  name: string
  type: string
  baseUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  config: any
  _count: {
    syncRecords: number
  }
}

interface SyncRecord {
  id: string
  entityType: string
  entityId: string
  status: string
  lastSyncAt: string | null
  errorMessage: string | null
  retryCount: number
}

export function AccountingSystemsManager() {
  const [systems, setSystems] = useState<AccountingSystem[]>([])
  const [syncs, setSyncs] = useState<SyncRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [testingSystem, setTestingSystem] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'generic',
    baseUrl: '',
    apiKey: '',
    config: {}
  })

  useEffect(() => {
    loadSystems()
    loadSyncs()
  }, [])

  const loadSystems = async () => {
    try {
      const response = await fetch('/api/accounting/systems')
      if (response.ok) {
        const data = await response.json()
        setSystems(data)
      }
    } catch (error) {
      console.error('Erro ao carregar sistemas:', error)
      toast.error('Erro ao carregar sistemas contábeis')
    }
  }

  const loadSyncs = async () => {
    try {
      const response = await fetch('/api/accounting/sync?limit=50')
      if (response.ok) {
        const data = await response.json()
        setSyncs(data.syncs)
      }
    } catch (error) {
      console.error('Erro ao carregar sincronizações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSystem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/accounting/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Sistema adicionado com sucesso')
        setIsAddDialogOpen(false)
        setFormData({ name: '', type: 'generic', baseUrl: '', apiKey: '', config: {} })
        loadSystems()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao adicionar sistema')
      }
    } catch (error) {
      console.error('Erro ao adicionar sistema:', error)
      toast.error('Erro ao adicionar sistema')
    }
  }

  const handleToggleSystem = async (systemId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/accounting/systems/${systemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        toast.success(`Sistema ${isActive ? 'ativado' : 'desativado'} com sucesso`)
        loadSystems()
      } else {
        toast.error('Erro ao atualizar sistema')
      }
    } catch (error) {
      console.error('Erro ao atualizar sistema:', error)
      toast.error('Erro ao atualizar sistema')
    }
  }

  const handleTestConnection = async (systemId: string) => {
    setTestingSystem(systemId)
    
    try {
      const response = await fetch(`/api/accounting/systems/${systemId}/test`, {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.connected) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error)
      toast.error('Erro ao testar conexão')
    } finally {
      setTestingSystem(null)
    }
  }

  const handleDeleteSystem = async (systemId: string) => {
    if (!confirm('Tem certeza que deseja remover este sistema?')) return

    try {
      const response = await fetch(`/api/accounting/systems/${systemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Sistema removido com sucesso')
        loadSystems()
      } else {
        toast.error('Erro ao remover sistema')
      }
    } catch (error) {
      console.error('Erro ao remover sistema:', error)
      toast.error('Erro ao remover sistema')
    }
  }

  const handleRetryFailedSyncs = async () => {
    try {
      const response = await fetch('/api/accounting/sync/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        loadSyncs()
      } else {
        toast.error('Erro ao reprocessar sincronizações')
      }
    } catch (error) {
      console.error('Erro ao reprocessar sincronizações:', error)
      toast.error('Erro ao reprocessar sincronizações')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sucesso</Badge>
      case 'failed':
        return <Badge variant="destructive">Falha</Badge>
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>
      case 'conflict':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Conflito</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSystemTypeName = (type: string) => {
    switch (type) {
      case 'omie': return 'Omie ERP'
      case 'contabilizei': return 'Contabilizei'
      case 'sage': return 'Sage'
      case 'generic': return 'Sistema Genérico'
      default: return type
    }
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
          <h2 className="text-2xl font-bold">Sistemas Contábeis</h2>
          <p className="text-gray-600">Gerencie integrações com sistemas contábeis</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Sistema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Sistema Contábil</DialogTitle>
              <DialogDescription>
                Configure um novo sistema contábil para sincronização
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddSystem} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Sistema</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Contabilidade Principal"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="omie">Omie ERP</SelectItem>
                    <SelectItem value="contabilizei">Contabilizei</SelectItem>
                    <SelectItem value="sage">Sage</SelectItem>
                    <SelectItem value="generic">Sistema Genérico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'generic' && (
                <div>
                  <Label htmlFor="baseUrl">URL Base da API</Label>
                  <Input
                    id="baseUrl"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="https://api.exemplo.com/v1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="apiKey">Chave da API</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Sua chave de API"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="systems" className="space-y-4">
        <TabsList>
          <TabsTrigger value="systems">Sistemas</TabsTrigger>
          <TabsTrigger value="syncs">Sincronizações</TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="space-y-4">
          {systems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum sistema configurado</h3>
                <p className="text-gray-600 text-center mb-4">
                  Adicione um sistema contábil para começar a sincronizar dados
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Sistema
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {systems.map((system) => (
                <Card key={system.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{system.name}</CardTitle>
                      <Switch
                        checked={system.isActive}
                        onCheckedChange={(checked) => handleToggleSystem(system.id, checked)}
                      />
                    </div>
                    <CardDescription>{getSystemTypeName(system.type)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      {system.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sincronizações:</span>
                      <span className="font-medium">{system._count.syncRecords}</span>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestConnection(system.id)}
                        disabled={testingSystem === system.id}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        {testingSystem === system.id ? 'Testando...' : 'Testar'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSystem(system.id)}
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

        <TabsContent value="syncs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Histórico de Sincronizações</h3>
            <Button onClick={handleRetryFailedSyncs} variant="outline">
              Reprocessar Falhas
            </Button>
          </div>

          {syncs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma sincronização encontrada</h3>
                <p className="text-gray-600 text-center">
                  As sincronizações aparecerão aqui quando forem executadas
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entidade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Última Sincronização
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tentativas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Erro
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {syncs.map((sync) => (
                        <tr key={sync.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {sync.entityType === 'payment' ? 'Pagamento' : 'Fatura'}
                              </div>
                              <div className="text-sm text-gray-500">{sync.entityId}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(sync.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sync.lastSyncAt ? new Date(sync.lastSyncAt).toLocaleString() : 'Nunca'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sync.retryCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            {sync.errorMessage && (
                              <div className="flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="truncate max-w-xs" title={sync.errorMessage}>
                                  {sync.errorMessage}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}