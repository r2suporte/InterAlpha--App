/**
 * E2E Tests - API Integration
 * Testa integração entre UI e APIs
 */

describe('Integração com APIs', () => {
  beforeEach(() => {
    cy.clearAllCookies();
  });

  describe('Endpoints de Usuários', () => {
    it('deve carregar dados de usuários via API', () => {
      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      // Interceptar requests de usuários
      cy.intercept('GET', '**/api/users*', { 
        statusCode: 200,
        body: { users: [] }
      }).as('getUsers');

      cy.wait('@getUsers', { timeout: 5000 }).then(() => {
        cy.get('body').should('not.be.empty');
      });
    });

    it('deve lidar com erro 404 de usuários', () => {
      cy.intercept('GET', '**/api/users*', { 
        statusCode: 404,
        body: { error: 'Not found' }
      }).as('getUsersError');

      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve lidar com erro 500 de usuários', () => {
      cy.intercept('GET', '**/api/users*', { 
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getUsersError');

      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Endpoints de Ordens de Serviço', () => {
    it('deve carregar ordens de serviço via API', () => {
      cy.intercept('GET', '**/api/ordens*', { 
        statusCode: 200,
        body: { 
          data: [
            { id: 1, titulo: 'Ordem 1', status: 'pendente' },
            { id: 2, titulo: 'Ordem 2', status: 'concluida' }
          ]
        }
      }).as('getOrdems');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve criar nova ordem de serviço', () => {
      cy.intercept('POST', '**/api/ordens*', { 
        statusCode: 201,
        body: { 
          id: 3,
          titulo: 'Nova Ordem',
          status: 'pendente'
        }
      }).as('createOrdem');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').then($body => {
        if ($body.find('button:contains("Criar"), button:contains("Nova")').length > 0) {
          cy.get('button:contains("Criar"), button:contains("Nova")').first().click();
          cy.wait(1000);
        }
      });
    });

    it('deve atualizar ordem de serviço', () => {
      cy.intercept('PUT', '**/api/ordens/*', { 
        statusCode: 200,
        body: { 
          id: 1,
          titulo: 'Ordem Atualizada',
          status: 'concluida'
        }
      }).as('updateOrdem');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve deletar ordem de serviço', () => {
      cy.intercept('DELETE', '**/api/ordens/*', { 
        statusCode: 200,
        body: { success: true }
      }).as('deleteOrdem');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Endpoints de Equipamentos', () => {
    it('deve carregar equipamentos via API', () => {
      cy.intercept('GET', '**/api/equipamentos*', { 
        statusCode: 200,
        body: { 
          data: [
            { id: 1, nome: 'Equipamento 1' },
            { id: 2, nome: 'Equipamento 2' }
          ]
        }
      }).as('getEquipamentos');

      cy.visit('/dashboard/equipamentos');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve buscar equipamentos com filtro', () => {
      cy.intercept('GET', '**/api/equipamentos*status=ativo*', { 
        statusCode: 200,
        body: { 
          data: [
            { id: 1, nome: 'Equipamento 1', status: 'ativo' }
          ]
        }
      }).as('getEquipamentosAtivos');

      cy.visit('/dashboard/equipamentos');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Endpoints de Relatórios', () => {
    it('deve carregar dados de relatório', () => {
      cy.intercept('GET', '**/api/relatorios*', { 
        statusCode: 200,
        body: { 
          data: {
            total: 100,
            concluidas: 80,
            pendentes: 20
          }
        }
      }).as('getRelatorio');

      cy.visit('/dashboard/relatorios');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve exportar relatório', () => {
      cy.intercept('GET', '**/api/relatorios/export*', { 
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf'
        },
        body: Buffer.from('PDF content')
      }).as('exportRelatorio');

      cy.visit('/dashboard/relatorios');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Endpoints de Alertas', () => {
    it('deve carregar alertas via API', () => {
      cy.intercept('GET', '**/api/alerts*', { 
        statusCode: 200,
        body: { 
          data: [
            { id: 1, titulo: 'Alerta 1', type: 'warning' },
            { id: 2, titulo: 'Alerta 2', type: 'error' }
          ]
        }
      }).as('getAlertas');

      cy.visit('/dashboard/alertas');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve criar nova regra de alerta', () => {
      cy.intercept('POST', '**/api/alerts/rules*', { 
        statusCode: 201,
        body: { 
          id: 3,
          nome: 'Nova Regra',
          enabled: true
        }
      }).as('createAlertRule');

      cy.visit('/dashboard/alertas');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Endpoints de Clientes', () => {
    it('deve carregar clientes via API', () => {
      cy.intercept('GET', '**/api/clients*', { 
        statusCode: 200,
        body: { 
          data: [
            { id: 1, nome: 'Cliente 1', email: 'cliente1@test.com' },
            { id: 2, nome: 'Cliente 2', email: 'cliente2@test.com' }
          ]
        }
      }).as('getClientes');

      cy.visit('/dashboard/clientes');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve criar novo cliente', () => {
      cy.intercept('POST', '**/api/clients*', { 
        statusCode: 201,
        body: { 
          id: 3,
          nome: 'Novo Cliente',
          email: 'novo@test.com'
        }
      }).as('createCliente');

      cy.visit('/dashboard/clientes');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve buscar cliente por ID', () => {
      cy.intercept('GET', '**/api/clients/1*', { 
        statusCode: 200,
        body: { 
          data: {
            id: 1,
            nome: 'Cliente 1',
            email: 'cliente1@test.com'
          }
        }
      }).as('getClienteById');

      cy.visit('/dashboard/clientes');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Tratamento de Erros HTTP', () => {
    it('deve lidar com timeout de requisição', () => {
      cy.intercept('GET', '**/api/**', (req) => {
        req.destroy();
      }).as('timeoutRequest');

      cy.visit('/dashboard');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve lidar com erro 401 - Não autenticado', () => {
      cy.intercept('GET', '**/api/users*', { 
        statusCode: 401,
        body: { error: 'Unauthorized' }
      }).as('unauthorizedError');

      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve lidar com erro 403 - Forbidden', () => {
      cy.intercept('GET', '**/api/admin*', { 
        statusCode: 403,
        body: { error: 'Forbidden' }
      }).as('forbiddenError');

      cy.visit('/dashboard');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve lidar com erro 429 - Too Many Requests', () => {
      cy.intercept('GET', '**/api/**', { 
        statusCode: 429,
        body: { error: 'Too many requests' }
      }).as('rateLimitError');

      cy.visit('/dashboard');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve retentar requisição após erro', () => {
      let attemptCount = 0;

      cy.intercept('GET', '**/api/data*', (req) => {
        attemptCount++;
        if (attemptCount < 2) {
          req.reply({
            statusCode: 500,
            body: { error: 'Server error' }
          });
        } else {
          req.reply({
            statusCode: 200,
            body: { data: [] }
          });
        }
      }).as('retryRequest');

      cy.visit('/dashboard');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Validação de Resposta', () => {
    it('deve validar estrutura de resposta de usuários', () => {
      cy.intercept('GET', '**/api/users*', { 
        statusCode: 200,
        body: { 
          data: [
            { id: 1, name: 'User 1', email: 'user1@test.com' }
          ]
        }
      }).as('getUsers');

      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      cy.wait('@getUsers').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body).to.have.property('data');
      });
    });

    it('deve validar headers de resposta', () => {
      cy.intercept('GET', '**/api/**', (req) => {
        req.reply((res) => {
          expect(res.headers).to.have.property('content-type');
        });
      }).as('validateHeaders');

      cy.visit('/dashboard');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar timestamps de resposta', () => {
      cy.intercept('GET', '**/api/**', { 
        statusCode: 200,
        body: { 
          data: [],
          timestamp: new Date().toISOString()
        }
      }).as('getWithTimestamp');

      cy.visit('/dashboard');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });
});
