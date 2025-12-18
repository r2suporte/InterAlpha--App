import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/role-middleware';

// Função interna para buscar técnicos
async function getTechnicians(_request: NextRequest) {
  try {
    // Buscar técnicos e supervisores técnicos
    const technicians = await prisma.user.findMany({
      where: {
        role: {
          in: ['technician', 'supervisor_tecnico'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true, // Note: active in supabase/schema might map to isActive in Prisma model
      },
      orderBy: {
        name: 'asc',
      },
    });

    const mappedTechnicians = technicians.map(t => ({
      ...t,
      active: t.isActive, // Map back to 'active' if frontend expects it
    }));

    return NextResponse.json(mappedTechnicians);
  } catch (error) {
    console.error('Erro na API de técnicos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Require at least basic auth
  const middleware = requireAuth();
  return await middleware(request, getTechnicians);
}
