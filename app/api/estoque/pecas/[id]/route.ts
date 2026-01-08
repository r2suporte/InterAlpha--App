import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updatePecaSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').optional(),
    codigo: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    quantidade: z.number().int().min(0).optional(),
    minimo: z.number().int().min(0).optional(),
    preco_custo: z.number().min(0).optional(),
    preco_venda: z.number().min(0).optional(),
    localizacao: z.string().optional(),
    fornecedor_id: z.string().optional(),
});

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Parse numeric values if strings
        if (typeof body.quantidade === 'string') body.quantidade = parseInt(body.quantidade);
        if (typeof body.minimo === 'string') body.minimo = parseInt(body.minimo);
        if (typeof body.preco_custo === 'string') body.preco_custo = parseFloat(body.preco_custo);
        if (typeof body.preco_venda === 'string') body.preco_venda = parseFloat(body.preco_venda);

        const validatedData = updatePecaSchema.parse(body);

        const updateData: any = {
            nome: validatedData.nome,
            codigo: validatedData.codigo,
            marca: validatedData.marca,
            modelo: validatedData.modelo,
            quantidade: validatedData.quantidade,
            minimo: validatedData.minimo,
            localizacao: validatedData.localizacao,
            fornecedorId: validatedData.fornecedor_id, // Allow setting to null/undefined
        };

        if (validatedData.preco_custo !== undefined) updateData.precoCusto = validatedData.preco_custo;
        if (validatedData.preco_venda !== undefined) updateData.precoVenda = validatedData.preco_venda;

        // Explicitly handle null for optional fields if passed
        if (body.fornecedor_id === null) updateData.fornecedorId = null;


        const peca = await prisma.peca.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(peca);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error updating part:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar peça' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.peca.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting part:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir peça' },
            { status: 500 }
        );
    }
}
