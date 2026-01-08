import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createPecaSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    codigo: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    quantidade: z.number().int().min(0),
    minimo: z.number().int().min(0).default(1),
    preco_custo: z.number().min(0),
    preco_venda: z.number().min(0),
    localizacao: z.string().optional(),
    fornecedor_id: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');
        const baixoEstoque = searchParams.get('baixo_estoque') === 'true';

        const where: any = {};

        if (search) {
            where.OR = [
                { nome: { contains: search, mode: 'insensitive' } },
                { codigo: { contains: search, mode: 'insensitive' } },
                { marca: { contains: search, mode: 'insensitive' } },
                { modelo: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (baixoEstoque) {
            // Prisma doesn't support direct column comparison in where clause easily for all DBs,
            // but for filtering low stock we might need a raw query or post-filtering.
            // However, for simplicity let's just return all and let frontend filter or basic pagination.
            // Or if we strictly need it, we can use raw query.
            // For now, let's just return all sorted by quantity.
        }

        const pecas = await prisma.peca.findMany({
            where,
            include: {
                fornecedor: {
                    select: { nome: true },
                },
            },
            orderBy: {
                nome: 'asc',
            },
        });

        if (baixoEstoque) {
            const lowStock = pecas.filter(p => p.quantidade <= p.minimo);
            return NextResponse.json(lowStock);
        }

        return NextResponse.json(pecas);
    } catch (error) {
        console.error('Error fetching parts:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar peças' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Parse numeric values if strings
        if (typeof body.quantidade === 'string') body.quantidade = parseInt(body.quantidade);
        if (typeof body.minimo === 'string') body.minimo = parseInt(body.minimo);
        if (typeof body.preco_custo === 'string') body.preco_custo = parseFloat(body.preco_custo);
        if (typeof body.preco_venda === 'string') body.preco_venda = parseFloat(body.preco_venda);

        const validatedData = createPecaSchema.parse(body);

        const peca = await prisma.peca.create({
            data: {
                nome: validatedData.nome,
                codigo: validatedData.codigo,
                marca: validatedData.marca,
                modelo: validatedData.modelo,
                quantidade: validatedData.quantidade,
                minimo: validatedData.minimo,
                precoCusto: validatedData.preco_custo,
                precoVenda: validatedData.preco_venda,
                localizacao: validatedData.localizacao,
                fornecedorId: validatedData.fornecedor_id || null,
            },
        });

        return NextResponse.json(peca, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error creating part:', error);
        return NextResponse.json(
            { error: 'Erro ao criar peça' },
            { status: 500 }
        );
    }
}
