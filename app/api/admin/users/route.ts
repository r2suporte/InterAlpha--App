import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { AuthenticatedUser, requireRoles } from '@/lib/auth/role-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Função interna para listar usuários
async function getUsers(_request: NextRequest, _user: AuthenticatedUser) {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro inesperado:', error);
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
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Email já está em uso',
        },
        { status: 409 }
      );
    }

    // Gerar senha temporária
    const tempPassword = `InterAlpha${Math.random().toString(36).slice(-8)}!`;

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name,
          role,
        },
      });

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      return NextResponse.json(
        {
          error: 'Erro ao criar usuário',
        },
        { status: 500 }
      );
    }

    // Criar usuário na tabela users
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      name,
      role,
      phone: phone || null,
      is_active: true,
    });

    if (insertError) {
      console.error('Erro ao inserir usuário na tabela:', insertError);

      // Tentar remover o usuário do Auth se falhou na tabela
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        {
          error: 'Erro ao criar usuário',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        user: {
          id: authData.user.id,
          email,
          name,
          role,
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
