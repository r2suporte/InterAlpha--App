// 🚀 Communication Service - Sistema Inteligente de Comunicação
// Gerencia automaticamente a escolha entre WhatsApp, SMS e Email
import { createClient } from '@/lib/supabase/client';

import EmailService from './email-service';
import { metricsService } from './metrics-service';
import { SMSService } from './sms-service';
import WhatsAppService from './whatsapp-service';

// 🔧 Interfaces e Tipos
interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  celular?: string;
  email?: string;
  preferencia_comunicacao?: 'whatsapp' | 'sms' | 'email' | 'auto';
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

interface CommunicationResult {
  success: boolean;
  channel: 'whatsapp' | 'sms' | 'email';
  messageId?: string;
  error?: string;
  fallbackUsed?: boolean;
  attempts: {
    channel: string;
    success: boolean;
    error?: string;
  }[];
}

interface CommunicationOptions {
  forceChannel?: 'whatsapp' | 'sms' | 'email';
  enableFallback?: boolean;
  priority?: 'speed' | 'reliability' | 'cost';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

// 🏗️ Classe Principal do Serviço de Comunicação
export class CommunicationService {
  private whatsappService: WhatsAppService;
  private smsService: SMSService;
  private emailService: EmailService;
  private supabase = createClient();

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.smsService = new SMSService();
    this.emailService = new EmailService();
  }

  // 🧠 Algoritmo Inteligente de Escolha de Canal
  private selectOptimalChannel(
    cliente: Cliente,
    options: CommunicationOptions = {}
  ): 'whatsapp' | 'sms' | 'email' {
    // Se canal forçado, usar ele
    if (options.forceChannel) {
      return options.forceChannel;
    }

    // Verificar preferência do cliente
    if (
      cliente.preferencia_comunicacao &&
      cliente.preferencia_comunicacao !== 'auto'
    ) {
      return cliente.preferencia_comunicacao;
    }

    // Verificar disponibilidade de contatos
    const hasWhatsApp = !!(cliente.celular || cliente.telefone);
    const hasSMS = !!(cliente.celular || cliente.telefone);
    const hasEmail = !!cliente.email;

    // Algoritmo baseado em urgência e prioridade
    const { urgency = 'medium', priority = 'reliability' } = options;

    // Para urgência crítica ou alta, priorizar canais instantâneos
    if (urgency === 'critical' || urgency === 'high') {
      if (hasWhatsApp) return 'whatsapp';
      if (hasSMS) return 'sms';
      if (hasEmail) return 'email';
    }

    // Para prioridade de velocidade
    if (priority === 'speed') {
      if (hasWhatsApp) return 'whatsapp';
      if (hasSMS) return 'sms';
      if (hasEmail) return 'email';
    }

    // Para prioridade de custo
    if (priority === 'cost') {
      if (hasEmail) return 'email';
      if (hasWhatsApp) return 'whatsapp';
      if (hasSMS) return 'sms';
    }

    // Para prioridade de confiabilidade (padrão)
    if (hasEmail) return 'email';
    if (hasWhatsApp) return 'whatsapp';
    if (hasSMS) return 'sms';

    // Fallback padrão
    return 'email';
  }

