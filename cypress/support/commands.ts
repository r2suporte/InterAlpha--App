/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Comando para login
Cypress.Commands.add(
  'login',
  (email = 'admin@interalpha.com', password = 'admin123') => {
    cy.visit('/auth/login');
    cy.contains('Entre na sua conta').should('be.visible');
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();
    cy.wait(2000);
    cy.url().should('include', '/dashboard');
  }
);

// Comando para logout
Cypress.Commands.add('logout', () => {
  cy.contains('Sair').click();
  cy.url().should('include', '/auth/login');
});

// Comando para buscar por data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Comando para aguardar carregamento da página
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  // Aguardar que não haja mais indicadores de loading
  cy.get('[data-testid="loading"]').should('not.exist');
  cy.get('.loading').should('not.exist');
});

// Comando para interceptar APIs comuns
Cypress.Commands.add('interceptCommonAPIs', () => {
  // Interceptar chamadas de autenticação
  cy.intercept('POST', '/api/auth/login').as('loginAPI');
  cy.intercept('POST', '/api/auth/logout').as('logoutAPI');
  cy.intercept('GET', '/api/auth/verify').as('verifyAPI');

  // Interceptar chamadas de clientes
  cy.intercept('GET', '/api/clientes*').as('getClientes');
  cy.intercept('POST', '/api/clientes').as('createCliente');
  cy.intercept('PUT', '/api/clientes/*').as('updateCliente');
  cy.intercept('DELETE', '/api/clientes/*').as('deleteCliente');

  // Interceptar chamadas de ordens de serviço
  cy.intercept('GET', '/api/ordens-servico*').as('getOrdens');
  cy.intercept('POST', '/api/ordens-servico').as('createOrdem');
  cy.intercept('PUT', '/api/ordens-servico/*').as('updateOrdem');
  cy.intercept('PATCH', '/api/ordens-servico/*/status').as('updateStatusOrdem');
  cy.intercept('DELETE', '/api/ordens-servico/*').as('deleteOrdem');
});

// Funções auxiliares para login com diferentes roles
const loginCredentials = {
  admin: { email: 'admin@interalpha.com', password: 'admin123' },
  technician: { email: 'tecnico@interalpha.com', password: 'tecnico123' },
  gerente_adm: { email: 'gerente.adm@interalpha.com', password: 'gerente123' },
  gerente_financeiro: {
    email: 'gerente.financeiro@interalpha.com',
    password: 'financeiro123',
  },
  supervisor_tecnico: {
    email: 'supervisor.tecnico@interalpha.com',
    password: 'SupervisorTec123!',
  },
  diretor: { email: 'diretor@interalpha.com', password: 'diretor123' },
  atendente: { email: 'atendente@interalpha.com', password: 'atendente123' },
  user: { email: 'user@interalpha.com', password: 'user123' },
};

// Comando para login com role específica
Cypress.Commands.add('loginWithRole', (role: keyof typeof loginCredentials) => {
  const credentials = loginCredentials[role];
  cy.login(credentials.email, credentials.password);
});
