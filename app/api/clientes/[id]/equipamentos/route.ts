import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';

export const dynamic = 'force-dynamic';

async function getEquipamentosCliente(
    request: NextRequest,
    // @ts-ignore
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'ID do cliente inválido' }, { status: 400 });
        }

        const equipamentos = await prisma.equipamento.findMany({
            where: {
                clienteId: id
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(equipamentos);

    } catch (error) {
        console.error('Erro ao buscar equipamentos do cliente:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export const GET = withAuthenticatedApiLogging(getEquipamentosCliente);
