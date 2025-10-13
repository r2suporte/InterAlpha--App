import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createClientToken, createUserToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fazer login no Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at, updated_at')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado no sistema' },
        { status: 404 }
      );
    }

    // Verificar se o usuário está ativo
    if (!userData.is_active) {
      return NextResponse.json(
        { error: 'Usuário inativo. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // Criar token JWT próprio e definir cookie esperado pelo middleware
    const roleRaw = userData.role as string;
    const normalizedRole = roleRaw === 'technician' ? 'tecnico' : roleRaw;

    const token =
      normalizedRole === 'cliente'
        ? await createClientToken(userData.id, userData.email)
        : await createUserToken(userData.id, userData.email, normalizedRole as any);

    const response = NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        active: userData.is_active,
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
      },
      token,
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: normalizedRole === 'cliente' ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30d para cliente, 7d para usuário
    });

    return response;
  } catch (error) {
    console.error('Erro na API de login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
