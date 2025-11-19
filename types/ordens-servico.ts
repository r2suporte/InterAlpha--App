import { EquipamentoApple } from './equipamentos';
import { FinanceiroOrdemServico, StatusFinanceiro } from './financeiro';

// Interface do cliente (referência)
export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf_cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  numero_cliente: string;
  created_at: string;
}

// Interface do cliente portal (referência)
export interface ClientePortal {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  created_at: string;
}

// Status expandidos para empresa autorizada Apple
export type StatusOrdemServico =
  | 'aberta'
  | 'em_andamento'
  | 'aguardando_peca'
  | 'aguardando_aprovacao'
  | 'aguardando_cliente'
  | 'em_teste'
  | 'concluida'
  | 'entregue'
  | 'cancelada';

// Prioridades
export type PrioridadeOrdemServico = 'baixa' | 'media' | 'alta' | 'urgente';

// Tipos de serviço
export type TipoServico =
  | 'reparo'
  | 'manutencao'
  | 'upgrade'
  | 'diagnostico'
  | 'instalacao'
  | 'recuperacao_dados'
  | 'limpeza'
  | 'configuracao';

// Interface principal da ordem de serviço
export interface OrdemServico {
  id: string;
  numero_os: string;
  cliente_id?: string;
  cliente_portal_id?: string;
  cliente?: Cliente;
  cliente_portal?: ClientePortal;

  // Equipamento
  equipamento_id: string;
  equipamento?: EquipamentoApple;

  // Informações específicas do equipamento
  serial_number: string;
  imei?: string; // Para iPads com conectividade celular

  // Informações do serviço
  tipo_servico: TipoServico;
  titulo: string;
  descricao: string;
  problema_reportado: string;
  descricao_defeito: string;
  estado_equipamento: string; // Descrição do estado físico do equipamento
  diagnostico_inicial?: string;
  diagnostico_final?: string;
  analise_tecnica?: string; // Campo para análise técnica detalhada
  solucao_aplicada?: string;

  // Status e prioridade
  status: StatusOrdemServico;
  prioridade: PrioridadeOrdemServico;

  // Responsáveis
  tecnico_id?: string;
  tecnico_nome?: string;
  supervisor_id?: string;

  // Valores
  valor_servico: number; // Valor da mão de obra
  valor_pecas: number;
  valor_total: number;
  valor_aprovado_cliente?: number;

  // Datas
  data_abertura: string;
  data_inicio?: string;
  data_previsao_conclusao?: string;
  data_conclusao?: string;
  data_entrega?: string;

  // Observações e notas
  observacoes_cliente?: string;
  observacoes_tecnico?: string;
  observacoes_internas?: string;

  // Aprovações
  aprovacao_cliente: boolean;
  data_aprovacao_cliente?: string;
  assinatura_cliente?: string;

  // Garantia
  garantia_servico_dias: number;
  garantia_pecas_dias: number;

  // Informações financeiras
  financeiro?: FinanceiroOrdemServico;
  status_financeiro?: StatusFinanceiro;

  // Metadados
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Interface para formulário de criação/edição
export interface OrdemServicoFormData {
  numero_os: string;
  cliente_id?: string;
  cliente_portal_id?: string;
  equipamento_id: string;

  // Informações específicas do equipamento
  serial_number: string;
  imei: string; // Para iPads com conectividade celular

  tipo_servico: TipoServico | '';
  titulo: string;
  descricao: string;
  problema_reportado: string;
  descricao_defeito: string;
  estado_equipamento: string; // Descrição do estado físico do equipamento
  diagnostico_inicial: string;
  analise_tecnica: string; // Campo para análise técnica detalhada

  status: StatusOrdemServico;
  prioridade: PrioridadeOrdemServico;

  tecnico_id: string;

  valor_servico: string; // Valor da mão de obra
  valor_pecas: string;

  data_inicio: string;
  data_previsao_conclusao: string;

  observacoes_cliente: string;
  observacoes_tecnico: string;

  garantia_servico_dias: string;
  garantia_pecas_dias: string;
}

// Interface para peças utilizadas
export interface PecaUtilizada {
  id: string;
  ordem_servico_id: string;
  nome: string;
  codigo_peca?: string;
  codigo_apple?: string; // Código oficial Apple da peça
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  fornecedor?: string;
  numero_serie?: string;
  garantia_dias: number;
  tipo_peca: 'original_apple' | 'compativel' | 'recondicionada';
  observacoes?: string;
  created_at: string;
}

// Interface para acompanhamento de status
export interface StatusHistorico {
  id: string;
  ordem_servico_id: string;
  status_anterior: StatusOrdemServico;
  status_novo: StatusOrdemServico;
  motivo?: string;
  observacoes?: string;
  usuario_id: string;
  usuario_nome: string;
  data_mudanca: string;
}

// Interface para comunicação com cliente
export interface ComunicacaoCliente {
  id: string;
  ordem_servico_id: string;
  tipo: 'email' | 'sms' | 'whatsapp' | 'telefone' | 'presencial';
  assunto: string;
  mensagem: string;
  enviado_por: string;
  data_envio: string;
  lida: boolean;
  data_leitura?: string;
  resposta_cliente?: string;
  anexos?: string[];
}

// Interface para fotos e documentos
export interface AnexoOrdemServico {
  id: string;
  ordem_servico_id: string;
  tipo:
  | 'foto_equipamento'
  | 'foto_dano'
  | 'documento'
  | 'comprovante'
  | 'laudo';
  nome_arquivo: string;
  url: string;
  descricao?: string;
  data_upload: string;
  uploaded_by: string;
}

// Interface para checklist de entrega
export interface ChecklistEntrega {
  id: string;
  ordem_servico_id: string;
  equipamento_funcionando: boolean;
  todos_acessorios_inclusos: boolean;
  cliente_satisfeito: boolean;
  garantia_explicada: boolean;
  forma_pagamento_definida: boolean;
  observacoes?: string;
  responsavel_entrega: string;
  data_checklist: string;
}

// Labels para exibição
export const LABELS_STATUS_OS: Record<StatusOrdemServico, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  aguardando_peca: 'Aguardando Peça',
  aguardando_aprovacao: 'Aguardando Aprovação',
  aguardando_cliente: 'Aguardando Cliente',
  em_teste: 'Em Teste',
  concluida: 'Concluída',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

export const LABELS_PRIORIDADE: Record<PrioridadeOrdemServico, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const LABELS_TIPO_SERVICO: Record<TipoServico, string> = {
  reparo: 'Reparo',
  manutencao: 'Manutenção',
  upgrade: 'Upgrade',
  diagnostico: 'Diagnóstico',
  instalacao: 'Instalação',
  recuperacao_dados: 'Recuperação de Dados',
  limpeza: 'Limpeza',
  configuracao: 'Configuração',
};

// Cores para status
export const CORES_STATUS: Record<StatusOrdemServico, string> = {
  aberta: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-yellow-100 text-yellow-800',
  aguardando_peca: 'bg-orange-100 text-orange-800',
  aguardando_aprovacao: 'bg-purple-100 text-purple-800',
  aguardando_cliente: 'bg-gray-100 text-gray-800',
  em_teste: 'bg-indigo-100 text-indigo-800',
  concluida: 'bg-green-100 text-green-800',
  entregue: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-800',
};

// Cores para prioridade
export const CORES_PRIORIDADE: Record<PrioridadeOrdemServico, string> = {
  baixa: 'bg-gray-100 text-gray-800',
  media: 'bg-blue-100 text-blue-800',
  alta: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800',
};
