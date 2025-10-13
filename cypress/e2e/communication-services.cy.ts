/**
 * Testes End-to-End para Serviços de Comunicação
 *
 * Este arquivo contém testes que validam o funcionamento completo
 * dos serviços de comunicação em ambiente de staging com dados reais.
 */

describe('Serviços de Comunicação - E2E', () => {
  let testOrdemServico: any;
  let testCliente: any;

  before(() => {
    // Configurar dados de teste
    testCliente = {
      nome: 'Cliente Teste E2E',
      email: 'teste.e2e@interalpha.com',
      telefone: '+5511999999999', // Número de teste do Twilio
      cpf: '11144477735',
    };

    testOrdemServico = {
      numero_os: `OS-E2E-${Date.now()}`,
      descricao: 'Teste E2E - Reparo de iPhone',
      valor: 299.99,
      tipo: 'reparo',
      prioridade: 'normal',
    };
  });

  beforeEach(() => {
    // Login como administrador
    cy.login('admin@interalpha.com', 'senha123');
    cy.waitForPageLoad();
  });

  describe('🔧 Configuração e Saúde dos Serviços', () => {
    it('deve verificar status de saúde dos serviços de comunicação', () => {
      cy.visit('/admin/configuracoes/comunicacao');

      // Verificar status do Email Service
      cy.getByTestId('email-service-status').should('contain', 'Conectado');
      cy.getByTestId('email-test-button').click();
      cy.getByTestId('email-test-result').should('contain', 'Sucesso', {
        timeout: 10000,
      });

      // Verificar status do SMS Service
      cy.getByTestId('sms-service-status').should('contain', 'Conectado');
      cy.getByTestId('sms-test-button').click();
      cy.getByTestId('sms-test-result').should('contain', 'Sucesso', {
        timeout: 10000,
      });

      // Verificar status do WhatsApp Service
      cy.getByTestId('whatsapp-service-status').should('contain', 'Conectado');
      cy.getByTestId('whatsapp-test-button').click();
      cy.getByTestId('whatsapp-test-result').should('contain', 'Sucesso', {
        timeout: 10000,
      });
    });

    it('deve exibir métricas de performance dos serviços', () => {
      cy.visit('/admin/metricas');

      // Verificar se as métricas estão sendo exibidas
      cy.getByTestId('metrics-dashboard').should('be.visible');
      cy.getByTestId('email-metrics').should('contain', 'Email Service');
      cy.getByTestId('sms-metrics').should('contain', 'SMS Service');
      cy.getByTestId('whatsapp-metrics').should('contain', 'WhatsApp Service');

      // Verificar se os dados de performance estão sendo atualizados
      cy.getByTestId('refresh-metrics-button').click();
      cy.getByTestId('last-update-time').should('not.be.empty');
    });
  });

  describe('📧 Serviço de Email', () => {
    it('deve enviar email de ordem de serviço com sucesso', () => {
      // Criar cliente de teste
      cy.visit('/clientes/novo');
      cy.getByTestId('cliente-nome').type(testCliente.nome);
      cy.getByTestId('cliente-email').type(testCliente.email);
      cy.getByTestId('cliente-telefone').type(testCliente.telefone);
      cy.getByTestId('cliente-cpf').type(testCliente.cpf);
      cy.getByTestId('salvar-cliente').click();

      cy.url().should('include', '/clientes/');
      cy.getByTestId('cliente-salvo-sucesso').should('be.visible');

      // Criar ordem de serviço
      cy.visit('/ordens-servico/nova');
      cy.getByTestId('os-cliente-select').click();
      cy.getByTestId(`cliente-option-${testCliente.nome}`).click();
      cy.getByTestId('os-numero').type(testOrdemServico.numero_os);
      cy.getByTestId('os-descricao').type(testOrdemServico.descricao);
      cy.getByTestId('os-valor').type(testOrdemServico.valor.toString());
      cy.getByTestId('os-tipo').select(testOrdemServico.tipo);
      cy.getByTestId('os-prioridade').select(testOrdemServico.prioridade);

      // Marcar para enviar email
      cy.getByTestId('enviar-email-checkbox').check();
      cy.getByTestId('salvar-ordem-servico').click();

      // Verificar se a ordem foi criada e email enviado
      cy.url().should('include', '/ordens-servico/');
      cy.getByTestId('os-criada-sucesso').should('be.visible');
      cy.getByTestId('email-enviado-sucesso').should('be.visible');

      // Verificar logs de comunicação
      cy.getByTestId('ver-comunicacoes').click();
      cy.getByTestId('comunicacao-email').should('contain', 'Email enviado');
      cy.getByTestId('comunicacao-status').should('contain', 'Sucesso');
    });

    it('deve lidar com falhas de email graciosamente', () => {
      // Simular falha temporária do serviço de email
      cy.intercept('POST', '/api/email/send', { statusCode: 500 }).as(
        'emailFail'
      );

      cy.visit('/ordens-servico/nova');
      cy.getByTestId('os-cliente-select').click();
      cy.getByTestId(`cliente-option-${testCliente.nome}`).click();
      cy.getByTestId('os-numero').type(`${testOrdemServico.numero_os}-FAIL`);
      cy.getByTestId('os-descricao').type('Teste de falha de email');
      cy.getByTestId('enviar-email-checkbox').check();
      cy.getByTestId('salvar-ordem-servico').click();

      // Verificar que a ordem foi criada mesmo com falha no email
      cy.getByTestId('os-criada-sucesso').should('be.visible');
      cy.getByTestId('email-erro-aviso').should('be.visible');

      // Verificar logs de erro
      cy.getByTestId('ver-comunicacoes').click();
      cy.getByTestId('comunicacao-email').should('contain', 'Falha no envio');
    });
  });

  describe('📱 Serviço de SMS', () => {
    it('deve enviar SMS de ordem de serviço com sucesso', () => {
      cy.visit('/ordens-servico/nova');
      cy.getByTestId('os-cliente-select').click();
      cy.getByTestId(`cliente-option-${testCliente.nome}`).click();
      cy.getByTestId('os-numero').type(`${testOrdemServico.numero_os}-SMS`);
      cy.getByTestId('os-descricao').type('Teste de SMS');
      cy.getByTestId('os-valor').type('199.99');

      // Marcar para enviar SMS
      cy.getByTestId('enviar-sms-checkbox').check();
      cy.getByTestId('salvar-ordem-servico').click();

      // Verificar se SMS foi enviado
      cy.getByTestId('os-criada-sucesso').should('be.visible');
      cy.getByTestId('sms-enviado-sucesso').should('be.visible');

      // Verificar logs de comunicação
      cy.getByTestId('ver-comunicacoes').click();
      cy.getByTestId('comunicacao-sms').should('contain', 'SMS enviado');
      cy.getByTestId('comunicacao-status').should('contain', 'Sucesso');
    });

    it('deve validar formato de número de telefone', () => {
      // Criar cliente com telefone inválido
      cy.visit('/clientes/novo');
      cy.getByTestId('cliente-nome').type('Cliente Telefone Inválido');
      cy.getByTestId('cliente-email').type('invalido@test.com');
      cy.getByTestId('cliente-telefone').type('123456'); // Número inválido
      cy.getByTestId('cliente-cpf').type('11144477735');
      cy.getByTestId('salvar-cliente').click();

      // Tentar enviar SMS
      cy.visit('/ordens-servico/nova');
      cy.getByTestId('os-cliente-select').click();
      cy.getByTestId('cliente-option-Cliente Telefone Inválido').click();
      cy.getByTestId('os-numero').type(`${testOrdemServico.numero_os}-INVALID`);
      cy.getByTestId('os-descricao').type('Teste telefone inválido');
      cy.getByTestId('enviar-sms-checkbox').check();
      cy.getByTestId('salvar-ordem-servico').click();

      // Verificar erro de validação
      cy.getByTestId('sms-erro-telefone').should('be.visible');
      cy.getByTestId('sms-erro-telefone').should(
        'contain',
        'Número de telefone inválido'
      );
    });
  });

  describe('💬 Serviço de WhatsApp', () => {
    it('deve enviar mensagem WhatsApp de ordem de serviço', () => {
      cy.visit('/ordens-servico/nova');
      cy.getByTestId('os-cliente-select').click();
      cy.getByTestId(`cliente-option-${testCliente.nome}`).click();
      cy.getByTestId('os-numero').type(`${testOrdemServico.numero_os}-WPP`);
      cy.getByTestId('os-descricao').type('Teste de WhatsApp');
      cy.getByTestId('os-valor').type('399.99');

      // Marcar para enviar WhatsApp
      cy.getByTestId('enviar-whatsapp-checkbox').check();
      cy.getByTestId('salvar-ordem-servico').click();

      // Verificar se WhatsApp foi enviado
      cy.getByTestId('os-criada-sucesso').should('be.visible');
      cy.getByTestId('whatsapp-enviado-sucesso').should('be.visible');

      // Verificar logs de comunicação
      cy.getByTestId('ver-comunicacoes').click();
      cy.getByTestId('comunicacao-whatsapp').should(
        'contain',
        'WhatsApp enviado'
      );
      cy.getByTestId('comunicacao-status').should('contain', 'Sucesso');
    });

    it('deve processar webhook de resposta do WhatsApp', () => {
      // Simular webhook de resposta do cliente
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry_id',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: testCliente.telefone,
                    phone_number_id: 'phone_id',
                  },
                  messages: [
                    {
                      from: testCliente.telefone.replace('+', ''),
                      id: 'message_id_123',
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: {
                        body: 'Aprovado! Pode prosseguir com o reparo.',
                      },
                      type: 'text',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      // Enviar webhook
      cy.request('POST', '/api/webhooks/whatsapp', webhookPayload).then(
        response => {
          expect(response.status).to.eq(200);
        }
      );

      // Verificar se a resposta foi processada
      cy.visit('/ordens-servico');
      cy.getByTestId(`os-${testOrdemServico.numero_os}-WPP`).click();
      cy.getByTestId('ver-comunicacoes').click();
      cy.getByTestId('comunicacao-whatsapp-resposta').should(
        'contain',
        'Aprovado'
      );
    });
  });

  describe('🔄 Sistema de Fallback', () => {
    it('deve usar fallback quando canal primário falha', () => {
      // Simular falha do email
      cy.intercept('POST', '/api/email/send', { statusCode: 500 }).as(
        'emailFail'
      );

      cy.visit('/ordens-servico/nova');
      cy.getByTestId('os-cliente-select').click();
      cy.getByTestId(`cliente-option-${testCliente.nome}`).click();
      cy.getByTestId('os-numero').type(
        `${testOrdemServico.numero_os}-FALLBACK`
      );
      cy.getByTestId('os-descricao').type('Teste de fallback');
      cy.getByTestId('os-valor').type('149.99');

      // Configurar comunicação com fallback
      cy.getByTestId('comunicacao-config').click();
      cy.getByTestId('canal-primario').select('email');
      cy.getByTestId('canal-fallback').select('sms');
      cy.getByTestId('habilitar-fallback').check();
      cy.getByTestId('salvar-ordem-servico').click();

      // Verificar que fallback foi usado
      cy.getByTestId('os-criada-sucesso').should('be.visible');
      cy.getByTestId('fallback-usado-aviso').should('be.visible');
      cy.getByTestId('sms-enviado-sucesso').should('be.visible');

      // Verificar logs de fallback
      cy.getByTestId('ver-comunicacoes').click();
      cy.getByTestId('comunicacao-email').should('contain', 'Falha');
      cy.getByTestId('comunicacao-sms').should('contain', 'Sucesso (Fallback)');
    });
  });

  describe('📊 Métricas e Monitoramento', () => {
    it('deve registrar métricas de performance para todos os serviços', () => {
      // Executar várias operações para gerar métricas
      for (let i = 0; i < 3; i++) {
        cy.visit('/ordens-servico/nova');
        cy.getByTestId('os-cliente-select').click();
        cy.getByTestId(`cliente-option-${testCliente.nome}`).click();
        cy.getByTestId('os-numero').type(
          `${testOrdemServico.numero_os}-METRICS-${i}`
        );
        cy.getByTestId('os-descricao').type(`Teste de métricas ${i}`);
        cy.getByTestId('os-valor').type('99.99');
        cy.getByTestId('enviar-email-checkbox').check();
        cy.getByTestId('enviar-sms-checkbox').check();
        cy.getByTestId('salvar-ordem-servico').click();
        cy.getByTestId('os-criada-sucesso').should('be.visible');
      }

      // Verificar métricas no dashboard
      cy.visit('/admin/metricas');
      cy.getByTestId('refresh-metrics-button').click();

      // Verificar se as métricas foram atualizadas
      cy.getByTestId('email-total-operations').should('not.contain', '0');
      cy.getByTestId('sms-total-operations').should('not.contain', '0');
      cy.getByTestId('email-success-rate').should('be.visible');
      cy.getByTestId('sms-success-rate').should('be.visible');

      // Verificar tempos de resposta
      cy.getByTestId('email-avg-response-time').should('be.visible');
      cy.getByTestId('sms-avg-response-time').should('be.visible');
    });

    it('deve detectar anomalias de performance', () => {
      // Simular operações lentas
      cy.intercept('POST', '/api/email/send', req => {
        req.reply(res => {
          setTimeout(() => {
            res.send({ statusCode: 200, body: { success: true } });
          }, 5000); // 5 segundos de delay
        });
      }).as('slowEmail');

      cy.visit('/ordens-servico/nova');
      cy.getByTestId('os-cliente-select').click();
      cy.getByTestId(`cliente-option-${testCliente.nome}`).click();
      cy.getByTestId('os-numero').type(`${testOrdemServico.numero_os}-SLOW`);
      cy.getByTestId('os-descricao').type('Teste de performance lenta');
      cy.getByTestId('enviar-email-checkbox').check();
      cy.getByTestId('salvar-ordem-servico').click();

      // Verificar detecção de anomalia
      cy.visit('/admin/metricas');
      cy.getByTestId('refresh-metrics-button').click();
      cy.getByTestId('anomalies-section').should('be.visible');
      cy.getByTestId('email-performance-warning').should(
        'contain',
        'Tempo de resposta elevado'
      );
    });
  });

  describe('🧹 Limpeza de Dados de Teste', () => {
    it('deve limpar dados de teste criados', () => {
      // Limpar ordens de serviço de teste
      cy.visit('/ordens-servico');
      cy.getByTestId('filtro-numero').type('OS-E2E-');
      cy.getByTestId('aplicar-filtro').click();

      cy.get('[data-testid^="os-OS-E2E-"]').each($el => {
        cy.wrap($el).find('[data-testid="excluir-os"]').click();
        cy.getByTestId('confirmar-exclusao').click();
      });

      // Limpar cliente de teste
      cy.visit('/clientes');
      cy.getByTestId('filtro-nome').type('Cliente Teste E2E');
      cy.getByTestId('aplicar-filtro').click();
      cy.getByTestId('excluir-cliente').click();
      cy.getByTestId('confirmar-exclusao').click();

      // Limpar métricas antigas
      cy.request('DELETE', '/api/metrics?olderThan=1h').then(response => {
        expect(response.status).to.eq(200);
      });
    });
  });

  afterEach(() => {
    // Capturar screenshot em caso de falha
    cy.screenshot();
  });
});
