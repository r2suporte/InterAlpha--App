// API para resolver conflitos específicos

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { conflictId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { resolution, resolvedData, notes } = body

    // Validar parâmetros
    if (!resolution) {
      return NextResponse.json(
        { error: 'Resolução é obrigatória' },
        { status: 400 }
      )
    }

    const validResolutions = ['use_local', 'use_external', 'merge', 'manual']
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        { error: 'Resolução inválida' },
        { status: 400 }
      )
    }

    // Buscar conflito
    const conflict = await prisma.accountingConflict.findUnique({
      where: { id: params.conflictId }
    })

    if (!conflict) {
      return NextResponse.json(
        { error: 'Conflito não encontrado' },
        { status: 404 }
      )
    }

    if (conflict.resolvedAt) {
      return NextResponse.json(
        { error: 'Conflito já foi resolvido' },
        { status: 400 }
      )
    }

    // Determinar dados resolvidos baseado na resolução
    let finalResolvedData = resolvedData

    if (!finalResolvedData) {
      switch (resolution) {
        case 'use_local':
          finalResolvedData = conflict.localData
          break
        case 'use_external':
          finalResolvedData = conflict.externalData
          break
        case 'merge':
          // Merge simples - prioriza dados locais mas mantém IDs externos
          finalResolvedData = {
            ...(conflict.localData as any || {}),
            ...(conflict.externalData as any || {}),
            // Manter dados locais para campos críticos
            id: (conflict.localData as any)?.id,
            createdAt: (conflict.localData as any)?.createdAt
          }
          break
        default:
          finalResolvedData = resolvedData || conflict.localData
      }
    }

    // Atualizar conflito
    const updatedConflict = await prisma.accountingConflict.update({
      where: { id: params.conflictId },
      data: {
        resolution,
        resolvedData: finalResolvedData,
        resolvedBy: userId,
        resolvedAt: new Date(),
        notes
      }
    })

    // Atualizar status da sincronização
    await prisma.accountingSync.update({
      where: { id: conflict.syncId },
      data: { 
        status: 'success',
        lastSyncAt: new Date(),
        errorMessage: null
      }
    })

    // Registrar log da resolução
    await prisma.accountingSyncLog.create({
      data: {
        syncId: conflict.syncId,
        action: 'conflict_resolved',
        details: {
          conflictId: params.conflictId,
          resolution,
          resolvedBy: userId,
          notes
        }
      }
    })

    return NextResponse.json({
      conflict: updatedConflict,
      message: 'Conflito resolvido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao resolver conflito:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}