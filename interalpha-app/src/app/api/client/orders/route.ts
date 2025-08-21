import { NextRequest, NextResponse } from 'next/server'

// Mock data para ordens do cliente
const mockClientOrders = [
  {
    id: '1',
    title: 'Manutenção Sistema ERP',
    status: 'completed',
    value: 2500.00,
    createdAt: '2024-01-15T10:00:00Z',
    description: 'Manutenção preventiva do sistema ERP'
  },
  {
    id: '2',
    title: 'Desenvolvimento App Mobile',
    status: 'in_progress',
    value: 15000.00,
    createdAt: '2024-01-20T14:30:00Z',
    description: 'Desenvolvimento de aplicativo mobile personalizado'
  },
  {
    id: '3',
    title: 'Consultoria em Cloud',
    status: 'pending',
    value: 5000.00,
    createdAt: '2024-01-25T09:15:00Z',
    description: 'Consultoria para migração para nuvem'
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

    // Filtrar ordens do cliente específico
    const clientOrders = mockClientOrders.filter(order => {
      // Em produção, filtrar por clientId real
      return true // Por enquanto retorna todas para demo
    })

    return NextResponse.json({
      success: true,
      orders: clientOrders,
      total: clientOrders.length
    })

  } catch (error) {
    console.error('Erro ao buscar ordens do cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}