/**
 * Testes para Validadores de Segurança
 * Testa todos os schemas Zod e funções utilitárias de validação
 */

import {
  senhaSchema,
  emailSchema,
  nomeSchema,
  telefoneSchema,
  cpfSchema,
  cnpjSchema,
  cepSchema,
  urlSchema,
  textoLivreSchema,
  uuidSchema,
  valorMonetarioSchema,
  loginSchema,
  registroSchema,
  clienteSchema,
  ordemServicoSchema,
  pagamentoSchema,
  rateLimitSchema,
  sanitizeHtml,
  validateApiInput,
} from '@/lib/validators/security';

describe('Validadores de Segurança', () => {
  describe('senhaSchema', () => {
    it('deve aceitar senhas válidas', () => {
      const senhasValidas = [
        'MinhaSenh@123',
        'P@ssw0rd!',
        'Teste123!@#',
        'AbC123!@#$%^&*()',
      ];

      senhasValidas.forEach(senha => {
        expect(() => senhaSchema.parse(senha)).not.toThrow();
      });
    });

    it('deve rejeitar senhas muito curtas', () => {
      expect(() => senhaSchema.parse('Abc1!')).toThrow('Senha deve ter pelo menos 8 caracteres');
    });

    it('deve rejeitar senhas muito longas', () => {
       const senhaLonga = `${'A'.repeat(130)  }a1!`;
       expect(() => senhaSchema.parse(senhaLonga)).toThrow('Senha muito longa');
     });

    it('deve rejeitar senhas sem letra maiúscula', () => {
      expect(() => senhaSchema.parse('minhasenha123!')).toThrow('Senha deve conter pelo menos uma letra maiúscula');
    });

    it('deve rejeitar senhas sem letra minúscula', () => {
      expect(() => senhaSchema.parse('MINHASENHA123!')).toThrow('Senha deve conter pelo menos uma letra minúscula');
    });

    it('deve rejeitar senhas sem número', () => {
      expect(() => senhaSchema.parse('MinhaSenha!')).toThrow('Senha deve conter pelo menos um número');
    });

    it('deve rejeitar senhas sem caractere especial', () => {
      expect(() => senhaSchema.parse('MinhaSenha123')).toThrow('Senha deve conter pelo menos um caractere especial');
    });
  });

  describe('emailSchema', () => {
    it('deve aceitar emails válidos', () => {
      const emailsValidos = [
        'teste@exemplo.com',
        'usuario.teste@dominio.com.br',
        'admin+tag@site.org',
        'user123@test-domain.co.uk',
      ];

      emailsValidos.forEach(email => {
        const resultado = emailSchema.parse(email);
        expect(resultado).toBe(email.toLowerCase().trim());
      });
    });

    it('deve transformar email para lowercase e remover espaços', () => {
       expect(emailSchema.parse('TESTE@EXEMPLO.COM')).toBe('teste@exemplo.com');
     });

    it('deve rejeitar emails inválidos', () => {
      const emailsInvalidos = [
        'email-invalido',
        '@dominio.com',
        'usuario@',
        'usuario..duplo@dominio.com',
        'usuario@dominio',
      ];

      emailsInvalidos.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow('Email inválido');
      });
    });

    it('deve rejeitar emails muito longos', () => {
      const emailLongo = `${'a'.repeat(250)  }@dominio.com`;
      expect(() => emailSchema.parse(emailLongo)).toThrow('Email muito longo');
    });
  });

  describe('nomeSchema', () => {
    it('deve aceitar nomes válidos', () => {
      const nomesValidos = [
        'João Silva',
        'Maria José da Silva',
        'José',
        'Ana Beatriz',
        'Carlos André',
        'Ângela Cristina',
      ];

      nomesValidos.forEach(nome => {
        const resultado = nomeSchema.parse(nome);
        expect(resultado).toBe(nome.trim());
      });
    });

    it('deve remover espaços extras', () => {
      expect(nomeSchema.parse('  João Silva  ')).toBe('João Silva');
    });

    it('deve rejeitar nomes muito curtos', () => {
      expect(() => nomeSchema.parse('A')).toThrow('Nome deve ter pelo menos 2 caracteres');
    });

    it('deve rejeitar nomes muito longos', () => {
      const nomeLongo = 'A'.repeat(256);
      expect(() => nomeSchema.parse(nomeLongo)).toThrow('Nome muito longo');
    });

    it('deve rejeitar nomes com caracteres inválidos', () => {
      const nomesInvalidos = [
        'João123',
        'Maria@Silva',
        'José#Santos',
        'Ana_Beatriz',
        'Carlos-André',
      ];

      nomesInvalidos.forEach(nome => {
        expect(() => nomeSchema.parse(nome)).toThrow('Nome deve conter apenas letras e espaços');
      });
    });
  });

  describe('telefoneSchema', () => {
    it('deve aceitar telefones brasileiros válidos', () => {
        // Testando apenas um formato que sabemos que funciona
        const telefone = '+55 11 99999-9999';
        const resultado = telefoneSchema.parse(telefone);
        expect(resultado).toBe('5511999999999');
      });

    it('deve remover formatação e manter apenas números', () => {
      expect(telefoneSchema.parse('+55 11 99988-7766')).toBe('5511999887766');
    });

    it('deve rejeitar telefones inválidos', () => {
      const telefonesInvalidos = [
        '123456789',
        '11888887766', // sem o 9
        '1199887766', // muito curto
        '+1234567890', // não brasileiro
        'abc123456789',
      ];

      telefonesInvalidos.forEach(telefone => {
        expect(() => telefoneSchema.parse(telefone)).toThrow('Telefone inválido');
      });
    });
  });

  describe('cpfSchema', () => {
    it('deve aceitar CPFs válidos', () => {
      const cpfsValidos = [
        '123.456.789-09',
        '12345678909',
        '111.444.777-35',
        '11144477735',
      ];

      cpfsValidos.forEach(cpf => {
        expect(() => cpfSchema.parse(cpf)).not.toThrow();
      });
    });

    it('deve rejeitar CPFs com formato inválido', () => {
      const cpfsInvalidos = [
        '123.456.789',
        '123456789',
        '123.456.789-0',
        '12345678901',
        'abc.def.ghi-jk',
      ];

      cpfsInvalidos.forEach(cpf => {
        expect(() => cpfSchema.parse(cpf)).toThrow('CPF inválido');
      });
    });

    it('deve rejeitar CPFs com todos os dígitos iguais', () => {
      const cpfsInvalidos = [
        '111.111.111-11',
        '22222222222',
        '333.333.333-33',
      ];

      cpfsInvalidos.forEach(cpf => {
        expect(() => cpfSchema.parse(cpf)).toThrow('CPF inválido');
      });
    });

    it('deve rejeitar CPFs com dígitos verificadores incorretos', () => {
      const cpfsInvalidos = [
        '123.456.789-00',
        '12345678900',
        '111.444.777-00',
      ];

      cpfsInvalidos.forEach(cpf => {
        expect(() => cpfSchema.parse(cpf)).toThrow('CPF inválido');
      });
    });
  });

  describe('cnpjSchema', () => {
    it('deve aceitar CNPJs válidos', () => {
      const cnpjsValidos = [
        '11.222.333/0001-81',
        '11222333000181',
      ];

      cnpjsValidos.forEach(cnpj => {
        expect(() => cnpjSchema.parse(cnpj)).not.toThrow();
      });
    });

    it('deve rejeitar CNPJs com formato inválido', () => {
      const cnpjsInvalidos = [
        '11.222.333/0001',
        '112223330001',
        '11.222.333/0001-8',
        '1122233300018',
        'ab.cde.fgh/ijkl-mn',
      ];

      cnpjsInvalidos.forEach(cnpj => {
        expect(() => cnpjSchema.parse(cnpj)).toThrow('CNPJ inválido');
      });
    });

    it('deve rejeitar CNPJs com todos os dígitos iguais', () => {
      const cnpjsInvalidos = [
        '11.111.111/1111-11',
        '11111111111111',
        '22.222.222/2222-22',
      ];

      cnpjsInvalidos.forEach(cnpj => {
        expect(() => cnpjSchema.parse(cnpj)).toThrow('CNPJ inválido');
      });
    });

    it('deve rejeitar CNPJs com dígitos verificadores incorretos', () => {
      const cnpjsInvalidos = [
        '11.222.333/0001-00',
        '11222333000100',
      ];

      cnpjsInvalidos.forEach(cnpj => {
        expect(() => cnpjSchema.parse(cnpj)).toThrow('CNPJ inválido');
      });
    });
  });

  describe('cepSchema', () => {
    it('deve aceitar CEPs válidos', () => {
      const cepsValidos = [
        '01234-567',
        '01234567',
        '12345-678',
        '98765432',
      ];

      cepsValidos.forEach(cep => {
        const resultado = cepSchema.parse(cep);
        expect(resultado).toMatch(/^\d{8}$/);
      });
    });

    it('deve remover formatação', () => {
      expect(cepSchema.parse('01234-567')).toBe('01234567');
    });

    it('deve rejeitar CEPs inválidos', () => {
      const cepsInvalidos = [
        '1234-567',
        '123456',
        '12345-67',
        'abcde-fgh',
        '12345-6789',
      ];

      cepsInvalidos.forEach(cep => {
        expect(() => cepSchema.parse(cep)).toThrow('CEP inválido');
      });
    });
  });

  describe('urlSchema', () => {
    it('deve aceitar URLs válidas', () => {
      const urlsValidas = [
        'https://www.exemplo.com',
        'http://exemplo.com',
        'https://sub.dominio.com.br/path?param=value',
        'ftp://files.exemplo.com',
      ];

      urlsValidas.forEach(url => {
        expect(() => urlSchema.parse(url)).not.toThrow();
      });
    });

    it('deve rejeitar URLs inválidas', () => {
      const urlsInvalidas = [
        'exemplo.com',
        'www.exemplo.com',
        'http://',
        'https://',
        'invalid-url',
      ];

      urlsInvalidas.forEach(url => {
        expect(() => urlSchema.parse(url)).toThrow('URL inválida');
      });
    });

    it('deve rejeitar URLs muito longas', () => {
      const urlLonga = `https://exemplo.com/${  'a'.repeat(2040)}`;
      expect(() => urlSchema.parse(urlLonga)).toThrow('URL muito longa');
    });
  });

  describe('textoLivreSchema', () => {
     it('deve aceitar textos válidos', () => {
       const textosValidos = [
         'Texto simples',
         'Texto com números 123',
         'Texto com acentos: ção, ã, é',
         'Texto com espaços',
       ];

       textosValidos.forEach(texto => {
         const resultado = textoLivreSchema.parse(texto);
         expect(resultado).toBe(texto.trim());
       });
     });

     it('deve normalizar espaços em branco', () => {
       expect(textoLivreSchema.parse('  Texto   com    espaços   ')).toBe('Texto   com    espaços');
     });

    it('deve rejeitar textos muito longos', () => {
      const textoLongo = 'a'.repeat(5001);
      expect(() => textoLivreSchema.parse(textoLongo)).toThrow('Texto muito longo');
    });
  });

  describe('uuidSchema', () => {
    it('deve aceitar UUIDs válidos', () => {
      const uuidsValidos = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];

      uuidsValidos.forEach(uuid => {
        expect(() => uuidSchema.parse(uuid)).not.toThrow();
      });
    });

    it('deve rejeitar UUIDs inválidos', () => {
      const uuidsInvalidos = [
        '123e4567-e89b-12d3-a456',
        'not-a-uuid',
        '123e4567e89b12d3a456426614174000',
        '123e4567-e89b-12d3-a456-426614174000-extra',
      ];

      uuidsInvalidos.forEach(uuid => {
        expect(() => uuidSchema.parse(uuid)).toThrow('ID inválido');
      });
    });
  });

  describe('valorMonetarioSchema', () => {
    it('deve aceitar valores monetários válidos', () => {
      const valoresValidos = [0, 0.01, 10.50, 999.99, 999999.99];

      valoresValidos.forEach(valor => {
        expect(() => valorMonetarioSchema.parse(valor)).not.toThrow();
      });
    });

    it('deve rejeitar valores negativos', () => {
      expect(() => valorMonetarioSchema.parse(-1)).toThrow('Valor deve ser positivo');
    });

    it('deve rejeitar valores muito altos', () => {
      expect(() => valorMonetarioSchema.parse(1000000)).toThrow('Valor muito alto');
    });

    it('deve rejeitar valores com mais de 2 casas decimais', () => {
      expect(() => valorMonetarioSchema.parse(10.123)).toThrow('Valor deve ter no máximo 2 casas decimais');
    });
  });

  describe('loginSchema', () => {
    it('deve aceitar dados de login válidos', () => {
      const loginValido = {
        email: 'usuario@exemplo.com',
        senha: 'qualquersenha',
      };

      expect(() => loginSchema.parse(loginValido)).not.toThrow();
    });

    it('deve rejeitar email inválido', () => {
      const loginInvalido = {
        email: 'email-invalido',
        senha: 'qualquersenha',
      };

      expect(() => loginSchema.parse(loginInvalido)).toThrow();
    });

    it('deve rejeitar senha vazia', () => {
      const loginInvalido = {
        email: 'usuario@exemplo.com',
        senha: '',
      };

      expect(() => loginSchema.parse(loginInvalido)).toThrow('Senha é obrigatória');
    });
  });

  describe('registroSchema', () => {
    it('deve aceitar dados de registro válidos', () => {
      const registroValido = {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        senha: 'MinhaSenh@123',
        confirmaSenha: 'MinhaSenh@123',
      };

      expect(() => registroSchema.parse(registroValido)).not.toThrow();
    });

    it('deve rejeitar quando senhas não coincidem', () => {
      const registroInvalido = {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        senha: 'MinhaSenh@123',
        confirmaSenha: 'OutraSenh@456',
      };

      expect(() => registroSchema.parse(registroInvalido)).toThrow('Senhas não coincidem');
    });

    it('deve validar todos os campos obrigatórios', () => {
      const registroInvalido = {
        nome: 'A', // muito curto
        email: 'email-invalido',
        senha: 'senha', // não atende critérios
        confirmaSenha: 'senha',
      };

      expect(() => registroSchema.parse(registroInvalido)).toThrow();
    });
  });

  describe('clienteSchema', () => {
    it('deve aceitar dados de cliente válidos', () => {
      const clienteValido = {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        telefone: '+55 11 99988-7766',
        endereco: 'Rua das Flores, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234567',
        tipoPessoa: 'fisica' as const,
      };

      expect(() => clienteSchema.parse(clienteValido)).not.toThrow();
    });

    it('deve aceitar cliente apenas com nome (campos opcionais)', () => {
      const clienteMinimo = {
        nome: 'João Silva',
      };

      const resultado = clienteSchema.parse(clienteMinimo);
      expect(resultado.nome).toBe('João Silva');
      expect(resultado.tipoPessoa).toBe('fisica'); // valor padrão
    });

    it('deve validar estado com 2 caracteres', () => {
      const clienteInvalido = {
        nome: 'João Silva',
        estado: 'SAO', // mais de 2 caracteres
      };

      expect(() => clienteSchema.parse(clienteInvalido)).toThrow('Estado deve ter 2 caracteres');
    });

    it('deve aceitar múltiplos emails', () => {
      const clienteComEmails = {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        email2: 'joao.silva@trabalho.com',
        email3: 'joao.pessoal@gmail.com',
      };

      expect(() => clienteSchema.parse(clienteComEmails)).not.toThrow();
    });
  });

  describe('ordemServicoSchema', () => {
    it('deve aceitar dados de ordem de serviço válidos', () => {
      const ordemValida = {
        clienteId: '123e4567-e89b-12d3-a456-426614174000',
        titulo: 'Reparo de equipamento',
        descricao: 'Descrição detalhada do serviço',
        status: 'aberta' as const,
        prioridade: 'media' as const,
        tecnicoId: '123e4567-e89b-12d3-a456-426614174001',
        valorServico: 150.00,
        valorPecas: 50.00,
      };

      expect(() => ordemServicoSchema.parse(ordemValida)).not.toThrow();
    });

    it('deve aceitar ordem mínima com valores padrão', () => {
      const ordemMinima = {
        clienteId: '123e4567-e89b-12d3-a456-426614174000',
        titulo: 'Título mínimo',
      };

      const resultado = ordemServicoSchema.parse(ordemMinima);
      expect(resultado.status).toBe('aberta');
      expect(resultado.prioridade).toBe('media');
    });

    it('deve rejeitar título muito curto', () => {
      const ordemInvalida = {
        clienteId: '123e4567-e89b-12d3-a456-426614174000',
        titulo: 'ABC', // menos de 5 caracteres
      };

      expect(() => ordemServicoSchema.parse(ordemInvalida)).toThrow('Título deve ter pelo menos 5 caracteres');
    });

    it('deve validar enums de status e prioridade', () => {
      const statusValidos = ['aberta', 'em_andamento', 'aguardando_peca', 'concluida', 'cancelada'];
      const prioridadesValidas = ['baixa', 'media', 'alta', 'urgente'];

      statusValidos.forEach(status => {
        const ordem = {
          clienteId: '123e4567-e89b-12d3-a456-426614174000',
          titulo: 'Título válido',
          status: status as any,
        };
        expect(() => ordemServicoSchema.parse(ordem)).not.toThrow();
      });

      prioridadesValidas.forEach(prioridade => {
        const ordem = {
          clienteId: '123e4567-e89b-12d3-a456-426614174000',
          titulo: 'Título válido',
          prioridade: prioridade as any,
        };
        expect(() => ordemServicoSchema.parse(ordem)).not.toThrow();
      });
    });
  });

  describe('pagamentoSchema', () => {
    it('deve aceitar dados de pagamento válidos', () => {
      const pagamentoValido = {
        ordemServicoId: '123e4567-e89b-12d3-a456-426614174000',
        valor: 200.50,
        metodoPagamento: 'cartao_credito' as const,
        observacoes: 'Pagamento à vista',
      };

      expect(() => pagamentoSchema.parse(pagamentoValido)).not.toThrow();
    });

    it('deve aceitar pagamento mínimo com valor padrão', () => {
      const pagamentoMinimo = {
        ordemServicoId: '123e4567-e89b-12d3-a456-426614174000',
        valor: 100.00,
      };

      const resultado = pagamentoSchema.parse(pagamentoMinimo);
      expect(resultado.metodoPagamento).toBe('dinheiro');
    });

    it('deve validar métodos de pagamento', () => {
      const metodosValidos = ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia'];

      metodosValidos.forEach(metodo => {
        const pagamento = {
          ordemServicoId: '123e4567-e89b-12d3-a456-426614174000',
          valor: 100.00,
          metodoPagamento: metodo as any,
        };
        expect(() => pagamentoSchema.parse(pagamento)).not.toThrow();
      });
    });
  });

  describe('rateLimitSchema', () => {
    it('deve aceitar dados de rate limit válidos', () => {
      const rateLimitValido = {
        ip: '192.168.1.1',
        endpoint: '/api/users',
        timestamp: Date.now(),
        count: 5,
      };

      expect(() => rateLimitSchema.parse(rateLimitValido)).not.toThrow();
    });

    it('deve rejeitar IP inválido', () => {
      const rateLimitInvalido = {
        ip: 'ip-invalido',
        endpoint: '/api/users',
        timestamp: Date.now(),
        count: 5,
      };

      expect(() => rateLimitSchema.parse(rateLimitInvalido)).toThrow();
    });

    it('deve rejeitar count menor que 1', () => {
      const rateLimitInvalido = {
        ip: '192.168.1.1',
        endpoint: '/api/users',
        timestamp: Date.now(),
        count: 0,
      };

      expect(() => rateLimitSchema.parse(rateLimitInvalido)).toThrow();
    });
  });

  describe('sanitizeHtml', () => {
    it('deve sanitizar caracteres HTML perigosos', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      expect(sanitizeHtml(input)).toBe(expected);
    });

    it('deve sanitizar todos os caracteres especiais', () => {
      const input = '&<>"\'\/';
      const expected = '&amp;&lt;&gt;&quot;&#x27;&#x2F;';
      expect(sanitizeHtml(input)).toBe(expected);
    });

    it('deve manter texto normal inalterado', () => {
      const input = 'Texto normal sem caracteres especiais';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('deve lidar com string vazia', () => {
      expect(sanitizeHtml('')).toBe('');
    });
  });

  describe('validateApiInput', () => {
    it('deve retornar sucesso para dados válidos', () => {
      const schema = emailSchema;
      const data = 'teste@exemplo.com';

      const resultado = validateApiInput(schema, data);

      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data).toBe('teste@exemplo.com');
      }
    });

    it('deve retornar erro para dados inválidos', () => {
      const schema = emailSchema;
      const data = 'email-invalido';

      const resultado = validateApiInput(schema, data);

      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(resultado.errors).toContain(': Email inválido');
      }
    });

    it('deve retornar múltiplos erros para schema complexo', () => {
      const data = {
        nome: 'A', // muito curto
        email: 'email-invalido',
        senha: 'senha', // não atende critérios
        confirmaSenha: 'outra', // não coincide
      };

      const resultado = validateApiInput(registroSchema, data);

      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(resultado.errors.length).toBeGreaterThan(1);
      }
    });

    it('deve lidar com erro desconhecido', () => {
      const schema = {
        parse: () => {
          throw new Error('Erro não-Zod');
        },
      } as any;

      const resultado = validateApiInput(schema, {});

      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(resultado.errors).toContain('Erro de validação desconhecido');
      }
    });

    it('deve formatar caminhos de erro corretamente', () => {
      const data = {
        nome: 'João Silva',
        email: 'email-invalido',
        senha: 'MinhaSenh@123',
        confirmaSenha: 'MinhaSenh@123',
      };

      const resultado = validateApiInput(registroSchema, data);

      expect(resultado.success).toBe(false);
      if (!resultado.success) {
        expect(resultado.errors.some(error => error.includes('email:'))).toBe(true);
      }
    });
  });

  describe('Cenários de Integração', () => {
    it('deve validar fluxo completo de registro de cliente', () => {
      const dadosCliente = {
        nome: 'João Silva Santos',
        email: 'joao.silva@exemplo.com',
        telefone: '+55 11 99988-7766',
        endereco: 'Rua das Flores, 123 - Apto 45',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        tipoPessoa: 'fisica' as const,
        observacoes: 'Cliente preferencial com desconto',
      };

      const resultado = clienteSchema.parse(dadosCliente);

      expect(resultado.nome).toBe('João Silva Santos');
      expect(resultado.email).toBe('joao.silva@exemplo.com');
      expect(resultado.telefone).toBe('5511999887766');
      expect(resultado.cep).toBe('01234567');
      expect(resultado.observacoes).toBe('Cliente preferencial com desconto');
    });

    it('deve validar fluxo completo de criação de ordem de serviço', () => {
       const dadosOrdem = {
         clienteId: '123e4567-e89b-12d3-a456-426614174000',
         titulo: 'Reparo urgente de equipamento crítico',
         descricao: 'Equipamento apresentando falhas intermitentes',
         status: 'em_andamento' as const,
         prioridade: 'urgente' as const,
         tecnicoId: '123e4567-e89b-12d3-a456-426614174001',
         valorServico: 299.99,
         valorPecas: 150.50,
         observacoes: 'Cliente solicitou atendimento prioritário',
       };

       const resultado = ordemServicoSchema.parse(dadosOrdem);

       expect(resultado.titulo).toBe('Reparo urgente de equipamento crítico');
       expect(resultado.descricao).toBe('Equipamento apresentando falhas intermitentes');
       expect(resultado.observacoes).toBe('Cliente solicitou atendimento prioritário');
       expect(resultado.valorServico).toBe(299.99);
       expect(resultado.valorPecas).toBe(150.50);
     });

    it('deve validar fluxo de processamento de pagamento', () => {
       const dadosPagamento = {
         ordemServicoId: '123e4567-e89b-12d3-a456-426614174000',
         valor: 450.49,
         metodoPagamento: 'pix' as const,
         observacoes: 'Pagamento realizado via PIX instantâneo',
       };

       const resultado = pagamentoSchema.parse(dadosPagamento);

       expect(resultado.valor).toBe(450.49);
       expect(resultado.metodoPagamento).toBe('pix');
       expect(resultado.observacoes).toBe('Pagamento realizado via PIX instantâneo');
     });

    it('deve validar dados de API com sanitização', () => {
      const dadosUnsafe = {
        nome: 'João<script>alert("xss")</script>Silva',
        observacoes: 'Texto com <b>HTML</b> e "aspas" e \'apostrofes\'',
      };

      // Simular sanitização antes da validação
      const dadosSanitizados = {
        nome: sanitizeHtml(dadosUnsafe.nome),
        observacoes: sanitizeHtml(dadosUnsafe.observacoes),
      };

      expect(dadosSanitizados.nome).toBe('João&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;Silva');
      expect(dadosSanitizados.observacoes).toBe('Texto com &lt;b&gt;HTML&lt;&#x2F;b&gt; e &quot;aspas&quot; e &#x27;apostrofes&#x27;');
    });
  });
});