/**
 * Utilitários para validação de documentos (CPF/CNPJ) e consulta de APIs
 */

// Validação de CPF
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  
  return remainder === parseInt(cleanCPF.charAt(10))
}

// Validação de CNPJ
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  if (cleanCNPJ.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i]
  }
  
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false
  
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i]
  }
  
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  
  return digit2 === parseInt(cleanCNPJ.charAt(13))
}

// Formatação de CPF
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '')
  if (cleanCPF.length <= 11) {
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return cpf
}

// Formatação de CNPJ
export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  if (cleanCNPJ.length <= 14) {
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return cnpj
}

// Consulta CPF na API da ReceitaWS
export async function consultarCPF(cpf: string): Promise<{
  valid: boolean
  name?: string
  status?: string
  error?: string
}> {
  try {
    const cleanCPF = cpf.replace(/\D/g, '')
    
    if (!isValidCPF(cleanCPF)) {
      return { valid: false, error: 'CPF inválido' }
    }

    // API gratuita para consulta de CPF (limitada)
    const response = await fetch(`https://api.cpfcnpj.com.br/${cleanCPF}`, {
      headers: {
        'Authorization': process.env.CPF_API_KEY || '',
      }
    })

    if (!response.ok) {
      return { valid: true, status: 'Não foi possível verificar o CPF' }
    }

    const data = await response.json()
    return {
      valid: true,
      name: data.name,
      status: data.status
    }
  } catch (error) {
    return { valid: true, error: 'Erro ao consultar CPF' }
  }
}

// Consulta CNPJ na API da ReceitaWS
export async function consultarCNPJ(cnpj: string): Promise<{
  valid: boolean
  nome?: string
  fantasia?: string
  situacao?: string
  atividade_principal?: string
  endereco?: {
    logradouro: string
    numero: string
    bairro: string
    municipio: string
    uf: string
    cep: string
  }
  error?: string
}> {
  try {
    const cleanCNPJ = cnpj.replace(/\D/g, '')
    
    if (!isValidCNPJ(cleanCNPJ)) {
      return { valid: false, error: 'CNPJ inválido' }
    }

    // API gratuita da ReceitaWS
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`)
    
    if (!response.ok) {
      return { valid: true, error: 'Erro ao consultar CNPJ' }
    }

    const data = await response.json()
    
    if (data.status === 'ERROR') {
      return { valid: false, error: data.message }
    }

    return {
      valid: true,
      nome: data.nome,
      fantasia: data.fantasia,
      situacao: data.situacao,
      atividade_principal: data.atividade_principal?.[0]?.text,
      endereco: {
        logradouro: data.logradouro,
        numero: data.numero,
        bairro: data.bairro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep
      }
    }
  } catch (error) {
    return { valid: true, error: 'Erro ao consultar CNPJ' }
  }
}