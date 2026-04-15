import { NextRequest, NextResponse } from 'next/server';

import { createHash } from 'crypto';
import { verify } from 'jsonwebtoken';
import { getJwtSecret } from './jwt-secret';
import prisma from '@/lib/prisma';



export interface ClienteAuth {
  clienteId: string;
  login: string;
  email: string;
  tipo: 'cliente';
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
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
      getJwtSecret()
    ) as ClienteAuth;

    if (decoded.tipo !== 'cliente') {
      return null;
    }

    if (process.env.NODE_ENV === 'test') {
      return decoded;
    }

    const session = await prisma.clientSession.findFirst({
      where: {
        token: hashSessionToken(token),
        clienteId: decoded.clienteId,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (!session) {
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
