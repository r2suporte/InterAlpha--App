import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { EmployeeRole, getRolePermissions } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar funcionário no banco de dados
    const employee = await prisma.employee.findUnique({
      where: { clerkId: userId },
      include: {
        roleAssignments: {
          where: { isActive: true },
          include: { role: true }
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Funcionário não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar último login
    await prisma.employee.update({
      where: { id: employee.id },
      data: { lastLoginAt: new Date() }
    })

    // Obter permissões baseadas no role
    const role = employee.role as EmployeeRole
    const permissions = getRolePermissions(role)

    // Dados do funcionário para retorno
    const employeeData = {
      id: employee.id,
      clerkId: employee.clerkId,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      isActive: employee.isActive,
      permissions: permissions,
      lastLoginAt: employee.lastLoginAt,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    }

    return NextResponse.json({
      success: true,
      employee: employeeData
    })

  } catch (error) {
    console.error('Erro ao buscar dados do funcionário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}