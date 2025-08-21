/**
 * Tipos para Ordens de Serviço Apple
 */

export interface ClienteInfo {
  nome: string
  endereco: string
  telefone: string
  email: string
}

export interface DispositivoApple {
  modelo: string
  numeroSerie: string
  capacidade?: string
  cor?: string
  imei?: string
  versaoiOS?: string
  estadoFisico: 'Excelente' | 'Bom' | 'Regular' | 'Ruim'
  acessorios: string[]
}

export interface ProblemaRelatado {
  descricao: string
  sintomas: string[]
  frequencia: 'Sempre' | 'Frequentemente' | 'Às vezes' | 'Raramente'
  condicoes: string
  tentativasReparo?: string
}

export interface AcaoReparo {
  id: string
  descricao: string
  tecnico: string
  dataHora: Date
  tempo: number // em minutos
  resultado: 'Sucesso' | 'Falha' | 'Parcial'
  observacoes?: string
}

export interface PecaSubstituida {
  id: string
  codigo: string
  nome: string
  categoria: 'Tela' | 'Bateria' | 'Camera' | 'Alto-falante' | 'Microfone' | 'Conector' | 'Placa' | 'Outro'
  preco: number
  fornecedor: string
  garantia: number // em dias
  numeroSerie?: string
}

export interface MaoDeObra {
  categoria: 'Básica' | 'Intermediária' | 'Avançada' | 'Especializada'
  tempoEstimado: number // em minutos
  tempoReal: number // em minutos
  valorHora: number
  tecnico: string
  complexidade: 1 | 2 | 3 | 4 | 5
}

export interface GarantiaServico {
  tipo: 'Garantia Apple' | 'Garantia InterAlpha' | 'Fora de Garantia'
  periodo: number // em dias
  condicoes: string[]
  dataInicio: Date
  dataFim: Date
  coberturas: string[]
  exclusoes: string[]
  // Campos específicos para cada tipo de garantia
  numeroSerieApple?: string // Para Garantia Apple
  dataCompraDispositivo?: Date // Para Garantia Apple
  statusGarantiaApple?: 'Ativa' | 'Expirada' | 'Não verificada' // Para Garantia Apple
  servicoInterAlpha?: {
    numeroOS: string
    dataServico: Date
    tipoServico: string
    tecnicoResponsavel: string
  } // Para Garantia InterAlpha
}

export interface ObservacoesEspeciais {
  backupNecessario: boolean
  senhaIdApple?: string
  dadosImportantes: string[]
  restricoes: string[]
  recomendacoes: string[]
  observacoesGerais: string
}

export interface OrdemServicoApple {
  id: string
  numeroSequencial?: number
  numero: string
  
  // Informações do Cliente
  clienteId?: string
  cliente: ClienteInfo
  
  // Dados do Dispositivo
  dispositivo: DispositivoApple
  
  // Problema Relatado
  problema: ProblemaRelatado
  
  // Diagnóstico e Reparo
  acoes: AcaoReparo[]
  pecasSubstituidas: PecaSubstituida[]
  maoDeObra: MaoDeObra
  
  // Valores
  valorPecas: number
  valorMaoDeObra: number
  valorTotal: number
  desconto?: number
  
  // Garantia
  garantia: GarantiaServico
  
  // Observações
  observacoes: ObservacoesEspeciais
  
  // Status e Controle
  status: 'Recebido' | 'Diagnosticando' | 'Aguardando Peças' | 'Em Reparo' | 'Testando' | 'Concluído' | 'Entregue' | 'Cancelado'
  prioridade: 'Baixa' | 'Normal' | 'Alta' | 'Urgente'
  
  // Datas
  dataRecebimento: Date
  dataPrevisao?: Date
  dataConclusao?: Date
  dataEntrega?: Date
  
  // Controle
  tecnicoResponsavel: string
  criadoPor: string
  atualizadoPor: string
  createdAt: Date
  updatedAt: Date
}

export interface ModeloDispositivo {
  categoria: 'iPhone' | 'iPad' | 'MacBook' | 'iMac' | 'Apple Watch' | 'AirPods' | 'Outro'
  modelo: string
  capacidades: string[]
  cores: string[]
  caracteristicas: string[]
}

export interface PecaDisponivel {
  codigo: string
  nome: string
  categoria: string
  compatibilidade: string[]
  preco: number
  estoque: number
  fornecedor: string
  garantia: number
  qualidade: 'Original' | 'OEM' | 'Compatível'
}