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

export const envPublic = {
  clerk: {
    publishableKey: () =>
      readEnv([
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'CLERK_PUBLISHABLE_KEY',
        'MCP_CLERK_PUBLISHABLE_KEY',
      ]),
  },
  stripe: {
    publishableKey: () =>
      readEnv([
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'MCP_STRIPE_PUBLISHABLE_KEY',
      ]),
  },
} as const;

