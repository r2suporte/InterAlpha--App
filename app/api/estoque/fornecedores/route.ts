import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createFornecedorSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    cpf_cnpj: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    telefone: z.string().optional(),
    endereco: z.string().optional(),
    observacoes: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');

        const where: any = {};

        if (search) {
            where.OR = [
                { nome: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { cpfCnpj: { contains: search, mode: 'insensitive' } },
            ];
        }

        const fornecedores = await prisma.fornecedor.findMany({
            where,
            orderBy: {
                nome: 'asc',
            },
        });

        return NextResponse.json(fornecedores);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar fornecedores' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createFornecedorSchema.parse(body);

        const fornecedor = await prisma.fornecedor.create({
            data: {
                nome: validatedData.nome,
                cpfCnpj: validatedData.cpf_cnpj,
                email: validatedData.email,
                telefone: validatedData.telefone,
                endereco: validatedData.endereco,
                observacoes: validatedData.observacoes,
            },
        });

        return NextResponse.json(fornecedor, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error creating supplier:', error);
        return NextResponse.json(
            { error: 'Erro ao criar fornecedor' },
            { status: 500 }
        );
    }
}
