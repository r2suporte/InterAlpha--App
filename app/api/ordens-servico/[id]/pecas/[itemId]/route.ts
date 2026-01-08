import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETE /api/ordens-servico/[id]/pecas/[itemId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { id: ordemId, itemId } = await params;

        await prisma.$transaction(async (tx) => {
            // 1. Get PecaUtilizada to know quantity and pecaId
            const item = await tx.pecaUtilizada.findUnique({
                where: { id: itemId }
            });

            if (!item) {
                throw new Error('Item não encontrado');
            }

            // 2. Return Stock if linked to a Peca
            if (item.pecaId) {
                await tx.peca.update({
                    where: { id: item.pecaId },
                    data: {
                        quantidade: { increment: item.quantidade }
                    }
                });
            }

            // 3. Delete Item
            await tx.pecaUtilizada.delete({
                where: { id: itemId }
            });

            // 4. Update Order Totals
            // Recalculate
            const allParts = await tx.pecaUtilizada.findMany({
                where: { ordemServicoId: ordemId }
            });

            const totalPecas = allParts.reduce((acc, p) => acc + Number(p.precoTotal), 0);

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
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Erro ao remover peça da OS:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao remover peça' },
            { status: 500 }
        );
    }
}
