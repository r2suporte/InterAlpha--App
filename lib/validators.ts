import { cnpj, cpf } from 'cpf-cnpj-validator';
/* eslint-disable no-magic-numbers */

/**
 * Implementar debounce para evitar muitas chamadas de API
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

// Tipos para validação
export type TipoPessoa = 'fisica' | 'juridica';

export interface EnderecoCompleto {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface CNPJResponse {
  cnpj: string;
  nome: string;
  fantasia?: string;
  situacao: string;
  atividade_principal: Array<{
    code: string;
    text: string;
  }>;
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  telefone?: string;
  email?: string;
  erro?: boolean;
  message?: string;
}

export interface CPFResponse {
  cpf: string;
  nome?: string;
  situacao: string;
  disponivel?: boolean;
  erro?: boolean;
  message?: string;
  aviso?: string;
}

// Validações de CPF e CNPJ
export const validarCPF = (cpfValue: string): boolean => {
  const cleanCpf = cpfValue.replace(/\D/g, '');

  // CPF deve ter exatamente 11 dígitos
  if (cleanCpf.length !== 11) {
    return false;
  }

  return cpf.isValid(cleanCpf);
};

export const validarCNPJ = (cnpjValue: string): boolean => {
  const cleanCnpj = cnpjValue.replace(/\D/g, '');

  // CNPJ deve ter exatamente 14 dígitos (permitindo formatação)
  if (cleanCnpj.length !== 14) {
    return false;
  }

  return cnpj.isValid(cleanCnpj);
};

export const validarCpfCnpj = (
  documento: string,
  tipo: TipoPessoa
): boolean => {
  if (!documento) return false;

  if (tipo === 'fisica') {
    return validarCPF(documento);
  }
  return validarCNPJ(documento);

};

// Formatação de documentos
export const formatarCPF = (cpfValue: string): string => {
  const cleanCpf = cpfValue.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return cpfValue;

  return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatarCNPJ = (cnpjValue: string): string => {
  const cleanCnpj = cnpjValue.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) return '';

  return cleanCnpj.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  );
};

export const formatarCpfCnpj = (
  documento: string,
  tipo: TipoPessoa
): string => {
  if (!documento) return '';

  if (tipo === 'fisica') {
    return formatarCPF(documento);
  }
  return formatarCNPJ(documento);

};

// Formatação de telefone
export const formatarTelefone = (telefone: string): string => {
  const cleanPhone = telefone.replace(/\D/g, '');

  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  return telefone;
};

// Formatação de CEP
export const formatarCEP = (cep: string): string => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length === 8) {
    return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep;
};

// Validação de email
export const validarEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validação de CEP
export const validarCEP = (cep: string): boolean => {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8;
};

// Buscar endereço via CEP
export const buscarEnderecoPorCEP = async (
  cep: string
): Promise<ViaCepResponse | null> => {
  try {
    const cleanCep = cep.replace(/\D/g, '');

    if (!validarCEP(cleanCep)) {
      throw new Error('CEP inválido');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
};

/**
 * Serviço interno de busca de CNPJ (Server-side ou via API Route)
 * Tenta BrasilAPI primeiro, depois ReceitaWS
 */
