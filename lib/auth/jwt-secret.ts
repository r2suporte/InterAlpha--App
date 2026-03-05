const JWT_SECRET_ERROR =
  'JWT_SECRET não definido. Configure a variável de ambiente JWT_SECRET.';
const DEV_ONLY_JWT_SECRET = 'dev-local-only-jwt-secret-change-me';

export function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || jwtSecret.trim().length === 0) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return DEV_ONLY_JWT_SECRET;
    }

    throw new Error(JWT_SECRET_ERROR);
  }

  return jwtSecret;
}
