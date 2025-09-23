describe('Controle de Acesso Baseado em Roles', () => {
  beforeEach(() => {
    cy.interceptCommonAPIs()
  })

  describe('Admin Role', () => {
    beforeEach(() => {
      // Login como admin
      cy.loginWithRole('admin')
      cy.waitForPageLoad()
    })

    it('deve ter acesso completo ao dashboard', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      
      // Verificar se elementos administrativos estão visíveis
      cy.contains('Relatórios').should('be.visible')
      cy.contains('Usuários').should('be.visible')
      cy.contains('Configurações').should('be.visible')
    })

    it('deve acessar gestão de usuários', () => {
      cy.visit('/dashboard/usuarios')
      cy.url().should('include', '/dashboard/usuarios')
      
      // Verificar se pode ver lista de usuários
      cy.contains('Gerenciar Usuários').should('be.visible')
      cy.get('[data-testid="user-list"]').should('be.visible')
    })

    it('deve acessar relatórios financeiros', () => {
      cy.visit('/dashboard/financeiro')
      cy.url().should('include', '/dashboard/financeiro')
      
      // Verificar acesso a dados financeiros
      cy.contains('Relatórios Financeiros').should('be.visible')
      cy.get('[data-testid="financial-data"]').should('be.visible')
    })

    it('deve gerenciar ordens de serviço', () => {
      cy.visit('/dashboard/ordens-servico')
      cy.url().should('include', '/dashboard/ordens-servico')
      
      // Verificar permissões de criação e edição
      cy.get('[data-testid="create-order-btn"]').should('be.visible')
      cy.get('[data-testid="edit-order-btn"]').first().should('be.visible')
      cy.get('[data-testid="delete-order-btn"]').first().should('be.visible')
    })
  })

  describe('Gerente Administrativo Role', () => {
    beforeEach(() => {
      // Login como gerente administrativo
      cy.loginWithRole('gerente_adm')
      cy.waitForPageLoad()
    })

    it('deve ter acesso ao dashboard administrativo', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      
      // Verificar elementos visíveis para gerente administrativo
      cy.contains('Ordens de Serviço').should('be.visible')
      cy.contains('Clientes').should('be.visible')
      cy.contains('Usuários').should('be.visible')
      cy.contains('Relatórios').should('be.visible')
      
      // Verificar elementos restritos
      cy.contains('Configurações do Sistema').should('not.exist')
    })

    it('deve acessar relatórios operacionais e administrativos', () => {
      cy.visit('/dashboard/relatorios')
      cy.url().should('include', '/dashboard/relatorios')
      
      // Verificar acesso a relatórios operacionais
      cy.contains('Relatórios Operacionais').should('be.visible')
      cy.get('[data-testid="operational-reports"]').should('be.visible')
      cy.get('[data-testid="administrative-reports"]').should('be.visible')
      
      // Verificar restrição a relatórios financeiros detalhados
      cy.get('[data-testid="detailed-financial-reports"]').should('not.exist')
    })

    it('deve gerenciar ordens de serviço', () => {
      cy.visit('/dashboard/ordens-servico')
      cy.url().should('include', '/dashboard/ordens-servico')
      
      // Verificar permissões de criação e edição
      cy.get('[data-testid="create-order-btn"]').should('be.visible')
      cy.get('[data-testid="edit-order-btn"]').first().should('be.visible')
      cy.get('[data-testid="assign-technician-btn"]').should('be.visible')
      
      // Verificar restrição para exclusão
      cy.get('[data-testid="delete-order-btn"]').should('not.exist')
    })

    it('deve acessar gestão de usuários', () => {
      cy.visit('/dashboard/usuarios')
      cy.url().should('include', '/dashboard/usuarios')
      
      // Verificar se pode ver lista de usuários
      cy.contains('Gerenciar Usuários').should('be.visible')
      cy.get('[data-testid="user-list"]').should('be.visible')
      cy.get('[data-testid="create-user-btn"]').should('be.visible')
    })

    it('deve gerenciar clientes', () => {
      cy.visit('/dashboard/clientes')
      cy.url().should('include', '/dashboard/clientes')
      
      // Verificar permissões de gestão de clientes
      cy.get('[data-testid="create-client-btn"]').should('be.visible')
      cy.get('[data-testid="edit-client-btn"]').first().should('be.visible')
      cy.get('[data-testid="clients-table"]').should('be.visible')
    })
  })

  describe('Gerente Financeiro Role', () => {
    beforeEach(() => {
      // Login como gerente financeiro
      cy.loginWithRole('gerente_financeiro')
      cy.waitForPageLoad()
    })

    it('deve ter acesso ao dashboard financeiro', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      
      // Verificar elementos visíveis para gerente financeiro
      cy.contains('Relatórios Financeiros').should('be.visible')
      cy.contains('Pagamentos').should('be.visible')
      cy.contains('Ordens de Serviço').should('be.visible')
      
      // Verificar elementos restritos
      cy.contains('Usuários').should('not.exist')
      cy.contains('Configurações do Sistema').should('not.exist')
    })

    it('deve acessar relatórios financeiros', () => {
      cy.visit('/dashboard/relatorios')
      cy.url().should('include', '/dashboard/relatorios')
      
      // Verificar acesso a relatórios financeiros
      cy.contains('Relatórios Financeiros').should('be.visible')
      cy.get('[data-testid="financial-reports"]').should('be.visible')
      cy.get('[data-testid="export-reports-btn"]').should('be.visible')
    })

    it('deve gerenciar pagamentos', () => {
      cy.visit('/dashboard/pagamentos')
      cy.url().should('include', '/dashboard/pagamentos')
      
      // Verificar permissões de gestão de pagamentos
      cy.get('[data-testid="payments-table"]').should('be.visible')
      cy.get('[data-testid="payment-status-filter"]').should('be.visible')
    })

    it('não deve acessar gestão de usuários', () => {
      cy.visit('/dashboard/usuarios')
      
      // Deve ser redirecionado ou mostrar erro de acesso
      cy.url().should('not.include', '/dashboard/usuarios')
      cy.contains('Acesso negado').should('be.visible')
    })
  })

  describe('Technician Role', () => {
    beforeEach(() => {
      // Login como técnico
      cy.loginWithRole('technician')
      cy.waitForPageLoad()
    })

    it('deve ter acesso limitado ao dashboard', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      
      // Verificar elementos visíveis para técnico
      cy.contains('Minhas Ordens').should('be.visible')
      cy.contains('Equipamentos').should('be.visible')
      
      // Verificar elementos restritos
      cy.contains('Relatórios').should('not.exist')
      cy.contains('Clientes').should('not.exist')
      cy.contains('Financeiro').should('not.exist')
    })

    it('deve acessar apenas suas ordens de serviço', () => {
      cy.visit('/dashboard/ordens-servico')
      cy.url().should('include', '/dashboard/ordens-servico')
      
      // Verificar filtro automático para suas ordens
      cy.get('[data-testid="assigned-orders-filter"]').should('be.checked')
      cy.get('[data-testid="all-orders-filter"]').should('not.exist')
      
      // Verificar permissões limitadas
      cy.get('[data-testid="create-order-btn"]').should('not.exist')
      cy.get('[data-testid="edit-status-btn"]').should('be.visible')
      cy.get('[data-testid="delete-order-btn"]').should('not.exist')
    })

    it('deve atualizar status de ordens atribuídas', () => {
      cy.visit('/dashboard/ordens-servico')
      
      // Clicar na primeira ordem atribuída
      cy.get('[data-testid="order-row"]').first().click()
      
      // Verificar se pode atualizar status
      cy.get('[data-testid="status-select"]').should('be.visible')
      cy.get('[data-testid="update-status-btn"]').should('be.visible')
      
      // Verificar restrições
      cy.get('[data-testid="edit-client-btn"]').should('not.exist')
      cy.get('[data-testid="edit-price-btn"]').should('not.exist')
    })

    it('não deve acessar relatórios', () => {
      cy.visit('/dashboard/relatorios')
      
      // Deve ser redirecionado ou mostrar erro de acesso
      cy.url().should('not.include', '/dashboard/relatorios')
      cy.contains('Acesso negado').should('be.visible')
    })
  })

  describe('Supervisor Técnico Role', () => {
    beforeEach(() => {
      // Login como supervisor técnico
      cy.loginWithRole('supervisor_tecnico')
      cy.waitForPageLoad()
    })

    it('deve ter acesso ao dashboard técnico', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      
      // Verificar elementos visíveis para supervisor técnico
      cy.contains('Ordens de Serviço').should('be.visible')
      cy.contains('Técnicos').should('be.visible')
      cy.contains('Relatórios Técnicos').should('be.visible')
      cy.contains('Equipamentos').should('be.visible')
      
      // Verificar elementos restritos
      cy.contains('Usuários').should('not.exist')
      cy.contains('Clientes').should('not.exist')
      cy.contains('Configurações do Sistema').should('not.exist')
      cy.contains('Relatórios Financeiros').should('not.exist')
    })

    it('deve gerenciar ordens de serviço técnicas', () => {
      cy.visit('/dashboard/ordens-servico')
      cy.url().should('include', '/dashboard/ordens-servico')
      
      // Verificar permissões de supervisor técnico
      cy.get('[data-testid="assign-technician-btn"]').should('be.visible')
      cy.get('[data-testid="approve-order-btn"]').should('be.visible')
      cy.get('[data-testid="technical-notes"]').should('be.visible')
      cy.get('[data-testid="priority-change-btn"]').should('be.visible')
      
      // Verificar restrição para criação de novas ordens
      cy.get('[data-testid="create-order-btn"]').should('not.exist')
    })

    it('deve gerenciar técnicos', () => {
      cy.visit('/dashboard/tecnicos')
      cy.url().should('include', '/dashboard/tecnicos')
      
      // Verificar permissões de gestão de técnicos
      cy.get('[data-testid="technicians-table"]').should('be.visible')
      cy.get('[data-testid="assign-orders-btn"]').should('be.visible')
      cy.get('[data-testid="performance-metrics"]').should('be.visible')
    })

    it('deve acessar relatórios técnicos', () => {
      cy.visit('/dashboard/relatorios')
      cy.url().should('include', '/dashboard/relatorios')
      
      // Verificar acesso a relatórios técnicos
      cy.contains('Relatórios Técnicos').should('be.visible')
      cy.get('[data-testid="technical-reports"]').should('be.visible')
      cy.get('[data-testid="performance-reports"]').should('be.visible')
      
      // Verificar restrição a outros relatórios
      cy.get('[data-testid="financial-reports"]').should('not.exist')
      cy.get('[data-testid="administrative-reports"]').should('not.exist')
    })
  })

  describe('Diretor Role', () => {
    beforeEach(() => {
      // Login como diretor
      cy.loginWithRole('diretor')
      cy.waitForPageLoad()
    })

    it('deve ter acesso completo ao dashboard', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      
      // Verificar elementos visíveis para diretor (acesso total)
      cy.contains('Ordens de Serviço').should('be.visible')
      cy.contains('Clientes').should('be.visible')
      cy.contains('Usuários').should('be.visible')
      cy.contains('Relatórios').should('be.visible')
      cy.contains('Configurações do Sistema').should('be.visible')
      cy.contains('Financeiro').should('be.visible')
    })

    it('deve ter acesso a todos os relatórios', () => {
      cy.visit('/dashboard/relatorios')
      cy.url().should('include', '/dashboard/relatorios')
      
      // Verificar acesso a todos os tipos de relatórios
      cy.contains('Relatórios Financeiros').should('be.visible')
      cy.get('[data-testid="financial-reports"]').should('be.visible')
      cy.get('[data-testid="operational-reports"]').should('be.visible')
      cy.get('[data-testid="technical-reports"]').should('be.visible')
      cy.get('[data-testid="administrative-reports"]').should('be.visible')
      cy.get('[data-testid="export-reports-btn"]').should('be.visible')
    })

    it('deve gerenciar usuários e roles', () => {
      cy.visit('/dashboard/usuarios')
      cy.url().should('include', '/dashboard/usuarios')
      
      // Verificar permissões completas de gestão de usuários
      cy.get('[data-testid="create-user-btn"]').should('be.visible')
      cy.get('[data-testid="edit-user-btn"]').first().should('be.visible')
      cy.get('[data-testid="delete-user-btn"]').first().should('be.visible')
      cy.get('[data-testid="change-role-btn"]').first().should('be.visible')
      cy.get('[data-testid="users-table"]').should('be.visible')
    })

    it('deve acessar configurações do sistema', () => {
      cy.visit('/dashboard/configuracoes')
      cy.url().should('include', '/dashboard/configuracoes')
      
      // Verificar acesso às configurações do sistema
      cy.get('[data-testid="system-settings"]').should('be.visible')
      cy.get('[data-testid="security-settings"]').should('be.visible')
      cy.get('[data-testid="backup-settings"]').should('be.visible')
    })
  })

  describe('Atendente Role', () => {
    beforeEach(() => {
      // Login como atendente
      cy.loginWithRole('atendente')
      cy.waitForPageLoad()
    })

    it('deve ter acesso básico ao dashboard', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
      
      // Verificar elementos visíveis para atendente
      cy.contains('Clientes').should('be.visible')
      cy.contains('Nova Ordem').should('be.visible')
      cy.contains('Consultar Status').should('be.visible')
      
      // Verificar elementos restritos
      cy.contains('Relatórios').should('not.exist')
      cy.contains('Financeiro').should('not.exist')
      cy.contains('Equipe').should('not.exist')
    })

    it('deve gerenciar clientes', () => {
      cy.visit('/dashboard/clientes')
      cy.url().should('include', '/dashboard/clientes')
      
      // Verificar permissões de gestão de clientes
      cy.get('[data-testid="create-client-btn"]').should('be.visible')
      cy.get('[data-testid="edit-client-btn"]').first().should('be.visible')
      
      // Verificar restrições
      cy.get('[data-testid="delete-client-btn"]').should('not.exist')
      cy.get('[data-testid="client-financial-data"]').should('not.exist')
    })

    it('deve criar ordens de serviço básicas', () => {
      cy.visit('/dashboard/ordens-servico/nova')
      cy.url().should('include', '/dashboard/ordens-servico/nova')
      
      // Verificar formulário básico
      cy.get('[data-testid="client-select"]').should('be.visible')
      cy.get('[data-testid="service-description"]').should('be.visible')
      cy.get('[data-testid="create-order-btn"]').should('be.visible')
      
      // Verificar restrições
      cy.get('[data-testid="price-input"]').should('not.exist')
      cy.get('[data-testid="assign-technician"]').should('not.exist')
    })

    it('não deve acessar relatórios', () => {
      cy.visit('/dashboard/relatorios')
      
      // Deve ser redirecionado ou mostrar erro de acesso
      cy.url().should('not.include', '/dashboard/relatorios')
      cy.contains('Acesso negado').should('be.visible')
    })
  })

  describe('Proteção de Rotas', () => {
    it('deve redirecionar usuários não autenticados', () => {
      cy.visit('/dashboard/usuarios')
      
      // Deve ser redirecionado para login
      cy.url().should('include', '/auth/login')
      cy.contains('Entre na sua conta').should('be.visible')
    })

    it('deve mostrar erro 403 para acesso não autorizado', () => {
      // Login como técnico
      cy.login('tecnico@interalpha.com', 'tecnico123')
      
      // Tentar acessar área administrativa
      cy.visit('/dashboard/usuarios')
      
      // Verificar erro de acesso
      cy.contains('403').should('be.visible')
      cy.contains('Acesso negado').should('be.visible')
      cy.contains('Você não tem permissão').should('be.visible')
    })

    it('deve manter sessão após navegação', () => {
      // Login como gerente administrativo
    cy.login('gerente.adm@interalpha.com', 'GerenteAdm123!')
      
      // Navegar entre páginas permitidas
      cy.visit('/dashboard/ordens-servico')
      cy.url().should('include', '/dashboard/ordens-servico')
      
      cy.visit('/dashboard/clientes')
      cy.url().should('include', '/dashboard/clientes')
      
      // Verificar que ainda está autenticado
      cy.contains('Sair').should('be.visible')
    })
  })

  describe('Componentes Condicionais', () => {
    it('deve mostrar botões baseados em permissões - Admin', () => {
      cy.login('admin@interalpha.com', 'admin123')
      cy.visit('/dashboard/ordens-servico')
      
      // Admin deve ver todos os botões
      cy.get('[data-testid="create-btn"]').should('be.visible')
      cy.get('[data-testid="edit-btn"]').should('be.visible')
      cy.get('[data-testid="delete-btn"]').should('be.visible')
      cy.get('[data-testid="export-btn"]').should('be.visible')
    })

    it('deve mostrar botões baseados em permissões - Técnico', () => {
      cy.login('tecnico@interalpha.com', 'tecnico123')
      cy.visit('/dashboard/ordens-servico')
      
      // Técnico deve ver apenas botões de visualização e atualização
      cy.get('[data-testid="view-btn"]').should('be.visible')
      cy.get('[data-testid="update-status-btn"]').should('be.visible')
      cy.get('[data-testid="create-btn"]').should('not.exist')
      cy.get('[data-testid="delete-btn"]').should('not.exist')
    })

    it('deve filtrar dados baseado em permissões', () => {
      cy.login('supervisor.tecnico@interalpha.com', 'SupervisorTec123!')
      cy.visit('/dashboard/relatorios')
      
      // Supervisor técnico deve ver apenas dados da sua equipe
      cy.get('[data-testid="team-filter"]').should('be.checked')
      cy.get('[data-testid="all-data-filter"]').should('not.exist')
      
      // Verificar que dados são filtrados
      cy.get('[data-testid="report-data"]').should('contain', 'Equipe')
      cy.get('[data-testid="report-data"]').should('not.contain', 'Todos os Dados')
    })
  })
})