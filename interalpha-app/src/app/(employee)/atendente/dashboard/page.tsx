'use client'

import { useState, useEffect } from 'react'
import { EmployeeDashboardLayout } from '@/components/employee/employee-dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  Plus, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface DashboardStats {
  totalClientes: number
  ordensAbertas: number
  ordensHoje: number
  chamadosAtivos: number
}

interface OrdemServico {
  id: string
  titulo: string
  cliente: {
    nome: string
    telefone?: string
  }
  status: string
  prioridade: string
  createdAt: string
}

export default function AtendenteDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    ordensAbertas: 0,
    ordensHoje: 0,
    chamadosAtivos: 0
  })
  const [recentOrders, setRecentOrders] = useState<OrdemServico[]>([])
  const [loading, setLoading] = useState(true)

  const navigation = [
    {
      label: 'Dashboard',
      href: '/employee/atendente/dashboard',
      icon: <TrendingUp className="h-4 w-4" />,
      permissions: ['atendente.dashboard']
    },
    {
      label: 'Clientes',
      href: '/employee/atendente/clientes',
      icon: <Users className="h-4 w-4" />,
      permissions: ['atendente.clientes']
    },
    {
      label: 'Ordens de Serviço',
      href: '/employee/atendente/ordens',
      icon: <FileText className="h-4 w-4" />,
      permissions: ['atendente.ordens'],
      badge: stats.ordensAbertas.toString()
    },
    {
      label: 'Chat de Suporte',
      href: '/employee/atendente/chat',
      icon: <MessageCircle className="h-4 w-4" />,
      permissions: ['atendente.chat'],
      badge: stats.chamadosAtivos > 0 ? stats.chamadosAtivos.toString() : undefined
    },
    {
      label: 'Agenda',
      href: '/employee/atendente/agenda',
      icon: <Calendar className="h-4 w-4" />,
      permissions: ['atendente.agenda']
    }
  ]

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('employee_token')
      if (!token) return

      // Carregar estatísticas
      const statsResponse = await fetch('/api/employee/atendente/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Carregar ordens recentes
      const ordersResponse = await fetch('/api/employee/atendente/orders/recent', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setRecentOrders(ordersData)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = () => {
    window.location.href = '/employee/atendente/ordens/nova'
  }

  const handleCreateClient = () => {
    window.location.href = '/employee/atendente/clientes/novo'
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'PENDENTE': { variant: 'secondary' as const, icon: Clock, className: '' },
      'EM_ANDAMENTO': { variant: 'default' as const, icon: Clock, className: '' },
      'CONCLUIDA': { variant: 'success' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      'CANCELADA': { variant: 'destructive' as const, icon: AlertCircle, className: '' }
    }

    const config = statusMap[status as keyof typeof statusMap] || { variant: 'secondary' as const, icon: Clock, className: '' }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'ALTA': return 'text-red-600'
      case 'MEDIA': return 'text-yellow-600'
      case 'BAIXA': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <EmployeeDashboardLayout 
        navigation={navigation} 
        title="Dashboard do Atendente"
        subtitle="Visão geral das suas atividades"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </EmployeeDashboardLayout>
    )
  }

  return (
    <EmployeeDashboardLayout 
      navigation={navigation} 
      title="Dashboard do Atendente"
      subtitle="Visão geral das suas atividades"
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleCreateOrder} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Nova Ordem de Serviço
          </Button>
          <Button variant="outline" onClick={handleCreateClient} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ordens Abertas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.ordensAbertas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ordens Hoje</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.ordensHoje}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chamados Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.chamadosAtivos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Ordens de Serviço Recentes</CardTitle>
            <CardDescription>
              Últimas ordens criadas ou atualizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma ordem encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Crie uma nova ordem de serviço para começar
                </p>
                <Button onClick={handleCreateOrder}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ordem
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((ordem) => (
                  <div key={ordem.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{ordem.titulo}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Cliente: {ordem.cliente.nome}
                        </p>
                        
                        <div className="flex items-center space-x-4 mt-3">
                          {getStatusBadge(ordem.status)}
                          
                          <span className={`text-sm font-medium ${getPriorityColor(ordem.prioridade)}`}>
                            {ordem.prioridade}
                          </span>
                          
                          <span className="text-sm text-gray-500">
                            {formatDate(ordem.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {ordem.cliente.telefone && (
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Gerenciar Clientes</h3>
              <p className="text-sm text-gray-600">
                Visualizar, editar e criar novos clientes
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Chat de Suporte</h3>
              <p className="text-sm text-gray-600">
                Atender chamados e conversar com clientes
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Agenda</h3>
              <p className="text-sm text-gray-600">
                Visualizar agendamentos e compromissos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </EmployeeDashboardLayout>
  )
}