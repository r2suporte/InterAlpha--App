import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Autenticação com fallback
    try {
      const { userId } = await auth()
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

    const stats = {
      total,
      pendentes,
      pagos,
      valorTotal: valorTotal._sum.valor || 0,
      valorPendente: valorPendente._sum.valor || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao obter estatísticas de pagamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}