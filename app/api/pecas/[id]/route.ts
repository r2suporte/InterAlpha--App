import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';

// GET - Detalhe da peça
async function getPeca(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params;
        const peca = await prisma.peca.findUnique({ where: { id } });

        if (!peca) return NextResponse.json({ error: 'Peça não encontrada' }, { status: 404 });

        return NextResponse.json(peca);
    } catch (error) {
        return NextResponse.json({ error: 'Erro servidor' }, { status: 500 });
    }
}

// PUT - Atualizar peça
async function updatePeca(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params;
        const data = await request.json();

        // Extract allowed fields
        const { nome, codigo, marca, modelo, quantidade, minimo, precoCusto, precoVenda, localizacao } = data;

        const updated = await prisma.peca.update({
            where: { id },
            data: {
                nome,
                codigo,
                marca,
                modelo,
                quantidade: quantityVal(quantidade),
                minimo: quantityVal(minimo),
                precoCusto: priceVal(precoCusto),
                precoVenda: priceVal(precoVenda),
                localizacao
            }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error('Erro ao atualizar peça:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Remover peça
async function deletePeca(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params;
        await prisma.peca.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar peça:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// Helpers
function quantityVal(val: any) {
    if (val === undefined) return undefined;
    return Number(val);
}
function priceVal(val: any) {
    if (val === undefined) return undefined;
    return Number(val);
}

export const GET = withAuthenticatedApiLogging(getPeca);
export const PUT = withAuthenticatedApiLogging(updatePeca);
export const DELETE = withAuthenticatedApiLogging(deletePeca);
