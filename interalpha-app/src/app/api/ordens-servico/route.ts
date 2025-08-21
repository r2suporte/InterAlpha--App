import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Mock data para ordens de serviço
const mockOrdensServico = [
  {
    id: '1',
    titulo: 'Manutenção Sistema ERP',
    status: 'em_andamento',
    prioridade: 'alta',
    valor: 2500.00,
    dataInicio: '2024-01-15',
    cliente: {
      id: '1',
      nome: 'Empresa ABC Ltda'
    }
  },
  {
    id: '2',
    titulo: 'Desenvolvimento App Mobile',
    status: 'pendente',
    prioridade: 'media',
    valor: 15000.00,
    dataInicio: '2024-01-20',
    cliente: {
      id: '2',
      nome: 'Tech Solutions'
    }
  },
  {
    id: '3',
    titulo: 'Consultoria em Cloud',
    status: 'concluida',
    prioridade: 'baixa',
    valor: 5000.00,
    dataInicio: '2024-01-10',
    cliente: {
      id: '3',
      nome: 'StartupXYZ'
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    // Tentar autenticação, mas não falhar se não conseguir
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let filteredOrdens = [...mockOrdensServico]

    // Filtrar por busca
    if (search) {
      const searchLower = search.toLowerCase()
      filteredOrdens = filteredOrdens.filter(ordem =>
        ordem.titulo.toLowerCase().includes(searchLower) ||
        ordem.cliente.nome.toLowerCase().includes(searchLower)
      )
    }

    // Filtrar por status
    if (status && status !== 'all') {
      filteredOrdens = filteredOrdens.filter(ordem => ordem.status === status)
    }

    // Paginação
    const total = filteredOrdens.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedOrdens = filteredOrdens.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: paginatedOrdens,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erro na API de ordens de serviço:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      },
      { status: 500 }
    )
  }
}