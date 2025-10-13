// Tipos para o sistema financeiro
import { Peca } from './pecas';

// Status financeiro da ordem de serviço
export type StatusFinanceiro =
  | 'orcamento_pendente' // Aguardando aprovação do orçamento
  | 'orcamento_aprovado' // Orçamento aprovado, aguardando execução
  | 'orcamento_reprovado' // Orçamento reprovado pelo cliente
  | 'em_execucao' // Serviço em execução
  | 'aguardando_pagamento' // Serviço concluído, aguardando pagamento
  | 'pago_parcial' // Pagamento parcial recebido
  | 'pago_total' // Pagamento total recebido
  | 'cancelado' // Ordem cancelada
  | 'garantia'; // Serviço em garantia (sem cobrança)

// Formas de pagamento
export type FormaPagamento =
  | 'dinheiro'
  | 'pix'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'transferencia'
  | 'boleto'
  | 'cheque'
  | 'crediario';

// Status do pagamento
export type StatusPagamento =
  | 'pendente'
  | 'processando'
  | 'aprovado'
  | 'recusado'
  | 'cancelado'
  | 'estornado';

// Item de serviço (mão de obra)
export interface ItemServico {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  observacoes?: string;
}

// Item de peça utilizada
export interface ItemPeca {
  id: string;
  peca_id: string;
  peca?: Peca;
  quantidade: number;
  valor_unitario: number; // Preço no momento da venda
  valor_total: number;
  desconto_percentual?: number;
  desconto_valor?: number;
  observacoes?: string;
}

// Desconto aplicado
export interface Desconto {
  tipo: 'percentual' | 'valor_fixo';
  valor: number;
  motivo: string;
  autorizado_por: string;
}

// Informações de pagamento
export interface Pagamento {
  id: string;
  ordem_servico_id: string;
  valor: number;
  forma_pagamento: FormaPagamento;
  status: StatusPagamento;
  data_pagamento?: Date;
  data_vencimento?: Date;
  comprovante?: string;
  observacoes?: string;
  parcela_numero?: number;
  total_parcelas?: number;
  created_at: Date;
  created_by: string;
}

// Orçamento detalhado
export interface Orcamento {
  id: string;
  ordem_servico_id: string;

  // Itens
  itens_servico: ItemServico[];
  itens_pecas: ItemPeca[];

  // Valores
  subtotal_servicos: number;
  subtotal_pecas: number;
  subtotal_geral: number;

  // Descontos
  desconto?: Desconto;
  valor_desconto: number;

  // Total
  valor_total: number;

  // Informações do orçamento
  valido_ate: Date;
  observacoes?: string;
  termos_condicoes?: string;

  // Status e aprovação
  status: 'pendente' | 'aprovado' | 'reprovado' | 'expirado';
  data_aprovacao?: Date;
  aprovado_por?: string;
  motivo_reprovacao?: string;

  // Metadados
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}

// Informações financeiras da ordem de serviço
export interface FinanceiroOrdemServico {
  id: string;
  ordem_servico_id: string;

  // Status
  status_financeiro: StatusFinanceiro;

  // Orçamento
  orcamento?: Orcamento;

  // Pagamentos
  pagamentos: Pagamento[];
  valor_total_pago: number;
  valor_pendente: number;

  // Configurações de pagamento
  permite_parcelamento: boolean;
  max_parcelas?: number;
  entrada_minima?: number;

  // Metadados
  created_at: Date;
  updated_at: Date;
}

// Métricas financeiras
export interface MetricasFinanceiras {
  // Receitas
  receita_total_mes: number;
  receita_total_ano: number;
  receita_media_diaria: number;

  // Ordens de serviço
  total_orcamentos_pendentes: number;
  total_aguardando_pagamento: number;
  total_pagos_mes: number;

  // Valores
  valor_orcamentos_pendentes: number;
  valor_aguardando_pagamento: number;
  valor_recebido_mes: number;
  valor_recebido_ano: number;

