'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Database,
  UserPlus,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react';

interface AdminStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingInvitations: number;
  systemIntegrations: number;
  securityAlerts: number;
  systemUptime: number;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  apis: 'healthy' | 'warning' | 'critical';
  integrations: 'healthy' | 'warning' | 'critical';
  storage: 'healthy' | 'warning' | 'critical';
}

interface RecentActivity {
  id: string;
  type: 'user_created' | 'user_deactivated' | 'role_assigned' | 'integration_added' | 'security_event';
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export default function GerenteAdmDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingInvitations: 0,
    systemIntegrations: 0,
    securityAlerts: 0,
    systemUptime: 0
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    apis: 'healthy',
    integrations: 'healthy',
    storage: 'healthy'
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsResponse, healthResponse, activityResponse] = await Promise.all([
        fetch('/api/employee/gerente-adm/stats'),
        fetch('/api/employee/gerente-adm/system-health'),
        fetch('/api/employee/gerente-adm/activity')
      ]);

      if (statsResponse.ok && healthResponse.ok && activityResponse.ok) {
        const statsData = await statsResponse.json();
        const healthData = await healthResponse.json();
        const activityData = await activityResponse.json();
        
        setStats(statsData);
        setSystemHealth(healthData);
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do gerente ADM:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created': return <UserPlus className="h-4 w-4" />;
      case 'user_deactivated': return <Users className="h-4 w-4" />;
      case 'role_assigned': return <Shield className="h-4 w-4" />;
      case 'integration_added': return <Database className="h-4 w-4" />;
      case 'security_event': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Gerente ADM</h1>
          <p className="text-gray-600">Gerencie usuários, sistema e integrações</p>
        </div>
        <Button onClick={fetchAdminData} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{stats.activeEmployees} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convites</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvitations}</div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrações</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemIntegrations}</div>
            <p className="text-xs text-muted-foreground">Ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.securityAlerts}</div>
            <p className="text-xs text-muted-foreground">Segurança</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemUptime}%</div>
            <p className="text-xs text-muted-foreground">Sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurações</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Módulos</p>
          </CardContent>
        </Card>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
          <CardDescription>
            Monitoramento em tempo real dos componentes do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className={`w-3 h-3 rounded-full ${getHealthColor(systemHealth.database)}`}></div>
              <div className="flex items-center space-x-2">
                {getHealthIcon(systemHealth.database)}
                <span className="font-medium">Banco de Dados</span>
              </div>
              <Badge variant="outline" className={getHealthColor(systemHealth.database)}>
                {systemHealth.database.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className={`w-3 h-3 rounded-full ${getHealthColor(systemHealth.apis)}`}></div>
              <div className="flex items-center space-x-2">
                {getHealthIcon(systemHealth.apis)}
                <span className="font-medium">APIs</span>
              </div>
              <Badge variant="outline" className={getHealthColor(systemHealth.apis)}>
                {systemHealth.apis.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className={`w-3 h-3 rounded-full ${getHealthColor(systemHealth.integrations)}`}></div>
              <div className="flex items-center space-x-2">
                {getHealthIcon(systemHealth.integrations)}
                <span className="font-medium">Integrações</span>
              </div>
              <Badge variant="outline" className={getHealthColor(systemHealth.integrations)}>
                {systemHealth.integrations.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className={`w-3 h-3 rounded-full ${getHealthColor(systemHealth.storage)}`}></div>
              <div className="flex items-center space-x-2">
                {getHealthIcon(systemHealth.storage)}
                <span className="font-medium">Armazenamento</span>
              </div>
              <Badge variant="outline" className={getHealthColor(systemHealth.storage)}>
                {systemHealth.storage.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Gestão */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie funcionários, roles e permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                  <UserPlus className="h-6 w-6" />
                  <span>Convidar Funcionário</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Users className="h-6 w-6" />
                  <span>Gerenciar Usuários</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Shield className="h-6 w-6" />
                  <span>Configurar Roles</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Integrações</CardTitle>
              <CardDescription>
                Configure e monitore integrações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Database className="h-6 w-6" />
                  <span>Nova Integração</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Settings className="h-6 w-6" />
                  <span>Configurações</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Activity className="h-6 w-6" />
                  <span>Monitoramento</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Operacionais</CardTitle>
              <CardDescription>
                Relatórios avançados de uso e performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>Relatório de Uso</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <FileText className="h-6 w-6" />
                  <span>Relatório de Performance</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Shield className="h-6 w-6" />
                  <span>Relatório de Segurança</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas ações administrativas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getActivityIcon(activity.type)}
                      <Badge className={getSeverityColor(activity.severity)}>
                        {activity.severity.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
                
                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma atividade recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}