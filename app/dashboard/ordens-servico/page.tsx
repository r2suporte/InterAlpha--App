'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar, 
  DollarSign, 
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  endereco: string
  created_at: string
}

interface OrdemServico {
  id: string
  numero_os: string
  cliente_id: string
  descricao: string
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
  valor: number
  data_inicio: string
  data_fim?: string
  created_at: string
  cliente?: Cliente
}

interface FormData {
  numero_os: string
  cliente_id: string
  descricao: string
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
  valor: string
  data_inicio: string
  data_fim: string
}

export default function OrdensServicoPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrdem, setEditingOrdem] = useState<OrdemServico | null>(null)
  const [formData, setFormData] = useState<FormData>({
    numero_os: '',
    cliente_id: '',
    descricao: '',
    status: 'pendente',
    valor: '',
    data_inicio: '',
    data_fim: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    fetchData()
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Buscar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('nome')

      if (clientesError) throw clientesError
      setClientes(clientesData || [])

      // Buscar ordens de serviço com dados do cliente
      const { data: ordensData, error: ordensError } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          cliente:clientes(*)
        `)
        .order('created_at', { ascending: false })

      if (ordensError) throw ordensError
      setOrdens(ordensData || [])
    } catch (error: any) {
      setError('Erro ao carregar dados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const baseData = {
        cliente_id: formData.cliente_id,
        descricao: formData.descricao,
        status: formData.status,
        valor: parseFloat(formData.valor),
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim || null
      }

      if (editingOrdem) {
        // Para edição, incluir numero_os
        const ordemData = {
          ...baseData,
          numero_os: formData.numero_os
        }
        
        const { error } = await supabase
          .from('ordens_servico')
          .update(ordemData)
          .eq('id', editingOrdem.id)

        if (error) throw error
        setSuccess('Ordem de serviço atualizada com sucesso!')
      } else {
        // Para criação, não incluir numero_os (será gerado automaticamente)
        const { error } = await supabase
          .from('ordens_servico')
          .insert([baseData])

        if (error) throw error
        setSuccess('Ordem de serviço criada com sucesso!')
      }

      setIsModalOpen(false)
      setEditingOrdem(null)
      setFormData({
        numero_os: '',
        cliente_id: '',
        descricao: '',
        status: 'pendente',
        valor: '',
        data_inicio: '',
        data_fim: ''
      })
      fetchData()
    } catch (error: any) {
      setError('Erro ao salvar ordem de serviço: ' + error.message)
    }
  }

  const handleEdit = (ordem: OrdemServico) => {
    setEditingOrdem(ordem)
    setFormData({
      numero_os: ordem.numero_os,
      cliente_id: ordem.cliente_id,
      descricao: ordem.descricao,
      status: ordem.status,
      valor: ordem.valor.toString(),
      data_inicio: ordem.data_inicio.split('T')[0],
      data_fim: ordem.data_fim ? ordem.data_fim.split('T')[0] : ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ordem de serviço?')) return

    try {
      const { error } = await supabase
        .from('ordens_servico')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSuccess('Ordem de serviço excluída com sucesso!')
      fetchData()
    } catch (error: any) {
      setError('Erro ao excluir ordem de serviço: ' + error.message)
    }
  }

  const openCreateModal = () => {
    setEditingOrdem(null)
    setFormData({
      numero_os: '',
      cliente_id: '',
      descricao: '',
      status: 'pendente',
      valor: '',
      data_inicio: '',
      data_fim: ''
    })
    setIsModalOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-4 w-4" />
      case 'em_andamento':
        return <AlertCircle className="h-4 w-4" />
      case 'concluida':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelada':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'concluida':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredOrdens = ordens.filter(ordem =>
    ordem.numero_os.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ordem.cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ordem.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: ordens.length,
    pendentes: ordens.filter(o => o.status === 'pendente').length,
    em_andamento: ordens.filter(o => o.status === 'em_andamento').length,
    concluidas: ordens.filter(o => o.status === 'concluida').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-gray-600 mt-1">Gerencie suas ordens de serviço</p>
        </div>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova OS
        </Button>
      </div>

      {/* Mensagens de erro e sucesso */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-600">{stats.em_andamento}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{stats.concluidas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de pesquisa */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Pesquisar por número da OS, cliente ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de ordens de serviço */}
      <div className="space-y-4">
        {filteredOrdens.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhuma ordem encontrada' : 'Nenhuma ordem de serviço cadastrada'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Tente ajustar os termos de pesquisa'
                  : 'Comece criando sua primeira ordem de serviço'
                }
              </p>
              {!searchTerm && (
                <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira OS
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredOrdens.map((ordem) => (
            <Card key={ordem.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        OS #{ordem.numero_os}
                      </h3>
                      <Badge className={`flex items-center gap-1 ${getStatusColor(ordem.status)}`}>
                        {getStatusIcon(ordem.status)}
                        {ordem.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{ordem.cliente?.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>R$ {ordem.valor.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(ordem.data_inicio).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{ordem.descricao}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ordem)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ordem.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingOrdem ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
            </DialogTitle>
            <DialogDescription>
              {editingOrdem 
                ? 'Atualize as informações da ordem de serviço'
                : 'Preencha os dados para criar uma nova ordem de serviço'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editingOrdem && (
                <div className="space-y-2">
                  <Label htmlFor="numero_os">Número da OS</Label>
                  <Input
                    id="numero_os"
                    type="text"
                    value={formData.numero_os}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cliente_id">Cliente</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada') => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim">Data de Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingOrdem ? 'Atualizar' : 'Criar'} OS
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}