// Tipos para o sistema de peças

// Categorias de peças
export type CategoriaPeca =
  | 'tela'
  | 'bateria'
  | 'placa_mae'
  | 'memoria'
  | 'armazenamento'
  | 'camera'
  | 'alto_falante'
  | 'conector'
  | 'cabo'
  | 'carcaca'
  | 'acessorio'
  | 'ferramenta'
  | 'outros';

// Status da peça no estoque
export type StatusPeca =
  | 'disponivel'
  | 'baixo_estoque'
  | 'sem_estoque'
  | 'descontinuada'
  | 'em_pedido';

// Fornecedores
export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  contato: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface principal da peça
export interface Peca {
  id: string;
  part_number: string; // Código único da peça
  nome: string;
  descricao: string;
  categoria: CategoriaPeca;
  marca?: string;
  modelo_compativel?: string[]; // Modelos de equipamentos compatíveis

  // Preços
  preco_custo: number;
  preco_venda: number;
  margem_lucro: number; // Calculado automaticamente

  // Estoque
  quantidade_estoque: number;
  estoque_minimo: number;
  status: StatusPeca;
  localizacao_estoque?: string;

  // Fornecedor
  fornecedor_id?: string;
  fornecedor?: Fornecedor;
  codigo_fornecedor?: string;

  // Especificações técnicas
  especificacoes?: Record<string, string>;

  // Garantia
  garantia_meses?: number;

  // Metadados
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}

// Dados para formulário de peça
export interface PecaFormData {
  part_number: string;
  nome: string;
  descricao: string;
  categoria: CategoriaPeca;
  marca: string;
  modelo_compativel: string[];
  preco_custo: number;
  preco_venda: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  localizacao_estoque: string;
  fornecedor_id: string;
  codigo_fornecedor: string;
  especificacoes: Record<string, string>;
  garantia_meses: number;
}

// Movimentação de estoque
export type TipoMovimentacao =
  | 'entrada'
  | 'saida'
  | 'ajuste'
  | 'transferencia'
  | 'devolucao';

export interface MovimentacaoEstoque {
  id: string;
  peca_id: string;
  peca?: Peca;
  tipo: TipoMovimentacao;
  quantidade: number;
  quantidade_anterior: number;
  quantidade_atual: number;
  motivo: string;
  observacoes?: string;
  ordem_servico_id?: string; // Se relacionado a uma OS
  usuario_id: string;
  created_at: Date;
}

// Relatórios e métricas
export interface MetricasPecas {
  total_pecas: number;
  valor_total_estoque: number;
  pecas_baixo_estoque: number;
  pecas_sem_estoque: number;
  valor_medio_peca: number;
  margem_lucro_media: number;
  movimentacoes_mes: number;
  pecas_mais_utilizadas: Array<{
    peca: Peca;
    quantidade_utilizada: number;
  }>;
}

// Labels para exibição
export const CATEGORIA_PECA_LABELS: Record<CategoriaPeca, string> = {
  tela: 'Tela/Display',
  bateria: 'Bateria',
  placa_mae: 'Placa Mãe',
  memoria: 'Memória RAM',
  armazenamento: 'Armazenamento',
  camera: 'Câmera',
  alto_falante: 'Alto-falante',
  conector: 'Conector',
  cabo: 'Cabo',
  carcaca: 'Carcaça',
  acessorio: 'Acessório',
  ferramenta: 'Ferramenta',
  outros: 'Outros',
};

export const STATUS_PECA_LABELS: Record<StatusPeca, string> = {
  disponivel: 'Disponível',
  baixo_estoque: 'Baixo Estoque',
  sem_estoque: 'Sem Estoque',
  descontinuada: 'Descontinuada',
  em_pedido: 'Em Pedido',
};

export const TIPO_MOVIMENTACAO_LABELS: Record<TipoMovimentacao, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  transferencia: 'Transferência',
  devolucao: 'Devolução',
};

// Funções utilitárias removidas e movidas para lib/utils/pricing.ts e lib/utils/pecas.ts