export const buscarCNPJService = async (
  cnpjValue: string
): Promise<CNPJResponse | null> => {
  const cleanCnpj = cnpjValue.replace(/\D/g, '');

  // Validações iniciais
  if (cleanCnpj.length !== 14) {
    return null;
  }

  if (!validarCNPJ(cleanCnpj)) {
    return null;
  }

  // TENTATIVA 1: BrasilAPI
  try {
    console.info('🔍 Tentando BrasilAPI...');
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (response.ok) {
      const data = await response.json();
      console.info('✅ BrasilAPI respondeu com sucesso');

      return {
        cnpj: data.cnpj,
        nome: data.razao_social || data.nome_fantasia || '',
        fantasia: data.nome_fantasia,
        situacao: data.descricao_situacao_cadastral || 'Ativo',
        atividade_principal: data.cnae_fiscal
          ? [
            {
              code: data.cnae_fiscal.codigo,
              text: data.cnae_fiscal.descricao,
            },
          ]
          : [],
        endereco: {
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          municipio: data.municipio || '',
          uf: data.uf || '',
          cep: data.cep ? data.cep.replace(/\D/g, '') : '',
        },
        telefone: data.ddd_telefone_1
          ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}`
          : '',
        email: data.email || '',
      };
    }

    // Se não for 404, logar o erro mas continuar para fallback
    if (response.status !== 404) {
      console.warn(`⚠️ BrasilAPI retornou ${response.status}, tentando fallback...`);
    }
  } catch (error) {
    console.warn('⚠️ BrasilAPI falhou:', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
  }

  // TENTATIVA 2: ReceitaWS (Fallback)
  try {
    console.info('🔍 Tentando ReceitaWS (fallback)...');
    const response = await fetch(
      `https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          cnpj: cleanCnpj,
          nome: '',
          situacao: 'CNPJ não encontrado',
          atividade_principal: [],
          erro: true,
          message: 'CNPJ não encontrado na base de dados',
        };
      }
      if (response.status === 429) {
        return {
          cnpj: cleanCnpj,
          nome: '',
          situacao: 'Limite de consultas atingido',
          atividade_principal: [],
          erro: true,
          message: 'Aguarde alguns segundos e tente novamente',
        };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Verificar se há erro na resposta
    if (data.status === 'ERROR') {
      return {
        cnpj: cleanCnpj,
        nome: '',
        situacao: 'CNPJ não encontrado',
        atividade_principal: [],
        erro: true,
        message: data.message || 'CNPJ não encontrado',
      };
    }

    console.info('✅ ReceitaWS respondeu com sucesso');

    // Mapear dados da ReceitaWS para nossa interface
    return {
      cnpj: data.cnpj,
      nome: data.nome || '',
      fantasia: data.fantasia,
      situacao: data.situacao || 'Ativo',
      atividade_principal: data.atividade_principal || [],
      endereco: {
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep ? data.cep.replace(/\D/g, '') : '',
      },
      telefone: data.telefone || '',
      email: data.email || '',
    };
  } catch (error) {
    console.error('❌ ReceitaWS também falhou:', error instanceof Error ? error : new Error(String(error)));
  }

  // Se ambas as APIs falharam
  return {
    cnpj: cleanCnpj,
    nome: '',
    situacao: 'Serviço temporariamente indisponível',
    atividade_principal: [],
    erro: true,
    message: 'Não foi possível consultar o CNPJ. Tente novamente em alguns instantes.',
  };
};

/**
 * Busca dados do CNPJ (Função pública)
 * - No cliente: Chama a API Route interna (/api/cnpj/...) para evitar CORS
 * - No servidor: Chama diretamente o serviço (buscarCNPJService)
 */