  // Análises
  ticket_medio: number;
  taxa_aprovacao_orcamentos: number;
  tempo_medio_pagamento: number; // em dias

  // Por forma de pagamento
  distribuicao_formas_pagamento: Array<{
    forma: FormaPagamento;
    quantidade: number;
    valor_total: number;
    percentual: number;
  }>;

  // Tendências
  crescimento_receita_mes: number; // percentual
  ordens_em_atraso: number;
}

// Relatório financeiro
export interface RelatorioFinanceiro {
  periodo_inicio: Date;
  periodo_fim: Date;
  metricas: MetricasFinanceiras;
  ordens_por_status: Array<{
    status: StatusFinanceiro;
    quantidade: number;
    valor_total: number;
  }>;
  top_servicos: Array<{
    descricao: string;
    quantidade: number;
    valor_total: number;
  }>;
  top_pecas: Array<{
    peca: Peca;
    quantidade: number;
    valor_total: number;
  }>;
}

// Labels para exibição
export const STATUS_FINANCEIRO_LABELS: Record<StatusFinanceiro, string> = {
  orcamento_pendente: 'Orçamento Pendente',
  orcamento_aprovado: 'Orçamento Aprovado',
  orcamento_reprovado: 'Orçamento Reprovado',
  em_execucao: 'Em Execução',
  aguardando_pagamento: 'Aguardando Pagamento',
  pago_parcial: 'Pago Parcial',
  pago_total: 'Pago Total',
  cancelado: 'Cancelado',
  garantia: 'Garantia',
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_debito: 'Cartão de Débito',
  cartao_credito: 'Cartão de Crédito',
  transferencia: 'Transferência',
  boleto: 'Boleto',
  cheque: 'Cheque',
  crediario: 'Crediário',
};

export const STATUS_PAGAMENTO_LABELS: Record<StatusPagamento, string> = {
  pendente: 'Pendente',
  processando: 'Processando',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
};

// Cores para status (para uso em badges e indicadores)
export const STATUS_FINANCEIRO_COLORS: Record<StatusFinanceiro, string> = {
  orcamento_pendente: 'yellow',
  orcamento_aprovado: 'blue',
  orcamento_reprovado: 'red',
  em_execucao: 'purple',
  aguardando_pagamento: 'orange',
  pago_parcial: 'cyan',
  pago_total: 'green',
  cancelado: 'gray',
  garantia: 'indigo',
};

// Funções utilitárias
export function calcularValorTotal(
  itensServico: ItemServico[],
  itensPecas: ItemPeca[]
): number {
  const totalServicos = itensServico.reduce(
    (sum, item) => sum + item.valor_total,
    0
  );
  const totalPecas = itensPecas.reduce(
    (sum, item) => sum + item.valor_total,
    0
  );
  return totalServicos + totalPecas;
}

export function aplicarDesconto(valor: number, desconto: Desconto): number {
  if (desconto.tipo === 'percentual') {
    return valor * (desconto.valor / 100);
  }
  return Math.min(desconto.valor, valor);
}

export function calcularValorPendente(
  valorTotal: number,
  pagamentos: Pagamento[]
): number {
  const totalPago = pagamentos
    .filter(p => p.status === 'aprovado')
    .reduce((sum, p) => sum + p.valor, 0);
  return Math.max(0, valorTotal - totalPago);
}

export function determinarStatusFinanceiro(
  orcamento?: Orcamento,
  pagamentos: Pagamento[] = [],
  valorTotal: number = 0
): StatusFinanceiro {
  if (!orcamento) return 'orcamento_pendente';

  if (orcamento.status === 'reprovado') return 'orcamento_reprovado';
  if (orcamento.status === 'pendente') return 'orcamento_pendente';

  const valorPago = pagamentos
    .filter(p => p.status === 'aprovado')
    .reduce((sum, p) => sum + p.valor, 0);

  if (valorPago === 0) return 'aguardando_pagamento';
  if (valorPago < valorTotal) return 'pago_parcial';
  return 'pago_total';
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}
