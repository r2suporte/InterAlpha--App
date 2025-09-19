import bcrypt from 'bcryptjs'

export interface ClientCredentials {
  login: string
  senha: string
}

/**
 * Gera credenciais automáticas para o cliente
 */
export function generateClientCredentials(email: string, nome: string): ClientCredentials {
  // Gerar login baseado no email (parte antes do @)
  const emailPrefix = email.split('@')[0].toLowerCase()
  const nomePrefix = nome.split(' ')[0].toLowerCase()
  
  // Combinar email e nome para criar login único
  const login = `${emailPrefix}_${nomePrefix}`.replace(/[^a-z0-9_]/g, '')
  
  // Gerar senha temporária (8 caracteres alfanuméricos)
  const senha = generateRandomPassword()
  
  return { login, senha }
}

/**
 * Gera uma senha aleatória de 8 caracteres
 */
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let senha = ''
  
  for (let i = 0; i < 8; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return senha
}

/**
 * Cria hash da senha
 */
export async function hashPassword(senha: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(senha, saltRounds)
}

/**
 * Verifica se a senha está correta
 */
export async function verifyPassword(senha: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(senha, hash)
}

/**
 * Valida formato do login
 */
export function validateLogin(login: string): boolean {
  // Login deve ter entre 3 e 30 caracteres, apenas letras, números e underscore
  const regex = /^[a-z0-9_]{3,30}$/
  return regex.test(login)
}

/**
 * Valida força da senha
 */
export function validatePassword(senha: string): { valid: boolean; message?: string } {
  if (senha.length < 6) {
    return { valid: false, message: 'Senha deve ter pelo menos 6 caracteres' }
  }
  
  if (senha.length > 50) {
    return { valid: false, message: 'Senha deve ter no máximo 50 caracteres' }
  }
  
  // Verificar se tem pelo menos uma letra e um número
  const hasLetter = /[a-zA-Z]/.test(senha)
  const hasNumber = /[0-9]/.test(senha)
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: 'Senha deve conter pelo menos uma letra e um número' }
  }
  
  return { valid: true }
}