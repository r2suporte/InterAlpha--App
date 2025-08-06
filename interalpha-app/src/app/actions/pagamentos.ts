'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'

// Schema de validação para pagamento
const pagamentoSchema = z.object({
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO', 'ESTORNADO']),
  metodo: z.enum(['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA', 'BOLETO']),
  descricao: z.string().optional(),
  dataVencimento: z.date().optional(),
  dataPagamento: z.date().optional(),
  ordemServicoId: z.string().optional(),
})

export type PagamentoFormData = z.infer<typeof pagamentoSchema>

export async function criarPagamento(formData: FormData) {
  try {
    // Extrair dados do FormData
    const data = {
      valor: parseFloat(formData.get('valor') as string),
      status: formData.get('status') as 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'ESTORNADO',
      metodo: formData.get('metodo') as 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'TRANSFERENCIA' | 'BOLETO',
      descricao: formData.get('descricao') as string || undefined,
      dataVencimento: formData.get('dataVencimento') ? new Date(formData.get('dataVencimento') as string) : undefined,
      dataPagamento: formData.get('dataPagamento') ? new Date(formData.get('dataPagamento') as string) : undefined,
      ordemServicoId: formData.get('ordemServicoId') as string || undefined,
    }

    // Validar dados
    const validatedData = pagamentoSchema.parse(data)

    // TODO: Obter userId do Clerk quando implementado
    const userId = 'temp-user-id' // Temporário

    // Se o status for PAGO e não tiver data de pagamento, usar data atual
    if (validatedData.status === 'PAGO' && !validatedData.dataPagamento) {
      validatedData.dataPagamento = new Date()
    }

    // Criar pagamento no banco
    const pagamento = await prisma.pagamento.create({
      data: {
        ...validatedData,
        userId,
      },
    })

    revalidatePath('/pagamentos')
    redirect('/pagamentos')
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Erro de validação: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw new Error('Erro ao criar pagamento')
  }
}

export async function atualizarPagamento(id: string, formData: FormData) {
  try {
    const data = {
      valor: parseFloat(formData.get('valor') as string),
      status: formData.get('status') as 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'ESTORNADO',
      metodo: formData.get('metodo') as 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'TRANSFERENCIA' | 'BOLETO',
      descricao: formData.get('descricao') as string || undefined,
      dataVencimento: formData.get('dataVencimento') ? new Date(formData.get('dataVencimento') as string) : undefined,
      dataPagamento: formData.get('dataPagamento') ? new Date(formData.get('dataPagamento') as string) : undefined,
      ordemServicoId: formData.get('ordemServicoId') as string || undefined,
    }

    const validatedData = pagamentoSchema.parse(data)

    // Se o status for PAGO e não tiver data de pagamento, usar data atual
    if (validatedData.status === 'PAGO' && !validatedData.dataPagamento) {
      validatedData.dataPagamento = new Date()
    }

    await prisma.pagamento.update({
      where: { id },
      data: validatedData,
    })

    revalidatePath('/pagamentos')
    revalidatePath(`/pagamentos/${id}`)
    redirect('/pagamentos')
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Erro de validação: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw new Error('Erro ao atualizar pagamento')
  }
}

export async function excluirPagamento(id: string) {
  try {
    await prisma.pagamento.delete({
      where: { id },
    })

    revalidatePath('/pagamentos')
  } catch (error) {
    throw new Error('Erro ao excluir pagamento')
  }
}

export async function buscarPagamentos(query?: string, status?: string, metodo?: string) {
  try {
    const pagamentos = await prisma.pagamento.findMany({
      where: {
        AND: [
          query ? {
            OR: [
              { descricao: { contains: query, mode: 'insensitive' } },
              { ordemServico: { titulo: { contains: query, mode: 'insensitive' } } },
              { ordemServico: { cliente: { nome: { contains: query, mode: 'insensitive' } } } },
            ],
          } : {},
          status ? { status } : {},
          metodo ? { metodo } : {},
        ],
      },
      include: {
        ordemServico: {
          select: {
            id: true,
            titulo: true,
            cliente: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return pagamentos
  } catch (error) {
    throw new Error('Erro ao buscar pagamentos')
  }
}

export async function buscarOrdensServicoParaSelect() {
  try {
    const ordensServico = await prisma.ordemServico.findMany({
      select: {
        id: true,
        titulo: true,
        valor: true,
        cliente: {
          select: {
            nome: true,
          },
        },
      },
      where: {
        status: {
          not: 'CANCELADA',
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ordensServico
  } catch (error) {
    throw new Error('Erro ao buscar ordens de serviço')
  }
}

// Função para obter estatísticas dos pagamentos
export async function obterEstatisticasPagamentos() {
  try {
    const [total, pendentes, pagos, valorTotal, valorPendente] = await Promise.all([
      prisma.pagamento.count(),
      prisma.pagamento.count({ where: { status: 'PENDENTE' } }),
      prisma.pagamento.count({ where: { status: 'PAGO' } }),
      prisma.pagamento.aggregate({
        _sum: { valor: true },
        where: { status: 'PAGO' },
      }),
      prisma.pagamento.aggregate({
        _sum: { valor: true },
        where: { status: 'PENDENTE' },
      }),
    ])

    return {
      total,
      pendentes,
      pagos,
      valorTotal: valorTotal._sum.valor || 0,
      valorPendente: valorPendente._sum.valor || 0,
    }
  } catch (error) {
    throw new Error('Erro ao obter estatísticas')
  }
}

// Função para obter relatório mensal
export async function obterRelatorioMensal(ano: number, mes: number) {
  try {
    const inicioMes = new Date(ano, mes - 1, 1)
    const fimMes = new Date(ano, mes, 0, 23, 59, 59)

    const [receitaMensal, pagamentosPorMetodo, pagamentosPorDia] = await Promise.all([
      prisma.pagamento.aggregate({
        _sum: { valor: true },
        _count: true,
        where: {
          status: 'PAGO',
          dataPagamento: {
            gte: inicioMes,
            lte: fimMes,
          },
        },
      }),
      prisma.pagamento.groupBy({
        by: ['metodo'],
        _sum: { valor: true },
        _count: true,
        where: {
          status: 'PAGO',
          dataPagamento: {
            gte: inicioMes,
            lte: fimMes,
          },
        },
      }),
      prisma.pagamento.groupBy({
        by: ['dataPagamento'],
        _sum: { valor: true },
        _count: true,
        where: {
          status: 'PAGO',
          dataPagamento: {
            gte: inicioMes,
            lte: fimMes,
          },
        },
        orderBy: { dataPagamento: 'asc' },
      }),
    ])

    return {
      receita: receitaMensal._sum.valor || 0,
      totalPagamentos: receitaMensal._count,
      porMetodo: pagamentosPorMetodo,
      porDia: pagamentosPorDia,
    }
  } catch (error) {
    throw new Error('Erro ao obter relatório mensal')
  }
}