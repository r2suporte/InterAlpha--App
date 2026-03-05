import { NextRequest, NextResponse } from 'next/server';

import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { getJwtSecret } from './jwt-secret';
import { hashSessionToken } from './session-token';



export interface ClienteAuth {
  clienteId: string;
  login: string;
  email?: string | null;
  tipo: 'cliente';
}

export async function verifyClienteToken(
  request: NextRequest
): Promise<ClienteAuth | null> {
  try {
    const token = request.cookies.get('cliente-token')?.value;

    if (!token) {
      return null;
    }

    // Verificar JWT
    const decoded = verify(
      token,
      getJwtSecret(),
      { algorithms: ['HS256'] }
    ) as ClienteAuth;

    if (decoded.tipo !== 'cliente') {
      return null;
    }

    if (!decoded.clienteId || !decoded.login) {
      return null;
    }

    const tokenHash = hashSessionToken(token);
    const activeSession = await prisma.clientSession.findFirst({
      where: {
        clienteId: decoded.clienteId,
        token: tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (!activeSession) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token do cliente:', error);
    return null;
  }
}

export async function requireClienteAuth(
  request: NextRequest
): Promise<NextResponse | ClienteAuth> {
  const cliente = await verifyClienteToken(request);

  if (!cliente) {
    return NextResponse.json(
      { error: 'Acesso não autorizado' },
      { status: 401 }
    );
  }

  return cliente;
}
