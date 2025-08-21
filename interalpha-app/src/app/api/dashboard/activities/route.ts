import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Mock data para atividades recentes
const mockActivities = [
  {
    id: '1',
    description: 'Novo cliente cadastrado: João Silva',
    type: 'client',
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
    user: 'Sistema',
    metadata: { clientId: '1', clientName: 'João Silva' }
  },
  {
    id: '2',
    description: 'Ordem de serviço concluída: Manutenção ERP',
    type: 'service',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
    user: 'Técnico Carlos',
    metadata: { orderId: '1', orderTitle: 'Manutenção ERP' }
  },
  {
    id: '3',
    description: 'Pagamento recebido: R$ 2.500,00',
    type: 'payment',
    date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h atrás
    user: 'Sistema',
    metadata: { paymentId: '1', amount: 2500.00 }
  },
  {
    id: '4',
    description: 'Nova ordem de serviço criada: App Mobile',
    type: 'service',
    date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6h atrás
    user: 'Atendente Ana',
    metadata: { orderId: '2', orderTitle: 'App Mobile' }
  },
  {
    id: '5',
    description: 'Cliente atualizado: Empresa ABC Ltda',
    type: 'client',
    date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8h atrás
    user: 'Gerente Admin',
    metadata: { clientId: '3', clientName: 'Empresa ABC Ltda' }
  }
]

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

    // Simular um pequeno delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Ordenar por data mais recente
    const sortedActivities = mockActivities.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return NextResponse.json({
      success: true,
      data: sortedActivities,
      total: sortedActivities.length
    })

  } catch (error) {
    console.error('Erro ao buscar atividades do dashboard:', error)
    
    return NextResponse.json({
      success: false,
      data: [],
      total: 0,
      error: 'Erro interno do servidor'
    })
  }
}