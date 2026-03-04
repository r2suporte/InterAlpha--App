import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import PDFGenerator from '@/lib/services/pdf-generator';
import {
    OrdemServico,
    PrioridadeOrdemServico,
    StatusOrdemServico,
    TipoServico
} from '@/types/ordens-servico';

const STATUS_VALUES: StatusOrdemServico[] = [
    'aberta',
    'em_andamento',
    'aguardando_peca',
    'aguardando_aprovacao',
    'aguardando_cliente',
    'em_teste',
    'concluida',
    'entregue',
    'cancelada'
];

const PRIORIDADE_VALUES: PrioridadeOrdemServico[] = ['baixa', 'media', 'alta', 'urgente'];
const TIPO_SERVICO_VALUES: TipoServico[] = [
    'reparo',
    'manutencao',
    'upgrade',
    'diagnostico',
    'instalacao',
    'recuperacao_dados',
    'limpeza',
    'configuracao'
];

type OrdemServicoComRelacionamentos = Prisma.OrdemServicoGetPayload<{
    include: {
        cliente: true;
        pecas: true;
    };
}>;

function normalizeStatus(status: string): StatusOrdemServico {
    return STATUS_VALUES.includes(status as StatusOrdemServico)
        ? (status as StatusOrdemServico)
        : 'aberta';
}

function normalizePrioridade(prioridade: string): PrioridadeOrdemServico {
    return PRIORIDADE_VALUES.includes(prioridade as PrioridadeOrdemServico)
        ? (prioridade as PrioridadeOrdemServico)
        : 'media';
}

function normalizeTipoServico(tipo: string): TipoServico {
    return TIPO_SERVICO_VALUES.includes(tipo as TipoServico)
        ? (tipo as TipoServico)
        : 'reparo';
}

function mapOrdemToPdfPayload(ordem: OrdemServicoComRelacionamentos): OrdemServico {
    const valorServico = Number(ordem.valorServico ?? 0);
    const valorPecas = Number(ordem.valorPecas ?? 0);
    const valorTotal = Number(ordem.valorTotal ?? valorServico + valorPecas);

    return {
        id: ordem.id,
        numero_os: ordem.numeroOs,
        cliente_id: ordem.clienteId,
        equipamento_id: ordem.equipamentoId ?? 'nao-informado',
        cliente: ordem.cliente
            ? {
                id: ordem.cliente.id,
                nome: ordem.cliente.nome,
                email: ordem.cliente.email ?? '',
                telefone: ordem.cliente.telefone ?? '',
                cpf_cnpj: ordem.cliente.cpfCnpj ?? '',
                endereco: ordem.cliente.endereco ?? '',
                cidade: ordem.cliente.cidade ?? '',
                estado: ordem.cliente.estado ?? '',
                cep: ordem.cliente.cep ?? '',
                numero_cliente: ordem.cliente.numeroCliente ?? '',
                created_at: ordem.cliente.createdAt.toISOString()
            }
            : undefined,
        serial_number: ordem.numeroSerie ?? '',
        tipo_servico: normalizeTipoServico(ordem.titulo),
        titulo: ordem.titulo,
        descricao: ordem.descricao ?? '',
        problema_reportado: ordem.defeitoRelatado ?? ordem.descricao ?? '',
        descricao_defeito: ordem.defeitoRelatado ?? ordem.descricao ?? '',
        estado_equipamento: ordem.danosAparentes ?? 'Não informado',
        status: normalizeStatus(ordem.status),
        prioridade: normalizePrioridade(ordem.prioridade),
        tecnico_id: ordem.tecnicoId ?? undefined,
        valor_servico: valorServico,
        valor_pecas: valorPecas,
        valor_total: valorTotal,
        data_abertura: ordem.dataAbertura.toISOString(),
        data_inicio: ordem.dataInicio?.toISOString(),
        data_previsao_conclusao: ordem.dataPrevisaoConclusao?.toISOString(),
        data_conclusao: ordem.dataConclusao?.toISOString(),
        observacoes_cliente: ordem.observacoesCliente ?? undefined,
        observacoes_tecnico: ordem.observacoesTecnico ?? undefined,
        aprovacao_cliente: false,
        garantia_servico_dias: 90,
        garantia_pecas_dias: 90,
        pecas: ordem.pecas.map(peca => ({
            id: peca.id,
            ordem_servico_id: peca.ordemServicoId,
            peca_id: peca.pecaId ?? undefined,
            nome: peca.nome,
            quantidade: peca.quantidade,
            valor_unitario: Number(peca.precoUnitario),
            valor_total: Number(peca.precoTotal),
            garantia_dias: 90,
            tipo_peca: 'compativel',
            created_at: peca.createdAt.toISOString()
        })),
        created_at: ordem.createdAt.toISOString(),
        updated_at: ordem.updatedAt.toISOString(),
        created_by: ordem.createdBy ?? 'system'
    };
}

export async function GET(
    _request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        const { id } = params;

        const ordem = await prisma.ordemServico.findUnique({
            where: { id },
            include: {
                cliente: true,
                pecas: true
            }
        });

        if (!ordem) {
            return NextResponse.json(
                { error: 'Ordem de serviço não encontrada' },
                { status: 404 }
            );
        }

        const ordemParaPDF = mapOrdemToPdfPayload(ordem);

        const generator = new PDFGenerator();
        const pdfBuffer = await generator.generateOrdemServicoPDF(ordemParaPDF);

        const filename = PDFGenerator.generateFileName(ordemParaPDF);
        const responseBody = new Blob([Uint8Array.from(pdfBuffer)], { type: 'application/pdf' });

        return new NextResponse(responseBody, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        return NextResponse.json(
            { error: 'Erro interno ao gerar PDF' },
            { status: 500 }
        );
    }
}
