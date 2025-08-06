'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Wrench, CreditCard, TrendingUp } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useDashboard } from '@/contexts/DashboardContext'

export default function DashboardPage() {
  // Temporariamente removido a verificação de usuário do Clerk
  // até que as chaves de API sejam configuradas
  const { user } = useUser()
  const { metrics, recentActivities, addActivity, updateMetrics } = useDashboard()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user?.firstName || 'Usuário'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Aqui está um resumo do seu negócio hoje.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeClients}</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.activeClients === 0 ? 'Nenhum cliente cadastrado ainda' : 'Clientes ativos no sistema'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              O.S. em Aberto
            </CardTitle>
            <Wrench className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openServiceOrders}</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.openServiceOrders === 0 ? 'Nenhuma ordem de serviço pendente' : 'Ordens de serviço em aberto'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Receita do Mês
            </CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.monthlyRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.monthlyRevenue === 0 ? 'Nenhuma receita registrada' : 'Receita total do mês'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Crescimento
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.growthPercentage > 0 ? '+' : ''}{metrics.growthPercentage}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <button 
                onClick={() => {
                  // Simulação de adição de cliente
                  addActivity({
                    description: 'Novo cliente cadastrado',
                    type: 'client'
                  });
                  // Atualiza métricas
                  const newActiveClients = metrics.activeClients + 1;
                  updateMetrics({ activeClients: newActiveClients });
                }}
                className="flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">Novo Cliente</div>
                  <div className="text-sm text-gray-500">Cadastrar um novo cliente</div>
                </div>
                <Users className="h-5 w-5 text-gray-400" />
              </button>
              
              <button 
                onClick={() => {
                  // Simulação de adição de ordem de serviço
                  addActivity({
                    description: 'Nova ordem de serviço criada',
                    type: 'service'
                  });
                  // Atualiza métricas
                  const newOpenServiceOrders = metrics.openServiceOrders + 1;
                  updateMetrics({ openServiceOrders: newOpenServiceOrders });
                }}
                className="flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">Nova O.S.</div>
                  <div className="text-sm text-gray-500">Criar ordem de serviço</div>
                </div>
                <Wrench className="h-5 w-5 text-gray-400" />
              </button>

              <button 
                onClick={() => {
                  // Simulação de adição de pagamento
                  const paymentValue = 150;
                  addActivity({
                    description: `Pagamento de R$ ${paymentValue.toFixed(2)} recebido`,
                    type: 'payment'
                  });
                  // Atualiza métricas
                  const newMonthlyRevenue = metrics.monthlyRevenue + paymentValue;
                  const newGrowthPercentage = metrics.monthlyRevenue === 0 ? 100 : 5;
                  updateMetrics({ 
                    monthlyRevenue: newMonthlyRevenue,
                    growthPercentage: newGrowthPercentage
                  });
                }}
                className="flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium">Registrar Pagamento</div>
                  <div className="text-sm text-gray-500">Adicionar novo pagamento</div>
                </div>
                <CreditCard className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-sm">Nenhuma atividade recente</div>
                <div className="text-xs mt-1">
                  As atividades aparecerão aqui conforme você usar o sistema
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 border-b pb-2">
                    <div className="flex-shrink-0">
                      {activity.type === 'client' && <Users className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'service' && <Wrench className="h-4 w-4 text-orange-600" />}
                      {activity.type === 'payment' && <CreditCard className="h-4 w-4 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}