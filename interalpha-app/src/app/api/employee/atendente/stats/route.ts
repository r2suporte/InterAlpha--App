// API para estatísticas do dashboard do atendente

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'

interface EmployeeTokenPayload {
  employeeId: string
  role: string
  permissions: string[]
}

export async function GET(request: NextRequest) {
  try {
    // Verificar token de autorização
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    let payload: EmployeeTokenPayload
    try {
      payload = verify(token, process.env.JWT_SECRET || 'fallback-secret') as EmployeeTokenPayload
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Verificar se é atendente
    if (payload.role !== 'ATENDENTE') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar estatísticas
    const [
      totalClientes,
      ordensAbertas,
      ordensHoje,
      chamadosAtivos
    ] = await Promise.all([
      // Total de clientes
      prisma.cliente.count(),
      
      // Ordens abertas (não concluídas)
      prisma.ordemServico.count({
        where: {
          status: {
            notIn: ['CONCLUIDA', 'CANCELADA']
          }
        }
      }),
      
      // Ordens criadas hoje
      prisma.ordemServico.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Chamados ativos (simulado - pode ser implementado com sistema de chat)
      Promise.resolve(3) // Valor fixo por enquanto
    ])

    return NextResponse.json({
      totalClientes,
      ordensAbertas,
      ordensHoje,
      chamadosAtivos
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}