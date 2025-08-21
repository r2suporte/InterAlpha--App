import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middleware/auth-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_ADM']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { userId } = params;

    // Buscar usuário com detalhes completos
    const user = await prisma.employee.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                description: true,
                permissions: true
              }
            }
          }
        },
        assignedOrders: {
          include: {
            client: {
              select: {
                nome: true
              }
            },
            service: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        technicalReports: {
          select: {
            id: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar estatísticas do usuário
    const [totalOrders, completedOrders, recentActivity] = await Promise.all([
      prisma.serviceOrder.count({
        where: { assignedTechnicianId: userId }
      }),

      prisma.serviceOrder.count({
        where: {
          assignedTechnicianId: userId,
          status: 'COMPLETED'
        }
      }),

      prisma.auditEntry.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          resource: true,
          timestamp: true,
          result: true
        }
      })
    ]);

    const userDetails = {
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
        id: ra.id,
        roleId: ra.role.id,
        roleName: ra.role.name,
        roleDisplayName: ra.role.displayName,
        roleDescription: ra.role.description,
        permissions: ra.role.permissions,
        assignedAt: ra.assignedAt.toISOString(),
        isActive: ra.isActive
      })),
      assignedOrders: user.assignedOrders.map(order => ({
        id: order.id,
        title: order.title,
        clientName: order.client.nome,
        serviceName: order.service.name,
        status: order.status.toLowerCase(),
        priority: order.priority.toLowerCase(),
        scheduledDate: order.scheduledDate.toISOString(),
        createdAt: order.createdAt.toISOString()
      })),
      technicalReports: user.technicalReports.map(report => ({
        id: report.id,
        status: report.status.toLowerCase(),
        createdAt: report.createdAt.toISOString()
      })),
      statistics: {
        totalOrders,
        completedOrders,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        resource: activity.resource,
        result: activity.result,
        timestamp: activity.timestamp.toISOString()
      }))
    };

    return NextResponse.json(userDetails);

  } catch (error) {
    console.error('Erro ao buscar detalhes do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_ADM']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const adminId = authResult.user.id;
    const { userId } = params;
    const { name, email, role, department, phone, isActive } = await request.json();

    // Verificar se usuário existe
    const existingUser = await prisma.employee.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se email já está em uso por outro usuário
    if (email && email !== existingUser.email) {
      const emailInUse = await prisma.employee.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: 'Email já está em uso por outro usuário' },
          { status: 400 }
        );
      }
    }

    // Preparar dados de atualização
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Atualizar usuário
    const updatedUser = await prisma.employee.update({
      where: { id: userId },
      data: updateData
    });

    // Log de auditoria
    await auditMiddleware({
      userId: adminId,
      action: 'UPDATE_USER',
      resource: 'EMPLOYEE',
      resourceId: userId,
      oldData: {
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        department: existingUser.department,
        phone: existingUser.phone,
        isActive: existingUser.isActive
      },
      newData: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        phone: updatedUser.phone,
        isActive: updatedUser.isActive
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await authMiddleware(request, ['GERENTE_ADM']);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const adminId = authResult.user.id;
    const { userId } = params;

    // Verificar se usuário existe
    const existingUser = await prisma.employee.findUnique({
      where: { id: userId },
      include: {
        assignedOrders: {
          where: {
            status: {
              in: ['ASSIGNED', 'IN_PROGRESS']
            }
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se usuário tem ordens ativas
    if (existingUser.assignedOrders.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível desativar usuário com ordens ativas. Reatribua as ordens primeiro.' },
        { status: 400 }
      );
    }

    // Desativar usuário (soft delete)
    const deactivatedUser = await prisma.employee.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Log de auditoria
    await auditMiddleware({
      userId: adminId,
      action: 'DEACTIVATE_USER',
      resource: 'EMPLOYEE',
      resourceId: userId,
      details: {
        userName: existingUser.name,
        userEmail: existingUser.email,
        userRole: existingUser.role
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário desativado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}