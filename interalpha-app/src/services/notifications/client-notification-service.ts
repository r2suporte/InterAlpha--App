import nodemailer from 'nodemailer'
import { ClientAccessKey } from '@/types/auth'

export interface NotificationTemplate {
  subject: string
  htmlContent: string
  textContent: string
  smsContent: string
}

export interface ClientNotificationData {
  clientName: string
  clientEmail: string
  clientPhone?: string
  accessKey: string
  expiresAt: Date
  portalUrl: string
  companyName: string
}

export class ClientNotificationService {
  private emailTransporter: nodemailer.Transporter | null = null

  constructor() {
    // Inicialização lazy
  }

  private getEmailTransporter() {
    if (!this.emailTransporter) {
      this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
      })
    }
    return this.emailTransporter
  }

  async sendAccessKeyNotification(
    client: any,
    accessKey: ClientAccessKey,
    generatedBy?: string
  ): Promise<{
    emailSent: boolean
    smsSent: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let emailSent = false
    let smsSent = false

    try {
      const notificationData: ClientNotificationData = {
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        accessKey: accessKey.key,
        expiresAt: accessKey.expiresAt,
        portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/client?key=${accessKey.key}`,
        companyName: 'InterAlpha'
      }

      // Enviar por email
      if (client.email) {
        try {
          await this.sendEmailNotification(notificationData)
          emailSent = true
        } catch (error) {
          errors.push(`Erro no envio de email: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        }
      }

      // Enviar por SMS se habilitado
      if (client.phone && client.preferences?.smsNotifications) {
        try {
          await this.sendSMSNotification(notificationData)
          smsSent = true
        } catch (error) {
          errors.push(`Erro no envio de SMS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        }
      }

      // Log da notificação
      await this.logNotification({
        clientId: client.id,
        type: 'access_key',
        channels: {
          email: emailSent,
          sms: smsSent
        },
        generatedBy,
        errors
      })

      return { emailSent, smsSent, errors }

    } catch (error) {
      errors.push(`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      return { emailSent: false, smsSent: false, errors }
    }
  }

  async sendKeyExpirationWarning(
    client: any,
    hoursUntilExpiration: number
  ): Promise<boolean> {
    try {
      const template = this.getExpirationWarningTemplate(hoursUntilExpiration)
      
      const notificationData: ClientNotificationData = {
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        accessKey: '', // Não incluir chave no aviso
        expiresAt: new Date(Date.now() + hoursUntilExpiration * 60 * 60 * 1000),
        portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/client/request-access`,
        companyName: 'InterAlpha'
      }

      if (client.email) {
        await this.sendCustomEmailNotification(client.email, template, notificationData)
      }

      return true
    } catch (error) {
      console.error('Error sending expiration warning:', error)
      return false
    }
  }

  private async sendEmailNotification(data: ClientNotificationData): Promise<void> {
    const template = this.getAccessKeyEmailTemplate()
    
    const mailOptions = {
      from: `"${data.companyName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.clientEmail,
      subject: template.subject,
      html: this.replaceTemplateVariables(template.htmlContent, data),
      text: this.replaceTemplateVariables(template.textContent, data)
    }

    await this.getEmailTransporter().sendMail(mailOptions)
  }

  private async sendCustomEmailNotification(
    email: string,
    template: NotificationTemplate,
    data: ClientNotificationData
  ): Promise<void> {
    const mailOptions = {
      from: `"${data.companyName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: this.replaceTemplateVariables(template.subject, data),
      html: this.replaceTemplateVariables(template.htmlContent, data),
      text: this.replaceTemplateVariables(template.textContent, data)
    }

    await this.getEmailTransporter().sendMail(mailOptions)
  }

  private async sendSMSNotification(data: ClientNotificationData): Promise<void> {
    // Implementar integração com serviço de SMS (Twilio, AWS SNS, etc.)
    const template = this.getAccessKeySMSTemplate()
    const message = this.replaceTemplateVariables(template.smsContent, data)

    // TODO: Implementar envio real de SMS
    console.log('SMS would be sent:', {
      to: data.clientPhone,
      message
    })

    // Exemplo com Twilio:
    // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE,
    //   to: data.clientPhone
    // })
  }

  private getAccessKeyEmailTemplate(): NotificationTemplate {
    return {
      subject: 'Sua chave de acesso ao portal {{companyName}}',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Chave de Acesso - {{companyName}}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9fafb; }
            .key-box { background: white; border: 2px solid #2563eb; padding: 20px; margin: 20px 0; text-align: center; }
            .key { font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{companyName}}</h1>
              <p>Portal do Cliente</p>
            </div>
            
            <div class="content">
              <h2>Olá, {{clientName}}!</h2>
              
              <p>Sua chave de acesso ao portal foi gerada com sucesso. Use a chave abaixo para acessar seus dados:</p>
              
              <div class="key-box">
                <div class="key">{{accessKey}}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Esta chave é válida até <strong>{{expiresAt}}</strong> (24 horas).
              </div>
              
              <p>Clique no botão abaixo para acessar o portal:</p>
              
              <a href="{{portalUrl}}" class="button">Acessar Portal</a>
              
              <p><strong>O que você pode fazer no portal:</strong></p>
              <ul>
                <li>Visualizar suas ordens de serviço</li>
                <li>Acompanhar status de pagamentos</li>
                <li>Baixar documentos e relatórios</li>
                <li>Entrar em contato conosco</li>
              </ul>
              
              <p>Se você não solicitou este acesso, ignore este email.</p>
            </div>
            
            <div class="footer">
              <p>{{companyName}} - Sistema de Gestão</p>
              <p>Este é um email automático, não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
        {{companyName}} - Portal do Cliente
        
        Olá, {{clientName}}!
        
        Sua chave de acesso: {{accessKey}}
        
        Válida até: {{expiresAt}}
        
        Acesse o portal em: {{portalUrl}}
        
        Esta chave expira em 24 horas.
        
        Se você não solicitou este acesso, ignore este email.
      `,
      smsContent: `{{companyName}}: Sua chave de acesso é {{accessKey}}. Válida até {{expiresAt}}. Acesse: {{portalUrl}}`
    }
  }

  private getExpirationWarningTemplate(hours: number): NotificationTemplate {
    return {
      subject: 'Sua chave de acesso expira em {{hours}} horas',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Aviso de Expiração - {{companyName}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
              <h1>⚠️ Aviso de Expiração</h1>
            </div>
            
            <div style="padding: 30px 20px; background: #f9fafb;">
              <h2>Olá, {{clientName}}!</h2>
              
              <p>Sua chave de acesso ao portal {{companyName}} expira em <strong>${hours} horas</strong>.</p>
              
              <p>Se você ainda precisa acessar o portal, solicite uma nova chave de acesso:</p>
              
              <a href="{{portalUrl}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Solicitar Nova Chave
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
        {{companyName}} - Aviso de Expiração
        
        Olá, {{clientName}}!
        
        Sua chave de acesso expira em ${hours} horas.
        
        Solicite uma nova chave em: {{portalUrl}}
      `,
      smsContent: `{{companyName}}: Sua chave expira em ${hours}h. Solicite nova chave em {{portalUrl}}`
    }
  }

  private getAccessKeySMSTemplate(): NotificationTemplate {
    return {
      subject: '',
      htmlContent: '',
      textContent: '',
      smsContent: '{{companyName}}: Chave de acesso {{accessKey}}. Válida até {{expiresAt}}. Portal: {{portalUrl}}'
    }
  }

  private replaceTemplateVariables(template: string, data: ClientNotificationData): string {
    return template
      .replace(/\{\{clientName\}\}/g, data.clientName)
      .replace(/\{\{clientEmail\}\}/g, data.clientEmail)
      .replace(/\{\{accessKey\}\}/g, data.accessKey)
      .replace(/\{\{expiresAt\}\}/g, data.expiresAt.toLocaleString('pt-BR'))
      .replace(/\{\{portalUrl\}\}/g, data.portalUrl)
      .replace(/\{\{companyName\}\}/g, data.companyName)
  }

  private async logNotification(logData: {
    clientId: string
    type: string
    channels: { email: boolean; sms: boolean }
    generatedBy?: string
    errors: string[]
  }): Promise<void> {
    // TODO: Implementar log de notificações
    console.log('Notification log:', logData)
  }
}

export const clientNotificationService = new ClientNotificationService()