// API para gerenciar conflitos de sincronização

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get('resolved')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (resolved !== null) {
      where.resolvedAt = resolved === 'true' ? { not: null } : null
    }

    const [conflicts, total] = await Promise.all([
      prisma.accountingConflict.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.accountingConflict.count({ where })
    ])

    return NextResponse.json({
      conflicts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar conflitos:', error)
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
    const { syncId, localData, externalData, conflictFields } = body

    // Validar parâmetros
    if (!syncId || !localData || !externalData || !conflictFields) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a sincronização existe
    const sync = await prisma.accountingSync.findUnique({
      where: { id: syncId }
    })

    if (!sync) {
      return NextResponse.json(
        { error: 'Sincronização não encontrada' },
        { status: 404 }
      )
    }

    // Criar conflito
    const conflict = await prisma.accountingConflict.create({
      data: {
        syncId,
        localData,
        externalData,
        conflictFields
      }
    })

    // Atualizar status da sincronização
    await prisma.accountingSync.update({
      where: { id: syncId },
      data: { status: 'conflict' }
    })

    return NextResponse.json(conflict, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar conflito:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}