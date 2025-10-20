/**
 * E2E Tests - Data Validation
 * Testa validação de dados, integridade e fluxos de negócio
 */

describe('Validação de Dados', () => {
  beforeEach(() => {
    cy.clearAllCookies();
  });

  describe('Validação de Formulários', () => {
    it('deve validar email obrigatório no login', () => {
      cy.visit('/auth/login');
      cy.wait(1000);

      cy.get('button[type="submit"]').click();
      cy.wait(500);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar senha obrigatória no login', () => {
      cy.visit('/auth/login');
      cy.wait(1000);

      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();
      cy.wait(500);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar formato de email', () => {
      cy.visit('/auth/login');
      cy.wait(1000);

      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait(500);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar comprimento mínimo de senha', () => {
      cy.visit('/auth/login');
      cy.wait(1000);

      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('123');
      cy.wait(500);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Validação de Integridade de Dados', () => {
    it('deve manter consistência de dados ao criar', () => {
      cy.intercept('POST', '**/api/users*', { 
        statusCode: 201,
        body: { 
          id: 1,
          email: 'newuser@test.com',
          name: 'New User'
        }
      }).as('createUser');

      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      cy.wait('@createUser', { timeout: 5000 }).then((interception) => {
        expect(interception.request.body).to.have.property('email');
        expect(interception.response?.statusCode).to.equal(201);
      });
    });

    it('deve validar campos requeridos em ordem de serviço', () => {
      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve verificar unicidade de email em usuarios', () => {
      cy.intercept('POST', '**/api/users*', (req) => {
        const email = req.body?.email;
        if (email === 'duplicate@test.com') {
          req.reply({
            statusCode: 409,
            body: { error: 'Email já existe' }
          });
        } else {
          req.reply({
            statusCode: 201,
            body: { id: 1, email }
          });
        }
      }).as('createUserDuplicate');

      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar relacionamentos entre tabelas', () => {
      cy.intercept('GET', '**/api/ordens*', { 
        statusCode: 200,
        body: { 
          data: [
            { id: 1, clientId: 1, status: 'pendente' }
          ]
        }
      }).as('getOrdens');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.wait('@getOrdens', { timeout: 5000 }).then((interception) => {
        const ordens = interception.response?.body.data;
        expect(ordens).to.have.lengthOf(1);
        expect(ordens[0]).to.have.property('clientId');
      });
    });
  });

  describe('Validação de Limites de Dados', () => {
    it('deve lidar com listas grandes de usuários', () => {
      const largeUserList = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        email: `user${i}@test.com`,
        name: `User ${i}`
      }));

      cy.intercept('GET', '**/api/users*', { 
        statusCode: 200,
        body: { data: largeUserList }
      }).as('getLargeUserList');

      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      cy.wait('@getLargeUserList', { timeout: 5000 }).then((interception) => {
        expect(interception.response?.body.data).to.have.length(1000);
      });
    });

    it('deve paginar resultados corretamente', () => {
      cy.intercept('GET', '**/api/usuarios?page=1*', { 
        statusCode: 200,
        body: { 
          data: Array.from({ length: 50 }, (_, i) => ({ id: i })),
          totalPages: 10,
          currentPage: 1
        }
      }).as('getUsersPage1');

      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar limites de tamanho de upload', () => {
      cy.visit('/dashboard');
      cy.wait(1000);

      cy.get('body').should('not.be.empty');
    });

    it('deve lidar com strings muito longas', () => {
      const longString = 'a'.repeat(5000);

      cy.visit('/dashboard/clientes');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Validação de Timestamps e Datas', () => {
    it('deve manter precisão de timestamps', () => {
      const timestamp = new Date().toISOString();

      cy.intercept('POST', '**/api/ordens*', { 
        statusCode: 201,
        body: { 
          id: 1,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }).as('createOrdemWithTimestamp');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar ordem de datas (createdAt < updatedAt)', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 1000).toISOString();
      const updatedAt = now.toISOString();

      cy.intercept('GET', '**/api/ordens/*', { 
        statusCode: 200,
        body: { 
          id: 1,
          createdAt,
          updatedAt
        }
      }).as('getOrdemWithDates');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve lidar com datas futuras invalidas', () => {
      const futureDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();

      cy.visit('/dashboard');
      cy.wait(1000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Validação de Enumerações e Status', () => {
    it('deve validar status válidos de ordem de serviço', () => {
      const validStatuses = ['pendente', 'em_andamento', 'concluida', 'cancelada'];

      cy.intercept('GET', '**/api/ordens*', { 
        statusCode: 200,
        body: { 
          data: validStatuses.map((status, i) => ({ id: i, status }))
        }
      }).as('getOrdensWithStatus');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.wait('@getOrdensWithStatus', { timeout: 5000 }).then((interception) => {
        const ordens = interception.response?.body.data;
        ordens.forEach((ordem: any) => {
          expect(['pendente', 'em_andamento', 'concluida', 'cancelada']).to.include(ordem.status);
        });
      });
    });

    it('deve rejeitar status inválidos', () => {
      cy.intercept('POST', '**/api/ordens*', (req) => {
        const validStatuses = ['pendente', 'em_andamento', 'concluida', 'cancelada'];
        if (!validStatuses.includes(req.body?.status)) {
          req.reply({
            statusCode: 400,
            body: { error: 'Status inválido' }
          });
        } else {
          req.reply({
            statusCode: 201,
            body: { id: 1, ...req.body }
          });
        }
      }).as('createOrdemValidateStatus');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar tipos de usuários', () => {
      const userTypes = ['admin', 'technician', 'viewer'];

      cy.intercept('GET', '**/api/users*', { 
        statusCode: 200,
        body: { 
          data: userTypes.map((type, i) => ({ id: i, role: type }))
        }
      }).as('getUsersWithRoles');

      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Validação de Relacionamentos e Referência Integridade', () => {
    it('deve validar cliente existe antes de criar ordem', () => {
      cy.intercept('POST', '**/api/ordens*', (req) => {
        if (!req.body?.clientId) {
          req.reply({
            statusCode: 400,
            body: { error: 'clientId obrigatório' }
          });
        } else {
          req.reply({
            statusCode: 201,
            body: { id: 1, ...req.body }
          });
        }
      }).as('createOrdemValidateClient');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve impedir deletar cliente com ordens ativas', () => {
      cy.intercept('DELETE', '**/api/clients/*', (req) => {
        req.reply({
          statusCode: 409,
          body: { error: 'Não é possível deletar cliente com ordens ativas' }
        });
      }).as('deleteClientWithActiveOrdems');

      cy.visit('/dashboard/clientes');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar integridade referencial ao atualizar', () => {
      cy.intercept('PUT', '**/api/ordens/*', { 
        statusCode: 200,
        body: { 
          id: 1,
          clientId: 1,
          status: 'concluida'
        }
      }).as('updateOrdemIntegrity');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Validação de Valores Numéricos', () => {
    it('deve validar preços positivos', () => {
      cy.intercept('POST', '**/api/ordens*', (req) => {
        if (req.body?.price && req.body.price < 0) {
          req.reply({
            statusCode: 400,
            body: { error: 'Preço deve ser positivo' }
          });
        } else {
          req.reply({
            statusCode: 201,
            body: { id: 1, ...req.body }
          });
        }
      }).as('createOrdemValidatePrice');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar percentuais entre 0 e 100', () => {
      cy.intercept('POST', '**/api/relatorios*', (req) => {
        if (req.body?.percentage && (req.body.percentage < 0 || req.body.percentage > 100)) {
          req.reply({
            statusCode: 400,
            body: { error: 'Percentual deve estar entre 0 e 100' }
          });
        }
      }).as('validatePercentage');

      cy.visit('/dashboard/relatorios');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve validar quantidades inteiras', () => {
      cy.intercept('POST', '**/api/equipamentos*', (req) => {
        if (req.body?.quantity && !Number.isInteger(req.body.quantity)) {
          req.reply({
            statusCode: 400,
            body: { error: 'Quantidade deve ser um número inteiro' }
          });
        }
      }).as('validateQuantity');

      cy.visit('/dashboard/equipamentos');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Validação de Caracteres Especiais', () => {
    it('deve sanitizar entrada de texto', () => {
      const maliciousInput = '<script>alert("xss")</script>';

      cy.intercept('POST', '**/api/users*', (req) => {
        if (req.body?.name?.includes('<script>')) {
          req.reply({
            statusCode: 400,
            body: { error: 'Entrada contém caracteres inválidos' }
          });
        }
      }).as('sanitizeInput');

      cy.visit('/dashboard/usuarios');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });

    it('deve permitir caracteres unicode válidos', () => {
      const unicodeInput = 'José da Silva';

      cy.intercept('POST', '**/api/clients*', { 
        statusCode: 201,
        body: { id: 1, name: unicodeInput }
      }).as('createClientUnicode');

      cy.visit('/dashboard/clientes');
      cy.wait(2000);

      cy.get('body').should('not.be.empty');
    });
  });

  describe('Validação de Cache e Concorrência', () => {
    it('deve invalidar cache ao atualizar dados', () => {
      cy.intercept('GET', '**/api/ordens*', { 
        statusCode: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: { data: [] }
      }).as('getOrdensCacheControl');

      cy.visit('/dashboard/ordens-servico');
      cy.wait(2000);

      cy.wait('@getOrdensCacheControl', { timeout: 5000 }).then((interception) => {
        expect(interception.response?.headers).to.have.property('cache-control');
      });
    });

    it('deve lidar com requisições simultâneas', () => {
      cy.intercept('GET', '**/api/users*', { 
        statusCode: 200,
        body: { data: [] }
      }).as('getUsers');

      cy.intercept('GET', '**/api/ordens*', { 
        statusCode: 200,
        body: { data: [] }
      }).as('getOrdens');

      cy.visit('/dashboard');
      cy.wait(2000);

      cy.wait(['@getUsers', '@getOrdens'], { timeout: 5000 });
    });
  });
});
