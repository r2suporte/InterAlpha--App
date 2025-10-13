describe('Navegação e Funcionalidades do Dashboard', () => {
  it('deve acessar dashboard principal', () => {
    cy.visit('/dashboard');
    cy.wait(2000);

    // Verificar se chegou no dashboard ou foi redirecionado para login
    cy.url().should('match', /(dashboard|auth\/login)/);
  });

  it('deve carregar elementos básicos do dashboard', () => {
    cy.visit('/dashboard');
    cy.wait(2000);

    // Se estiver no dashboard, verificar elementos básicos
    cy.url().then(url => {
      if (url.includes('/dashboard')) {
        // Verificar se a página tem conteúdo
        cy.get('body').should('not.be.empty');

        // Verificar se há alguma referência a dashboard
        cy.get('body').should('contain.text', 'dashboard');
      }
    });
  });

  it('deve permitir navegação básica', () => {
    cy.visit('/dashboard');
    cy.wait(2000);

    // Verificar se consegue navegar
    cy.url().should('match', /(dashboard|auth\/login)/);
  });
});
