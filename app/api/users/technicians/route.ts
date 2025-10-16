import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar técnicos e supervisores técnicos
    const { data: technicians, error } = await supabase
      .from('users')
      .select('id, name, email, role, active')
      .in('role', ['technician', 'supervisor_tecnico'])
      .order('name');

    if (error) {
      console.error('Erro ao buscar técnicos:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    return NextResponse.json(technicians || []);
  } catch (error) {
    console.error('Erro na API de técnicos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
