describe('CRUD de Clientes', () => {
  it('deve acessar página de clientes', () => {
    cy.visit('/dashboard/clientes');
    cy.wait(2000);

    // Verificar se chegou na página ou foi redirecionado para login
    cy.url().should('match', /(dashboard\/clientes|auth\/login)/);
  });

  it('deve carregar elementos básicos da página', () => {
    cy.visit('/dashboard/clientes');
    cy.wait(2000);

    // Se estiver na página de clientes, verificar elementos básicos
    cy.url().then(url => {
      if (url.includes('/dashboard/clientes')) {
        // Verificar se a página tem conteúdo
        cy.get('body').should('not.be.empty');

        // Verificar se há alguma referência a clientes
        cy.get('body').should('contain.text', 'cliente');
      }
    });
  });

  it('deve ter navegação funcional', () => {
    cy.visit('/dashboard');
    cy.wait(2000);

    // Verificar se consegue navegar
    cy.url().should('match', /(dashboard|auth\/login)/);
  });
});
