// 📱 SMS Service - Twilio Integration
// Serviço para envio de SMS via Twilio com backup e fallback
import prisma from '@/lib/prisma';

import { metricsService } from './metrics-service';

// 🔧 Interfaces e Tipos
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'twilio';
}

interface OrdemServico {
  id: string;
  numero_ordem: string;
  cliente_id: string;
  status: string;
  descricao_problema: string;
  valor_total?: number;
  data_criacao: string;
  data_conclusao?: string;
  tecnico_responsavel?: string;
}

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  celular?: string;
  email?: string;
}

// 🏗️ Classe Principal do Serviço SMS
export class SMSService {
  private config: TwilioConfig;

  constructor() {
    this.config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    };

    this.validateConfig();
  }

  // 🔍 Validação de Configuração
  private validateConfig(): void {
    const { accountSid, authToken, phoneNumber } = this.config;

    if (!accountSid || !authToken || !phoneNumber) {
      console.warn('⚠️ SMS Service: Configuração incompleta do Twilio');
      console.warn(
        'Variáveis necessárias: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER'
      );
    }
  }

  // 📱 Formatação de Número de Telefone
  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');

    // Se não tem código do país, adiciona +55 (Brasil)
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return `+55${cleaned}`;
    }

    if (cleaned.length === 10) {
      return `+55${cleaned}`;
    }

    // Se já tem código do país
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `+${cleaned}`;
    }

    // Se já tem + no início
    if (phone.startsWith('+')) {
      return phone;
    }

    return `+55${cleaned}`;
  }

  // 🚀 Envio de SMS Simples
  async sendSMS(to: string, message: string): Promise<SMSResponse> {
    return await metricsService.measureOperation(
      'sms',
      'sendSMS',
      async () => {
        try {
          const formattedPhone = this.formatPhoneNumber(to);

          const smsData: SMSMessage = {
            to: formattedPhone,
            body: message,
            from: this.config.phoneNumber,
          };

          const response = await this.sendToTwilio(smsData);

          // Registrar comunicação no banco
          await this.logCommunication({
            cliente_telefone: formattedPhone,
            tipo: 'sms',
            conteudo: message,
            status: response.success ? 'enviado' : 'erro',
            provider: 'twilio',
            message_id: response.messageId,
          });

          return response;
        } catch (error) {
          console.error('❌ Erro ao enviar SMS:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            provider: 'twilio',
          };
        }
      },
      {
        destinatario: to,
        tamanho_mensagem: message.length,
      }
    );
  }

  // 🔧 Envio para API do Twilio
  private async sendToTwilio(smsData: SMSMessage): Promise<SMSResponse> {
    try {
      const { accountSid, authToken } = this.config;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const body = new URLSearchParams({
        To: smsData.to,
        From: smsData.from || this.config.phoneNumber,
        Body: smsData.body,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: result.sid,
          provider: 'twilio',
        };
      }
      throw new Error(result.message || 'Erro na API do Twilio');

    } catch (error) {
      console.error('❌ Erro na API do Twilio:', error);
      throw error;
    }
  }

  // 📋 SMS para Ordem de Serviço
  async sendOrdemServicoSMS(
    ordemServico: OrdemServico,
    cliente: Cliente,
    tipo: 'criacao' | 'atualizacao' | 'conclusao'
  ): Promise<SMSResponse> {
    return await metricsService.measureOperation(
      'sms',
      'sendOrdemServicoSMS',
      async () => {
        try {
          const telefone = cliente.celular || cliente.telefone;

          if (!telefone) {
            throw new Error('Cliente não possui telefone cadastrado');
          }

          const message = this.generateOrdemServicoMessage(
            ordemServico,
            cliente,
            tipo
          );

          return await this.sendSMS(telefone, message);
        } catch (error) {
          console.error('❌ Erro ao enviar SMS de ordem de serviço:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            provider: 'twilio',
          };
        }
      },
      {
        numero_ordem: ordemServico.numero_ordem,
        tipo_sms: tipo,
        cliente_id: cliente.id,
        valor_total: ordemServico.valor_total,
      }
    );
  }

  // 📝 Geração de Mensagem para Ordem de Serviço
  private generateOrdemServicoMessage(
    ordemServico: OrdemServico,
    cliente: Cliente,
    tipo: 'criacao' | 'atualizacao' | 'conclusao'
  ): string {
    const nomeCliente = cliente.nome.split(' ')[0]; // Primeiro nome
    const numeroOrdem = ordemServico.numero_ordem;

    switch (tipo) {
      case 'criacao': {
        return `🔧 InterAlpha - Olá ${nomeCliente}! Sua ordem de serviço #${numeroOrdem} foi criada. Problema: ${ordemServico.descricao_problema}. Acompanhe o status pelo portal do cliente.`;
      }

      case 'atualizacao': {
        return `📱 InterAlpha - ${nomeCliente}, sua ordem #${numeroOrdem} foi atualizada. Status: ${ordemServico.status}. Acesse o portal para mais detalhes.`;
      }

      case 'conclusao': {
        const valor = ordemServico.valor_total
          ? ` Valor: R$ ${ordemServico.valor_total.toFixed(2)}.`
          : '';
        return `✅ InterAlpha - ${nomeCliente}, sua ordem #${numeroOrdem} foi concluída!${valor} Obrigado pela confiança!`;
      }

      default: {
        return `📱 InterAlpha - ${nomeCliente}, atualização sobre sua ordem #${numeroOrdem}. Status: ${ordemServico.status}.`;
      }
    }
  }

  // 📊 Registro de Comunicação no Banco
  // Note: This method is commented out as the comunicacoes_cliente table
  // may not exist in the current Prisma schema. Uncomment and adjust
  // when the table is added to the schema.
  private async logCommunication(data: {
    cliente_telefone: string;
    tipo: 'sms';
    conteudo: string;
    status: 'enviado' | 'erro';
    provider: 'twilio';
    message_id?: string;
  }): Promise<void> {
    try {
      // TODO: Add comunicacoes_cliente table to Prisma schema
      // await prisma.comunicacoesCliente.create({
      //   data: {
      //     clienteTelefone: data.cliente_telefone,
      //     tipo: data.tipo,
      //     conteudo: data.conteudo,
      //     status: data.status,
      //     provider: data.provider,
      //     messageId: data.message_id,
      //     dataEnvio: new Date(),
      //   },
      // });
      console.log('📱 SMS log:', data);
    } catch (error) {
      console.error('❌ Erro ao salvar log de comunicação:', error);
    }
  }

  // 🧪 Teste de Conexão
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return await metricsService.measureOperation(
      'sms',
      'testConnection',
      async () => {
        try {
          const { accountSid, authToken } = this.config;

          if (!accountSid || !authToken) {
            return {
              success: false,
              message: 'Configuração do Twilio incompleta',
            };
          }

          // Teste simples de autenticação
          const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;

          const response = await fetch(url, {
            headers: {
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            },
          });

          if (response.ok) {
            return {
              success: true,
              message: 'Conexão com Twilio estabelecida com sucesso',
            };
          }
          return {
            success: false,
            message: 'Falha na autenticação com Twilio',
          };

        } catch (error) {
          return {
            success: false,
            message: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          };
        }
      }
    );
  }

  // 📈 Templates de SMS Predefinidos
  static templates = {
    bemVindo: (nome: string) =>
      `🎉 Bem-vindo à InterAlpha, ${nome}! Estamos prontos para cuidar dos seus equipamentos Apple com excelência.`,

    lembreteManutencao: (nome: string, equipamento: string) =>
      `🔧 ${nome}, que tal agendar uma manutenção preventiva para seu ${equipamento}? Entre em contato conosco!`,

    promocao: (nome: string, desconto: string) =>
      `🎁 ${nome}, oferta especial! ${desconto} de desconto em serviços. Válido até o final do mês!`,

    agendamento: (nome: string, data: string, hora: string) =>
      `📅 ${nome}, seu agendamento está confirmado para ${data} às ${hora}. Aguardamos você!`,
  };
}

// 🚀 Instância Singleton
export const smsService = new SMSService();
