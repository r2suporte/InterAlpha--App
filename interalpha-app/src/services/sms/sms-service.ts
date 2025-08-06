import twilio from 'twilio';
import { integrationConfig } from '@/lib/integrations/config';
import type { SMSJob } from '@/lib/integrations/types';

export class SMSService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    if (!integrationConfig.twilio.accountSid || !integrationConfig.twilio.authToken) {
      throw new Error('Credenciais do Twilio não configuradas');
    }

    this.client = twilio(
      integrationConfig.twilio.accountSid,
      integrationConfig.twilio.authToken
    );
    
    this.fromNumber = integrationConfig.twilio.phoneNumber || '';
    
    if (!this.fromNumber) {
      console.warn('⚠️  Número do Twilio não configurado');
    }

    console.log('✅ Serviço SMS inicializado');
  }

  async sendSMS(smsData: SMSJob): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      const { to, message } = smsData;

      // Validar número de telefone
      const validatedNumber = this.validatePhoneNumber(to);
      if (!validatedNumber.isValid) {
        throw new Error(`Número de telefone inválido: ${validatedNumber.error}`);
      }

      // Validar tamanho da mensagem (SMS tem limite de 160 caracteres)
      if (message.length > 160) {
        console.warn(`⚠️  Mensagem SMS muito longa (${message.length} chars), será dividida em múltiplas partes`);
      }

      // Enviar SMS via Twilio
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: validatedNumber.formatted,
      });

      console.log(`✅ SMS enviado para ${validatedNumber.formatted} - SID: ${result.sid}`);

      return {
        success: true,
        sid: result.sid,
      };
    } catch (error) {
      console.error('❌ Erro ao enviar SMS:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  private validatePhoneNumber(phoneNumber: string): { isValid: boolean; formatted?: string; error?: string } {
    try {
      // Remover caracteres não numéricos
      const cleanNumber = phoneNumber.replace(/\D/g, '');

      // Verificar se é um número brasileiro
      if (cleanNumber.length === 11 && cleanNumber.startsWith('55')) {
        // Número já com código do país
        return {
          isValid: true,
          formatted: `+${cleanNumber}`,
        };
      } else if (cleanNumber.length === 11 && (cleanNumber.startsWith('11') || cleanNumber.startsWith('21'))) {
        // Número brasileiro sem código do país
        return {
          isValid: true,
          formatted: `+55${cleanNumber}`,
        };
      } else if (cleanNumber.length === 10 && (cleanNumber.startsWith('1') || cleanNumber.startsWith('2'))) {
        // Número brasileiro sem código do país e sem 9 no celular
        return {
          isValid: true,
          formatted: `+55${cleanNumber}`,
        };
      } else if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
        // Número internacional
        const formatted = cleanNumber.startsWith('55') ? `+${cleanNumber}` : `+55${cleanNumber}`;
        return {
          isValid: true,
          formatted,
        };
      }

      return {
        isValid: false,
        error: 'Formato de número inválido. Use formato brasileiro: (11) 99999-9999',
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Erro ao validar número de telefone',
      };
    }
  }

  // Criar mensagem SMS otimizada (máximo 160 caracteres)
  createOptimizedMessage(template: string, data: Record<string, any>): string {
    const templates: Record<string, string> = {
      'order-created': `InterAlpha: Nova ordem #{orderNumber} criada. Status: {status}. Acompanhe pelo sistema.`,
      'order-completed': `InterAlpha: Ordem #{orderNumber} concluída! Obrigado por escolher nossos serviços.`,
      'order-status-changed': `InterAlpha: Ordem #{orderNumber} - Status: {newStatus}. Detalhes no sistema.`,
      'payment-received': `InterAlpha: Pagamento de {amount} confirmado via {paymentMethod}. Obrigado!`,
      'payment-overdue': `InterAlpha: Pagamento de {amount} venceu há {daysOverdue} dias. Regularize sua situação.`,
      'technician-assigned': `InterAlpha: Técnico {technicianName} designado para ordem #{orderNumber}. Tel: {technicianPhone}`,
      'appointment-reminder': `InterAlpha: Lembrete - Agendamento amanhã às {time}. Ordem #{orderNumber}.`,
      'test': `InterAlpha: Teste de SMS - {timestamp}`,
    };

    let message = templates[template] || templates['test'];

    // Substituir variáveis na mensagem
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      if (message.includes(placeholder)) {
        let formattedValue = String(value);
        
        // Formatações específicas
        if (key === 'amount' && typeof value === 'number') {
          formattedValue = value.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          });
        } else if (key === 'timestamp' && value instanceof Date) {
          formattedValue = value.toLocaleString('pt-BR');
        }
        
        message = message.replace(placeholder, formattedValue);
      }
    });

    // Garantir que não exceda 160 caracteres
    if (message.length > 160) {
      message = message.substring(0, 157) + '...';
    }

    return message;
  }

  async testConnection(): Promise<boolean> {
    try {
      // Testar credenciais fazendo uma consulta simples
      await this.client.api.accounts(integrationConfig.twilio.accountSid).fetch();
      return true;
    } catch (error) {
      console.error('❌ Teste de conexão Twilio falhou:', error);
      return false;
    }
  }

  async sendTestSMS(to: string): Promise<boolean> {
    try {
      const result = await this.sendSMS({
        to,
        message: this.createOptimizedMessage('test', {
          timestamp: new Date(),
        }),
      });

      return result.success;
    } catch (error) {
      console.error('❌ Erro no teste de SMS:', error);
      return false;
    }
  }

  // Obter informações da conta Twilio
  async getAccountInfo(): Promise<any> {
    try {
      const account = await this.client.api.accounts(integrationConfig.twilio.accountSid).fetch();
      return {
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type,
      };
    } catch (error) {
      console.error('❌ Erro ao obter informações da conta:', error);
      return null;
    }
  }

  // Obter histórico de mensagens (últimas 20)
  async getMessageHistory(limit: number = 20): Promise<any[]> {
    try {
      const messages = await this.client.messages.list({ limit });
      return messages.map(msg => ({
        sid: msg.sid,
        to: msg.to,
        from: msg.from,
        body: msg.body,
        status: msg.status,
        direction: msg.direction,
        dateCreated: msg.dateCreated,
        price: msg.price,
        priceUnit: msg.priceUnit,
      }));
    } catch (error) {
      console.error('❌ Erro ao obter histórico de mensagens:', error);
      return [];
    }
  }
}

// Singleton instance
let smsServiceInstance: SMSService | null = null;

export function getSMSService(): SMSService {
  if (!smsServiceInstance) {
    smsServiceInstance = new SMSService();
  }
  return smsServiceInstance;
}