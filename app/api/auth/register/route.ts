import { NextRequest, NextResponse } from 'next/server';

import {
  generateClientCredentials,
  hashPassword,
} from '@/lib/auth/client-auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
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
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const usuarioExistente = await prisma.cliente.findFirst({
      where: {
        OR: [
          { email },
          { email2: email }, // Check alt emails too if generic
          { login: email }   // Check against login just in case
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
    const credenciais = generateClientCredentials(email, nome);
    const senhaHash = await hashPassword(credenciais.senha);

    // Criar novo usuário no portal
    const novoUsuario = await prisma.cliente.create({
      data: {
        email,
        nome,
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
    const { senhaHash: _, senhaTemporaria: __, ...usuarioSemSenha } = novoUsuario;

    return NextResponse.json(
      {
        success: true,
        message: 'Usuário registrado com sucesso',
        usuario: usuarioSemSenha,
        credenciais: {
          login: credenciais.login,
          senha_temporaria: credenciais.senha,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
