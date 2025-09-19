import { createClient } from '@/lib/supabase/server'

interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
  apiVersion: string
  baseUrl?: string
}

interface OrdemServicoWhatsApp {
  id: string
  numero_os: string
  descricao: string
  valor?: number
  data_inicio?: string
  cliente: {
    nome: string
    telefone: string
  }
}

interface WhatsAppMessage {
  messaging_product: string
  to: string
  type: string
  text?: {
    body: string
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: any[]
  }
}

interface WhatsAppResponse {
  messaging_product: string
  contacts: Array<{
    input: string
    wa_id: string
  }>
  messages: Array<{
    id: string
  }>
}

export default class WhatsAppService {
  private config: WhatsAppConfig
  private baseUrl: string

  constructor() {
    this.config = {
      phoneNumberId: process.env.WA_PHONE_NUMBER_ID || '',
      accessToken: process.env.CLOUD_API_ACCESS_TOKEN || '',
      apiVersion: process.env.CLOUD_API_VERSION || 'v18.0',
      baseUrl: process.env.WA_BASE_URL || 'https://graph.facebook.com'
    }

    this.baseUrl = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`
  }

  /**
   * Envia mensagem de ordem de serviço via WhatsApp
   */
  async sendOrdemServicoMessage(ordemServico: OrdemServicoWhatsApp): Promise<WhatsAppResponse> {
    try {
      // Validar configuração
      if (!this.config.phoneNumberId || !this.config.accessToken) {
        throw new Error('Configuração do WhatsApp incompleta')
      }

      // Validar telefone do cliente
      if (!ordemServico.cliente.telefone) {
        throw new Error('Cliente não possui telefone cadastrado')
      }

      // Formatar número de telefone (remover caracteres especiais e adicionar código do país se necessário)
      const telefoneFormatado = this.formatPhoneNumber(ordemServico.cliente.telefone)

      // Gerar mensagem
      const mensagem = this.generateOrdemServicoMessage(ordemServico)

      // Preparar payload da mensagem
      const messagePayload: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: telefoneFormatado,
        type: 'text',
        text: {
          body: mensagem
        }
      }

      // Enviar mensagem
      const response = await this.sendMessage(messagePayload)

      // Registrar comunicação no banco
      await this.registrarComunicacao(ordemServico.id, {
        tipo: 'whatsapp',
        destinatario: telefoneFormatado,
        mensagem: mensagem,
        status: 'enviado',
        whatsapp_message_id: response.messages[0]?.id
      })

      return response

    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error)
      
      // Registrar erro no banco
      await this.registrarComunicacao(ordemServico.id, {
        tipo: 'whatsapp',
        destinatario: ordemServico.cliente.telefone,
        mensagem: this.generateOrdemServicoMessage(ordemServico),
        status: 'erro',
        erro_detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      })

      throw error
    }
  }

  /**
   * Envia mensagem de texto simples
   */
  async sendTextMessage(to: string, message: string): Promise<WhatsAppResponse> {
    const telefoneFormatado = this.formatPhoneNumber(to)

    const messagePayload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: telefoneFormatado,
      type: 'text',
      text: {
        body: message
      }
    }

    return await this.sendMessage(messagePayload)
  }

  /**
   * Envia mensagem usando template
   */
  async sendTemplateMessage(to: string, templateName: string, components?: any[]): Promise<WhatsAppResponse> {
    const telefoneFormatado = this.formatPhoneNumber(to)

    const messagePayload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: telefoneFormatado,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'pt_BR'
        },
        components: components || []
      }
    }

    return await this.sendMessage(messagePayload)
  }

  /**
   * Método privado para enviar mensagem via API
   */
  private async sendMessage(messagePayload: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`WhatsApp API Error: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return data

    } catch (error) {
      console.error('Erro na API do WhatsApp:', error)
      throw error
    }
  }

  /**
   * Formata número de telefone para o padrão WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '')

    // Se não começar com código do país, adiciona o código do Brasil (55)
    if (!cleanPhone.startsWith('55') && cleanPhone.length === 11) {
      cleanPhone = '55' + cleanPhone
    }

    // Se começar com 0, remove o 0
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1)
    }

    return cleanPhone
  }

  /**
   * Gera mensagem formatada para ordem de serviço
   */
  private generateOrdemServicoMessage(ordemServico: OrdemServicoWhatsApp): string {
    const { numero_os, descricao, valor, data_inicio, cliente } = ordemServico

    let mensagem = `🔧 *Nova Ordem de Serviço*\n\n`
    mensagem += `📋 *OS:* ${numero_os}\n`
    mensagem += `👤 *Cliente:* ${cliente.nome}\n`
    mensagem += `📝 *Descrição:* ${descricao}\n`

    if (valor) {
      mensagem += `💰 *Valor:* R$ ${valor.toFixed(2).replace('.', ',')}\n`
    }

    if (data_inicio) {
      const dataFormatada = new Date(data_inicio).toLocaleDateString('pt-BR')
      mensagem += `📅 *Data de Início:* ${dataFormatada}\n`
    }

    mensagem += `\n📱 Para acompanhar o andamento da sua ordem de serviço, acesse nosso portal do cliente.`
    mensagem += `\n\n_Esta é uma mensagem automática. Para dúvidas, entre em contato conosco._`

    return mensagem
  }

  /**
   * Registra comunicação no banco de dados
   */
  private async registrarComunicacao(ordemServicoId: string, dados: {
    tipo: string
    destinatario: string
    mensagem: string
    status: string
    whatsapp_message_id?: string
    erro_detalhes?: string
  }) {
    try {
      const supabase = await createClient()

      const { error } = await supabase
        .from('comunicacoes_cliente')
        .insert({
          ordem_servico_id: ordemServicoId,
          tipo: dados.tipo,
          mensagem: dados.mensagem,
          status: dados.status,
          whatsapp_message_id: dados.whatsapp_message_id,
          erro_detalhes: dados.erro_detalhes,
          tentativas: 1
        })

      if (error) {
        console.error('Erro ao registrar comunicação WhatsApp:', error)
      }
    } catch (error) {
      console.error('Erro ao registrar comunicação WhatsApp:', error)
    }
  }

  /**
   * Testa conexão com a API do WhatsApp
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Validar configuração
      if (!this.config.phoneNumberId || !this.config.accessToken) {
        return {
          success: false,
          message: 'Configuração do WhatsApp incompleta. Verifique as variáveis de ambiente.'
        }
      }

      // Fazer uma requisição simples para verificar se as credenciais estão válidas
      const testUrl = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}`
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (response.ok) {
        return {
          success: true,
          message: 'Conexão com WhatsApp Business API estabelecida com sucesso'
        }
      } else {
        const errorData = await response.json()
        return {
          success: false,
          message: `Erro na API: ${errorData.error?.message || response.statusText}`
        }
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }
}

// Exportar instância singleton
export const whatsappService = new WhatsAppService()