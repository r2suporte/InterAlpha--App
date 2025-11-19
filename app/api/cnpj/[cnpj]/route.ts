import { NextRequest, NextResponse } from 'next/server';
import { buscarDadosCNPJ } from '@/lib/validators';

export async function GET(
    request: NextRequest,
    { params }: { params: { cnpj: string } }
) {
    try {
        const { cnpj } = params;

        if (!cnpj) {
            return NextResponse.json(
                { error: 'CNPJ não fornecido' },
                { status: 400 }
            );
        }

        const dados = await buscarDadosCNPJ(cnpj);

        if (!dados) {
            return NextResponse.json(
                { error: 'CNPJ inválido' },
                { status: 400 }
            );
        }

        if (dados.erro) {
            return NextResponse.json(dados, { status: 404 });
        }

        return NextResponse.json(dados);
    } catch (error) {
        console.error('Erro ao buscar CNPJ:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar CNPJ' },
            { status: 500 }
        );
    }
}