  // 📱 Envio de Comunicação com Fallback Inteligente
  async sendCommunication(
    cliente: Cliente,
    message: string,
    subject?: string,
    options: CommunicationOptions = {}
  ): Promise<CommunicationResult> {
    const { enableFallback = true } = options;
    const primaryChannel = this.selectOptimalChannel(cliente, options);

    return await metricsService.measureOperation(
      'communication',
      'sendCommunication',
      async () => {
        const attempts: CommunicationResult['attempts'] = [];

        // Tentar envio no canal principal
        let result = await this.sendToChannel(
          primaryChannel,
          cliente,
          message,
          subject
        );
        attempts.push({
          channel: primaryChannel,
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          return {
            ...result,
            channel: primaryChannel,
            attempts,
          };
        }

        // Se falhou e fallback está habilitado, tentar outros canais
        if (!result.success && enableFallback) {
          const fallbackChannels = this.getFallbackChannels(
            primaryChannel,
            cliente
          );

          for (const channel of fallbackChannels) {
            result = await this.sendToChannel(
              channel,
              cliente,
              message,
              subject
            );
            attempts.push({
              channel,
              success: result.success,
              error: result.error,
            });

            if (result.success) {
              return {
                ...result,
                channel,
                fallbackUsed: true,
                attempts,
              };
            }
          }
        }

        // Se todos os canais falharam
        return {
          success: false,
          channel: primaryChannel,
          error: 'Falha em todos os canais de comunicação',
          attempts,
        };
      },
      {
        clienteId: cliente.id,
        primaryChannel,
        enableFallback,
        priority: options.priority,
        urgency: options.urgency,
      }
    );
  }

  // 🔄 Obter Canais de Fallback
  private getFallbackChannels(
    primaryChannel: 'whatsapp' | 'sms' | 'email',
    cliente: Cliente
  ): ('whatsapp' | 'sms' | 'email')[] {
  const channels: ('whatsapp' | 'sms' | 'email')[] = [];

    // Verificar disponibilidade de contatos
    const hasWhatsApp = !!(cliente.celular || cliente.telefone);
    const hasSMS = !!(cliente.celular || cliente.telefone);
    const hasEmail = !!cliente.email;

    // Definir ordem de fallback baseada no canal principal
  switch (primaryChannel) {
      case 'whatsapp':
        if (hasSMS) channels.push('sms');
        if (hasEmail) channels.push('email');
        break;

      case 'sms':
        if (hasWhatsApp) channels.push('whatsapp');
        if (hasEmail) channels.push('email');
        break;

      case 'email':
        if (hasWhatsApp) channels.push('whatsapp');
        if (hasSMS) channels.push('sms');
        break;
    }

  return channels;
  }

  // 📤 Envio para Canal Específico
  private async sendToChannel(
    channel: 'whatsapp' | 'sms' | 'email',
    cliente: Cliente,
    message: string,
    subject?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      switch (channel) {
        case 'whatsapp': {
          const telefone = cliente.celular || cliente.telefone;
          if (!telefone) {
            throw new Error('Cliente não possui telefone para WhatsApp');
          }
          const whatsappResult = await this.whatsappService.sendTextMessage(
            telefone,
            message
          );
          return {
            success: true,
            messageId: whatsappResult.messages[0]?.id,
            error: undefined,
          };
        }

        case 'sms': {
          const telefoneSMS = cliente.celular || cliente.telefone;
          if (!telefoneSMS) {
            throw new Error('Cliente não possui telefone para SMS');
          }
          const smsResult = await this.smsService.sendSMS(telefoneSMS, message);
          return {
            success: smsResult.success,
            messageId: smsResult.messageId,
            error: smsResult.error,
          };
        }

        case 'email': {
          if (!cliente.email) {
            throw new Error('Cliente não possui email');
          }

          // Criar objeto compatível com EmailService
          const ordemServicoEmail = {
            id: cliente.id,
            numero_os: 'COMUNICACAO',
            descricao: message,
            valor: 0,
            data_inicio: new Date().toISOString(),
            cliente: {
              nome: cliente.nome,
              email: cliente.email,
              telefone: cliente.telefone,
            },
          };

          const emailResult =
            await this.emailService.sendOrdemServicoEmail(ordemServicoEmail);
          return {
            success: true,
            messageId: emailResult?.messageId,
            error: undefined,
          };
        }

        default: {
          throw new Error(`Canal não suportado: ${channel}`);
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // 🔧 Comunicação para Ordem de Serviço
  async sendOrdemServicoCommunication(
    ordemServico: OrdemServico,
    cliente: Cliente,
    tipo: 'criacao' | 'atualizacao' | 'conclusao',
    options: CommunicationOptions = {}
  ): Promise<CommunicationResult> {
    return await metricsService.measureOperation(
      'communication',
      'sendOrdemServicoCommunication',
      async () => {
        // Definir urgência baseada no tipo
        const urgencyMap = {
          criacao: 'medium' as const,
          atualizacao: 'low' as const,
          conclusao: 'high' as const,
        };

        const communicationOptions: CommunicationOptions = {
          urgency: urgencyMap[tipo],
          enableFallback: true,
          priority: 'reliability',
          ...options,
        };

        // Gerar mensagem baseada no canal
        const selectedChannel = this.selectOptimalChannel(
          cliente,
          communicationOptions
        );
        const { message, subject } = this.generateOrdemServicoContent(
          ordemServico,
          cliente,
          tipo,
          selectedChannel
        );

        return await this.sendCommunication(
          cliente,
          message,
          subject,
          communicationOptions
        );
      },
      {
        ordemServicoId: ordemServico.id,
        numeroOrdem: ordemServico.numero_ordem,
        clienteId: cliente.id,
        tipo,
        valorTotal: ordemServico.valor_total,
      }
    );
  }

  // 📝 Geração de Conteúdo para Ordem de Serviço
  private generateOrdemServicoContent(
    ordemServico: OrdemServico,
    cliente: Cliente,
    tipo: 'criacao' | 'atualizacao' | 'conclusao',
    channel: 'whatsapp' | 'sms' | 'email'
  ): { message: string; subject?: string } {
    const nomeCliente = cliente.nome.split(' ')[0];
    const numeroOrdem = ordemServico.numero_ordem;

    // Conteúdo específico por canal
    switch (channel) {
      case 'whatsapp': {
        return this.generateWhatsAppContent(ordemServico, nomeCliente, tipo);
      }

      case 'sms': {
        return this.generateSMSContent(ordemServico, nomeCliente, tipo);
      }

      case 'email': {
        return this.generateEmailContent(ordemServico, cliente, tipo);
      }

      default: {
        return { message: `Atualização sobre ordem #${numeroOrdem}` };
      }
    }
  }

  // 📱 Conteúdo para WhatsApp
  private generateWhatsAppContent(
    ordemServico: OrdemServico,
    nomeCliente: string,
    tipo: 'criacao' | 'atualizacao' | 'conclusao'
  ): { message: string } {
    const numeroOrdem = ordemServico.numero_ordem;

    switch (tipo) {
      case 'criacao': {
        return {
          message: `🔧 *InterAlpha - Nova Ordem de Serviço*\n\nOlá ${nomeCliente}!\n\nSua ordem de serviço *#${numeroOrdem}* foi criada com sucesso.\n\n📋 *Problema:* ${ordemServico.descricao_problema}\n📅 *Data:* ${new Date(ordemServico.data_criacao).toLocaleDateString('pt-BR')}\n\nAcompanhe o status pelo nosso portal do cliente.\n\n_InterAlpha - Especialistas em Apple_ 🍎`,
        };
      }

      case 'atualizacao': {
        return {
          message: `📱 *InterAlpha - Atualização*\n\n${nomeCliente}, sua ordem *#${numeroOrdem}* foi atualizada.\n\n🔄 *Status:* ${ordemServico.status}\n\nAcesse o portal para mais detalhes.\n\n_InterAlpha - Especialistas em Apple_ 🍎`,
        };
      }

      case 'conclusao': {
        const valor = ordemServico.valor_total
          ? `\n💰 *Valor:* R$ ${ordemServico.valor_total.toFixed(2)}`
          : '';
        return {
          message: `✅ *InterAlpha - Serviço Concluído*\n\n${nomeCliente}, sua ordem *#${numeroOrdem}* foi concluída!${valor}\n\n🎉 Obrigado pela confiança!\n\n_InterAlpha - Especialistas em Apple_ 🍎`,
        };
      }
    }
  }

  // 📱 Conteúdo para SMS
  private generateSMSContent(
    ordemServico: OrdemServico,
    nomeCliente: string,
    tipo: 'criacao' | 'atualizacao' | 'conclusao'
  ): { message: string } {
    const numeroOrdem = ordemServico.numero_ordem;

    switch (tipo) {
      case 'criacao': {
        return {
          message: `🔧 InterAlpha - ${nomeCliente}, ordem #${numeroOrdem} criada. Problema: ${ordemServico.descricao_problema}. Acompanhe pelo portal.`,
        };
      }

      case 'atualizacao': {
        return {
          message: `📱 InterAlpha - ${nomeCliente}, ordem #${numeroOrdem} atualizada. Status: ${ordemServico.status}. Acesse o portal.`,
        };
      }

      case 'conclusao': {
        const valor = ordemServico.valor_total
          ? ` Valor: R$ ${ordemServico.valor_total.toFixed(2)}.`
          : '';
        return {
          message: `✅ InterAlpha - ${nomeCliente}, ordem #${numeroOrdem} concluída!${valor} Obrigado!`,
        };
      }
    }
  }

  // 📧 Conteúdo para Email
  private generateEmailContent(
    ordemServico: OrdemServico,
    cliente: Cliente,
    tipo: 'criacao' | 'atualizacao' | 'conclusao'
  ): { message: string; subject: string } {
    const numeroOrdem = ordemServico.numero_ordem;

    switch (tipo) {
      case 'criacao': {
        return {
          subject: `InterAlpha - Nova Ordem de Serviço #${numeroOrdem}`,
          message: `
            <h2>🔧 Nova Ordem de Serviço</h2>
            <p>Olá <strong>${cliente.nome}</strong>,</p>
            <p>Sua ordem de serviço <strong>#${numeroOrdem}</strong> foi criada com sucesso.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Detalhes da Ordem</h3>
              <p><strong>Número:</strong> #${numeroOrdem}</p>
              <p><strong>Problema:</strong> ${ordemServico.descricao_problema}</p>
              <p><strong>Data de Criação:</strong> ${new Date(ordemServico.data_criacao).toLocaleDateString('pt-BR')}</p>
              <p><strong>Status:</strong> ${ordemServico.status}</p>
            </div>
            
            <p>Acompanhe o status da sua ordem através do nosso portal do cliente.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe InterAlpha</strong><br>
            <em>Especialistas em Apple</em> 🍎</p>
          `,
        };
      }

      case 'atualizacao': {
        return {
          subject: `InterAlpha - Atualização da Ordem #${numeroOrdem}`,
          message: `
            <h2>📱 Atualização da Ordem de Serviço</h2>
            <p>Olá <strong>${cliente.nome}</strong>,</p>
            <p>Sua ordem de serviço <strong>#${numeroOrdem}</strong> foi atualizada.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>🔄 Status Atual</h3>
              <p><strong>Status:</strong> ${ordemServico.status}</p>
              <p><strong>Técnico Responsável:</strong> ${ordemServico.tecnico_responsavel || 'A definir'}</p>
            </div>
            
            <p>Acesse o portal do cliente para mais detalhes.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe InterAlpha</strong><br>
            <em>Especialistas em Apple</em> 🍎</p>
          `,
        };
      }

      case 'conclusao': {
        const valor = ordemServico.valor_total
          ? `<p><strong>Valor Total:</strong> R$ ${ordemServico.valor_total.toFixed(2)}</p>`
          : '';
        return {
          subject: `InterAlpha - Ordem #${numeroOrdem} Concluída ✅`,
          message: `
            <h2>✅ Ordem de Serviço Concluída</h2>
            <p>Olá <strong>${cliente.nome}</strong>,</p>
            <p>Temos o prazer de informar que sua ordem de serviço <strong>#${numeroOrdem}</strong> foi concluída!</p>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <h3>🎉 Serviço Finalizado</h3>
              <p><strong>Data de Conclusão:</strong> ${ordemServico.data_conclusao ? new Date(ordemServico.data_conclusao).toLocaleDateString('pt-BR') : 'Hoje'}</p>
              <p><strong>Técnico Responsável:</strong> ${ordemServico.tecnico_responsavel || 'Equipe InterAlpha'}</p>
              ${valor}
            </div>
            
            <p>Obrigado pela confiança em nossos serviços!</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe InterAlpha</strong><br>
            <em>Especialistas em Apple</em> 🍎</p>
          `,
        };
      }

      default: {
        return {
          subject: `InterAlpha - Ordem #${numeroOrdem}`,
          message: `<p>Atualização sobre sua ordem #${numeroOrdem}.</p>`,
        };
      }
    }
  }

  // 📊 Estatísticas de Comunicação
  async getCommunicationStats(clienteId?: string): Promise<{
    total: number;
    byChannel: Record<string, number>;
    successRate: number;
    lastWeek: number;
  }> {
    try {
      let query = this.supabase
        .from('comunicacoes_cliente')
        .select('tipo, status, data_envio');

      if (clienteId) {
        // Buscar telefone/email do cliente para filtrar
        const { data: cliente } = await this.supabase
          .from('clientes')
          .select('telefone, celular, email')
          .eq('id', clienteId)
          .single();

        if (cliente) {
          const contacts = [
            cliente.telefone,
            cliente.celular,
            cliente.email,
          ].filter(Boolean);
          query = query.in('cliente_telefone', contacts);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      type CommRow = { tipo: string; status: string; data_envio?: string | null };

      const rows: CommRow[] = (data || []) as CommRow[];

      const total = rows.length;

      const byChannel = rows.reduce((acc: Record<string, number>, item) => {
        acc[item.tipo] = (acc[item.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const successful = rows.filter((item) => item.status === 'enviado').length;
      const successRate = total > 0 ? (successful / total) * 100 : 0;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const lastWeek = rows.filter((item) => {
        if (!item.data_envio) return false;
        const date = new Date(item.data_envio);
        return date >= weekAgo;
      }).length;

      return {
        total,
        byChannel,
        successRate,
        lastWeek,
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        total: 0,
        byChannel: {},
        successRate: 0,
        lastWeek: 0,
      };
    }
  }

  // 🧪 Teste de Todos os Canais
  async testAllChannels(): Promise<{
    whatsapp: { success: boolean; message: string };
    sms: { success: boolean; message: string };
    email: { success: boolean; message: string };
  }> {
    const [whatsappTest, smsTest, emailTestResult] = await Promise.all([
      this.whatsappService.testConnection(),
      this.smsService.testConnection(),
      this.emailService.testConnection(),
    ]);

    const emailTest = {
      success: emailTestResult,
      message: emailTestResult
        ? 'Email configurado corretamente'
        : 'Erro na configuração do email',
    };

    return {
      whatsapp: whatsappTest,
      sms: smsTest,
      email: emailTest,
    };
  }
}

// 🚀 Instância Singleton
export const communicationService = new CommunicationService();
