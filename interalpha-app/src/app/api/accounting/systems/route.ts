// API para gerenciar sistemas contábeis

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const systems = await prisma.accountingSystem.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        baseUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        config: true,
        _count: {
          select: {
            syncRecords: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(systems)
  } catch (error) {
    console.error('Erro ao buscar sistemas contábeis:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, baseUrl, apiKey, config = {} } = body

    // Validar campos obrigatórios
    if (!name || !type || !apiKey) {
      return NextResponse.json(
        { error: 'Nome, tipo e chave da API são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de sistema
    const validTypes = ['omie', 'contabilizei', 'sage', 'generic']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de sistema inválido' },
        { status: 400 }
      )
    }

    // Criar sistema contábil
    const system = await prisma.accountingSystem.create({
      data: {
        name,
        type,
        baseUrl: baseUrl || '',
        apiKey,
        config,
        isActive: true
      }
    })

    return NextResponse.json(system, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar sistema contábil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}