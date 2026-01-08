import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createDespesaSchema = z.object({
    descricao: z.string().min(1, 'A descrição é obrigatória'),
    valor: z.number().min(0, 'O valor deve ser positivo'),
    categoria: z.string().min(1, 'A categoria é obrigatória'),
    status: z.enum(['pago', 'pendente', 'vencido']).default('pendente'),
    fornecedor: z.string().optional(),
    data_vencimento: z.string().optional().nullable(),
    observacoes: z.string().optional(),
    fornecedor_id: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const categoria = searchParams.get('categoria');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const where: any = {};

        if (categoria && categoria !== 'Todas') {
            where.categoria = categoria;
        }

        if (status && status !== 'Todos') {
            where.status = status.toLowerCase();
        }

        if (search) {
            where.OR = [
                { descricao: { contains: search, mode: 'insensitive' } },
                { fornecedor: { contains: search, mode: 'insensitive' } },
            ];
        }

        const despesas = await prisma.despesa.findMany({
            where,
            include: {
                fornecedorRef: {
                    select: { nome: true },
                },
            },
            orderBy: {
                data: 'desc',
            },
        });

        // Normalize result to include fornecedor name in the flat object if useful, or let frontend handle it
        const despesasComFornecedor = despesas.map((d: any) => ({
            ...d,
            fornecedorNome: d.fornecedorRef?.nome || d.fornecedor, // Fallback to old field
        }));

        return NextResponse.json(despesasComFornecedor);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar despesas' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Parse numeric value if string
        if (typeof body.valor === 'string') {
            body.valor = parseFloat(body.valor);
        }

        const validatedData = createDespesaSchema.parse(body);

        const despesa = await prisma.despesa.create({
            data: {
                descricao: validatedData.descricao,
                valor: validatedData.valor,
                data: new Date(),
                categoria: validatedData.categoria,
                status: validatedData.status,
                fornecedor: validatedData.fornecedor,
                fornecedorId: validatedData.fornecedor_id || null,
                dataVencimento: validatedData.data_vencimento ? new Date(validatedData.data_vencimento) : null,
                observacoes: validatedData.observacoes,
            },
        });

        return NextResponse.json(despesa, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error creating expense:', error);
        return NextResponse.json(
            { error: 'Erro ao criar despesa' },
            { status: 500 }
        );
    }
}
