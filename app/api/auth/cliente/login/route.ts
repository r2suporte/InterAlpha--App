import { NextRequest, NextResponse } from 'next/server';

import { createHash } from 'crypto';
import { sign } from 'jsonwebtoken';

import { verifyPassword } from '@/lib/auth/client-auth';
import { getJwtSecret } from '@/lib/auth/jwt-secret';
import prisma from '@/lib/prisma';
import { ensureTrustedOrigin } from '@/lib/security/http-security';

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getClientIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  if (realIp) {
    return realIp;
  }

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const originValidation = ensureTrustedOrigin(request);
    if (originValidation) {
      return originValidation;
    }

    const { login, senha } = await request.json();

    if (!login || !senha) {
      return NextResponse.json(
        { error: 'Login e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar cliente pelo login
    const cliente = await prisma.cliente.findUnique({
      where: { login },
    });

    if (!cliente || !cliente.isActive) {
      return NextResponse.json(
        { error: 'Login ou senha incorretos' },
        { status: 401 }
      );
    }

    // Verify password exists (legacy clients might not have it)
    if (!cliente.senhaHash) {
      return NextResponse.json(
        { error: 'Login não configurado para este cliente' },
        { status: 401 }
      );
    }

    // Verificar senha
    const senhaValida = await verifyPassword(senha, cliente.senhaHash);
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Login ou senha incorretos' },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = sign(
      {
        clienteId: cliente.id,
        login: cliente.login,
        email: cliente.email,
        tipo: 'cliente',
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    // Atualizar último acesso
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { ultimoAcesso: new Date() }
    });

    // Criar sessão no banco
    const ipAddress = getClientIpAddress(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    // Expira em 24h
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.clientSession.create({
      data: {
        clienteId: cliente.id,
        token: hashSessionToken(token),
        ipAddress,
        userAgent,
        expiresAt
      }
    });

    // Buscar ordens de serviço do cliente
    const ordensServico = await prisma.ordemServico.findMany({
      where: { clienteId: cliente.id }, // Correctly mapped to clienteId
      select: {
        id: true,
        numeroOs: true,
        status: true,
        descricao: true,
        valorTotal: true,
        dataInicio: true,
        dataConclusao: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const response = NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        login: cliente.login,
        primeiro_acesso: cliente.primeiroAcesso,
      },
      ordens_servico: ordensServico || [],
    });

    // Definir cookie com o token
    response.cookies.set('cliente-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60, // 24h
    });
    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Erro no login do cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const originValidation = ensureTrustedOrigin(request);
    if (originValidation) {
      return originValidation;
    }

    const token = request.cookies.get('cliente-token')?.value;

    if (token) {
      const tokenHash = hashSessionToken(token);
      // Remover sessão do banco
      try {
        await prisma.clientSession.deleteMany({
          where: { token: tokenHash }
        });
      } catch (e) {
        console.error('Erro ao remover sessão:', e);
        // Não falhar o logout se o banco der erro, apenas limpar cookie
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('cliente-token');
    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Erro no logout do cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