export const buscarDadosCNPJ = async (
  cnpjValue: string
): Promise<CNPJResponse | null> => {
  // Se estiver no servidor, chama o serviço diretamente
  if (typeof window === 'undefined') {
    return buscarCNPJService(cnpjValue);
  }

  // Se estiver no cliente, chama a API interna
  try {
    const cleanCnpj = cnpjValue.replace(/\D/g, '');
    if (!cleanCnpj) return null;

    const response = await fetch(`/api/cnpj/${cleanCnpj}`);

    if (!response.ok) {
      // Tenta ler a mensagem de erro da API
      try {
        const errorData = await response.json();
        if (errorData && (errorData.erro || errorData.error)) {
          return {
            cnpj: cleanCnpj,
            nome: '',
            situacao: 'Erro',
            atividade_principal: [],
            erro: true,
            message: errorData.message || errorData.error || 'Erro ao buscar CNPJ'
          } as CNPJResponse;
        }
      } catch (e) {
        // Ignora erro de parse
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar CNPJ via API interna:', error);
    return {
      cnpj: cnpjValue,
      nome: '',
      situacao: 'Erro de conexão',
      atividade_principal: [],
      erro: true,
      message: 'Não foi possível conectar ao serviço de consulta.'
    };
  }
};

/**
 * Busca validação de CPF
 * 
 * ⚠️ OBSERVAÇÃO IMPORTANTE:
 * Não existe API pública gratuita e confiável para consultar dados pessoais por CPF.
 * Esta função retorna informações básicas:
 * - Valida o CPF localmente
 * - Retorna status de validação
 * - Avisa ao usuário sobre as limitações
 */
export const buscarDadosCPF = async (
  cpfValue: string
): Promise<CPFResponse | null> => {
  const cleanCpf = cpfValue.replace(/\D/g, '');

  // Validações iniciais
  if (cleanCpf.length !== 11) {
    return null;
  }

  if (!validarCPF(cleanCpf)) {
    return {
      cpf: cleanCpf,
      situacao: 'CPF Inválido',
      disponivel: false,
      erro: true,
      message: 'O CPF fornecido não é válido',
    };
  }

  console.info('✅ CPF validado localmente');

  // Retornar validação bem-sucedida
  // Nota: Dados pessoais reais não estão disponíveis em APIs públicas gratuitas
  return {
    cpf: cleanCpf,
    situacao: 'CPF Válido',
    disponivel: true,
    erro: false,
    message: 'CPF validado com sucesso',
    aviso: 'Nota: Dados pessoais específicos não estão disponíveis em APIs públicas por questões de segurança/privacidade.',
  };
};

// Determinar tipo de pessoa baseado no documento
export const determinarTipoPessoa = (documento: string): TipoPessoa => {
  const cleanDoc = documento.replace(/\D/g, '');

  if (cleanDoc.length === 11) {
    return 'fisica';
  } else if (cleanDoc.length === 14) {
    return 'juridica';
  }

  // Default para pessoa física se não conseguir determinar
  return 'fisica';
};

// Máscara para input de CPF/CNPJ dinâmica
export const getMascaraCpfCnpj = (valor: string): string => {
  const cleanValue = valor.replace(/\D/g, '');

  if (cleanValue.length <= 11) {
    return '999.999.999-99'; // Máscara CPF
  }
  return '99.999.999/9999-99'; // Máscara CNPJ

};

// Máscara baseada no tipo de documento especificado
export const getMascaraPorTipo = (tipo: 'cpf' | 'cnpj'): string => {
  if (tipo === 'cpf') {
    return '999.999.999-99'; // Máscara CPF
  }
  return '99.999.999/9999-99'; // Máscara CNPJ

};

// Limpar documento (remover formatação)
export const limparDocumento = (documento: string): string => {
  return documento.replace(/\D/g, '');
};

// Validar se todos os campos obrigatórios estão preenchidos
export const validarCamposObrigatorios = (dados: {
  nome: string;
  email: string;
  cpfCnpj: string;
  tipoPessoa: TipoPessoa;
}): string[] => {
  const erros: string[] = [];

  if (!dados.nome.trim()) {
    erros.push('Nome é obrigatório');
  }

  if (!dados.email.trim()) {
    erros.push('Email é obrigatório');
  } else if (!validarEmail(dados.email)) {
    erros.push('Email inválido');
  }

  if (!dados.cpfCnpj.trim()) {
    erros.push('CPF/CNPJ é obrigatório');
  } else {
    const cleanDoc = dados.cpfCnpj.replace(/\D/g, '');

    if (dados.tipoPessoa === 'fisica') {
      if (cleanDoc.length !== 11) {
        erros.push('CPF deve ter exatamente 11 dígitos');
      } else if (!validarCpfCnpj(dados.cpfCnpj, dados.tipoPessoa)) {
        erros.push('CPF inválido');
      }
    } else if (cleanDoc.length !== 14) {
      erros.push('CNPJ deve ter exatamente 14 dígitos');
    } else if (!validarCpfCnpj(dados.cpfCnpj, dados.tipoPessoa)) {
      erros.push('CNPJ inválido');
    }
  }

  return erros;
};
