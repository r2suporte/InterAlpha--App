import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: params.id,
        userId: userId
      },
      include: {
        _count: {
          select: { ordensServico: true }
        }
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: cliente
    })

  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: params.id,
        userId: userId
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se cliente tem ordens de serviço
    const ordensCount = await prisma.ordemServico.count({
      where: { clienteId: params.id }
    })

    if (ordensCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir cliente com ordens de serviço' },
        { status: 400 }
      )
    }

    await prisma.cliente.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Cliente excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}