import jwt from 'jsonwebtoken';
import type { UserRole } from './permissions';

/**
 * 🔐 JWT Utilities - InterAlpha App
 *
 * Funções para criação e verificação de tokens JWT seguros
 * Utiliza a biblioteca 'jsonwebtoken' para compatibilidade
 */

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole | 'cliente';
  tipo?: 'admin' | 'cliente';
  iat?: number;
  exp?: number;
}

/**
 * Cria um token JWT
 */
export async function signJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresIn: string = '7d'
): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload as object,
      JWT_SECRET,
      {
        expiresIn,
        algorithm: 'HS256',
      } as jwt.SignOptions,
      (error: Error | null, token?: string) => {
        if (error || !token) {
          reject(new Error('Erro ao criar token JWT'));
        } else {
          resolve(token);
        }
      }
    );
  });
}

/**
 * Verifica e decodifica um token JWT
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      JWT_SECRET,
      { algorithms: ['HS256'] } as jwt.VerifyOptions,
      (error: jwt.VerifyErrors | null, decoded?: string | jwt.JwtPayload | object) => {
        if (error || !decoded) {
          reject(new Error('Token inválido ou expirado'));
        } else {
          resolve(decoded as JWTPayload);
        }
      }
    );
  });
}

/**
 * Cria token para cliente
 */
export async function createClientToken(
  clienteId: string,
  email: string
): Promise<string> {
  return await signJWT(
    {
      userId: clienteId,
      email,
      role: 'cliente',
      tipo: 'cliente',
    },
    '30d'
  ); // Token de cliente dura 30 dias
}

/**
 * Cria token para usuário admin/técnico
 */
export async function createUserToken(
  userId: string,
  email: string,
  role: UserRole
): Promise<string> {
  return await signJWT(
    {
      userId,
      email,
      role,
    },
    '7d'
  ); // Token de usuário dura 7 dias
}

/**
 * Extrai token do header Authorization
 */
export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * Verifica se o token está expirado
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  if (!payload.exp) return false;
  return payload.exp < Date.now() / 1000;
}

/**
 * Obtém tempo restante do token em segundos
 */
export function getTokenTimeRemaining(payload: JWTPayload): number {
  if (!payload.exp) return 0;
  const remaining = payload.exp - Date.now() / 1000;
  return Math.max(0, remaining);
}
