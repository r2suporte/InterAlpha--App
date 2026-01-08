import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const addPecaSchema = z.object({
    pecaId: z.string().uuid(),
    quantidade: z.number().int().positive(),
});

// GET /api/ordens-servico/[id]/pecas
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: ordemId } = await params;

        const pecasUtilizadas = await prisma.pecaUtilizada.findMany({
            where: { ordemServicoId: ordemId },
            include: {
                peca: {
                    select: { codigo: true, marca: true }
                }
            }
        });

        return NextResponse.json(pecasUtilizadas);
    } catch (error) {
        console.error('Erro ao buscar peças da OS:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar peças' },
            { status: 500 }
        );
    }
}

// POST /api/ordens-servico/[id]/pecas
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: ordemId } = await params;
        const body = await request.json();

        const { pecaId, quantidade } = addPecaSchema.parse(body);

        // Transaction to ensure stock consistency
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Part and Check Stock
            const peca = await tx.peca.findUnique({
                where: { id: pecaId }
            });

            if (!peca) {
                throw new Error('Peça não encontrada');
            }

            if (peca.quantidade < quantidade) {
                throw new Error(`Estoque insuficiente. Disponível: ${peca.quantidade}`);
            }

            // 2. Create PecaUtilizada
            const precoUnitario = Number(peca.precoVenda);
            const precoTotal = precoUnitario * quantidade;

            const pecaUtilizada = await tx.pecaUtilizada.create({
                data: {
                    ordemServicoId: ordemId,
                    pecaId: pecaId,
                    nome: peca.nome,
                    quantidade: quantidade,
                    precoUnitario: precoUnitario,
                    precoTotal: precoTotal,
                }
            });

            // 3. Decrement Stock
            await tx.peca.update({
                where: { id: pecaId },
                data: {
                    quantidade: { decrement: quantidade }
                }
            });

            // 4. Update Order Totals
            // Recalculate all parts total to be safe
            const allParts = await tx.pecaUtilizada.findMany({
                where: { ordemServicoId: ordemId }
            });

            const totalPecas = allParts.reduce((acc, p) => acc + Number(p.precoTotal), 0);

            // Get current service value to update total
            const os = await tx.ordemServico.findUnique({
                where: { id: ordemId },
                select: { valorServico: true }
            });
            const valorServico = Number(os?.valorServico || 0);

            await tx.ordemServico.update({
                where: { id: ordemId },
                data: {
                    valorPecas: totalPecas,
                    valorTotal: valorServico + totalPecas
                }
            });

            return pecaUtilizada;
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
        console.error('Erro ao adicionar peça na OS:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
        }
        return NextResponse.json(
            { error: error.message || 'Erro ao adicionar peça' },
            { status: error.message.includes('Estoque') ? 400 : 500 }
        );
    }
}
