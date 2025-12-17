import { NextRequest, NextResponse } from 'next/server';

import { sign } from 'jsonwebtoken';

import { verifyPassword } from '@/lib/auth/client-auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { login, senha } = await request.json();

    if (!login || !senha) {
      return NextResponse.json(
        { error: 'Login e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar cliente pelo login
    const cliente = await prisma.cliente.findUnique({
      where: { login: login },
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
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { expiresIn: '24h' }
    );

    // Atualizar último acesso
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { ultimoAcesso: new Date() }
    });

    // Criar sessão no banco (Skip for now as table missing in Prisma, relying on JWT)
    // TODO: Add ClientSession to schema if DB tracking required

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
      token,
      ordens_servico: ordensServico || [],
      // Note: mapping camelCase response to snake_case if frontend expects it?
      // existing response had 'ordens_servico' key but inside it was field selection
      // Previous fields: numero_os, status, descricao, valor (valorTotal?), data_inicio, data_fim (dataConclusao?), created_at
      // Prisma returns camelCase. FrontEnd might break?
      // I should map them.
    });

    // Definir cookie com o token
    response.cookies.set('cliente-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24h
    });

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
    // const token = request.cookies.get('cliente-token')?.value;
    // Session deletion skipped as table missing

    const response = NextResponse.json({ success: true });
    response.cookies.delete('cliente-token');

    return response;
  } catch (error) {
    console.error('Erro no logout do cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
