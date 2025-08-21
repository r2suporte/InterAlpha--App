'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  UserCheck,
  Calendar,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  assignedOrders: number;
  completedToday: number;
  averageTime: number;
  status: 'available' | 'busy' | 'offline';
  currentOrder?: {
    id: string;
    clientName: string;
    service: string;
    startedAt: string;
  };
}

interface SupervisorStats {
  totalTechnicians: number;
  activeOrders: number;
  completedToday: number;
  teamEfficiency: number;
  pendingReassignments: number;
}

interface WorkloadData {
  technicianId: string;
  technicianName: string;
  assignedOrders: number;
  capacity: number;
  utilizationRate: number;
}

export default function SupervisorTecnicoDashboard() {
  const [stats, setStats] = useState<SupervisorStats>({
    totalTechnicians: 0,
    activeOrders: 0,
    completedToday: 0,
    teamEfficiency: 0,
    pendingReassignments: 0
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  const fetchSupervisorData = async () => {
    try {
      const [statsResponse, teamResponse, workloadResponse] = await Promise.all([
        fetch('/api/employee/supervisor-tecnico/stats'),
        fetch('/api/employee/supervisor-tecnico/team'),
        fetch('/api/employee/supervisor-tecnico/workload')
      ]);

      if (statsResponse.ok && teamResponse.ok && workloadResponse.ok) {
        const statsData = await statsResponse.json();
        const teamData = await teamResponse.json();
        const workloadDataResponse = await workloadResponse.json();
        
        setStats(statsData);
        setTeamMembers(teamData);
        setWorkloadData(workloadDataResponse);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do supervisor:', error);
    } finally {
      setLoading(false);
    }
  };

  const reassignOrder = async (orderId: string, newTechnicianId: string) => {
    try {
      const response = await fetch('/api/employee/supervisor-tecnico/reassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, newTechnicianId }),
      });

      if (response.ok) {
        await fetchSupervisorData();
      }
    } catch (error) {
      console.error('Erro ao reatribuir ordem:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Supervisor Técnico</h1>
          <p className="text-gray-600">Gerencie sua equipe técnica e distribua ordens de serviço</p>
        </div>
        <Button onClick={fetchSupervisorData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTechnicians}</div>
            <p className="text-xs text-muted-foreground">Total da equipe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordens Ativas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">Finalizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamEfficiency}%</div>
            <p className="text-xs text-muted-foreground">Da equipe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reatribuições</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReassignments}</div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Gestão */}
      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="workload">Carga de Trabalho</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reassign">Reatribuições</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status da Equipe Técnica</CardTitle>
              <CardDescription>
                Acompanhe o status atual de cada técnico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(member.status)}`}></div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                        <Badge variant="outline">
                          {member.status.toUpperCase()}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Ordens Atribuídas:</span>
                        <span className="ml-2 font-medium">{member.assignedOrders}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Concluídas Hoje:</span>
                        <span className="ml-2 font-medium">{member.completedToday}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tempo Médio:</span>
                        <span className="ml-2 font-medium">{member.averageTime}h</span>
                      </div>
                    </div>

                    {member.currentOrder && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm">
                          <UserCheck className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-800">
                            Executando: {member.currentOrder.service} - {member.currentOrder.clientName}
                          </span>
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Iniciado: {new Date(member.currentOrder.startedAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Carga de Trabalho</CardTitle>
              <CardDescription>
                Visualize a distribuição de ordens entre os técnicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workloadData.map((data) => (
                  <div key={data.technicianId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{data.technicianName}</span>
                      <Badge className={getUtilizationColor(data.utilizationRate)}>
                        {data.utilizationRate}% utilização
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Ordens Atribuídas: {data.assignedOrders}</span>
                        <span>Capacidade: {data.capacity}</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getUtilizationColor(data.utilizationRate)}`}
                          style={{ width: `${Math.min(data.utilizationRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Performance</CardTitle>
              <CardDescription>
                Análise detalhada da performance da equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Relatórios de performance serão exibidos aqui</p>
                <Button variant="outline" className="mt-4">
                  Gerar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reassign" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reatribuição de Ordens</CardTitle>
              <CardDescription>
                Gerencie a redistribuição de ordens de serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sistema de reatribuição será implementado aqui</p>
                <Button variant="outline" className="mt-4">
                  Ver Ordens Pendentes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}