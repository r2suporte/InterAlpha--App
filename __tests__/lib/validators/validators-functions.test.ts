/**
 * Testes para lib/validators.ts
 * Testando funções de validação de CPF, CNPJ, Email, CEP e formatação
 */

import {
  validarCPF,
  validarCNPJ,
  validarCpfCnpj,
  formatarCPF,
  formatarCNPJ,
  formatarCpfCnpj,
  formatarTelefone,
  formatarCEP,
  validarEmail,
  validarCEP,
  determinarTipoPessoa,
  getMascaraCpfCnpj,
  getMascaraPorTipo,
  limparDocumento,
  validarCamposObrigatorios,
  type TipoPessoa,
} from '../../../lib/validators';

describe('lib/validators', () => {
  describe('CPF Validation', () => {
    it('deve validar CPF válido', () => {
      // CPF válido: 111.444.777-35
      expect(validarCPF('11144477735')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validarCPF('11111111111')).toBe(false);
    });

    it('deve rejeitar CPF com menos de 11 dígitos', () => {
      expect(validarCPF('123456789')).toBe(false);
    });

    it('deve aceitar CPF formatado', () => {
      expect(validarCPF('111.444.777-35')).toBe(true);
    });

    it('deve rejeitar CPF vazio', () => {
      expect(validarCPF('')).toBe(false);
    });
  });

  describe('CNPJ Validation', () => {
    it('deve validar CNPJ válido', () => {
      // CNPJ válido
      const validCNPJ = '11222333000181';
      expect(validarCNPJ(validCNPJ)).toBe(true);
    });

    it('deve rejeitar CNPJ inválido', () => {
      expect(validarCNPJ('11111111111111')).toBe(false);
    });

    it('deve rejeitar CNPJ com menos de 14 dígitos', () => {
      expect(validarCNPJ('123456789')).toBe(false);
    });

    it('deve aceitar CNPJ formatado', () => {
      const validCNPJ = '11.222.333/0001-81';
      expect(validarCNPJ(validCNPJ)).toBe(true);
    });

    it('deve rejeitar CNPJ vazio', () => {
      expect(validarCNPJ('')).toBe(false);
    });
  });

  describe('CPF/CNPJ Combined Validation', () => {
    it('deve validar CPF quando tipo é física', () => {
      expect(validarCpfCnpj('11144477735', 'fisica')).toBe(true);
    });

    it('deve validar CNPJ quando tipo é jurídica', () => {
      expect(validarCpfCnpj('11222333000181', 'juridica')).toBe(true);
    });

    it('deve rejeitar CPF inválido para pessoa física', () => {
      expect(validarCpfCnpj('12345678901', 'fisica')).toBe(false);
    });

    it('deve rejeitar CNPJ inválido para pessoa jurídica', () => {
      expect(validarCpfCnpj('12345678901234', 'juridica')).toBe(false);
    });

    it('deve rejeitar documento vazio', () => {
      expect(validarCpfCnpj('', 'fisica')).toBe(false);
    });
  });

  describe('CPF Formatting', () => {
    it('deve formatar CPF corretamente', () => {
      expect(formatarCPF('11144477735')).toBe('111.444.777-35');
    });

    it('deve retornar valor original se CPF tem comprimento inválido', () => {
      expect(formatarCPF('123456')).toBe('123456');
    });

    it('deve aceitar CPF já formatado', () => {
      expect(formatarCPF('111.444.777-35')).toBe('111.444.777-35');
    });
  });

  describe('CNPJ Formatting', () => {
    it('deve formatar CNPJ corretamente', () => {
      expect(formatarCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });

    it('deve retornar string vazia se CNPJ tem comprimento inválido', () => {
      expect(formatarCNPJ('123456')).toBe('');
    });

    it('deve aceitar CNPJ já formatado', () => {
      expect(formatarCNPJ('11.222.333/0001-81')).toBe('11.222.333/0001-81');
    });
  });

  describe('CPF/CNPJ Combined Formatting', () => {
    it('deve formatar CPF quando tipo é física', () => {
      expect(formatarCpfCnpj('11144477735', 'fisica')).toBe('111.444.777-35');
    });

    it('deve formatar CNPJ quando tipo é jurídica', () => {
      expect(formatarCpfCnpj('11222333000181', 'juridica')).toBe(
        '11.222.333/0001-81'
      );
    });

    it('deve retornar string vazia quando documento é vazio', () => {
      expect(formatarCpfCnpj('', 'fisica')).toBe('');
    });
  });

  describe('Phone Formatting', () => {
    it('deve formatar telefone com 10 dígitos', () => {
      expect(formatarTelefone('1133334444')).toBe('(11) 3333-4444');
    });

    it('deve formatar celular com 11 dígitos', () => {
      expect(formatarTelefone('11999998888')).toBe('(11) 99999-8888');
    });

    it('deve aceitar telefone já formatado', () => {
      const formatted = formatarTelefone('(11) 99999-8888');
      expect(formatted).toContain('11');
      expect(formatted).toContain('99999');
    });

    it('deve retornar valor original se tamanho inválido', () => {
      expect(formatarTelefone('123')).toBe('123');
    });
  });

  describe('CEP Formatting', () => {
    it('deve formatar CEP corretamente', () => {
      expect(formatarCEP('01310100')).toBe('01310-100');
    });

    it('deve aceitar CEP já formatado', () => {
      expect(formatarCEP('01310-100')).toBe('01310-100');
    });

    it('deve retornar valor original se tamanho inválido', () => {
      expect(formatarCEP('123')).toBe('123');
    });
  });

  describe('Email Validation', () => {
    it('deve validar email válido', () => {
      expect(validarEmail('test@example.com')).toBe(true);
    });

    it('deve validar email com subdomínio', () => {
      expect(validarEmail('user@mail.company.com')).toBe(true);
    });

    it('deve rejeitar email sem @', () => {
      expect(validarEmail('testexample.com')).toBe(false);
    });

    it('deve rejeitar email sem domínio', () => {
      expect(validarEmail('test@')).toBe(false);
    });

    it('deve rejeitar email com espaço', () => {
      expect(validarEmail('test @example.com')).toBe(false);
    });

    it('deve rejeitar email vazio', () => {
      expect(validarEmail('')).toBe(false);
    });
  });

  describe('CEP Validation', () => {
    it('deve validar CEP com 8 dígitos', () => {
      expect(validarCEP('01310100')).toBe(true);
    });

    it('deve validar CEP formatado', () => {
      expect(validarCEP('01310-100')).toBe(true);
    });

    it('deve rejeitar CEP com menos de 8 dígitos', () => {
      expect(validarCEP('0131')).toBe(false);
    });

    it('deve rejeitar CEP vazio', () => {
      expect(validarCEP('')).toBe(false);
    });
  });

  describe('Determine Type of Person', () => {
    it('deve determinar pessoa física para 11 dígitos', () => {
      expect(determinarTipoPessoa('11144477735')).toBe('fisica');
    });

    it('deve determinar pessoa jurídica para 14 dígitos', () => {
      expect(determinarTipoPessoa('11222333000181')).toBe('juridica');
    });

    it('deve retornar física por padrão para documento indefinido', () => {
      expect(determinarTipoPessoa('123')).toBe('fisica');
    });
  });

  describe('Get CPF/CNPJ Mask', () => {
    it('deve retornar máscara CPF para até 11 dígitos', () => {
      expect(getMascaraCpfCnpj('111444777')).toBe('999.999.999-99');
    });

    it('deve retornar máscara CNPJ para mais de 11 dígitos', () => {
      expect(getMascaraCpfCnpj('11222333000181')).toBe('99.999.999/9999-99');
    });

    it('deve retornar máscara CPF por padrão', () => {
      expect(getMascaraCpfCnpj('')).toBe('999.999.999-99');
    });
  });

  describe('Get Mask by Type', () => {
    it('deve retornar máscara CPF para tipo cpf', () => {
      expect(getMascaraPorTipo('cpf')).toBe('999.999.999-99');
    });

    it('deve retornar máscara CNPJ para tipo cnpj', () => {
      expect(getMascaraPorTipo('cnpj')).toBe('99.999.999/9999-99');
    });
  });

  describe('Clean Document', () => {
    it('deve remover formatação de CPF', () => {
      expect(limparDocumento('111.444.777-35')).toBe('11144477735');
    });

    it('deve remover formatação de CNPJ', () => {
      expect(limparDocumento('11.222.333/0001-81')).toBe('11222333000181');
    });

    it('deve retornar valor como está se já limpo', () => {
      expect(limparDocumento('11144477735')).toBe('11144477735');
    });

    it('deve remover todos os caracteres não numéricos', () => {
      expect(limparDocumento('111-444-777-35')).toBe('11144477735');
    });
  });

  describe('Validate Required Fields', () => {
    it('deve retornar array vazio para dados válidos', () => {
      const dados = {
        nome: 'João Silva',
        email: 'joao@example.com',
        cpfCnpj: '11144477735',
        tipoPessoa: 'fisica' as TipoPessoa,
      };
      expect(validarCamposObrigatorios(dados)).toEqual([]);
    });

    it('deve validar nome obrigatório', () => {
      const dados = {
        nome: '',
        email: 'joao@example.com',
        cpfCnpj: '11144477735',
        tipoPessoa: 'fisica' as TipoPessoa,
      };
      const erros = validarCamposObrigatorios(dados);
      expect(erros).toContain('Nome é obrigatório');
    });

    it('deve validar email obrigatório', () => {
      const dados = {
        nome: 'João Silva',
        email: '',
        cpfCnpj: '11144477735',
        tipoPessoa: 'fisica' as TipoPessoa,
      };
      const erros = validarCamposObrigatorios(dados);
      expect(erros).toContain('Email é obrigatório');
    });

    it('deve validar email inválido', () => {
      const dados = {
        nome: 'João Silva',
        email: 'email-invalido',
        cpfCnpj: '11144477735',
        tipoPessoa: 'fisica' as TipoPessoa,
      };
      const erros = validarCamposObrigatorios(dados);
      expect(erros).toContain('Email inválido');
    });

    it('deve validar CPF obrigatório', () => {
      const dados = {
        nome: 'João Silva',
        email: 'joao@example.com',
        cpfCnpj: '',
        tipoPessoa: 'fisica' as TipoPessoa,
      };
      const erros = validarCamposObrigatorios(dados);
      expect(erros).toContain('CPF/CNPJ é obrigatório');
    });

    it('deve validar CPF inválido para pessoa física', () => {
      const dados = {
        nome: 'João Silva',
        email: 'joao@example.com',
        cpfCnpj: '12345678901',
        tipoPessoa: 'fisica' as TipoPessoa,
      };
      const erros = validarCamposObrigatorios(dados);
      expect(erros.length).toBeGreaterThan(0);
    });

    it('deve validar CNPJ para pessoa jurídica', () => {
      const dados = {
        nome: 'Empresa LTDA',
        email: 'empresa@example.com',
        cpfCnpj: '11222333000181',
        tipoPessoa: 'juridica' as TipoPessoa,
      };
      const erros = validarCamposObrigatorios(dados);
      expect(erros).toEqual([]);
    });

    it('deve retornar múltiplos erros', () => {
      const dados = {
        nome: '',
        email: 'email-invalido',
        cpfCnpj: '',
        tipoPessoa: 'fisica' as TipoPessoa,
      };
      const erros = validarCamposObrigatorios(dados);
      expect(erros.length).toBeGreaterThan(2);
    });
  });
});
