'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Wrench, 
  CreditCard, 
  TrendingUp, 
  Search, 
  Filter,
  Plus,
  MessageSquare,
  Calendar,
  Bell,
  Settings,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

// Mock data for demonstration
const mockClients = [
  { id: 1, name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-9999', status: 'active' },
  { id: 2, name: 'Maria Oliveira', email: 'maria@email.com', phone: '(21) 98888-8888', status: 'active' },
  { id: 3, name: 'Carlos Souza', email: 'carlos@email.com', phone: '(31) 97777-7777', status: 'inactive' },
]

const mockServiceOrders = [
  { id: 101, clientId: 1, clientName: 'João Silva', title: 'Reparo de Notebook', status: 'open', priority: 'high', createdAt: '2023-06-15' },
  { id: 102, clientId: 2, clientName: 'Maria Oliveira', title: 'Manutenção Preventiva', status: 'in_progress', priority: 'medium', createdAt: '2023-06-10' },
  { id: 103, clientId: 1, clientName: 'João Silva', title: 'Troca de Bateria', status: 'completed', priority: 'low', createdAt: '2023-06-05' },
]

const mockPayments = [
  { id: 1001, clientId: 1, clientName: 'João Silva', amount: 250.00, status: 'paid', date: '2023-06-15' },
  { id: 1002, clientId: 2, clientName: 'Maria Oliveira', amount: 180.50, status: 'pending', date: '2023-06-12' },
]

export default function AgentFrontend() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [clients, setClients] = useState(mockClients)
  const [serviceOrders, setServiceOrders] = useState(mockServiceOrders)
  const [payments, setPayments] = useState(mockPayments)
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' })
  const [newServiceOrder, setNewServiceOrder] = useState({ 
    clientId: '', 
    title: '', 
    description: '', 
    priority: 'medium' 
  })

  // Filter clients based on search term
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter service orders based on search term and status
  const filteredServiceOrders = serviceOrders.filter(order => {
    const matchesSearch = order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleAddClient = () => {
    if (newClient.name && newClient.email) {
      const client = {
        id: clients.length + 1,
        ...newClient,
        status: 'active'
      }
      setClients([...clients, client])
      setNewClient({ name: '', email: '', phone: '' })
    }
  }

  const handleAddServiceOrder = () => {
    if (newServiceOrder.clientId && newServiceOrder.title) {
      const client = clients.find(c => c.id === parseInt(newServiceOrder.clientId))
      if (client) {
        const order = {
          id: serviceOrders.length + 101,
          clientId: parseInt(newServiceOrder.clientId),
          clientName: client.name,
          title: newServiceOrder.title,
          description: newServiceOrder.description,
          priority: newServiceOrder.priority,
          status: 'open',
          createdAt: new Date().toISOString().split('T')[0]
        }
        setServiceOrders([...serviceOrders, order])
        setNewServiceOrder({ clientId: '', title: '', description: '', priority: 'medium' })
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Ativo</Badge>
      case 'inactive': return <Badge variant="secondary">Inativo</Badge>
      case 'open': return <Badge variant="default">Aberto</Badge>
      case 'in_progress': return <Badge variant="outline">Em Andamento</Badge>
      case 'completed': return <Badge variant="secondary">Concluído</Badge>
      case 'paid': return <Badge variant="default">Pago</Badge>
      case 'pending': return <Badge variant="destructive">Pendente</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">Alta</Badge>
      case 'medium': return <Badge variant="default">Média</Badge>
      case 'low': return <Badge variant="secondary">Baixa</Badge>
      default: return <Badge variant="secondary">{priority}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IA</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">InterAlpha Agent</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Buscar..." 
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5 text-gray-600" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} alt={user?.firstName || 'User'} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium text-gray-700">
                {user?.firstName || 'Agente'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 w-64 fixed md:static h-full z-40 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          </div>
          <nav className="p-2">
            <Button 
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} 
              className="w-full justify-start mb-1"
              onClick={() => setActiveTab('dashboard')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button 
              variant={activeTab === 'clients' ? 'secondary' : 'ghost'} 
              className="w-full justify-start mb-1"
              onClick={() => setActiveTab('clients')}
            >
              <Users className="mr-2 h-4 w-4" />
              Clientes
            </Button>
            <Button 
              variant={activeTab === 'service-orders' ? 'secondary' : 'ghost'} 
              className="w-full justify-start mb-1"
              onClick={() => setActiveTab('service-orders')}
            >
              <Wrench className="mr-2 h-4 w-4" />
              Ordens de Serviço
            </Button>
            <Button 
              variant={activeTab === 'payments' ? 'secondary' : 'ghost'} 
              className="w-full justify-start mb-1"
              onClick={() => setActiveTab('payments')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pagamentos
            </Button>
            <Button 
              variant={activeTab === 'messages' ? 'secondary' : 'ghost'} 
              className="w-full justify-start mb-1"
              onClick={() => setActiveTab('messages')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Mensagens
            </Button>
            <Button 
              variant={activeTab === 'calendar' ? 'secondary' : 'ghost'} 
              className="w-full justify-start mb-1"
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Calendário
            </Button>
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <Button variant="ghost" className="w-full justify-start mb-1">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {/* Mobile Search */}
          <div className="mb-6 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Buscar..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Resumo das atividades</p>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-xs text-muted-foreground">+12% em relação ao mês passado</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ordens Abertas</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">56</div>
                    <p className="text-xs text-muted-foreground">+3 novas hoje</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">R$ 24,560</div>
                    <p className="text-xs text-muted-foreground">+8% em relação ao mês passado</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">92%</div>
                    <p className="text-xs text-muted-foreground">+2% em relação ao mês passado</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ordens Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockServiceOrders.slice(0, 3).map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{order.title}</p>
                            <p className="text-sm text-gray-600">{order.clientName}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(order.status)}
                            {getPriorityBadge(order.priority)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Pagamentos Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockPayments.filter(p => p.status === 'pending').map(payment => (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{payment.clientName}</p>
                            <p className="text-sm text-gray-600">R$ {payment.amount.toFixed(2)}</p>
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                  <p className="text-gray-600">Gerenciar clientes</p>
                </div>
                <Button className="mt-4 md:mt-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </div>
              
              {/* Add Client Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Novo Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <Input 
                        value={newClient.name}
                        onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input 
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Telefone</label>
                      <Input 
                        value={newClient.phone}
                        onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <Button className="mt-4" onClick={handleAddClient}>
                    Adicionar Cliente
                  </Button>
                </CardContent>
              </Card>
              
              {/* Clients List */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Nome</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Telefone</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.map(client => (
                          <tr key={client.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{client.name}</td>
                            <td className="py-3 px-4">{client.email}</td>
                            <td className="py-3 px-4">{client.phone}</td>
                            <td className="py-3 px-4">{getStatusBadge(client.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Service Orders Tab */}
          {activeTab === 'service-orders' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
                  <p className="text-gray-600">Gerenciar ordens de serviço</p>
                </div>
                <Button className="mt-4 md:mt-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Ordem
                </Button>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Add Service Order Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Nova Ordem de Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Cliente</label>
                      <Select 
                        value={newServiceOrder.clientId} 
                        onValueChange={(value) => setNewServiceOrder({...newServiceOrder, clientId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Prioridade</label>
                      <Select 
                        value={newServiceOrder.priority} 
                        onValueChange={(value) => setNewServiceOrder({...newServiceOrder, priority: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Título</label>
                      <Input 
                        value={newServiceOrder.title}
                        onChange={(e) => setNewServiceOrder({...newServiceOrder, title: e.target.value})}
                        placeholder="Descrição breve do serviço"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea 
                        value={newServiceOrder.description}
                        onChange={(e) => setNewServiceOrder({...newServiceOrder, description: e.target.value})}
                        placeholder="Detalhes completos do serviço"
                      />
                    </div>
                  </div>
                  <Button className="mt-4" onClick={handleAddServiceOrder}>
                    Criar Ordem de Serviço
                  </Button>
                </CardContent>
              </Card>
              
              {/* Service Orders List */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Ordens de Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">ID</th>
                          <th className="text-left py-3 px-4">Cliente</th>
                          <th className="text-left py-3 px-4">Serviço</th>
                          <th className="text-left py-3 px-4">Data</th>
                          <th className="text-left py-3 px-4">Prioridade</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredServiceOrders.map(order => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">#{order.id}</td>
                            <td className="py-3 px-4">{order.clientName}</td>
                            <td className="py-3 px-4">{order.title}</td>
                            <td className="py-3 px-4">{order.createdAt}</td>
                            <td className="py-3 px-4">{getPriorityBadge(order.priority)}</td>
                            <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
                <p className="text-gray-600">Gerenciar pagamentos</p>
              </div>
              
              {/* Payments List */}
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">ID</th>
                          <th className="text-left py-3 px-4">Cliente</th>
                          <th className="text-left py-3 px-4">Valor</th>
                          <th className="text-left py-3 px-4">Data</th>
                          <th className="text-left py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(payment => (
                          <tr key={payment.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">#{payment.id}</td>
                            <td className="py-3 px-4">{payment.clientName}</td>
                            <td className="py-3 px-4">R$ {payment.amount.toFixed(2)}</td>
                            <td className="py-3 px-4">{payment.date}</td>
                            <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
                <p className="text-gray-600">Comunicação com clientes</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Conversas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg cursor-pointer">
                        <Avatar>
                          <AvatarFallback>JS</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">João Silva</p>
                          <p className="text-sm text-gray-600">Olá, gostaria de saber sobre...</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50">
                        <Avatar>
                          <AvatarFallback>MO</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Maria Oliveira</p>
                          <p className="text-sm text-gray-600">O serviço foi concluído?</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>João Silva</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 h-96 overflow-y-auto">
                      <div className="flex justify-start">
                        <div className="bg-gray-200 rounded-lg p-3 max-w-xs">
                          <p>Olá, gostaria de saber sobre o status do meu notebook.</p>
                          <p className="text-xs text-gray-500 mt-1">10:30 AM</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white rounded-lg p-3 max-w-xs">
                          <p>Olá João, seu notebook está quase pronto. Deve ficar pronto até amanhã.</p>
                          <p className="text-xs text-blue-100 mt-1">10:32 AM</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Input placeholder="Digite sua mensagem..." />
                      <Button>Enviar</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
                <p className="text-gray-600">Agenda de atividades</p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Junho 2023</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="text-center font-medium text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[...Array(30)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-24 p-1 border rounded-lg ${i === 14 ? 'bg-blue-50 border-blue-200' : ''}`}
                      >
                        <div className="font-medium">{i + 1}</div>
                        {i === 14 && (
                          <div className="text-xs mt-1 text-blue-600">
                            <div>Reunião com João</div>
                          </div>
                        )}
                        {i === 18 && (
                          <div className="text-xs mt-1 text-green-600">
                            <div>Entrega notebook</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}