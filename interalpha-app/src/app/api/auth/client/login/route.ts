// API para login do cliente com chave temporária

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ClientKeyService } from '@/services/client-access/client-key-service'
import { sign } from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessKey } = body

    // Validar parâmetros
    if (!accessKey) {
      return NextResponse.json(
        { error: 'Chave de acesso é obrigatória' },
        { status: 400 }
      )
    }

    // Validar chave de acesso
    const keyService = new ClientKeyService()
    const validation = await keyService.validateKey(accessKey)

    if (!validation) {
      return NextResponse.json(
        { error: 'Chave de acesso inválida' },
        { status: 401 }
      )
    }

    // Buscar dados do cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: validation.clientId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        documento: true,
        tipoDocumento: true,
        cidade: true,
        estado: true,
        createdAt: true
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Gerar token JWT para o cliente
    const token = sign(
      {
        clientId: cliente.id,
        type: 'client',
        accessKeyId: validation.keyId
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    // Registrar acesso
    await prisma.accessLogEntry.create({
      data: {
        userId: cliente.id,
        userType: 'client',
        action: 'login',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: true,
        timestamp: new Date()
      }
    })

    // Marcar chave como usada
    await keyService.markKeyAsUsed(validation.keyId!)

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      token,
      client: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        documento: cliente.documento,
        tipoDocumento: cliente.tipoDocumento,
        cidade: cliente.cidade,
        estado: cliente.estado
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    })

  } catch (error) {
    console.error('Erro no login do cliente:', error)

    // Registrar tentativa de login falhada
    try {
      await prisma.accessLogEntry.create({
        data: {
          userId: 'unknown',
          userType: 'client',
          action: 'login',
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          success: false,
          failureReason: 'internal_error',
          timestamp: new Date()
        }
      })
    } catch (logError) {
      console.error('Erro ao registrar log de acesso:', logError)
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}