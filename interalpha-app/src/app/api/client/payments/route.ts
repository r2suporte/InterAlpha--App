import { NextRequest, NextResponse } from 'next/server'

// Mock data para pagamentos do cliente
const mockClientPayments = [
  {
    id: '1',
    amount: 2500.00,
    status: 'paid',
    method: 'PIX',
    date: '2024-01-15T10:00:00Z',
    description: 'Pagamento - Manutenção Sistema ERP',
    orderId: '1'
  },
  {
    id: '2',
    amount: 7500.00,
    status: 'paid',
    method: 'CARTAO_CREDITO',
    date: '2024-01-20T14:30:00Z',
    description: 'Pagamento parcial - App Mobile (50%)',
    orderId: '2'
  },
  {
    id: '3',
    amount: 5000.00,
    status: 'pending',
    method: 'BOLETO',
    date: '2024-01-25T09:15:00Z',
    description: 'Pagamento - Consultoria Cloud',
    orderId: '3'
  }
]

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do cliente
    const clientKey = request.headers.get('x-client-key')
    const clientSession = request.headers.get('x-client-session')
    
    if (!clientKey) {
      return NextResponse.json(
        { error: 'Chave de acesso necessária' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      )
    }

    // Simular validação da chave (em produção, validar com o serviço)
    // const validation = await clientKeyService.validateClientKey(clientKey)
    // if (!validation.valid) {
    //   return NextResponse.json({ error: 'Chave inválida' }, { status: 401 })
    // }

    // Filtrar pagamentos do cliente específico
    const clientPayments = mockClientPayments.filter(payment => {
      // Em produção, filtrar por clientId real
      return true // Por enquanto retorna todos para demo
    })

    // Calcular estatísticas
    const totalPaid = clientPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)
    
    const totalPending = clientPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      success: true,
      payments: clientPayments,
      statistics: {
        total: clientPayments.length,
        totalPaid,
        totalPending,
        paidCount: clientPayments.filter(p => p.status === 'paid').length,
        pendingCount: clientPayments.filter(p => p.status === 'pending').length
      }
    })

  } catch (error) {
    console.error('Erro ao buscar pagamentos do cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}