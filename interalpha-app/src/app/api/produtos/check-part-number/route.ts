/**
 * API para Verificação de Part Number Único
 * POST /api/produtos/check-part-number - Verificar se part number é único
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { productService } from '@/lib/services/product-service'
import { uniquePartNumberSchema } from '@/lib/validations/product'

/**
 * POST /api/produtos/check-part-number - Verificar unicidade do part number
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter dados do corpo da requisição
    const body = await request.json()
    
    // Validar dados de entrada
    const { partNumber, excludeId } = uniquePartNumberSchema.parse(body)

    // Verificar unicidade
    const isUnique = await productService.isPartNumberUnique(partNumber, excludeId)

    return NextResponse.json({
      success: true,
      data: {
        partNumber,
        isUnique,
        available: isUnique
      },
      message: isUnique ? 'Part number disponível' : 'Part number já existe'
    })

  } catch (error: any) {
    console.error('Erro ao verificar part number:', error)

    // Erros de validação do Zod
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}