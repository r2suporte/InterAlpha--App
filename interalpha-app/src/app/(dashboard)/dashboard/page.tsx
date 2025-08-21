'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Wrench, CreditCard, TrendingUp } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useDashboard } from '@/contexts/DashboardContext'

export default function DashboardPage() {
  const { user } = useUser()
  const { metrics, recentActivities, addActivity, updateMetrics } = useDashboard()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Olá, {user?.firstName || 'Usuário'}! 👋
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Aqui está um resumo do seu negócio hoje
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Sistema Online</span>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Clientes Ativos
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.activeClients}</div>
            <p className="text-sm text-gray-500">
              {metrics.activeClients === 0 ? 'Nenhum cliente cadastrado ainda' : 'Clientes ativos no sistema'}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">
              O.S. em Aberto
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Wrench className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.openServiceOrders}</div>
            <p className="text-sm text-gray-500">
              {metrics.openServiceOrders === 0 ? 'Nenhuma ordem de serviço pendente' : 'Ordens de serviço em aberto'}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Receita do Mês
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.monthlyRevenue)}
            </div>
            <p className="text-sm text-gray-500">
              {metrics.monthlyRevenue === 0 ? 'Nenhuma receita registrada' : 'Receita total do mês'}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Crescimento
            </CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {metrics.growthPercentage > 0 ? '+' : ''}{metrics.growthPercentage}%
            </div>
            <p className="text-sm text-gray-500">
              Em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button 
              onClick={() => {
                addActivity({
                  description: 'Novo cliente cadastrado',
                  type: 'client'
                });
                const newActiveClients = metrics.activeClients + 1;
                updateMetrics({ activeClients: newActiveClients });
              }}
              className="group w-full flex items-center justify-between p-4 text-left border-0 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-blue-900">Novo Cliente</div>
                <div className="text-sm text-gray-600">Cadastrar um novo cliente</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Users className="h-5 w-5 text-white" />
              </div>
            </button>
            
            <button 
              onClick={() => {
                addActivity({
                  description: 'Nova ordem de serviço criada',
                  type: 'service'
                });
                const newOpenServiceOrders = metrics.openServiceOrders + 1;
                updateMetrics({ openServiceOrders: newOpenServiceOrders });
              }}
              className="group w-full flex items-center justify-between p-4 text-left border-0 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl hover:from-orange-100 hover:to-orange-200/50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-orange-900">Nova O.S.</div>
                <div className="text-sm text-gray-600">Criar ordem de serviço</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Wrench className="h-5 w-5 text-white" />
              </div>
            </button>

            <button 
              onClick={() => {
                const paymentValue = 150;
                addActivity({
                  description: `Pagamento de R$ ${paymentValue.toFixed(2)} recebido`,
                  type: 'payment'
                });
                const newMonthlyRevenue = metrics.monthlyRevenue + paymentValue;
                const newGrowthPercentage = metrics.monthlyRevenue === 0 ? 100 : 5;
                updateMetrics({ 
                  monthlyRevenue: newMonthlyRevenue,
                  growthPercentage: newGrowthPercentage
                });
              }}
              className="group w-full flex items-center justify-between p-4 text-left border-0 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl hover:from-green-100 hover:to-green-200/50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-green-900">Registrar Pagamento</div>
                <div className="text-sm text-gray-600">Adicionar novo pagamento</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg"></div>
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-sm font-medium text-gray-600 mb-2">Nenhuma atividade recente</div>
                <div className="text-xs text-gray-500">
                  As atividades aparecerão aqui conforme você usar o sistema
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-gray-50/50 to-transparent rounded-xl border border-gray-100/50">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                        activity.type === 'client' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                        activity.type === 'service' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                        'bg-gradient-to-br from-green-500 to-green-600'
                      }`}>
                        {activity.type === 'client' && <Users className="h-5 w-5 text-white" />}
                        {activity.type === 'service' && <Wrench className="h-5 w-5 text-white" />}
                        {activity.type === 'payment' && <CreditCard className="h-5 w-5 text-white" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
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