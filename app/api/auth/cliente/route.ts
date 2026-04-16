import { NextRequest, NextResponse } from 'next/server';

import {
  generateClientCredentials,
  hashPassword,
  verifyPassword,
} from '@/lib/auth/client-auth';
import { authorizeApiRequest } from '@/lib/auth/api-authorization';
import prisma from '@/lib/prisma';
import { shouldExposeTemporaryCredentials } from '@/lib/security/credential-policy';
import { ensureTrustedOrigin } from '@/lib/security/http-security';

const CLIENT_AUTH_MANAGEMENT_ROLES = [
  'admin',
  'diretor',
  'gerente_adm',
  'atendente',
  'supervisor_tecnico',
] as const;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const originValidation = ensureTrustedOrigin(request);
    if (originValidation) {
      return originValidation;
    }

    const auth = await authorizeApiRequest(request, [
      ...CLIENT_AUTH_MANAGEMENT_ROLES,
    ]);
    if (!auth.authorized) {
      return auth.response;
    }

    const { email, nome, telefone, ordem_servico_id } = await request.json();

    if (!email || !nome || !ordem_servico_id) {
      return NextResponse.json(
        { error: 'Email, nome e ordem_servico_id são obrigatórios' },
        { status: 400 }
      );
    }

    const emailNormalizado = String(email).trim().toLowerCase();
    const nomeNormalizado = String(nome).trim();
    const telefoneNormalizado =
      typeof telefone === 'string' && telefone.trim().length > 0
        ? telefone.trim()
        : null;

    if (!emailNormalizado || !nomeNormalizado) {
      return NextResponse.json(
        { error: 'Email e nome são obrigatórios' },
        { status: 400 }
      );
    }

    if (!isUuid(ordem_servico_id)) {
      return NextResponse.json(
        { error: 'ordem_servico_id inválido' },
        { status: 400 }
      );
    }

    const ordemServico = await prisma.ordemServico.findUnique({
      where: { id: ordem_servico_id },
      select: { id: true },
    });

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    // Verificar email
    const clienteExistente = await prisma.cliente.findFirst({
      where: { email: emailNormalizado },
    });

    let cliente = clienteExistente;
    let credenciais: { login: string; senha: string | null };

    if (clienteExistente) {
      if (!clienteExistente.login || !clienteExistente.senhaHash) {
        const novasCredenciais = generateClientCredentials(
          emailNormalizado,
          nomeNormalizado
        );
        const senhaHash = await hashPassword(novasCredenciais.senha);

        cliente = await prisma.cliente.update({
          where: { id: clienteExistente.id },
          data: {
            login: novasCredenciais.login,
            senhaHash,
            senhaTemporaria: novasCredenciais.senha,
            primeiroAcesso: true,
            updatedAt: new Date(),
          },
        });

        credenciais = {
          login: novasCredenciais.login,
          senha: novasCredenciais.senha,
        };
      } else {
        credenciais = {
          login: clienteExistente.login,
          senha: clienteExistente.senhaTemporaria || null,
        };
      }
    } else {
      // Gerar novas credenciais
      const novasCredenciais = generateClientCredentials(
        emailNormalizado,
        nomeNormalizado
      );
      const senhaHash = await hashPassword(novasCredenciais.senha);

      // Criar novo cliente no portal (Prisma)
      const novoCliente = await prisma.cliente.create({
        data: {
          email: emailNormalizado,
          nome: nomeNormalizado,
          telefone: telefoneNormalizado,
          login: novasCredenciais.login,
          senhaHash,
          senhaTemporaria: novasCredenciais.senha,
          primeiroAcesso: true,
          isActive: true,
        }
      });

      cliente = novoCliente;
      credenciais = {
        login: novasCredenciais.login,
        senha: novasCredenciais.senha,
      };
    }

    if (!cliente) {
      return NextResponse.json(
        { error: 'Não foi possível preparar o cliente' },
        { status: 500 }
      );
    }

    // Associar cliente à ordem de serviço
    // Logic Assumption: We unify clientePortalId with clienteId.
    // So we update the OS's clienteId.
    await prisma.ordemServico.update({
      where: { id: ordem_servico_id },
      data: { clienteId: cliente.id }
    });

    const exposeCredentials = shouldExposeTemporaryCredentials();
    const payload = NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        login: credenciais.login,
      },
      credenciais: exposeCredentials
        ? {
            login: credenciais.login,
            senha: credenciais.senha,
          }
        : {
            login: credenciais.login,
            senha: null,
            message:
              'Senha temporária não é retornada por segurança. Defina ALLOW_PLAINTEXT_CREDENTIALS=true para habilitar explicitamente.',
          },
      primeiro_acesso: cliente.primeiroAcesso,
    });
    payload.headers.set('Cache-Control', 'no-store');

    return payload;
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
    const originValidation = ensureTrustedOrigin(request);
    if (originValidation) {
      return originValidation;
    }

    const auth = await authorizeApiRequest(request, [
      ...CLIENT_AUTH_MANAGEMENT_ROLES,
    ]);
    if (!auth.authorized) {
      return auth.response;
    }

    const { login, senha_atual, nova_senha } = await request.json();

    if (!login || !senha_atual || !nova_senha) {
      return NextResponse.json(
        { error: 'Login, senha atual e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (typeof nova_senha !== 'string' || nova_senha.length < 8) {
      return NextResponse.json(
        { error: 'A nova senha deve conter ao menos 8 caracteres' },
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

    const payload = NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso',
    });
    payload.headers.set('Cache-Control', 'no-store');

    return payload;
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
