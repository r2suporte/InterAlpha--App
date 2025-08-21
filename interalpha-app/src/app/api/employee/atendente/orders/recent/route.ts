// API para ordens de serviço recentes do atendente

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

    // Buscar ordens recentes
    const recentOrders = await prisma.ordemServico.findMany({
      select: {
        id: true,
        titulo: true,
        status: true,
        prioridade: true,
        createdAt: true,
        cliente: {
          select: {
            nome: true,
            telefone: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    })

    return NextResponse.json(recentOrders)

  } catch (error) {
    console.error('Erro ao buscar ordens recentes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}