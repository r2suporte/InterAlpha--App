import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/middleware/auth-middleware'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeEmployees = searchParams.get('includeEmployees') === 'true'

    const departments = await prisma.department.findMany({
      where: {
        isActive: true
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        employees: includeEmployees ? {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        } : false,
        _count: {
          select: {
            employees: true,
            messages: true,
            supportTickets: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedDepartments = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      managerId: dept.managerId,
      managerName: dept.manager?.name,
      employeeIds: dept.employees ? dept.employees.map(emp => emp.id) : [],
      employees: dept.employees || [],
      isActive: dept.isActive,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
      stats: {
        employeeCount: dept._count.employees,
        messageCount: dept._count.messages,
        ticketCount: dept._count.supportTickets
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedDepartments
    })
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Verificar se o usuário tem permissão para criar departamentos
    if (!['GERENTE_ADM', 'GERENTE_FINANCEIRO'].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para criar departamentos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, managerId } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome do departamento é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se já existe um departamento com o mesmo nome
    const existingDepartment = await prisma.department.findUnique({
      where: { name: name.trim() }
    })

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Já existe um departamento com este nome' },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        managerId,
        isActive: true
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: department.id,
        name: department.name,
        description: department.description,
        managerId: department.managerId,
        managerName: department.manager?.name,
        employeeIds: [],
        isActive: department.isActive,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt
      }
    })
  } catch (error) {
    console.error('Erro ao criar departamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}