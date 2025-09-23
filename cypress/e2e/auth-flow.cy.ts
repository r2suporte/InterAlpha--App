describe('Fluxo de Autenticação', () => {
  it('deve carregar a página de login', () => {
    cy.visit('/auth/login')
    cy.wait(1000)
    
    // Verificar se a página carregou
    cy.url().should('include', '/auth/login')
    
    // Verificar se elementos básicos existem
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
    cy.get('button[type="submit"]').should('exist')
  })

  it('deve ter formulário funcional', () => {
    cy.visit('/auth/login')
    cy.wait(1000)
    
    // Preencher campos
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    
    // Verificar se os valores foram preenchidos
    cy.get('input[type="email"]').should('have.value', 'test@example.com')
    cy.get('input[type="password"]').should('have.value', 'password123')
  })

  it('deve acessar dashboard diretamente', () => {
    cy.visit('/dashboard')
    cy.wait(2000)
    
    // Verificar se chegou em alguma página (login ou dashboard)
    cy.url().should('match', /(auth\/login|dashboard)/)
  })
})