import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';

// GET - Listar equipamentos (global ou filtrado)
async function getEquipamentos(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const imei = searchParams.get('imei');
    const serial = searchParams.get('serial_number') || searchParams.get('serial');

    const where: any = {};

    if (imei) {
      where.imei = imei;
    }
    if (serial) {
      where.numeroSerie = serial;
    }

    if (search) {
      where.OR = [
        { modelo: { contains: search, mode: 'insensitive' } },
        { numeroSerie: { contains: search, mode: 'insensitive' } },
        { imei: { contains: search, mode: 'insensitive' } },
        { cliente: { nome: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const equipamentos = await prisma.equipamento.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nome: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    return NextResponse.json(equipamentos);

  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar equipamento
async function createEquipamento(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      clienteId,
      tipo,
      marca,
      modelo,
      numeroSerie,
      imei,
      senha,
      acessorios,
      estado,
      observacoes
    } = data;

    if (!clienteId || !tipo || !modelo) {
      return NextResponse.json(
        { error: 'Cliente, Tipo e Modelo são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar duplicação de serial se fornecido
    if (numeroSerie) {
      const existente = await prisma.equipamento.findFirst({
        where: {
          numeroSerie,
          // Opcional: restringir duplicidade apenas para o mesmo cliente? 
          // Geralmente serial é único globalmente, mas as vezes repete.
          // Vamos assumir único por enquanto para evitar confusão.
        }
      });
      if (existente && existente.clienteId !== clienteId) {
        // Aviso ou erro? Vamos permitir mas logar? 
        // Melhor retornar erro se for estrito.
        // Mas como é oficina, as vezes digitam errado.
        // Vamos apenas criar.
      }
    }

    const novoEquipamento = await prisma.equipamento.create({
      data: {
        clienteId,
        tipo,
        marca,
        modelo,
        numeroSerie,
        imei,
        senha,
        acessorios,
        estado,
        observacoes
      }
    });

    return NextResponse.json(novoEquipamento, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar equipamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withAuthenticatedApiLogging(getEquipamentos);
export const POST = withAuthenticatedApiLogging(createEquipamento);
