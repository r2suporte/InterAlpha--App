// API para gerenciar sistema contábil específico

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { systemId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const system = await prisma.accountingSystem.findUnique({
      where: { id: params.systemId },
      include: {
        syncRecords: {
          take: 10,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            entityType: true,
            entityId: true,
            status: true,
            lastSyncAt: true,
            errorMessage: true,
            retryCount: true
          }
        },
        _count: {
          select: {
            syncRecords: true
          }
        }
      }
    })

    if (!system) {
      return NextResponse.json(
        { error: 'Sistema não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(system)
  } catch (error) {
    console.error('Erro ao buscar sistema contábil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { systemId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, baseUrl, apiKey, config, isActive } = body

    const system = await prisma.accountingSystem.update({
      where: { id: params.systemId },
      data: {
        ...(name && { name }),
        ...(baseUrl !== undefined && { baseUrl }),
        ...(apiKey && { apiKey }),
        ...(config && { config }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(system)
  } catch (error) {
    console.error('Erro ao atualizar sistema contábil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { systemId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await prisma.accountingSystem.delete({
      where: { id: params.systemId }
    })

    return NextResponse.json({ message: 'Sistema removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover sistema contábil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}