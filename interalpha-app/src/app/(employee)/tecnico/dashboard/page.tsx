'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  MapPin,
  Calendar,
  User
} from 'lucide-react';

interface ServiceOrder {
  id: string;
  clientName: string;
  service: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'completed' | 'pending_parts';
  scheduledDate: string;
  location: string;
  estimatedDuration: number;
  description: string;
}

interface TechnicianStats {
  assignedOrders: number;
  completedToday: number;
  pendingOrders: number;
  averageCompletionTime: number;
}

export default function TecnicoDashboard() {
  const [stats, setStats] = useState<TechnicianStats>({
    assignedOrders: 0,
    completedToday: 0,
    pendingOrders: 0,
    averageCompletionTime: 0
  });
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechnicianData();
  }, []);

  const fetchTechnicianData = async () => {
    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch('/api/employee/tecnico/stats'),
        fetch('/api/employee/tecnico/orders')
      ]);

      if (statsResponse.ok && ordersResponse.ok) {
        const statsData = await statsResponse.json();
        const ordersData = await ordersResponse.json();
        
        setStats(statsData);
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do técnico:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/employee/tecnico/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchTechnicianData();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'pending_parts': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Técnico</h1>
          <p className="text-gray-600">Gerencie suas ordens de serviço e relatórios</p>
        </div>
        <Button onClick={fetchTechnicianData} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordens Atribuídas</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedOrders}</div>
            <p className="text-xs text-muted-foreground">Total de ordens ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Serviços finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Aguardando execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCompletionTime}h</div>
            <p className="text-xs text-muted-foreground">Por ordem de serviço</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Ordens */}
      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned">Atribuídas</TabsTrigger>
          <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ordens Atribuídas</CardTitle>
              <CardDescription>
                Ordens de serviço aguardando início
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders
                  .filter(order => order.status === 'assigned')
                  .map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'in_progress')}
                        >
                          Iniciar Serviço
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{order.clientName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <Wrench className="h-4 w-4" />
                            <span>{order.service}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(order.scheduledDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4" />
                            <span>{order.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700">{order.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Duração estimada: {order.estimatedDuration}h</span>
                        <span>ID: {order.id}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ordens em Andamento</CardTitle>
              <CardDescription>
                Serviços que você está executando atualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders
                  .filter(order => order.status === 'in_progress')
                  .map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="bg-yellow-500">
                            EM ANDAMENTO
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'pending_parts')}
                          >
                            Aguardar Peças
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                          >
                            Finalizar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{order.clientName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <Wrench className="h-4 w-4" />
                            <span>{order.service}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(order.scheduledDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4" />
                            <span>{order.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700">{order.description}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ordens Concluídas</CardTitle>
              <CardDescription>
                Serviços finalizados recentemente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders
                  .filter(order => order.status === 'completed')
                  .map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-3 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-500">
                            CONCLUÍDO
                          </Badge>
                        </div>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Relatório
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{order.clientName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <Wrench className="h-4 w-4" />
                            <span>{order.service}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(order.scheduledDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Finalizado</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Serviços</CardTitle>
              <CardDescription>
                Todos os serviços executados por você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Histórico completo será carregado aqui</p>
                <Button variant="outline" className="mt-4">
                  Carregar Histórico
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}