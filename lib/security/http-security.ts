import { NextRequest, NextResponse } from 'next/server';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

type OriginGuardOptions = {
  allowMissingOrigin?: boolean;
};

function normalizeOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return null;
  }
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function buildAllowedOrigins(request: NextRequest): Set<string> {
  const allowed = new Set<string>();
  const host = request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const protocol =
    forwardedProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http');

  if (host) {
    const inferredOrigin = normalizeOrigin(`${protocol}://${host}`);
    if (inferredOrigin) {
      allowed.add(inferredOrigin);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    const normalized = normalizeOrigin(trimTrailingSlash(appUrl));
    if (normalized) {
      allowed.add(normalized);
    }
  }

  const trustedOrigins = process.env.APP_TRUSTED_ORIGINS;
  if (trustedOrigins) {
    for (const origin of trustedOrigins.split(',')) {
      const normalized = normalizeOrigin(trimTrailingSlash(origin.trim()));
      if (normalized) {
        allowed.add(normalized);
      }
    }
  }

  return allowed;
}

function getRequestOrigin(request: NextRequest): string | null {
  const originHeader = request.headers.get('origin');
  if (originHeader) {
    return normalizeOrigin(originHeader);
  }

  const refererHeader = request.headers.get('referer');
  if (refererHeader) {
    return normalizeOrigin(refererHeader);
  }

  return null;
}

export function ensureTrustedOrigin(
  request: NextRequest,
  options: OriginGuardOptions = {}
): NextResponse | null {
  const { allowMissingOrigin = false } = options;

  if (!MUTATION_METHODS.has(request.method)) {
    return null;
  }

  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin) {
    if (allowMissingOrigin) {
      return null;
    }

    return NextResponse.json(
      { error: 'Origem da requisição não informada' },
      { status: 403 }
    );
  }

  const allowedOrigins = buildAllowedOrigins(request);
  if (allowedOrigins.has(requestOrigin)) {
    return null;
  }

  return NextResponse.json(
    { error: 'Origem da requisição não permitida' },
    { status: 403 }
  );
}
