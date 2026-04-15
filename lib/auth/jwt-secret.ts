const TEST_FALLBACK_SECRET = 'your-super-secret-jwt-key-change-in-production';

type JwtSecretOptions = {
  allowTestFallback?: boolean;
};

export function getJwtSecret(options: JwtSecretOptions = {}): string {
  const { allowTestFallback = true } = options;
  const envSecret = process.env.JWT_SECRET?.trim();

  if (envSecret) {
    return envSecret;
  }

  if (allowTestFallback && process.env.NODE_ENV === 'test') {
    return TEST_FALLBACK_SECRET;
  }

  throw new Error(
    'JWT_SECRET não definido. Configure a variável de ambiente para iniciar a aplicação.'
  );
}
