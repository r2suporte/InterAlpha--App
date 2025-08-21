import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Mock data
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
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Tentar autenticação, mas não falhar se não conseguir
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const ordem = mockOrdensServico.find(o => o.id === params.id)

    if (!ordem) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: ordem
    })

  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Tentar autenticação, mas não falhar se não conseguir
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const ordemIndex = mockOrdensServico.findIndex(o => o.id === params.id)

    if (ordemIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    // Simular exclusão (em um app real, removeria do banco)
    const ordemRemovida = mockOrdensServico.splice(ordemIndex, 1)[0]

    return NextResponse.json({
      success: true,
      message: 'Ordem de serviço excluída com sucesso',
      data: ordemRemovida
    })

  } catch (error) {
    console.error('Erro ao excluir ordem de serviço:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}