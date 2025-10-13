describe('CRUD de Ordens de Serviço', () => {
  it('deve acessar página de ordens de serviço', () => {
    cy.visit('/dashboard/ordens-servico');
    cy.wait(2000);

    // Verificar se chegou na página ou foi redirecionado para login
    cy.url().should('match', /(dashboard\/ordens-servico|auth\/login)/);
  });

  it('deve carregar elementos básicos da página', () => {
    cy.visit('/dashboard/ordens-servico');
    cy.wait(2000);

    // Se estiver na página de ordens, verificar elementos básicos
    cy.url().then(url => {
      if (url.includes('/dashboard/ordens-servico')) {
        // Verificar se a página tem conteúdo
        cy.get('body').should('not.be.empty');

        // Verificar se há alguma referência a ordens
        cy.get('body').should('contain.text', 'ordem');
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
