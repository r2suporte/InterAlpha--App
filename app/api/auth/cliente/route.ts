import { NextRequest, NextResponse } from 'next/server';

import {
  generateClientCredentials,
  hashPassword,
  verifyPassword,
} from '@/lib/auth/client-auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, nome, telefone, ordem_servico_id } = await request.json();

    if (!email || !nome || !ordem_servico_id) {
      return NextResponse.json(
        { error: 'Email, nome e ordem_servico_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar      // Verificar email
    const clienteExistente = await prisma.cliente.findFirst({
      where: { email },
    });

    let cliente;
    let credenciais;

    if (clienteExistente) {
      // Cliente já existe, retornar credenciais existentes
      cliente = clienteExistente;
      credenciais = {
        login: cliente.login,
        // Since we can't recover hash, logic suggests we might need to reset or just inform?
        // Original code returned 'senha_temporaria' from DB.
        // Prisma model now has senhaTemporaria field.
        senha: cliente.senhaTemporaria || 'Senha já foi alterada',
      };
    } else {
      // Gerar novas credenciais
      credenciais = generateClientCredentials(email, nome);
      const senhaHash = await hashPassword(credenciais.senha);

      // Criar novo cliente no portal (Prisma)
      const novoCliente = await prisma.cliente.create({
        data: {
          email,
          nome,
          telefone,
          login: credenciais.login,
          senhaHash,
          senhaTemporaria: credenciais.senha,
          primeiroAcesso: true,
          isActive: true,
        }
      });

      cliente = novoCliente;
    }

    // Associar cliente à ordem de serviço
    // Logic Assumption: We unify clientePortalId with clienteId.
    // So we update the OS's clienteId.
    await prisma.ordemServico.update({
      where: { id: ordem_servico_id },
      data: { clienteId: cliente.id }
    });

    return NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        login: credenciais.login,
      },
      credenciais: {
        login: credenciais.login,
        senha: credenciais.senha,
      },
      primeiro_acesso: cliente.primeiroAcesso,
    });
  } catch (error) {
    console.error('Erro na API de autenticação do cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { login, senha_atual, nova_senha } = await request.json();

    if (!login || !senha_atual || !nova_senha) {
      return NextResponse.json(
        { error: 'Login, senha atual e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { login }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Need to handle null password (legacy/not set)
    if (!cliente.senhaHash) {
      return NextResponse.json(
        { error: 'Senha não configurada.' },
        { status: 400 }
      );
    }

    // Verificar senha atual
    const senhaValida = await verifyPassword(senha_atual, cliente.senhaHash);
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 401 }
      );
    }

    // Atualizar senha
    const novaSenhaHash = await hashPassword(nova_senha);

    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        senhaHash: novaSenhaHash,
        senhaTemporaria: null,
        primeiroAcesso: false,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
