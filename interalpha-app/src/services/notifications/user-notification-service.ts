import nodemailer from 'nodemailer'
import { Employee, EmployeeRole } from '@/types/auth'
import { EmployeeInvitation } from '@/types/user-management'

export interface WelcomeEmailData {
  employeeName: string
  employeeEmail: string
  temporaryPassword: string
  role: EmployeeRole
  loginUrl: string
  companyName: string
}

export interface InvitationEmailData {
  invitedEmail: string
  inviterName: string
  role: EmployeeRole
  invitationUrl: string
  expiresAt: Date
  companyName: string
}

export class UserNotificationService {
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

  async sendWelcomeEmail(employee: Employee, temporaryPassword: string): Promise<boolean> {
    try {
      const emailData: WelcomeEmailData = {
        employeeName: employee.name,
        employeeEmail: employee.email,
        temporaryPassword,
        role: employee.role,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/employee/login`,
        companyName: 'InterAlpha'
      }

      const template = this.getWelcomeEmailTemplate()
      
      const mailOptions = {
        from: `"${emailData.companyName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: employee.email,
        subject: this.replaceVariables(template.subject, emailData),
        html: this.replaceVariables(template.htmlContent, emailData),
        text: this.replaceVariables(template.textContent, emailData)
      }

      await this.getEmailTransporter().sendMail(mailOptions)
      
      await this.logNotification({
        type: 'welcome_email',
        userId: employee.id,
        email: employee.email,
        success: true
      })

      return true

    } catch (error) {
      console.error('Error sending welcome email:', error)
      
      await this.logNotification({
        type: 'welcome_email',
        userId: employee.id,
        email: employee.email,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return false
    }
  }

  async sendInvitationEmail(invitation: EmployeeInvitation, inviterName: string): Promise<boolean> {
    try {
      const emailData: InvitationEmailData = {
        invitedEmail: invitation.email,
        inviterName,
        role: invitation.role,
        invitationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/invitation/accept?token=${invitation.token}`,
        expiresAt: invitation.expiresAt,
        companyName: 'InterAlpha'
      }

      const template = this.getInvitationEmailTemplate()
      
      const mailOptions = {
        from: `"${emailData.companyName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: invitation.email,
        subject: this.replaceVariables(template.subject, emailData),
        html: this.replaceVariables(template.htmlContent, emailData),
        text: this.replaceVariables(template.textContent, emailData)
      }

      await this.getEmailTransporter().sendMail(mailOptions)
      
      await this.logNotification({
        type: 'invitation_email',
        invitationId: invitation.id,
        email: invitation.email,
        success: true
      })

      return true

    } catch (error) {
      console.error('Error sending invitation email:', error)
      
      await this.logNotification({
        type: 'invitation_email',
        invitationId: invitation.id,
        email: invitation.email,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return false
    }
  }

  async sendPasswordResetEmail(employee: Employee, resetToken: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/reset-password?token=${resetToken}`
      
      const template = this.getPasswordResetTemplate()
      const emailData = {
        employeeName: employee.name,
        resetUrl,
        expiresIn: '1 hora',
        companyName: 'InterAlpha'
      }
      
      const mailOptions = {
        from: `"InterAlpha" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: employee.email,
        subject: this.replaceVariables(template.subject, emailData),
        html: this.replaceVariables(template.htmlContent, emailData),
        text: this.replaceVariables(template.textContent, emailData)
      }

      await this.getEmailTransporter().sendMail(mailOptions)
      
      await this.logNotification({
        type: 'password_reset_email',
        userId: employee.id,
        email: employee.email,
        success: true
      })

      return true

    } catch (error) {
      console.error('Error sending password reset email:', error)
      return false
    }
  }

  async sendRoleChangeNotification(employee: Employee, oldRole: EmployeeRole, newRole: EmployeeRole, changedBy: string): Promise<boolean> {
    try {
      const template = this.getRoleChangeTemplate()
      const emailData = {
        employeeName: employee.name,
        oldRole: this.getRoleDisplayName(oldRole),
        newRole: this.getRoleDisplayName(newRole),
        changedBy,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/employee/login`,
        companyName: 'InterAlpha'
      }
      
      const mailOptions = {
        from: `"InterAlpha" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: employee.email,
        subject: this.replaceVariables(template.subject, emailData),
        html: this.replaceVariables(template.htmlContent, emailData),
        text: this.replaceVariables(template.textContent, emailData)
      }

      await this.getEmailTransporter().sendMail(mailOptions)
      return true

    } catch (error) {
      console.error('Error sending role change notification:', error)
      return false
    }
  }

  // Templates de email

  private getWelcomeEmailTemplate() {
    return {
      subject: 'Bem-vindo à equipe {{companyName}}!',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bem-vindo - {{companyName}}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px 20px; background: #f8f9fa; }
            .credentials-box { background: white; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .credential-item { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #667eea; }
            .credential-value { font-family: monospace; background: #f1f3f4; padding: 5px 10px; border-radius: 4px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo à {{companyName}}!</h1>
              <p>Você foi adicionado como {{role}}</p>
            </div>
            
            <div class="content">
              <h2>Olá, {{employeeName}}!</h2>
              
              <p>É com grande prazer que damos as boas-vindas à equipe {{companyName}}! Sua conta foi criada com sucesso.</p>
              
              <div class="credentials-box">
                <h3>🔐 Suas credenciais de acesso:</h3>
                <div class="credential-item">
                  <div class="credential-label">Email:</div>
                  <div class="credential-value">{{employeeEmail}}</div>
                </div>
                <div class="credential-item">
                  <div class="credential-label">Senha temporária:</div>
                  <div class="credential-value">{{temporaryPassword}}</div>
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Por segurança, altere sua senha no primeiro acesso.
              </div>
              
              <p>Clique no botão abaixo para fazer seu primeiro login:</p>
              
              <a href="{{loginUrl}}" class="button">Fazer Login</a>
              
              <p><strong>Como funcionário {{role}}, você terá acesso a:</strong></p>
              <ul>
                <li>Dashboard personalizado</li>
                <li>Ferramentas específicas do seu cargo</li>
                <li>Sistema de notificações</li>
                <li>Suporte da equipe</li>
              </ul>
              
              <p>Se você tiver dúvidas, não hesite em entrar em contato conosco.</p>
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
        Bem-vindo à {{companyName}}!
        
        Olá, {{employeeName}}!
        
        Sua conta foi criada como {{role}}.
        
        Credenciais de acesso:
        Email: {{employeeEmail}}
        Senha temporária: {{temporaryPassword}}
        
        IMPORTANTE: Altere sua senha no primeiro acesso.
        
        Faça login em: {{loginUrl}}
        
        Bem-vindo à equipe!
      `
    }
  }

  private getInvitationEmailTemplate() {
    return {
      subject: 'Convite para integrar a equipe {{companyName}}',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Convite - {{companyName}}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px 20px; background: #f8f9fa; }
            .invitation-box { background: white; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .expiry { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Convite Especial</h1>
              <p>Você foi convidado para integrar nossa equipe!</p>
            </div>
            
            <div class="content">
              <h2>Olá!</h2>
              
              <p><strong>{{inviterName}}</strong> convidou você para fazer parte da equipe {{companyName}} como <strong>{{role}}</strong>.</p>
              
              <div class="invitation-box">
                <h3>🚀 Pronto para começar?</h3>
                <p>Clique no botão abaixo para aceitar o convite e criar sua conta:</p>
                <a href="{{invitationUrl}}" class="button">Aceitar Convite</a>
              </div>
              
              <div class="expiry">
                <strong>⏰ Atenção:</strong> Este convite expira em {{expiresAt}}.
              </div>
              
              <p><strong>O que você encontrará na {{companyName}}:</strong></p>
              <ul>
                <li>Ambiente de trabalho colaborativo</li>
                <li>Ferramentas modernas e eficientes</li>
                <li>Equipe dedicada e profissional</li>
                <li>Oportunidades de crescimento</li>
              </ul>
              
              <p>Estamos ansiosos para tê-lo em nossa equipe!</p>
            </div>
            
            <div class="footer">
              <p>{{companyName}} - Sistema de Gestão</p>
              <p>Se você não esperava este convite, pode ignorar este email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Convite para integrar a equipe {{companyName}}
        
        Olá!
        
        {{inviterName}} convidou você para fazer parte da equipe {{companyName}} como {{role}}.
        
        Para aceitar o convite, acesse: {{invitationUrl}}
        
        ATENÇÃO: Este convite expira em {{expiresAt}}.
        
        Estamos ansiosos para tê-lo em nossa equipe!
        
        {{companyName}}
      `
    }
  }

  private getPasswordResetTemplate() {
    return {
      subject: 'Redefinição de senha - {{companyName}}',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Redefinir Senha - {{companyName}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
              <h1>🔒 Redefinição de Senha</h1>
            </div>
            
            <div style="padding: 20px;">
              <h2>Olá, {{employeeName}}!</h2>
              
              <p>Recebemos uma solicitação para redefinir sua senha.</p>
              
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              
              <a href="{{resetUrl}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Redefinir Senha
              </a>
              
              <p><strong>Este link expira em {{expiresIn}}.</strong></p>
              
              <p>Se você não solicitou esta redefinição, ignore este email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Redefinição de Senha - {{companyName}}
        
        Olá, {{employeeName}}!
        
        Recebemos uma solicitação para redefinir sua senha.
        
        Acesse o link para criar uma nova senha: {{resetUrl}}
        
        Este link expira em {{expiresIn}}.
        
        Se você não solicitou esta redefinição, ignore este email.
      `
    }
  }

  private getRoleChangeTemplate() {
    return {
      subject: 'Seu role foi atualizado - {{companyName}}',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Role Atualizado - {{companyName}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>🔄 Role Atualizado</h1>
            
            <p>Olá, {{employeeName}}!</p>
            
            <p>Seu role no sistema foi atualizado por {{changedBy}}.</p>
            
            <p><strong>Role anterior:</strong> {{oldRole}}</p>
            <p><strong>Novo role:</strong> {{newRole}}</p>
            
            <p>Suas novas permissões já estão ativas. Faça login para ver as mudanças:</p>
            
            <a href="{{loginUrl}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Fazer Login
            </a>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Role Atualizado - {{companyName}}
        
        Olá, {{employeeName}}!
        
        Seu role foi atualizado por {{changedBy}}.
        
        Role anterior: {{oldRole}}
        Novo role: {{newRole}}
        
        Faça login para ver as mudanças: {{loginUrl}}
      `
    }
  }

  private replaceVariables(template: string, data: any): string {
    let result = template
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, String(value))
    }
    return result
  }

  private getRoleDisplayName(role: EmployeeRole): string {
    const roleNames = {
      [EmployeeRole.ATENDENTE]: 'Atendente',
      [EmployeeRole.TECNICO]: 'Técnico',
      [EmployeeRole.SUPERVISOR_TECNICO]: 'Supervisor Técnico',
      [EmployeeRole.GERENTE_ADM]: 'Gerente Administrativo',
      [EmployeeRole.GERENTE_FINANCEIRO]: 'Gerente Financeiro'
    }
    return roleNames[role] || role
  }

  private async logNotification(data: any): Promise<void> {
    // TODO: Implementar log de notificações
    console.log('Notification log:', data)
  }
}

export const userNotificationService = new UserNotificationService()