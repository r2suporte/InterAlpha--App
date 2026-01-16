import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';

async function getEquipmentDetail(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params;

        const equipment = await prisma.equipamento.findUnique({
            where: { id },
            include: {
                cliente: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        telefone: true
                    }
                },
                ordensServico: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        numeroOs: true,
                        status: true,
                        dataAbertura: true,
                        dataConclusao: true,
                        defeitoRelatado: true,
                        valorTotal: true,
                        pecas: {
                            select: {
                                id: true,
                                nome: true,
                                quantidade: true,
                                precoUnitario: true,
                                precoTotal: true
                            }
                        }
                    }
                }
            }
        });

        if (!equipment) {
            return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 });
        }

        return NextResponse.json(equipment);

    } catch (error) {
        console.error('Erro ao buscar detalhe do equipamento:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export const GET = withAuthenticatedApiLogging(getEquipmentDetail);
