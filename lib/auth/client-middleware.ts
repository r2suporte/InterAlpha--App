import { NextRequest, NextResponse } from 'next/server';

import { verify } from 'jsonwebtoken';



export interface ClienteAuth {
  clienteId: string;
  login: string;
  email: string;
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
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
    ) as ClienteAuth;

    if (decoded.tipo !== 'cliente') {
      return null;
    }

    // Checking session in DB skipped for now (simplified migration)
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
