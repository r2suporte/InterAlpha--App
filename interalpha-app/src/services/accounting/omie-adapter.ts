// Adaptador para integração com Omie ERP

import { AccountingAdapter } from './accounting-adapter'
import { SyncResult, DataConflict, Resolution } from '@/types/accounting'

export class OmieAdapter extends AccountingAdapter {
  private appKey: string
  private appSecret: string

  constructor(appKey: string, appSecret: string, config: Record<string, any> = {}) {
    super('', 'https://app.omie.com.br/api/v1/', config)
    this.appKey = appKey
    this.appSecret = appSecret
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeOmieRequest('geral/empresas/', 'ListarEmpresas', {})
      return response && !response.faultstring
    } catch (error) {
      console.error('Erro ao testar conexão com Omie:', error)
      return false
    }
  }

  async syncPayment(payment: any): Promise<SyncResult> {
    try {
      this.validateRequiredFields(payment, ['valor', 'descricao', 'data'])

      const omiePayment = {
        codigo_lancamento_omie: 0,
        codigo_lancamento_integracao: payment.id,
        data_vencimento: this.parseDate(new Date(payment.data)),
        valor_documento: this.formatCurrency(payment.valor),
        codigo_categoria: this.config.defaultPaymentCategory || '1.01.01',
        observacao: payment.descricao,
        codigo_cliente_fornecedor: payment.clienteId ? await this.getOmieClientId(payment.clienteId) : undefined,
        tipo_documento: 'REC' // Receita
      }

      const response = await this.makeOmieRequest('financas/contareceber/', 'IncluirContaReceber', omiePayment)

      if (response.faultstring) {
        throw new Error(response.faultstring)
      }

      return {
        success: true,
        externalId: response.codigo_lancamento_omie?.toString(),
        timestamp: new Date(),
        retryCount: 0
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
        retryCount: 0
      }
    }
  }

  async syncInvoice(invoice: any): Promise<SyncResult> {
    try {
      this.validateRequiredFields(invoice, ['numero', 'valor', 'clienteId', 'itens'])

      const omieInvoice = {
        cabecalho: {
          codigo_pedido: 0,
          codigo_pedido_integracao: invoice.id,
          numero_pedido: invoice.numero,
          codigo_cliente: await this.getOmieClientId(invoice.clienteId),
          data_previsao: this.parseDate(new Date(invoice.dataVencimento)),
          etapa: '50', // Faturado
          codigo_parcela: '000'
        },
        det: invoice.itens.map((item: any, index: number) => ({
          ide: {
            codigo_item_integracao: item.id,
            simples_nacional: 'S'
          },
          produto: {
            codigo: item.codigo || `SERV${index + 1}`,
            descricao: item.descricao,
            ncm: '00000000',
            tipo_item: 'S', // Serviço
            unidade: 'UN',
            valor_unitario: this.formatCurrency(item.valorUnitario),
            quantidade: item.quantidade || 1
          }
        }))
      }

      const response = await this.makeOmieRequest('produtos/pedido/', 'IncluirPedido', omieInvoice)

      if (response.faultstring) {
        throw new Error(response.faultstring)
      }

      return {
        success: true,
        externalId: response.codigo_pedido?.toString(),
        timestamp: new Date(),
        retryCount: 0
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
        retryCount: 0
      }
    }
  }

  async syncExpense(expense: any): Promise<SyncResult> {
    try {
      this.validateRequiredFields(expense, ['valor', 'descricao', 'data'])

      const omieExpense = {
        codigo_lancamento_omie: 0,
        codigo_lancamento_integracao: expense.id,
        data_vencimento: this.parseDate(new Date(expense.data)),
        valor_documento: this.formatCurrency(expense.valor),
        codigo_categoria: this.config.defaultExpenseCategory || '3.01.01',
        observacao: expense.descricao,
        tipo_documento: 'PAG' // Pagamento
      }

      const response = await this.makeOmieRequest('financas/contapagar/', 'IncluirContaPagar', omieExpense)

      if (response.faultstring) {
        throw new Error(response.faultstring)
      }

      return {
        success: true,
        externalId: response.codigo_lancamento_omie?.toString(),
        timestamp: new Date(),
        retryCount: 0
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
        retryCount: 0
      }
    }
  }

  async handleConflict(conflict: DataConflict): Promise<Resolution> {
    // Implementação básica - pode ser expandida conforme necessário
    return {
      action: 'manual',
      notes: 'Conflito requer resolução manual no Omie'
    }
  }

  async getExternalData(entityType: string, externalId: string): Promise<any> {
    try {
      let endpoint = ''
      let method = ''
      let params = {}

      switch (entityType) {
        case 'payment':
          endpoint = 'financas/contareceber/'
          method = 'ConsultarContaReceber'
          params = { codigo_lancamento_omie: parseInt(externalId) }
          break
        case 'invoice':
          endpoint = 'produtos/pedido/'
          method = 'ConsultarPedido'
          params = { codigo_pedido: parseInt(externalId) }
          break
        case 'expense':
          endpoint = 'financas/contapagar/'
          method = 'ConsultarContaPagar'
          params = { codigo_lancamento_omie: parseInt(externalId) }
          break
        default:
          throw new Error(`Tipo de entidade não suportado: ${entityType}`)
      }

      const response = await this.makeOmieRequest(endpoint, method, params)
      
      if (response.faultstring) {
        throw new Error(response.faultstring)
      }

      return response
    } catch (error) {
      console.error(`Erro ao buscar dados externos do Omie:`, error)
      throw error
    }
  }

  private async makeOmieRequest(endpoint: string, call: string, param: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    const requestBody = {
      call,
      app_key: this.appKey,
      app_secret: this.appSecret,
      param: [param]
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Erro na requisição Omie para ${endpoint}:`, error)
      throw error
    }
  }

  private async getOmieClientId(clienteId: string): Promise<number> {
    try {
      // Buscar cliente no Omie pelo código de integração
      const response = await this.makeOmieRequest('geral/clientes/', 'ConsultarCliente', {
        codigo_cliente_integracao: clienteId
      })

      if (response.faultstring) {
        // Se cliente não existe, criar novo
        return await this.createOmieClient(clienteId)
      }

      return response.codigo_cliente_omie
    } catch (error) {
      console.error('Erro ao buscar cliente no Omie:', error)
      throw error
    }
  }

  private async createOmieClient(clienteId: string): Promise<number> {
    // Esta função deveria buscar os dados do cliente no sistema local
    // e criar no Omie. Por simplicidade, retornamos um ID padrão
    console.warn(`Cliente ${clienteId} não encontrado no Omie. Usando cliente padrão.`)
    return 1 // ID do cliente padrão
  }
}