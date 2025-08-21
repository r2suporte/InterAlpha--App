// API para testar conectividade com sistema contábil

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { AccountingSyncService } from '@/services/accounting/accounting-sync-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { systemId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar sistema contábil
    const system = await prisma.accountingSystem.findUnique({
      where: { id: params.systemId }
    })

    if (!system) {
      return NextResponse.json(
        { error: 'Sistema não encontrado' },
        { status: 404 }
      )
    }

    // Criar serviço de sincronização temporário
    const syncService = new AccountingSyncService({
      autoSync: false,
      syncInterval: 60,
      maxRetries: 3,
      retryDelay: 30,
      conflictResolution: 'manual',
      enabledEntities: []
    })

    // Inicializar apenas este adaptador
    await syncService.initializeAdapters()

    // Testar conectividade
    const results = await syncService.testAllConnections()
    const isConnected = results[params.systemId] || false

    // Registrar resultado do teste
    await prisma.accountingSystem.update({
      where: { id: params.systemId },
      data: {
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      systemId: params.systemId,
      systemName: system.name,
      connected: isConnected,
      testedAt: new Date().toISOString(),
      message: isConnected 
        ? 'Conexão estabelecida com sucesso' 
        : 'Falha na conexão. Verifique as credenciais.'
    })
  } catch (error) {
    console.error('Erro ao testar sistema contábil:', error)
    return NextResponse.json({
      systemId: params.systemId,
      connected: false,
      testedAt: new Date().toISOString(),
      message: 'Erro interno durante o teste de conectividade',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}