import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateDespesaSchema = z.object({
    descricao: z.string().min(1).optional(),
    valor: z.number().min(0).optional(),
    categoria: z.string().min(1).optional(),
    status: z.enum(['pago', 'pendente', 'vencido']).optional(),
    fornecedor: z.string().optional(),
    data_vencimento: z.string().optional().nullable(),
    observacoes: z.string().optional(),
    fornecedor_id: z.string().optional().nullable(),
});

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next.js 15
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Parse numeric value if string
        if (typeof body.valor === 'string') {
            body.valor = parseFloat(body.valor);
        }

        const validatedData = updateDespesaSchema.parse(body);

        const updateData: any = { ...validatedData };
        if (validatedData.data_vencimento) {
            updateData.dataVencimento = new Date(validatedData.data_vencimento);
            delete updateData.data_vencimento; // Remove to match Prisma field name
        }

        if (validatedData.fornecedor_id !== undefined) {
            updateData.fornecedorId = validatedData.fornecedor_id;
            delete updateData.fornecedor_id;
        }

        const despesa = await prisma.despesa.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(despesa);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error updating expense:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar despesa' },
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
        await prisma.despesa.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir despesa' },
            { status: 500 }
        );
    }
}
