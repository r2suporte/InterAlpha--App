import { z } from 'zod';

/**
 * 🔒 Validadores de Segurança - InterAlpha App
 *
 * Validadores Zod para entrada de dados seguros
 * Baseado na documentação de segurança
 */

// Validador de senha forte
export const senhaSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha muito longa')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');

// Validador de email
export const emailSchema = z
  .string()
  .email('Email inválido')
  .max(255, 'Email muito longo')
  .toLowerCase()
  .transform(email => email.trim());

// Validador de nome
export const nomeSchema = z
  .string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(255, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
  .transform(nome => nome.trim());

// Validador de telefone brasileiro
export const telefoneSchema = z
  .string()
  .regex(/^\+?55\s?\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/, 'Telefone inválido')
  .transform(tel => tel.replace(/\D/g, ''));

// Validador de CPF
export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido')
  .refine(cpf => {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return false;

    // Verificar se não são todos os dígitos iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    // Validação do algoritmo do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
  }, 'CPF inválido');

// Validador de CNPJ
export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 'CNPJ inválido')
  .refine(cnpj => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return false;

    // Verificar se não são todos os dígitos iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;

    // Validação do algoritmo do CNPJ
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCnpj.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (digit1 !== parseInt(cleanCnpj.charAt(12))) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCnpj.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;

    return digit2 === parseInt(cleanCnpj.charAt(13));
  }, 'CNPJ inválido');

// Validador de CEP
export const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
  .transform(cep => cep.replace(/\D/g, ''));

// Validador de URL
export const urlSchema = z
  .string()
  .url('URL inválida')
  .max(2048, 'URL muito longa');

// Validador de texto livre (previne XSS)
export const textoLivreSchema = z
  .string()
  .max(5000, 'Texto muito longo')
  .transform(texto => {
    // Remove caracteres potencialmente perigosos
    return texto
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  });

// Validador de ID UUID
export const uuidSchema = z.string().uuid('ID inválido');

// Validador de valor monetário
export const valorMonetarioSchema = z
  .number()
  .min(0, 'Valor deve ser positivo')
  .max(999999.99, 'Valor muito alto')
  .multipleOf(0.01, 'Valor deve ter no máximo 2 casas decimais');

// Schema para login
export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'Senha é obrigatória'),
});

// Schema para registro
export const registroSchema = z
  .object({
    nome: nomeSchema,
    email: emailSchema,
    senha: senhaSchema,
    confirmaSenha: z.string(),
  })
  .refine(data => data.senha === data.confirmaSenha, {
    message: 'Senhas não coincidem',
    path: ['confirmaSenha'],
  });

// Schema para cliente
export const clienteSchema = z.object({
  nome: nomeSchema,
  email: emailSchema.optional(),
  email2: emailSchema.optional(),
  email3: emailSchema.optional(),
  telefone: telefoneSchema.optional(),
  endereco: textoLivreSchema.optional(),
  cidade: nomeSchema.optional(),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  cep: cepSchema.optional(),
  cpfCnpj: z.string().optional(),
  tipoPessoa: z.enum(['fisica', 'juridica']).default('fisica'),
  observacoes: textoLivreSchema.optional(),
});

// Schema para ordem de serviço
export const ordemServicoSchema = z.object({
  clienteId: uuidSchema,
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(255),
  descricao: textoLivreSchema.optional(),
  status: z
    .enum([
      'aberta',
      'em_andamento',
      'aguardando_peca',
      'concluida',
      'cancelada',
    ])
    .default('aberta'),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
  tecnicoId: uuidSchema.optional(),
  valorServico: valorMonetarioSchema.optional(),
  valorPecas: valorMonetarioSchema.optional(),
  observacoes: textoLivreSchema.optional(),
});

// Schema para pagamento
export const pagamentoSchema = z.object({
  ordemServicoId: uuidSchema,
  valor: valorMonetarioSchema,
  metodoPagamento: z
    .enum([
      'dinheiro',
      'cartao_credito',
      'cartao_debito',
      'pix',
      'transferencia',
    ])
    .default('dinheiro'),
  observacoes: textoLivreSchema.optional(),
});

// Função para sanitizar entrada HTML
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Função para validar entrada de API
export function validateApiInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro de validação desconhecido'] };
  }
}

// Rate limiting schema
export const rateLimitSchema = z.object({
  ip: z.string().ip(),
  endpoint: z.string(),
  timestamp: z.number(),
  count: z.number().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type ClienteInput = z.infer<typeof clienteSchema>;
export type OrdemServicoInput = z.infer<typeof ordemServicoSchema>;
export type PagamentoInput = z.infer<typeof pagamentoSchema>;
