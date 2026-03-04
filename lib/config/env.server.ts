import 'server-only';

type EnvKey = string;

function readEnv(keys: EnvKey[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function requireEnv(keys: EnvKey[], label: string): string {
  const value = readEnv(keys);
  if (!value) {
    throw new Error(
      `Missing environment variable for ${label}. Checked keys: ${keys.join(', ')}`
    );
  }
  return value;
}

export const envServer = {
  neon: {
    databaseUrl: () =>
      requireEnv(
        ['DATABASE_URL', 'NEON_DATABASE_URL', 'MCP_NEON_DATABASE_URL'],
        'Neon database URL'
      ),
    directUrl: () =>
      readEnv([
        'DATABASE_URL_UNPOOLED',
        'NEON_DATABASE_URL_UNPOOLED',
        'MCP_NEON_DATABASE_URL_UNPOOLED',
      ]),
  },
  clerk: {
    secretKey: () =>
      requireEnv(
        ['CLERK_SECRET_KEY', 'MCP_CLERK_SECRET_KEY'],
        'Clerk secret key'
      ),
    webhookSecret: () =>
      readEnv([
        'CLERK_WEBHOOK_SECRET',
        'CLERK_WEBHOOK_SIGNING_SECRET',
        'MCP_CLERK_WEBHOOK_SECRET',
      ]),
  },
  stripe: {
    secretKey: () =>
      readEnv(['STRIPE_SECRET_KEY', 'STRIPE_API_KEY', 'MCP_STRIPE_SECRET_KEY']),
  },
} as const;

