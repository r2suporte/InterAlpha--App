import {
  TipoPessoa,
  buscarDadosCNPJ,
  buscarEnderecoPorCEP,
  determinarTipoPessoa,
  formatarCEP,
  formatarCNPJ,
  formatarCPF,
  formatarCpfCnpj,
  formatarTelefone,
  getMascaraCpfCnpj,
  getMascaraPorTipo,
  limparDocumento,
  validarCEP,
  validarCNPJ,
  validarCPF,
  validarCamposObrigatorios,
  validarCpfCnpj,
  validarEmail,
} from '@/lib/validators';

// Mock fetch para testes de APIs externas
global.fetch = jest.fn();

describe('Validators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validarCPF', () => {
    it('valida CPF válido', () => {
      expect(validarCPF('11144477735')).toBe(true);
      expect(validarCPF('111.444.777-35')).toBe(true);
    });

    it('rejeita CPF inválido', () => {
      expect(validarCPF('12345678901')).toBe(false);
      expect(validarCPF('111.444.777-36')).toBe(false);
      expect(validarCPF('')).toBe(false);
      expect(validarCPF('abc')).toBe(false);
    });

    it('rejeita CPFs com todos os dígitos iguais', () => {
      expect(validarCPF('11111111111')).toBe(false);
      expect(validarCPF('000.000.000-00')).toBe(false);
    });
  });

  describe('validarCNPJ', () => {
    it('valida CNPJ válido', () => {
      expect(validarCNPJ('11222333000181')).toBe(true);
      expect(validarCNPJ('11.222.333/0001-81')).toBe(true);
    });

    it('rejeita CNPJ inválido', () => {
      expect(validarCNPJ('12345678000100')).toBe(false);
      expect(validarCNPJ('11.222.333/0001-82')).toBe(false);
      expect(validarCNPJ('')).toBe(false);
      expect(validarCNPJ('abc')).toBe(false);
    });

    it('rejeita CNPJs com todos os dígitos iguais', () => {
      expect(validarCNPJ('11111111111111')).toBe(false);
      expect(validarCNPJ('00.000.000/0000-00')).toBe(false);
    });
  });

  describe('validarCpfCnpj', () => {
    it('valida CPF quando tipo é física', () => {
      expect(validarCpfCnpj('11144477735', 'fisica')).toBe(true);
      expect(validarCpfCnpj('12345678901', 'fisica')).toBe(false);
    });

    it('valida CNPJ quando tipo é jurídica', () => {
      expect(validarCpfCnpj('11222333000181', 'juridica')).toBe(true);
      expect(validarCpfCnpj('12345678000100', 'juridica')).toBe(false);
    });
  });

  describe('formatarCPF', () => {
    it('formata CPF corretamente', () => {
      expect(formatarCPF('11144477735')).toBe('111.444.777-35');
      expect(formatarCPF('111.444.777-35')).toBe('111.444.777-35');
    });

    it('retorna string vazia para entrada inválida', () => {
      expect(formatarCPF('')).toBe('');
      expect(formatarCPF('abc')).toBe('abc');
    });
  });

  describe('formatarCNPJ', () => {
    it('formata CNPJ corretamente', () => {
      expect(formatarCNPJ('11222333000181')).toBe('11.222.333/0001-81');
      expect(formatarCNPJ('11.222.333/0001-81')).toBe('11.222.333/0001-81');
    });

    it('retorna string vazia para entrada inválida', () => {
      expect(formatarCNPJ('')).toBe('');
      expect(formatarCNPJ('abc')).toBe('');
    });
  });

  describe('formatarCpfCnpj', () => {
    it('formata CPF quando tipo é física', () => {
      expect(formatarCpfCnpj('11144477735', 'fisica')).toBe('111.444.777-35');
    });

    it('formata CNPJ quando tipo é jurídica', () => {
      expect(formatarCpfCnpj('11222333000181', 'juridica')).toBe(
        '11.222.333/0001-81'
      );
    });
  });

  describe('formatarTelefone', () => {
    it('formata telefone celular', () => {
      expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321');
    });

    it('formata telefone fixo', () => {
      expect(formatarTelefone('1133334444')).toBe('(11) 3333-4444');
    });

    it('mantém formatação existente', () => {
      expect(formatarTelefone('(11) 98765-4321')).toBe('(11) 98765-4321');
    });

    it('retorna string original para entrada inválida', () => {
      expect(formatarTelefone('123')).toBe('123');
      expect(formatarTelefone('')).toBe('');
    });
  });

  describe('formatarCEP', () => {
    it('formata CEP corretamente', () => {
      expect(formatarCEP('01234567')).toBe('01234-567');
      expect(formatarCEP('01234-567')).toBe('01234-567');
    });

    it('retorna string original para entrada inválida', () => {
      expect(formatarCEP('123')).toBe('123');
      expect(formatarCEP('')).toBe('');
    });
  });

  describe('validarEmail', () => {
    it('valida email válido', () => {
      expect(validarEmail('test@example.com')).toBe(true);
      expect(validarEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('rejeita email inválido', () => {
      expect(validarEmail('invalid-email')).toBe(false);
      expect(validarEmail('test@')).toBe(false);
      expect(validarEmail('@domain.com')).toBe(false);
      expect(validarEmail('')).toBe(false);
    });
  });

  describe('validarCEP', () => {
    it('valida CEP válido', () => {
      expect(validarCEP('01234567')).toBe(true);
      expect(validarCEP('01234-567')).toBe(true);
    });

    it('rejeita CEP inválido', () => {
      expect(validarCEP('123')).toBe(false);
      expect(validarCEP('abcdefgh')).toBe(false);
      expect(validarCEP('')).toBe(false);
    });
  });

  describe('determinarTipoPessoa', () => {
    it('determina pessoa física para CPF', () => {
      expect(determinarTipoPessoa('11144477735')).toBe('fisica');
      expect(determinarTipoPessoa('111.444.777-35')).toBe('fisica');
    });

    it('determina pessoa jurídica para CNPJ', () => {
      expect(determinarTipoPessoa('11222333000181')).toBe('juridica');
      expect(determinarTipoPessoa('11.222.333/0001-81')).toBe('juridica');
    });

    it('retorna física como padrão para documento inválido', () => {
      expect(determinarTipoPessoa('123')).toBe('fisica');
      expect(determinarTipoPessoa('')).toBe('fisica');
    });
  });

  describe('getMascaraCpfCnpj', () => {
    it('retorna máscara de CPF para documento de 11 dígitos', () => {
      expect(getMascaraCpfCnpj('11144477735')).toBe('999.999.999-99');
    });

    it('retorna máscara de CNPJ para documento de 14 dígitos', () => {
      expect(getMascaraCpfCnpj('11222333000181')).toBe('99.999.999/9999-99');
    });

    it('retorna string vazia para documento inválido', () => {
      expect(getMascaraCpfCnpj('123')).toBe('999.999.999-99');
      expect(getMascaraCpfCnpj('')).toBe('999.999.999-99');
    });
  });

  describe('getMascaraPorTipo', () => {
    it('retorna máscara de CPF', () => {
      expect(getMascaraPorTipo('cpf')).toBe('999.999.999-99');
    });

    it('retorna máscara de CNPJ', () => {
      expect(getMascaraPorTipo('cnpj')).toBe('99.999.999/9999-99');
    });
  });

  describe('limparDocumento', () => {
    it('remove caracteres especiais', () => {
      expect(limparDocumento('111.444.777-35')).toBe('11144477735');
      expect(limparDocumento('11.222.333/0001-81')).toBe('11222333000181');
    });
  });

  describe('validarCamposObrigatorios', () => {
    const dadosValidos = {
      nome: 'João Silva',
      email: 'joao@example.com',
      cpfCnpj: '11144477735',
      tipoPessoa: 'fisica' as TipoPessoa,
    };

    it('retorna array vazio para dados válidos', () => {
      expect(validarCamposObrigatorios(dadosValidos)).toEqual([]);
    });

    it('retorna erros para campos obrigatórios vazios', () => {
      const erros = validarCamposObrigatorios({
        nome: '',
        email: '',
        cpfCnpj: '',
        tipoPessoa: 'fisica',
      });

      expect(erros).toContain('Nome é obrigatório');
      expect(erros).toContain('Email é obrigatório');
      expect(erros).toContain('CPF/CNPJ é obrigatório');
    });

    it('retorna erro para email inválido', () => {
      const erros = validarCamposObrigatorios({
        ...dadosValidos,
        email: 'email-invalido',
      });

      expect(erros).toContain('Email inválido');
    });

    it('retorna erro para CPF inválido', () => {
      const erros = validarCamposObrigatorios({
        ...dadosValidos,
        cpfCnpj: '12345678901',
      });

      expect(erros).toContain('CPF inválido');
    });

    it('retorna erro para CNPJ inválido', () => {
      const erros = validarCamposObrigatorios({
        ...dadosValidos,
        cpfCnpj: '12345678000100',
        tipoPessoa: 'juridica',
      });

      expect(erros).toContain('CNPJ inválido');
    });
  });

  describe('buscarEnderecoPorCEP', () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    it('busca endereço com sucesso', async () => {
      const mockResponse = {
        cep: '01234-567',
        logradouro: 'Rua Teste',
        complemento: '',
        bairro: 'Centro',
        localidade: 'São Paulo',
        uf: 'SP',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const resultado = await buscarEnderecoPorCEP('01234567');
      expect(resultado).toEqual(mockResponse);
    });

    it('retorna null para CEP inválido', async () => {
      const resultado = await buscarEnderecoPorCEP('123');
      expect(resultado).toBeNull();
    });

    it('retorna null quando API retorna erro', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      const resultado = await buscarEnderecoPorCEP('01234567');
      expect(resultado).toBeNull();
    });

    it('retorna null quando CEP não é encontrado', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ erro: true }),
      } as Response);

      const resultado = await buscarEnderecoPorCEP('01234567');
      expect(resultado).toBeNull();
    });

    it('retorna null quando fetch falha', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const resultado = await buscarEnderecoPorCEP('01234567');
      expect(resultado).toBeNull();
    });
  });

  describe('buscarDadosCNPJ', () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    it('busca dados do CNPJ com sucesso', async () => {
      const mockResponse = {
        cnpj: '11222333000181',
        razao_social: 'Empresa Teste LTDA',
        nome_fantasia: 'Empresa Teste',
        descricao_situacao_cadastral: 'ATIVA',
        cnae_fiscal: {
          codigo: '6201-5/00',
          descricao: 'Desenvolvimento de programas de computador sob encomenda',
        },
        logradouro: 'Rua Teste',
        numero: '123',
        complemento: 'Sala 1',
        bairro: 'Centro',
        municipio: 'São Paulo',
        uf: 'SP',
        cep: '01234567',
        ddd_telefone_1: '1133334444',
        email: 'contato@empresa.com',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const resultado = await buscarDadosCNPJ('11222333000181');
      expect(resultado).toEqual({
        cnpj: '11222333000181',
        nome: 'Empresa Teste LTDA',
        fantasia: 'Empresa Teste',
        situacao: 'ATIVA',
        atividade_principal: [
          {
            code: '6201-5/00',
            text: 'Desenvolvimento de programas de computador sob encomenda',
          },
        ],
        endereco: {
          logradouro: 'Rua Teste',
          numero: '123',
          complemento: 'Sala 1',
          bairro: 'Centro',
          municipio: 'São Paulo',
          uf: 'SP',
          cep: '01234567',
        },
        telefone: '(11) 33334444',
        email: 'contato@empresa.com',
      });
    });

    it('retorna null para CNPJ inválido', async () => {
      const resultado = await buscarDadosCNPJ('123');
      expect(resultado).toBeNull();
    });

    it('retorna null para CNPJ com formato inválido', async () => {
      const resultado = await buscarDadosCNPJ('12345678000100');
      expect(resultado).toBeNull();
    });

    it('retorna erro quando CNPJ não é encontrado', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const resultado = await buscarDadosCNPJ('11222333000181');
      expect(resultado).toEqual({
        cnpj: '11222333000181',
        nome: '',
        situacao: 'CNPJ não encontrado',
        atividade_principal: [],
        erro: true,
        message: 'CNPJ não encontrado na base de dados',
      });
    });

    it('retorna erro quando API falha', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const resultado = await buscarDadosCNPJ('11222333000181');
      expect(resultado).toEqual({
        cnpj: '11222333000181',
        nome: '',
        situacao: 'Serviço temporariamente indisponível',
        atividade_principal: [],
        erro: true,
        message: 'Não foi possível consultar o CNPJ. Tente novamente em alguns instantes.',
      });
    });

    it('retorna erro quando fetch falha', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const resultado = await buscarDadosCNPJ('11222333000181');
      expect(resultado).toEqual({
        cnpj: '11222333000181',
        nome: '',
        situacao: 'Serviço temporariamente indisponível',
        atividade_principal: [],
        erro: true,
        message: 'Não foi possível consultar o CNPJ. Tente novamente em alguns instantes.',
      });
    });
  });
});
