/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Comando para fazer login com email e senha
     */
    login(email?: string, password?: string): Chainable<void>;

    /**
     * Comando para fazer logout
     */
    logout(): Chainable<void>;

    /**
     * Comando para buscar elemento por data-testid
     */
    getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

    /**
     * Comando para aguardar carregamento da página
     */
    waitForPageLoad(): Chainable<void>;

    /**
     * Comando para interceptar APIs comuns
     */
    interceptCommonAPIs(): Chainable<void>;

    /**
     * Comando para login com role específica
     */
    loginWithRole(
      role:
        | 'admin'
        | 'diretor'
        | 'gerente_adm'
        | 'gerente_financeiro'
        | 'supervisor_tecnico'
        | 'technician'
        | 'atendente'
        | 'user'
    ): Chainable<void>;
  }
}
