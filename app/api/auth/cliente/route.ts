import { NextRequest, NextResponse } from 'next/server';

import {
  generateClientCredentials,
  hashPassword,
  validatePassword,
  verifyPassword,
} from '@/lib/auth/client-auth';
import { verifyClienteToken } from '@/lib/auth/client-middleware';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

const ALLOWED_BACKOFFICE_ROLES = new Set(['admin', 'diretor', 'gerente_adm']);

async function enforceBackofficeAccess(): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });

  if (!user?.isActive || !user.role || !ALLOWED_BACKOFFICE_ROLES.has(user.role)) {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const deniedResponse = await enforceBackofficeAccess();
    if (deniedResponse) return deniedResponse;

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
    let senhaTemporariaGerada: string | null = null;

    if (clienteExistente) {
      cliente = clienteExistente;

      if (!cliente.login || !cliente.senhaHash) {
        credenciais = generateClientCredentials(email, nome);
        const senhaHash = await hashPassword(credenciais.senha);
        senhaTemporariaGerada = credenciais.senha;

        cliente = await prisma.cliente.update({
          where: { id: cliente.id },
          data: {
            login: credenciais.login,
            senhaHash,
            primeiroAcesso: true,
          },
        });
      } else {
        credenciais = {
          login: cliente.login,
        };
      }
    } else {
      // Gerar novas credenciais
      credenciais = generateClientCredentials(email, nome);
      const senhaHash = await hashPassword(credenciais.senha);
      senhaTemporariaGerada = credenciais.senha;

      // Criar novo cliente no portal (Prisma)
      const novoCliente = await prisma.cliente.create({
        data: {
          email,
          nome,
          telefone,
          login: credenciais.login,
          senhaHash,
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
        senha_temporaria: senhaTemporariaGerada,
        senha_configurada: senhaTemporariaGerada === null,
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
    const clienteAutenticado = await verifyClienteToken(request);
    if (!clienteAutenticado) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

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

    if (cliente.login !== clienteAutenticado.login) {
      return NextResponse.json(
        { error: 'Operação não permitida para este usuário' },
        { status: 403 }
      );
    }

    // Need to handle null password (legacy/not set)
    if (!cliente.senhaHash) {
      return NextResponse.json(
        { error: 'Senha não configurada.' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(nova_senha);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message || 'Senha inválida' },
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
