import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Mock data para estatísticas do dashboard
const mockDashboardStats = {
  activeClients: 25,
  openServiceOrders: 12,
  monthlyRevenue: 45750.00,
  growthPercentage: 18.5,
  recentMetrics: {
    newClientsThisWeek: 3,
    completedOrdersThisWeek: 8,
    pendingPayments: 5,
    averageOrderValue: 3812.50
  },
  trends: {
    clientsGrowth: 12.3,
    revenueGrowth: 18.5,
    ordersGrowth: -2.1,
    satisfactionScore: 4.7
  }
}

export async function GET() {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    // Simular um pequeno delay para mostrar loading
    await new Promise(resolve => setTimeout(resolve, 100))

    // Adicionar variação nos dados para simular dados reais
    const stats = {
      ...mockDashboardStats,
      activeClients: mockDashboardStats.activeClients + Math.floor(Math.random() * 5),
      openServiceOrders: mockDashboardStats.openServiceOrders + Math.floor(Math.random() * 3),
      monthlyRevenue: mockDashboardStats.monthlyRevenue * (0.9 + Math.random() * 0.2),
      growthPercentage: mockDashboardStats.growthPercentage + (Math.random() - 0.5) * 10
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error)
    
    // Retornar estatísticas zeradas em caso de erro
    return NextResponse.json({
      activeClients: 0,
      openServiceOrders: 0,
      monthlyRevenue: 0,
      growthPercentage: 0,
      recentMetrics: {
        newClientsThisWeek: 0,
        completedOrdersThisWeek: 0,
        pendingPayments: 0,
        averageOrderValue: 0
      },
      trends: {
        clientsGrowth: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        satisfactionScore: 0
      }
    })
  }
}