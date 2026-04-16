import { NextRequest, NextResponse } from 'next/server';

import {
  generateClientCredentials,
  hashPassword,
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

    const { email, nome, telefone, cpf_cnpj, endereco, cidade, estado, cep } =
      await request.json();

    // Validação dos campos obrigatórios
    if (!email || !nome) {
      return NextResponse.json(
        { error: 'Email e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailNormalizado = String(email).trim().toLowerCase();
    const nomeNormalizado = String(nome).trim();

    if (!emailRegex.test(emailNormalizado)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const usuarioExistente = await prisma.cliente.findFirst({
      where: {
        OR: [
          { email: emailNormalizado },
          { email2: emailNormalizado }, // Check alt emails too if generic
          { login: emailNormalizado }   // Check against login just in case
        ]
      }
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuário já existe com este email' },
        { status: 409 }
      );
    }

    // Gerar credenciais para o novo usuário
    const credenciais = generateClientCredentials(emailNormalizado, nomeNormalizado);
    const senhaHash = await hashPassword(credenciais.senha);

    // Criar novo usuário no portal
    const novoUsuario = await prisma.cliente.create({
      data: {
        email: emailNormalizado,
        nome: nomeNormalizado,
        telefone: telefone || null,
        cpfCnpj: cpf_cnpj, // Mapping snake_case from body to camelCase in Prisma
        endereco,
        cidade,
        estado,
        cep,
        login: credenciais.login,
        senhaHash,
        senhaTemporaria: credenciais.senha,
        isActive: true, // ativo -> isActive
        primeiroAcesso: true,
        // createdBy? We don't have user ID in this context usually, assumed self-reg or public
      },
    });

    // Retornar dados do usuário criado (sem senha hash)
    // Prisma returns object, just sanitize
    const {
      senhaHash: senhaHashPersistida,
      senhaTemporaria: senhaTemporariaPersistida,
      ...usuarioSemSenha
    } = novoUsuario;
    void senhaHashPersistida;
    void senhaTemporariaPersistida;
    const exposeCredentials = shouldExposeTemporaryCredentials();

    const response = NextResponse.json(
      {
        success: true,
        message: 'Usuário registrado com sucesso',
        usuario: usuarioSemSenha,
        credenciais: exposeCredentials
          ? {
              login: credenciais.login,
              senha_temporaria: credenciais.senha,
            }
          : {
              login: credenciais.login,
              senha_temporaria: null,
              message:
                'Senha temporária não é retornada por segurança. Defina ALLOW_PLAINTEXT_CREDENTIALS=true para habilitar explicitamente.',
            },
      },
      { status: 201 }
    );
    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
