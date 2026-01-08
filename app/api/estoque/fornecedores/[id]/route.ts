import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateFornecedorSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').optional(),
    cpf_cnpj: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    telefone: z.string().optional(),
    endereco: z.string().optional(),
    observacoes: z.string().optional(),
});

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validatedData = updateFornecedorSchema.parse(body);

        const fornecedor = await prisma.fornecedor.update({
            where: { id },
            data: {
                nome: validatedData.nome,
                cpfCnpj: validatedData.cpf_cnpj,
                email: validatedData.email,
                telefone: validatedData.telefone,
                endereco: validatedData.endereco,
                observacoes: validatedData.observacoes,
            },
        });

        return NextResponse.json(fornecedor);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error updating supplier:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar fornecedor' },
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

        // Check if supplier has linked parts
        const linkedParts = await prisma.peca.findFirst({
            where: { fornecedorId: id },
        });

        if (linkedParts) {
            return NextResponse.json(
                { error: 'Não é possível excluir fornecedor com peças vinculadas.' },
                { status: 400 }
            );
        }

        await prisma.fornecedor.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir fornecedor' },
            { status: 500 }
        );
    }
}
