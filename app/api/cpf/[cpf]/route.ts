import { NextRequest, NextResponse } from 'next/server';
import { buscarDadosCPF } from '@/lib/validators';

export async function GET(
    request: NextRequest,
    { params }: { params: { cpf: string } }
) {
    try {
        const { cpf } = params;

        if (!cpf) {
            return NextResponse.json(
                { error: 'CPF não fornecido' },
                { status: 400 }
            );
        }

        const dados = await buscarDadosCPF(cpf);

        if (!dados) {
            return NextResponse.json(
                { error: 'CPF inválido' },
                { status: 400 }
            );
        }

        return NextResponse.json(dados);
    } catch (error) {
        console.error('Erro ao validar CPF:', error);
        return NextResponse.json(
            { error: 'Erro ao validar CPF' },
            { status: 500 }
        );
    }
}
