import nodemailer from 'nodemailer';

import { createClient } from '@/lib/supabase/server';

import { metricsService } from './metrics-service';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface OrdemServicoEmail {
  id: string;
  numero_os: string;
  descricao: string;
  valor: number;
  data_inicio: string;
  cliente: {
    nome: string;
    email: string;
    telefone?: string;
  };
  equipamento?: {
    marca: string;
    modelo: string;
    numero_serie?: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    if (!config.auth.user || !config.auth.pass) {
      console.warn(
        'Configurações SMTP não encontradas. Email não será enviado.'
      );
      return;
    }

    this.transporter = nodemailer.createTransport(config);
  }

  async sendOrdemServicoEmail(
    ordemServico: OrdemServicoEmail,
    loginCredentials?: { login: string; senha: string }
  ) {
    return await metricsService.measureOperation(
      'email',
      'sendOrdemServicoEmail',
      async () => {
        if (!this.transporter) {
          throw new Error('Transporter de email não configurado');
        }

        const emailHtml = this.generateOrdemServicoEmailTemplate(
          ordemServico,
          loginCredentials
        );

        const mailOptions = {
          from: `"InterAlpha" <${process.env.SMTP_USER}>`,
          to: ordemServico.cliente.email,
          subject: `Nova Ordem de Serviço #${ordemServico.numero_os} - InterAlpha`,
          html: emailHtml,
        };

        try {
          const result = await this.transporter.sendMail(mailOptions);

          // Registrar comunicação no banco
          await this.registrarComunicacao({
            cliente_portal_id: ordemServico.id,
            ordem_servico_id: ordemServico.id,
            tipo: 'email',
            conteudo: emailHtml,
            destinatario: ordemServico.cliente.email,
            status: 'enviado',
            message_id: result.messageId,
          });

          return result;
        } catch (error) {
          console.error('Erro ao enviar email:', error);

          // Registrar erro no banco
          await this.registrarComunicacao({
            cliente_portal_id: ordemServico.id,
            ordem_servico_id: ordemServico.id,
            tipo: 'email',
            conteudo: emailHtml,
            destinatario: ordemServico.cliente.email,
            status: 'erro',
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          });

          throw error;
        }
      },
      {
        destinatario: ordemServico.cliente.email,
        numero_os: ordemServico.numero_os,
        valor: ordemServico.valor,
      }
    );
  }

  private generateOrdemServicoEmailTemplate(
    ordemServico: OrdemServicoEmail,
    loginCredentials?: { login: string; senha: string }
  ): string {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pt-BR');
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Ordem de Serviço - InterAlpha</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f8fafc;
            padding: 30px;
            border: 1px solid #e2e8f0;
        }
        .footer {
            background-color: #1e293b;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 8px 8px;
        }
        .info-box {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .credentials-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 0;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .table th, .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        .table th {
            background-color: #f1f5f9;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>InterAlpha</h1>
        <h2>Nova Ordem de Serviço</h2>
    </div>

    <div class="content">
        <p>Olá <strong>${ordemServico.cliente.nome}</strong>,</p>
        
        <p>Uma nova ordem de serviço foi criada para você. Confira os detalhes abaixo:</p>

        <div class="info-box">
            <table class="table">
                <tr>
                    <th>Número da OS:</th>
                    <td><strong>#${ordemServico.numero_os}</strong></td>
                </tr>
                <tr>
                    <th>Descrição:</th>
                    <td>${ordemServico.descricao}</td>
                </tr>
                <tr>
                    <th>Valor:</th>
                    <td><strong>${formatCurrency(ordemServico.valor)}</strong></td>
                </tr>
                <tr>
                    <th>Data de Início:</th>
                    <td>${formatDate(ordemServico.data_inicio)}</td>
                </tr>
                ${
                  ordemServico.equipamento
                    ? `
                <tr>
                    <th>Equipamento:</th>
                    <td>${ordemServico.equipamento.marca} ${ordemServico.equipamento.modelo}${ordemServico.equipamento.numero_serie ? ` (S/N: ${ordemServico.equipamento.numero_serie})` : ''}</td>
                </tr>
                `
                    : ''
                }
            </table>
        </div>

        ${
          loginCredentials
            ? `
        <div class="credentials-box">
            <h3>🔐 Acesso ao Portal do Cliente</h3>
            <p>Suas credenciais de acesso ao portal foram criadas:</p>
            <table class="table">
                <tr>
                    <th>Login:</th>
                    <td><strong>${loginCredentials.login}</strong></td>
                </tr>
                <tr>
                    <th>Senha:</th>
                    <td><strong>${loginCredentials.senha}</strong></td>
                </tr>
            </table>
            <p><strong>⚠️ Importante:</strong> Guarde essas credenciais em local seguro. Você pode alterar sua senha após o primeiro acesso.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/cliente/login" class="button">
                Acessar Portal do Cliente
            </a>
        </div>
        `
            : ''
        }

        <div class="info-box">
            <h3>📱 Próximos Passos</h3>
            <ul>
                <li>Acesse o portal do cliente para acompanhar o andamento</li>
                <li>Você receberá notificações sobre atualizações da OS</li>
                <li>Aprove orçamentos diretamente pelo portal</li>
                <li>Entre em contato conosco se tiver dúvidas</li>
            </ul>
        </div>

        <p>Obrigado por confiar na InterAlpha!</p>
    </div>

    <div class="footer">
        <p><strong>InterAlpha</strong></p>
        <p>📧 suporte@interalpha.com | 📞 (11) 99999-9999</p>
        <p>Este é um email automático, não responda.</p>
    </div>
</body>
</html>
    `;
  }

  private async registrarComunicacao(dados: {
    cliente_portal_id: string;
    ordem_servico_id: string;
    tipo: string;
    conteudo: string;
    destinatario: string;
    status: string;
    message_id?: string;
    erro?: string;
  }) {
    try {
      const supabase = await createClient();

      const { error } = await supabase.from('comunicacoes_cliente').insert({
        cliente_portal_id: dados.cliente_portal_id,
        ordem_servico_id: dados.ordem_servico_id,
        tipo: dados.tipo,
        conteudo: dados.conteudo,
        destinatario: dados.destinatario,
        status: dados.status,
        message_id: dados.message_id,
        erro: dados.erro,
        enviado_em: new Date().toISOString(),
      });

      if (error) {
        console.error('Erro ao registrar comunicação:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar comunicação:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    return await metricsService.measureOperation(
      'email',
      'testConnection',
      async () => {
        if (!this.transporter) {
          return false;
        }

        try {
          await this.transporter.verify();
          return true;
        } catch (error) {
          console.error('Erro na conexão SMTP:', error);
          return false;
        }
      }
    );
  }
}

export const emailService = new EmailService();
export default EmailService;
