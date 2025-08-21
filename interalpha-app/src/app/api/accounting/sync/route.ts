// API para gerenciar sincronizações contábeis

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { AccountingSyncService } from '@/services/accounting/accounting-sync-service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const status = searchParams.get('status')
    const systemId = searchParams.get('systemId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (entityType) where.entityType = entityType
    if (status) where.status = status
    if (systemId) where.systemId = systemId

    const [syncs, total] = await Promise.all([
      prisma.accountingSync.findMany({
        where,
        include: {
          system: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.accountingSync.count({ where })
    ])

    return NextResponse.json({
      syncs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar sincronizações:', error)
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
    const { entityType, entityId, systemIds } = body

    // Validar parâmetros
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Tipo de entidade e ID são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar dados da entidade
    let entityData
    switch (entityType) {
      case 'payment':
        entityData = await prisma.pagamento.findUnique({
          where: { id: entityId },
          include: { user: true }
        })
        break
      case 'invoice':
        entityData = await prisma.ordemServico.findUnique({
          where: { id: entityId },
          include: { cliente: true, user: true }
        })
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de entidade não suportado' },
          { status: 400 }
        )
    }

    if (!entityData) {
      return NextResponse.json(
        { error: 'Entidade não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso à entidade
    if (entityData.userId !== userId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Inicializar serviço de sincronização
    const syncService = new AccountingSyncService({
      autoSync: true,
      syncInterval: 60,
      maxRetries: 3,
      retryDelay: 30,
      conflictResolution: 'manual',
      enabledEntities: [entityType]
    })

    await syncService.initializeAdapters()

    // Executar sincronização
    let results
    switch (entityType) {
      case 'payment':
        results = await syncService.syncPayment(entityData)
        break
      case 'invoice':
        results = await syncService.syncInvoice(entityData)
        break
      default:
        throw new Error('Tipo de entidade não suportado')
    }

    return NextResponse.json({
      entityType,
      entityId,
      results,
      syncedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao sincronizar:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}