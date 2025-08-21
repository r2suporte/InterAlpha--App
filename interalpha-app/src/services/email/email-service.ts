import nodemailer from 'nodemailer';
import { integrationConfig } from '@/lib/integrations/config';
import type { EmailJob } from '@/lib/integrations/types';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Inicialização lazy - verificar conexão apenas quando necessário
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
      host: integrationConfig.email.smtp.host,
      port: integrationConfig.email.smtp.port,
      secure: integrationConfig.email.smtp.secure,
      auth: {
        user: integrationConfig.email.smtp.auth.user,
        pass: integrationConfig.email.smtp.auth.pass,
      },
      // Configurações adicionais para melhor confiabilidade
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
      });
    }
    return this.transporter;
  }

  private async verifyConnection() {
    try {
      await this.getTransporter().verify();
      console.log('✅ Conexão SMTP verificada com sucesso');
    } catch (error) {
      console.error('❌ Erro na verificação SMTP:', error);
    }
  }

  async sendEmail(emailData: EmailJob): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { to, subject, template, data } = emailData;

      // Renderizar template
      const { html, text } = await this.renderTemplate(template, data);

      // Configurar email
      const mailOptions = {
        from: integrationConfig.email.from,
        to,
        subject,
        html,
        text,
        // Headers adicionais para melhor deliverability
        headers: {
          'X-Mailer': 'InterAlpha System',
          'X-Priority': '3',
        },
      };

      // Enviar email
      const result = await this.getTransporter().sendMail(mailOptions);

      console.log(`✅ Email enviado para ${to} - MessageID: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  private async renderTemplate(templateName: string, data: Record<string, any>): Promise<{ html: string; text: string }> {
    try {
      // Importar template engine
      const { renderEmailTemplate } = await import('./templates/template-engine');
      
      const html = await renderEmailTemplate(templateName, data);
      const text = this.htmlToText(html);

      return { html, text };
    } catch (error) {
      console.error(`❌ Erro ao renderizar template ${templateName}:`, error);
      
      // Fallback para template simples
      const fallbackHtml = this.createFallbackTemplate(data);
      const fallbackText = this.htmlToText(fallbackHtml);
      
      return { html: fallbackHtml, text: fallbackText };
    }
  }

  private createFallbackTemplate(data: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>InterAlpha</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>InterAlpha</h1>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Você recebeu uma notificação do sistema InterAlpha.</p>
              ${Object.entries(data).map(([key, value]) => 
                `<p><strong>${key}:</strong> ${value}</p>`
              ).join('')}
            </div>
            <div class="footer">
              <p>Este é um email automático do sistema InterAlpha.</p>
              <p>Por favor, não responda este email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private htmlToText(html: string): string {
    // Conversão simples de HTML para texto
    return html
      .replace(/<[^>]*>/g, '') // Remove tags HTML
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getTransporter().verify();
      return true;
    } catch (error) {
      console.error('❌ Teste de conexão SMTP falhou:', error);
      return false;
    }
  }

  async sendTestEmail(to: string): Promise<boolean> {
    try {
      const result = await this.sendEmail({
        to,
        subject: 'Teste de Email - InterAlpha',
        template: 'test',
        data: {
          timestamp: new Date().toISOString(),
          message: 'Este é um email de teste do sistema InterAlpha.',
        },
      });

      return result.success;
    } catch (error) {
      console.error('❌ Erro no teste de email:', error);
      return false;
    }
  }

  // Método para fechar conexões (cleanup)
  async close(): Promise<void> {
    this.getTransporter().close();
    console.log('📧 Conexões SMTP fechadas');
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}