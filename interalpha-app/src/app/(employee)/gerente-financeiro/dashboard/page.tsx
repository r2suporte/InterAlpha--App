'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Users
} from 'lucide-react';

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  approvedPayments: number;
  revenueGrowth: number;
  averageTicket: number;
}

interface PaymentApproval {
  id: string;
  clientName: string;
  amount: number;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  type: 'service' | 'expense' | 'refund';
  requestedBy: string;
  requestedAt: string;
}

interface FinancialMetrics {
  cashFlow: number;
  accountsReceivable: number;
  accountsPayable: number;
  profitMargin: number;
  operatingExpenses: number;
}

export default function GerenteFinanceiroDashboard() {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
    approvedPayments: 0,
    revenueGrowth: 0,
    averageTicket: 0
  });
  const [pendingApprovals, setPendingApprovals] = useState<PaymentApproval[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    cashFlow: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    profitMargin: 0,
    operatingExpenses: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod]);

  const fetchFinancialData = async () => {
    try {
      const [statsResponse, approvalsResponse, metricsResponse] = await Promise.all([
        fetch(`/api/employee/gerente-financeiro/stats?period=${selectedPeriod}`),
        fetch('/api/employee/gerente-financeiro/approvals'),
        fetch(`/api/employee/gerente-financeiro/metrics?period=${selectedPeriod}`)
      ]);

      if (statsResponse.ok && approvalsResponse.ok && metricsResponse.ok) {
        const statsData = await statsResponse.json();
        const approvalsData = await approvalsResponse.json();
        const metricsData = await metricsResponse.json();
        
        setStats(statsData);
        setPendingApprovals(approvalsData);
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (paymentId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/employee/gerente-financeiro/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId, approved }),
      });

      if (response.ok) {
        await fetchFinancialData();
      }
    } catch (error) {
      console.error('Erro ao aprovar pagamento:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'service': return <CreditCard className="h-4 w-4" />;
      case 'expense': return <FileText className="h-4 w-4" />;
      case 'refund': return <TrendingDown className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Gerente Financeiro</h1>
          <p className="text-gray-600">Gerencie aprovações financeiras e relatórios</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchFinancialData} variant="outline">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center space-x-1 text-xs">
              {stats.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={stats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(stats.revenueGrowth)}%
              </span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">{stats.overduePayments} em atraso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</div>
            <p className="text-xs text-muted-foreground">Por serviço</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.cashFlow)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.accountsReceivable)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.accountsPayable)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.profitMargin}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Operacionais</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.operatingExpenses)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Gestão Financeira */}
      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals">Aprovações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="users">Usuários Financeiros</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aprovações Financeiras Pendentes</CardTitle>
              <CardDescription>
                Pagamentos aguardando sua aprovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(approval.type)}
                        <div>
                          <p className="font-medium">{approval.clientName}</p>
                          <p className="text-sm text-gray-600">{approval.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(approval.priority)}>
                          {approval.priority.toUpperCase()}
                        </Badge>
                        <span className="text-lg font-bold">{formatCurrency(approval.amount)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Vencimento:</span>
                        <span className="ml-2">{new Date(approval.dueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Solicitado por:</span>
                        <span className="ml-2">{approval.requestedBy}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Data da solicitação:</span>
                        <span className="ml-2">{new Date(approval.requestedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => approvePayment(approval.id, false)}
                      >
                        Rejeitar
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => approvePayment(approval.id, true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                ))}
                
                {pendingApprovals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma aprovação pendente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>
                Gere relatórios financeiros detalhados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>Relatório de Receitas</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <PieChart className="h-6 w-6" />
                  <span>Análise de Custos</span>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>Fluxo de Caixa</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários Financeiros</CardTitle>
              <CardDescription>
                Gerencie permissões financeiras dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Gestão de usuários financeiros será implementada aqui</p>
                <Button variant="outline" className="mt-4">
                  Gerenciar Usuários
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard de Métricas Financeiras</CardTitle>
              <CardDescription>
                Visualizações avançadas de performance financeira
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Gráficos e métricas avançadas serão exibidos aqui</p>
                <Button variant="outline" className="mt-4">
                  Ver Métricas Detalhadas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}