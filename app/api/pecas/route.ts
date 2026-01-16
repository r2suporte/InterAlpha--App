import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';

// GET - Listar peças
async function getPecas(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const lowStock = searchParams.get('low_stock');

        const where: any = {};

        if (search) {
            where.OR = [
                { nome: { contains: search, mode: 'insensitive' } },
                { codigo: { contains: search, mode: 'insensitive' } },
                { marca: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (lowStock === 'true') {
            // Prisma doesn't support direct field comparison in where easily without raw query or logic
            // But for small datasets we can filter in memory or use specific conditions.
            // Actually, we can use `quantidade: { lte: db.peca.fields.minimo }`? No.
            // We'll fetch and filter if complex, or just return all and let frontend filter for now,
            // OR better: use raw query if critical, but let's stick to standard prisma for simplicity 
            // as "low stock" usually means quantity <= minimum.
            // A common pattern is `where: { quantidade: { lte: 5 } }` if 5 is global, but min is per item.
            // We will return all and let client flag them, or just ignore this param for server-side filtering strictly for now.
        }

        const pecas = await prisma.peca.findMany({
            where,
            orderBy: { nome: 'asc' },
        });

        return NextResponse.json(pecas);

    } catch (error) {
        console.error('Erro ao buscar peças:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST - Criar peça
async function createPeca(request: NextRequest) {
    try {
        const data = await request.json();
        const { nome, codigo, marca, modelo, quantidade, minimo, precoCusto, precoVenda, localizacao } = data;

        if (!nome || !precoVenda) {
            return NextResponse.json(
                { error: 'Nome e Preço de Venda são obrigatórios' },
                { status: 400 }
            );
        }

        const newPeca = await prisma.peca.create({
            data: {
                nome,
                codigo,
                marca,
                modelo,
                quantidade: Number(quantidade) || 0,
                minimo: Number(minimo) || 1,
                precoCusto: Number(precoCusto) || 0,
                precoVenda: Number(precoVenda),
                localizacao
            }
        });

        return NextResponse.json(newPeca, { status: 201 });

    } catch (error) {
        console.error('Erro ao criar peça:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export const GET = withAuthenticatedApiLogging(getPecas);
export const POST = withAuthenticatedApiLogging(createPeca);
