import nodemailer from 'nodemailer'
import { SecurityEventEntry, SecuritySeverity } from '@/types/audit'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth?: {
    user: string
    pass: string
  }
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    // Inicialização lazy - não criar transporter no constructor
  }

  private createTransporter(): nodemailer.Transporter {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
    }

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      config.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }

    return nodemailer.createTransporter(config)
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = this.createTransporter()
    }
    return this.transporter
  }

  async sendEmail(options: {
    to: string
    subject: string
    template?: string
    data?: any
    html?: string
    text?: string
  }): Promise<boolean> {
    try {
      let html = options.html
      let text = options.text

      // Se template foi especificado, processar template
      if (options.template && options.data) {
        const templateResult = await this.processTemplate(options.template, options.data)
        html = templateResult.html
        text = templateResult.text
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html,
        text
      }

      await this.getTransporter().sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      return false
    }
  }

  async sendNotificationEmail(options: {
    to: string
    subject: string
    template: string
    data: any
  }): Promise<boolean> {
    return this.sendEmail({
      to: options.to,
      subject: options.subject,
      template: options.template,
      data: options.data
    })
  }

  private async processTemplate(templateName: string, data: any): Promise<{ html: string; text: string }> {
    try {
      const fs = require('fs')
      const path = require('path')
      
      const templatePath = path.join(process.cwd(), 'src', 'templates', 'email', `${templateName}.html`)
      let html = fs.readFileSync(templatePath, 'utf8')

      // Substituir variáveis no template
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        html = html.replace(regex, data[key])
      })

      // Gerar versão texto simples (remover HTML)
      const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

      return { html, text }
    } catch (error) {
      console.error('Erro ao processar template:', error)
      return { 
        html: `<p>Erro ao carregar template</p>`, 
        text: 'Erro ao carregar template' 
      }
    }
  }

  async sendSecurityAlert(
    recipients: string[],
    event: SecurityEventEntry,
    additionalContext?: any
  ): Promise<boolean> {
    try {
      const template = this.generateSecurityAlertTemplate(event, additionalContext)
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@interalpha.com',
        to: recipients.join(', '),
        subject: template.subject,
        html: template.html,
        text: template.text,
        priority: this.getPriorityFromSeverity(event.severity),
        headers: {
          'X-Priority': this.getPriorityFromSeverity(event.severity) === 'high' ? '1' : '3',
          'X-MSMail-Priority': this.getPriorityFromSeverity(event.severity) === 'high' ? 'High' : 'Normal'
        }
      }

      const result = await this.getTransporter().sendMail(mailOptions)
      console.log('Security alert email sent:', result.messageId)
      return true

    } catch (error) {
      console.error('Error sending security alert email:', error)
      return false
    }
  }

  async sendAuditReport(
    recipients: string[],
    reportTitle: string,
    reportData: any,
    downloadUrl?: string
  ): Promise<boolean> {
    try {
      const template = this.generateAuditReportTemplate(reportTitle, reportData, downloadUrl)
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@interalpha.com',
        to: recipients.join(', '),
        subject: template.subject,
        html: template.html,
        text: template.text
      }

      const result = await this.getTransporter().sendMail(mailOptions)
      console.log('Audit report email sent:', result.messageId)
      return true

    } catch (error) {
      console.error('Error sending audit report email:', error)
      return false
    }
  }

  async sendComplianceAlert(
    recipients: string[],
    complianceType: string,
    findings: any[],
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<boolean> {
    try {
      const template = this.generateComplianceAlertTemplate(complianceType, findings, severity)
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@interalpha.com',
        to: recipients.join(', '),
        subject: template.subject,
        html: template.html,
        text: template.text,
        priority: severity === 'critical' || severity === 'high' ? 'high' : 'normal'
      }

      const result = await this.getTransporter().sendMail(mailOptions)
      console.log('Compliance alert email sent:', result.messageId)
      return true

    } catch (error) {
      console.error('Error sending compliance alert email:', error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getTransporter().verify()
      console.log('Email service connection verified')
      return true
    } catch (error) {
      console.error('Email service connection failed:', error)
      return false
    }
  }

  private generateSecurityAlertTemplate(
    event: SecurityEventEntry,
    additionalContext?: any
  ): EmailTemplate {
    const severityColor = this.getSeverityColor(event.severity)
    const severityText = this.getSeverityText(event.severity)
    
    const subject = `🚨 ALERTA DE SEGURANÇA [${severityText.toUpperCase()}] - InterAlpha`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alerta de Segurança - InterAlpha</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .alert-box { background: white; border-left: 4px solid ${severityColor}; padding: 15px; margin: 15px 0; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .severity-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; background: ${severityColor}; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Alerta de Segurança</h1>
            <p>Sistema de Auditoria InterAlpha</p>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <h2>Evento Detectado</h2>
              <p><strong>Tipo:</strong> ${this.getEventTypeDescription(event.type)}</p>
              <p><strong>Severidade:</strong> <span class="severity-badge">${severityText}</span></p>
              <p><strong>Descrição:</strong> ${event.description}</p>
              <p><strong>Data/Hora:</strong> ${event.timestamp.toLocaleString('pt-BR')}</p>
            </div>

            <div class="details">
              <h3>Detalhes Técnicos</h3>
              <p><strong>ID do Evento:</strong> ${event.id}</p>
              <p><strong>Endereço IP:</strong> ${event.ipAddress}</p>
              ${event.userId ? `<p><strong>Usuário:</strong> ${event.userId}</p>` : ''}
              ${event.userAgent ? `<p><strong>User Agent:</strong> ${event.userAgent}</p>` : ''}
            </div>

            ${event.actions.length > 0 ? `
            <div class="details">
              <h3>Ações Automáticas Executadas</h3>
              <ul>
                ${event.actions.map(action => `
                  <li><strong>${action.action}</strong> - ${action.timestamp.toLocaleString('pt-BR')} ${action.automated ? '(Automática)' : '(Manual)'}</li>
                `).join('')}
              </ul>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXTAUTH_URL}/auditoria/seguranca" class="button">
                Ver Detalhes no Dashboard
              </a>
            </div>
          </div>

          <div class="footer">
            <p>Este é um alerta automático do Sistema de Auditoria InterAlpha</p>
            <p>Para mais informações, acesse o dashboard de auditoria</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
ALERTA DE SEGURANÇA - InterAlpha

Tipo: ${this.getEventTypeDescription(event.type)}
Severidade: ${severityText}
Descrição: ${event.description}
Data/Hora: ${event.timestamp.toLocaleString('pt-BR')}

Detalhes:
- ID do Evento: ${event.id}
- Endereço IP: ${event.ipAddress}
${event.userId ? `- Usuário: ${event.userId}` : ''}

${event.actions.length > 0 ? `
Ações Executadas:
${event.actions.map(action => `- ${action.action} (${action.timestamp.toLocaleString('pt-BR')})`).join('\n')}
` : ''}

Acesse o dashboard para mais detalhes: ${process.env.NEXTAUTH_URL}/auditoria/seguranca
    `

    return { subject, html, text }
  }

  private generateAuditReportTemplate(
    reportTitle: string,
    reportData: any,
    downloadUrl?: string
  ): EmailTemplate {
    const subject = `📊 Relatório de Auditoria: ${reportTitle} - InterAlpha`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Auditoria - InterAlpha</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .summary { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
          .button { display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Relatório de Auditoria</h1>
            <p>${reportTitle}</p>
          </div>
          
          <div class="content">
            <div class="summary">
              <h2>Resumo do Relatório</h2>
              <p><strong>Período:</strong> ${reportData.period?.startDate ? new Date(reportData.period.startDate).toLocaleDateString('pt-BR') : 'N/A'} - ${reportData.period?.endDate ? new Date(reportData.period.endDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
              <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>

            ${reportData.summary ? `
            <div class="summary">
              <h3>Estatísticas</h3>
              <div class="stats">
                <div class="stat">
                  <div class="stat-number">${reportData.summary.totalEntries || 0}</div>
                  <div>Total de Entradas</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${reportData.summary.successfulActions || 0}</div>
                  <div>Ações Bem-sucedidas</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${reportData.summary.securityEvents || 0}</div>
                  <div>Eventos de Segurança</div>
                </div>
              </div>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 20px 0;">
              ${downloadUrl ? `
                <a href="${downloadUrl}" class="button">
                  📥 Baixar Relatório Completo
                </a>
              ` : ''}
              <a href="${process.env.NEXTAUTH_URL}/auditoria/relatorios" class="button">
                Ver no Dashboard
              </a>
            </div>
          </div>

          <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema de Auditoria InterAlpha</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
RELATÓRIO DE AUDITORIA - InterAlpha

Título: ${reportTitle}
Período: ${reportData.period?.startDate ? new Date(reportData.period.startDate).toLocaleDateString('pt-BR') : 'N/A'} - ${reportData.period?.endDate ? new Date(reportData.period.endDate).toLocaleDateString('pt-BR') : 'N/A'}
Gerado em: ${new Date().toLocaleString('pt-BR')}

${reportData.summary ? `
Estatísticas:
- Total de Entradas: ${reportData.summary.totalEntries || 0}
- Ações Bem-sucedidas: ${reportData.summary.successfulActions || 0}
- Eventos de Segurança: ${reportData.summary.securityEvents || 0}
` : ''}

${downloadUrl ? `Baixar relatório: ${downloadUrl}` : ''}
Ver no dashboard: ${process.env.NEXTAUTH_URL}/auditoria/relatorios
    `

    return { subject, html, text }
  }

  private generateComplianceAlertTemplate(
    complianceType: string,
    findings: any[],
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): EmailTemplate {
    const severityColor = this.getSeverityColor(severity)
    const subject = `⚠️ Alerta de Compliance ${complianceType.toUpperCase()} - InterAlpha`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alerta de Compliance - InterAlpha</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .finding { background: white; border-left: 4px solid ${severityColor}; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerta de Compliance</h1>
            <p>${complianceType.toUpperCase()}</p>
          </div>
          
          <div class="content">
            <p>Foram identificadas ${findings.length} não conformidade(s) que requerem atenção:</p>
            
            ${findings.slice(0, 5).map(finding => `
              <div class="finding">
                <h3>${finding.category || 'Categoria não especificada'}</h3>
                <p>${finding.description || 'Descrição não disponível'}</p>
                <p><strong>Severidade:</strong> ${finding.severity || 'N/A'}</p>
                ${finding.recommendation ? `<p><strong>Recomendação:</strong> ${finding.recommendation}</p>` : ''}
              </div>
            `).join('')}
            
            ${findings.length > 5 ? `<p><em>... e mais ${findings.length - 5} achado(s)</em></p>` : ''}

            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXTAUTH_URL}/auditoria/relatorios" class="button">
                Ver Relatório Completo
              </a>
            </div>
          </div>

          <div class="footer">
            <p>Alerta gerado automaticamente pelo Sistema de Compliance InterAlpha</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
ALERTA DE COMPLIANCE - InterAlpha

Tipo: ${complianceType.toUpperCase()}
Severidade: ${severity}

Foram identificadas ${findings.length} não conformidade(s):

${findings.slice(0, 5).map(finding => `
- ${finding.category || 'Categoria não especificada'}
  ${finding.description || 'Descrição não disponível'}
  Severidade: ${finding.severity || 'N/A'}
  ${finding.recommendation ? `Recomendação: ${finding.recommendation}` : ''}
`).join('\n')}

${findings.length > 5 ? `... e mais ${findings.length - 5} achado(s)` : ''}

Ver relatório completo: ${process.env.NEXTAUTH_URL}/auditoria/relatorios
    `

    return { subject, html, text }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#dc3545'
      case 'high': return '#fd7e14'
      case 'medium': return '#ffc107'
      case 'low': return '#28a745'
      default: return '#6c757d'
    }
  }

  private getSeverityText(severity: string): string {
    switch (severity) {
      case 'critical': return 'Crítica'
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return 'Desconhecida'
    }
  }

  private getPriorityFromSeverity(severity: string): 'high' | 'normal' | 'low' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'high'
      case 'medium':
        return 'normal'
      case 'low':
      default:
        return 'low'
    }
  }

  private getEventTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'SUSPICIOUS_LOGIN': 'Login Suspeito',
      'MULTIPLE_FAILED_ATTEMPTS': 'Múltiplas Tentativas Falhadas',
      'UNUSUAL_ACCESS_PATTERN': 'Padrão de Acesso Incomum',
      'PRIVILEGE_ESCALATION_ATTEMPT': 'Tentativa de Escalação de Privilégios',
      'DATA_BREACH_ATTEMPT': 'Tentativa de Violação de Dados',
      'UNAUTHORIZED_API_ACCESS': 'Acesso Não Autorizado à API',
      'MALICIOUS_REQUEST': 'Requisição Maliciosa',
      'ACCOUNT_TAKEOVER_ATTEMPT': 'Tentativa de Sequestro de Conta',
      'BRUTE_FORCE_ATTACK': 'Ataque de Força Bruta',
      'SQL_INJECTION_ATTEMPT': 'Tentativa de Injeção SQL'
    }
    return descriptions[type] || type
  }
}

export const emailService = new EmailService()