import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { auditMiddleware } from '@/middleware/audit-middleware'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/pagamentos/[id] - Buscar pagamento específico
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const pagamento = await prisma.pagamento.findUnique({
      where: { id },
      include: {
        ordemServico: {
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true
              }
            }
          }
        }
      }
    })

    if (!pagamento) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: pagamento
    })

  } catch (error: any) {
    console.error('Erro ao buscar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/pagamentos/[id] - Atualizar pagamento
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Verificar se o pagamento existe
    const pagamentoExistente = await prisma.pagamento.findUnique({
      where: { id }
    })

    if (!pagamentoExistente) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar pagamento
    const pagamentoAtualizado = await prisma.pagamento.update({
      where: { id },
      data: {
        ...body,
        dataVencimento: body.dataVencimento ? new Date(body.dataVencimento) : undefined,
        dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : undefined,
        updatedAt: new Date()
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
      action: 'update',
      resource: 'pagamento',
      resourceId: id,
      oldData: pagamentoExistente,
      newData: pagamentoAtualizado
    })

    return NextResponse.json({
      success: true,
      data: pagamentoAtualizado,
      message: 'Pagamento atualizado com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao atualizar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/pagamentos/[id] - Excluir pagamento
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verificar se o pagamento existe
    const pagamento = await prisma.pagamento.findUnique({
      where: { id }
    })

    if (!pagamento) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se pode ser excluído (não permitir exclusão de pagamentos já processados)
    if (pagamento.status === 'PAGO') {
      return NextResponse.json(
        { error: 'Não é possível excluir pagamento já processado' },
        { status: 400 }
      )
    }

    // Excluir pagamento
    await prisma.pagamento.delete({
      where: { id }
    })

    // Registrar auditoria
    await auditMiddleware(request, {
      action: 'delete',
      resource: 'pagamento',
      resourceId: id,
      oldData: pagamento
    })

    return NextResponse.json({
      success: true,
      message: 'Pagamento excluído com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao excluir pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}