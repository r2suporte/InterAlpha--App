import twilio from 'twilio';
import { integrationConfig } from '@/lib/integrations/config';
import type { WhatsAppJob } from '@/lib/integrations/types';

export class WhatsAppService {
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
    
    this.fromNumber = integrationConfig.twilio.whatsappNumber;
    
    if (!this.fromNumber) {
      console.warn('⚠️  Número WhatsApp do Twilio não configurado');
    }

    console.log('✅ Serviço WhatsApp inicializado');
  }

  async sendMessage(whatsappData: WhatsAppJob): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      const { to, message, template, templateParams } = whatsappData;

      // Validar número de telefone
      const validatedNumber = this.validateWhatsAppNumber(to);
      if (!validatedNumber.isValid) {
        throw new Error(`Número WhatsApp inválido: ${validatedNumber.error}`);
      }

      let messageBody: string;
      let mediaUrl: string[] | undefined;

      // Se é um template, usar template do Twilio
      if (template && templateParams) {
        const result = await this.sendTemplate(validatedNumber.formatted, template, templateParams);
        return result;
      } else {
        messageBody = message;
      }

      // Enviar mensagem via Twilio WhatsApp
      const result = await this.client.messages.create({
        body: messageBody,
        from: this.fromNumber,
        to: validatedNumber.formatted,
        ...(mediaUrl && { mediaUrl }),
      });

      console.log(`✅ WhatsApp enviado para ${validatedNumber.formatted} - SID: ${result.sid}`);

      return {
        success: true,
        sid: result.sid,
      };
    } catch (error) {
      console.error('❌ Erro ao enviar WhatsApp:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  } 
 // Enviar template do WhatsApp
  async sendTemplate(to: string, templateName: string, params: any[]): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      // Templates do WhatsApp Business precisam ser pré-aprovados
      const approvedTemplates: Record<string, string> = {
        'order_created': 'Olá! Sua ordem #{1} foi criada com sucesso. Status: {2}. Acompanhe pelo nosso sistema.',
        'order_completed': 'Ótima notícia! Sua ordem #{1} foi concluída. Obrigado por escolher nossos serviços!',
        'payment_received': 'Pagamento confirmado! Recebemos {1} via {2}. Obrigado!',
        'appointment_reminder': 'Lembrete: Você tem um agendamento amanhã às {1} para a ordem #{2}.',
      };

      let messageBody = approvedTemplates[templateName];
      if (!messageBody) {
        throw new Error(`Template ${templateName} não encontrado`);
      }

      // Substituir parâmetros no template
      params.forEach((param, index) => {
        messageBody = messageBody.replace(`{${index + 1}}`, String(param));
      });

      const result = await this.client.messages.create({
        body: messageBody,
        from: this.fromNumber,
        to,
      });

      return {
        success: true,
        sid: result.sid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no template',
      };
    }
  }

  private validateWhatsAppNumber(phoneNumber: string): { isValid: boolean; formatted?: string; error?: string } {
    try {
      // Remover caracteres não numéricos
      const cleanNumber = phoneNumber.replace(/\D/g, '');

      // Verificar se é um número brasileiro
      if (cleanNumber.length === 13 && cleanNumber.startsWith('55')) {
        // Número já com código do país
        return {
          isValid: true,
          formatted: `whatsapp:+${cleanNumber}`,
        };
      } else if (cleanNumber.length === 11 && (cleanNumber.startsWith('11') || cleanNumber.startsWith('21'))) {
        // Número brasileiro sem código do país
        return {
          isValid: true,
          formatted: `whatsapp:+55${cleanNumber}`,
        };
      } else if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
        // Número internacional
        const formatted = cleanNumber.startsWith('55') ? `whatsapp:+${cleanNumber}` : `whatsapp:+55${cleanNumber}`;
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
        error: 'Erro ao validar número WhatsApp',
      };
    }
  } 
 async testConnection(): Promise<boolean> {
    try {
      // Testar credenciais fazendo uma consulta simples
      await this.client.api.accounts(integrationConfig.twilio.accountSid).fetch();
      return true;
    } catch (error) {
      console.error('❌ Teste de conexão WhatsApp falhou:', error);
      return false;
    }
  }

  async sendTestMessage(to: string): Promise<boolean> {
    try {
      const result = await this.sendMessage({
        to,
        message: `🧪 Teste WhatsApp - InterAlpha\n\nEste é um teste do sistema de WhatsApp.\n\nData: ${new Date().toLocaleString('pt-BR')}`,
      });

      return result.success;
    } catch (error) {
      console.error('❌ Erro no teste de WhatsApp:', error);
      return false;
    }
  }

  // Obter histórico de mensagens WhatsApp (últimas 20)
  async getMessageHistory(limit: number = 20): Promise<any[]> {
    try {
      const messages = await this.client.messages.list({ 
        limit,
        from: this.fromNumber,
      });
      
      return messages
        .filter(msg => msg.from.startsWith('whatsapp:') || msg.to.startsWith('whatsapp:'))
        .map(msg => ({
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
      console.error('❌ Erro ao obter histórico WhatsApp:', error);
      return [];
    }
  }

  // Processar webhook de mensagem recebida
  async handleIncomingMessage(webhookData: any): Promise<void> {
    try {
      const { From, To, Body, MessageSid, ProfileName } = webhookData;
      
      console.log(`📱 Mensagem WhatsApp recebida de ${From}: ${Body}`);

      // Salvar conversa no banco (será implementado na próxima etapa)
      await this.saveConversation({
        from: From,
        to: To,
        body: Body,
        messageSid: MessageSid,
        profileName: ProfileName,
        direction: 'inbound',
        timestamp: new Date(),
      });

      // Resposta automática simples (opcional)
      if (Body.toLowerCase().includes('oi') || Body.toLowerCase().includes('olá')) {
        await this.sendMessage({
          to: From,
          message: '👋 Olá! Obrigado por entrar em contato. Nossa equipe responderá em breve.',
        });
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem WhatsApp:', error);
    }
  }

  private async saveConversation(messageData: any): Promise<void> {
    // Placeholder - será implementado quando criarmos o schema do banco
    console.log('💾 Salvando conversa WhatsApp:', messageData);
  }
}

// Singleton instance
let whatsappServiceInstance: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService {
  if (!whatsappServiceInstance) {
    whatsappServiceInstance = new WhatsAppService();
  }
  return whatsappServiceInstance;
}