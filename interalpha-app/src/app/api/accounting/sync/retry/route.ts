// API para reprocessar sincronizações falhadas

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { AccountingSyncService } from '@/services/accounting/accounting-sync-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { syncIds, systemId } = body

    // Inicializar serviço de sincronização
    const syncService = new AccountingSyncService({
      autoSync: true,
      syncInterval: 60,
      maxRetries: 3,
      retryDelay: 30,
      conflictResolution: 'manual',
      enabledEntities: ['payment', 'invoice']
    })

    await syncService.initializeAdapters()

    let processedCount = 0

    if (syncIds && syncIds.length > 0) {
      // Reprocessar sincronizações específicas
      for (const syncId of syncIds) {
        try {
          const sync = await prisma.accountingSync.findUnique({
            where: { id: syncId },
            include: { system: true }
          })

          if (!sync) {
            console.warn(`Sincronização ${syncId} não encontrada`)
            continue
          }

          // Buscar dados da entidade
          let entityData
          switch (sync.entityType) {
            case 'payment':
              entityData = await prisma.pagamento.findUnique({
                where: { id: sync.entityId },
                include: { user: true }
              })
              break
            case 'invoice':
              entityData = await prisma.ordemServico.findUnique({
                where: { id: sync.entityId },
                include: { cliente: true, user: true }
              })
              break
          }

          if (!entityData) {
            console.warn(`Entidade ${sync.entityType} ${sync.entityId} não encontrada`)
            continue
          }

          // Verificar acesso do usuário
          if (entityData.userId !== userId) {
            console.warn(`Usuário ${userId} não tem acesso à entidade ${sync.entityId}`)
            continue
          }

          // Executar retry
          let result
          switch (sync.entityType) {
            case 'payment':
              const paymentResults = await syncService.syncPayment(entityData)
              result = paymentResults.find(r => r.entityId === sync.entityId)
              break
            case 'invoice':
              const invoiceResults = await syncService.syncInvoice(entityData)
              result = invoiceResults.find(r => r.entityId === sync.entityId)
              break
          }

          if (result) {
            processedCount++
          }
        } catch (error) {
          console.error(`Erro ao reprocessar sincronização ${syncId}:`, error)
        }
      }
    } else {
      // Reprocessar todas as sincronizações falhadas
      await syncService.retryFailedSyncs()
      
      // Contar quantas foram reprocessadas
      const failedSyncs = await prisma.accountingSync.count({
        where: {
          status: 'failed',
          retryCount: { lt: 3 },
          ...(systemId && { systemId })
        }
      })
      
      processedCount = failedSyncs
    }

    return NextResponse.json({
      message: `${processedCount} sincronizações reprocessadas`,
      processedCount,
      processedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao reprocessar sincronizações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}