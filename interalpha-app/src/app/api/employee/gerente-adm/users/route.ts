import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_ADM']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Buscar usuários com paginação
    const [users, totalCount] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          roleAssignments: {
            where: { isActive: true },
            include: {
              role: {
                select: {
                  name: true,
                  displayName: true
                }
              }
            }
          },
          assignedOrders: {
            where: {
              status: {
                in: ['ASSIGNED', 'IN_PROGRESS']
              }
            },
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),

      prisma.employee.count({ where })
    ]);

    // Formatar dados
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      roleAssignments: user.roleAssignments.map(ra => ({
        roleName: ra.role.name,
        roleDisplayName: ra.role.displayName,
        assignedAt: ra.assignedAt.toISOString()
      })),
      activeOrders: user.assignedOrders.length
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_ADM']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const adminId = authResult.user.id;
    const { name, email, role, department, phone } = await request.json();

    // Validar dados obrigatórios
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Nome, email e role são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await prisma.employee.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Validar role
    const validRoles = ['ATENDENTE', 'TECNICO', 'SUPERVISOR_TECNICO', 'GERENTE_ADM', 'GERENTE_FINANCEIRO'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido' },
        { status: 400 }
      );
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Criar usuário
    const newUser = await prisma.employee.create({
      data: {
        name,
        email,
        role,
        department,
        phone,
        passwordHash,
        isActive: true
      }
    });

    // Log de auditoria
    await auditMiddleware({
      userId: adminId,
      action: 'CREATE_USER',
      resource: 'EMPLOYEE',
      resourceId: newUser.id,
      details: {
        userName: name,
        userEmail: email,
        userRole: role,
        userDepartment: department
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    });

    // Em produção, enviar email com senha temporária
    console.log(`Usuário criado: ${email} - Senha temporária: ${tempPassword}`);

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        tempPassword // Remover em produção
      }
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}