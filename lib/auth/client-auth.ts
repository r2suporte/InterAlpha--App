import bcrypt from 'bcryptjs';

const GENERATED_PASSWORD_LENGTH = 12;
const PASSWORD_SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 128;

export interface ClientCredentials {
  login: string;
  senha: string;
}

/**
 * Gera credenciais automáticas para o cliente
 */
export function generateClientCredentials(
  email: string,
  nome: string
): ClientCredentials {
  // Gerar login baseado no email (parte antes do @)
  const emailPrefix = email.split('@')[0].toLowerCase();
  const nomePrefix = nome.split(' ')[0].toLowerCase();

  // Combinar email e nome para criar login único
  const login = `${emailPrefix}_${nomePrefix}`.replace(/[^a-z0-9_]/g, '');

  // Gerar senha temporária (8 caracteres alfanuméricos)
  const senha = generateRandomPassword();

  return { login, senha };
}

/**
 * Gera uma senha aleatória de 12 caracteres
 */
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let senha = '';

  for (let i = 0; i < GENERATED_PASSWORD_LENGTH; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return senha;
}

/**
 * Cria hash da senha
 */
export async function hashPassword(senha: string): Promise<string> {
  return await bcrypt.hash(senha, PASSWORD_SALT_ROUNDS);
}

/**
 * Verifica se a senha está correta
 */
export async function verifyPassword(
  senha: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(senha, hash);
}

/**
 * Valida formato do login
 */
export function validateLogin(login: string): boolean {
  // Login deve ter entre 3 e 30 caracteres, apenas letras, números e underscore
  const regex = /^[a-z0-9_]{3,30}$/;
  return regex.test(login);
}

/**
 * Valida força da senha
 */
export function validatePassword(senha: string): {
  valid: boolean;
  message?: string;
} {
  if (senha.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`,
    };
  }

  if (senha.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres`,
    };
  }

  // Verificar se tem pelo menos uma letra maiúscula, uma minúscula e um número
  const hasUppercase = /[A-Z]/.test(senha);
  const hasLowercase = /[a-z]/.test(senha);
  const hasNumber = /[0-9]/.test(senha);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      valid: false,
      message:
        'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
    };
  }

  return { valid: true };
}
