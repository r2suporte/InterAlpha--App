import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { auditMiddleware } from '@/middleware/audit-middleware'
import { z } from 'zod'

// Schema de validação para criação de pagamento
const createPagamentoSchema = z.object({
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO', 'ESTORNADO']),
  metodo: z.enum(['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA', 'BOLETO']),
  descricao: z.string().optional(),
  dataVencimento: z.string().datetime().optional(),
  dataPagamento: z.string().datetime().optional(),
  ordemServicoId: z.string().optional(),
})

/**
 * GET /api/pagamentos - Listar pagamentos
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação com fallback
    let userId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult.userId
      if (!userId) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 }
        )
      }
    } catch (authError) {
      console.warn('Erro de autenticação, continuando sem filtro de usuário:', authError)
      // Continua sem filtro de usuário para desenvolvimento
    }

    // Parâmetros de query
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const metodo = searchParams.get('metodo')
    const search = searchParams.get('search')

    // Construir filtros
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (metodo && metodo !== 'all') {
      where.metodo = metodo
    }

    if (search) {
      where.OR = [
        { descricao: { contains: search, mode: 'insensitive' } },
        { ordemServico: { titulo: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Buscar pagamentos com paginação
    const [pagamentos, total] = await Promise.all([
      prisma.pagamento.findMany({
        where,
        include: {
          ordemServico: {
            include: {
              cliente: {
                select: {
                  id: true,
                  nome: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.pagamento.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: pagamentos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Erro ao buscar pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pagamentos - Criar novo pagamento
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

    // Validar dados
    const body = await request.json()
    const validatedData = createPagamentoSchema.parse(body)

    // Se o status for PAGO e não tiver data de pagamento, usar data atual
    if (validatedData.status === 'PAGO' && !validatedData.dataPagamento) {
      validatedData.dataPagamento = new Date().toISOString()
    }

    // Verificar se a ordem de serviço existe (se fornecida)
    if (validatedData.ordemServicoId) {
      const ordemServico = await prisma.ordemServico.findUnique({
        where: { id: validatedData.ordemServicoId }
      })

      if (!ordemServico) {
        return NextResponse.json(
          { error: 'Ordem de serviço não encontrada' },
          { status: 404 }
        )
      }
    }

    // Criar pagamento
    const pagamento = await prisma.pagamento.create({
      data: {
        ...validatedData,
        userId,
        dataVencimento: validatedData.dataVencimento ? new Date(validatedData.dataVencimento) : null,
        dataPagamento: validatedData.dataPagamento ? new Date(validatedData.dataPagamento) : null,
      },
      include: {
        ordemServico: {
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Registrar auditoria
    await auditMiddleware(request, {
      action: 'create',
      resource: 'pagamento',
      resourceId: pagamento.id,
      newData: pagamento
    })

    return NextResponse.json({
      success: true,
      data: pagamento,
      message: 'Pagamento criado com sucesso'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors
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