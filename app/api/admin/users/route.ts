import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

import { AuthenticatedUser, requireRoles } from '@/lib/auth/role-middleware';

// Função interna para listar usuários
async function getUsers(_request: NextRequest, _user: AuthenticatedUser) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to match the previous response format if needed (snake_case vs camelCase)
    // Previous selection was: id, email, name, role, is_active, created_at
    // Prisma returns camelCase by default property names usually, but let's map it.
    const mappedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      is_active: u.isActive,
      created_at: u.createdAt,
    }));

    return NextResponse.json({ users: mappedUsers });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Listar usuários (apenas para admin, diretor e gerentes)
export async function GET(request: NextRequest) {
  const middleware = requireRoles(
    'admin',
    'diretor',
    'gerente_adm',
    'gerente_financeiro'
  );
  return await middleware(request, getUsers);
}

// Função interna para criar usuário
async function createUser(request: NextRequest, user: AuthenticatedUser) {
  try {
    const body = await request.json();
    const { email, name, role, phone } = body;

    // Validações
    if (!email || !name || !role) {
      return NextResponse.json(
        {
          error: 'Email, nome e função são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: 'Formato de email inválido',
        },
        { status: 400 }
      );
    }

    // Validar roles permitidas
    const allowedRoles = [
      'user',
      'technician',
      'atendente',
      'supervisor_tecnico',
      'gerente_adm',
      'gerente_financeiro',
    ];

    // Apenas admin e diretor podem criar outros diretores
    if (role === 'diretor' && !['admin', 'diretor'].includes(user.role)) {
      return NextResponse.json(
        {
          error:
            'Apenas administradores e diretores podem criar outros diretores',
        },
        { status: 403 }
      );
    }

    // Apenas admin pode criar outros admins
    if (role === 'admin' && user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Apenas administradores podem criar outros administradores',
        },
        { status: 403 }
      );
    }

    if (role === 'diretor') {
      allowedRoles.push('diretor');
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        {
          error: 'Função não permitida',
        },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Email já está em uso',
        },
        { status: 409 }
      );
    }

    // Gerar senha temporária (Simulação - NÃO SALVA no banco pois não tem campo senha)
    // TODO: Integrar com Clerk ou Auth Provider para criar usuário
    const tempPassword = `InterAlpha${Math.random().toString(36).slice(-8)}!`;

    // Criar usuário na tabela users
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        phone: phone || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso (Atenção: Integração Auth pendente)',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          tempPassword,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário (apenas para admin, diretor e gerentes)
export async function POST(request: NextRequest) {
  const middleware = requireRoles(
    'admin',
    'diretor',
    'gerente_adm',
    'gerente_financeiro'
  );
  return await middleware(request, createUser);
}
