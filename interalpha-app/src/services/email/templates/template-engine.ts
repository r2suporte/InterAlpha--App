import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

// Cache de templates compilados
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

// Registrar helpers do Handlebars
Handlebars.registerHelper('formatDate', (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

Handlebars.registerHelper('formatDateTime', (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

Handlebars.registerHelper('formatCurrency', (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
});

Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
Handlebars.registerHelper('lt', (a: number, b: number) => a < b);

export async function renderEmailTemplate(templateName: string, data: Record<string, any>): Promise<string> {
  try {
    // Verificar se o template está no cache
    let template = templateCache.get(templateName);

    if (!template) {
      // Carregar template do arquivo
      const templatePath = join(process.cwd(), 'src/services/email/templates', `${templateName}.hbs`);
      
      try {
        const templateSource = readFileSync(templatePath, 'utf-8');
        template = Handlebars.compile(templateSource);
        templateCache.set(templateName, template);
      } catch (fileError) {
        console.warn(`⚠️  Template ${templateName}.hbs não encontrado, usando template padrão`);
        template = getDefaultTemplate(templateName);
        templateCache.set(templateName, template);
      }
    }

    // Renderizar template com dados
    const html = template({
      ...data,
      // Dados globais sempre disponíveis
      currentYear: new Date().getFullYear(),
      companyName: 'InterAlpha',
      supportEmail: 'suporte@interalpha.com',
      websiteUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    });

    return html;
  } catch (error) {
    console.error(`❌ Erro ao renderizar template ${templateName}:`, error);
    throw error;
  }
}

function getDefaultTemplate(templateName: string): HandlebarsTemplateDelegate {
  const defaultTemplates: Record<string, string> = {
    'test': `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Teste - {{companyName}}</title>
          {{> emailStyles}}
        </head>
        <body>
          <div class="container">
            {{> emailHeader}}
            <div class="content">
              <h2>Email de Teste</h2>
              <p>{{message}}</p>
              <p><strong>Timestamp:</strong> {{formatDateTime timestamp}}</p>
            </div>
            {{> emailFooter}}
          </div>
        </body>
      </html>
    `,
    
    'order-created': `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Nova Ordem de Serviço - {{companyName}}</title>
          {{> emailStyles}}
        </head>
        <body>
          <div class="container">
            {{> emailHeader}}
            <div class="content">
              <h2>Nova Ordem de Serviço Criada</h2>
              <p>Olá {{clientName}},</p>
              <p>Uma nova ordem de serviço foi criada para você:</p>
              
              <div class="info-box">
                <p><strong>Número:</strong> {{orderNumber}}</p>
                <p><strong>Serviço:</strong> {{serviceName}}</p>
                <p><strong>Data:</strong> {{formatDate createdAt}}</p>
                <p><strong>Status:</strong> {{status}}</p>
                {{#if description}}
                <p><strong>Descrição:</strong> {{description}}</p>
                {{/if}}
              </div>
              
              <p>Você será notificado sobre atualizações no status da sua ordem.</p>
            </div>
            {{> emailFooter}}
          </div>
        </body>
      </html>
    `,
    
    'order-completed': `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ordem Concluída - {{companyName}}</title>
          {{> emailStyles}}
        </head>
        <body>
          <div class="container">
            {{> emailHeader}}
            <div class="content">
              <h2>Ordem de Serviço Concluída</h2>
              <p>Olá {{clientName}},</p>
              <p>Sua ordem de serviço foi concluída com sucesso!</p>
              
              <div class="info-box success">
                <p><strong>Número:</strong> {{orderNumber}}</p>
                <p><strong>Serviço:</strong> {{serviceName}}</p>
                <p><strong>Concluída em:</strong> {{formatDateTime completedAt}}</p>
                {{#if notes}}
                <p><strong>Observações:</strong> {{notes}}</p>
                {{/if}}
              </div>
              
              <p>Obrigado por escolher nossos serviços!</p>
            </div>
            {{> emailFooter}}
          </div>
        </body>
      </html>
    `,
    
    'payment-received': `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Pagamento Recebido - {{companyName}}</title>
          {{> emailStyles}}
        </head>
        <body>
          <div class="container">
            {{> emailHeader}}
            <div class="content">
              <h2>Pagamento Confirmado</h2>
              <p>Olá {{clientName}},</p>
              <p>Confirmamos o recebimento do seu pagamento:</p>
              
              <div class="info-box success">
                <p><strong>Valor:</strong> {{formatCurrency amount}}</p>
                <p><strong>Método:</strong> {{paymentMethod}}</p>
                <p><strong>Data:</strong> {{formatDateTime paidAt}}</p>
                {{#if transactionId}}
                <p><strong>ID da Transação:</strong> {{transactionId}}</p>
                {{/if}}
              </div>
              
              <p>Obrigado pelo pagamento!</p>
            </div>
            {{> emailFooter}}
          </div>
        </body>
      </html>
    `,
    
    'payment-overdue': `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Pagamento em Atraso - {{companyName}}</title>
          {{> emailStyles}}
        </head>
        <body>
          <div class="container">
            {{> emailHeader}}
            <div class="content">
              <h2>Lembrete de Pagamento</h2>
              <p>Olá {{clientName}},</p>
              <p>Identificamos que o pagamento abaixo está em atraso:</p>
              
              <div class="info-box warning">
                <p><strong>Valor:</strong> {{formatCurrency amount}}</p>
                <p><strong>Vencimento:</strong> {{formatDate dueDate}}</p>
                <p><strong>Dias em atraso:</strong> {{daysOverdue}}</p>
                {{#if orderNumber}}
                <p><strong>Ordem:</strong> {{orderNumber}}</p>
                {{/if}}
              </div>
              
              <p>Por favor, regularize sua situação o quanto antes.</p>
              <p>Em caso de dúvidas, entre em contato conosco.</p>
            </div>
            {{> emailFooter}}
          </div>
        </body>
      </html>
    `,
  };

  const templateSource = defaultTemplates[templateName] || defaultTemplates.test;
  return Handlebars.compile(templateSource);
}

// Registrar partials (componentes reutilizáveis)
Handlebars.registerPartial('emailStyles', `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 300;
    }
    .content {
      padding: 30px 20px;
    }
    .content h2 {
      color: #007bff;
      margin-top: 0;
      font-size: 24px;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #007bff;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box.success {
      background: #d4edda;
      border-left-color: #28a745;
    }
    .info-box.warning {
      background: #fff3cd;
      border-left-color: #ffc107;
    }
    .info-box p {
      margin: 8px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #dee2e6;
    }
    .footer a {
      color: #007bff;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
    }
  </style>
`);

Handlebars.registerPartial('emailHeader', `
  <div class="header">
    <h1>{{companyName}}</h1>
  </div>
`);

Handlebars.registerPartial('emailFooter', `
  <div class="footer">
    <p>Este é um email automático do sistema {{companyName}}.</p>
    <p>Por favor, não responda este email.</p>
    <p>
      <a href="{{websiteUrl}}">Acessar Sistema</a> | 
      <a href="mailto:{{supportEmail}}">Suporte</a>
    </p>
    <p>&copy; {{currentYear}} {{companyName}}. Todos os direitos reservados.</p>
  </div>
`);

// Função para limpar cache de templates (útil em desenvolvimento)
export function clearTemplateCache(): void {
  templateCache.clear();
  console.log('🧹 Cache de templates de email limpo');
}