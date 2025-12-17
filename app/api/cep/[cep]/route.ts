import { NextRequest, NextResponse } from 'next/server';
import { buscarEnderecoPorCEP } from '@/lib/validators';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cep: string }> }
) {
    try {
        const { cep } = await params;

        if (!cep) {
            return NextResponse.json(
                { error: 'CEP não fornecido' },
                { status: 400 }
            );
        }

        const dados = await buscarEnderecoPorCEP(cep);

        if (!dados) {
            return NextResponse.json(
                { error: 'CEP não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(dados);
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar CEP' },
            { status: 500 }
        );
    }
}
