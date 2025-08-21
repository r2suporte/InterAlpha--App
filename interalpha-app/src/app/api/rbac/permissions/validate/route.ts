import { NextRequest, NextResponse } from 'next/server'
import { roleManagementService } from '@/services/rbac/role-management-service'

// Validar permissão de usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      resource,
      action,
      context
    } = body

    // Validar dados obrigatórios
    if (!userId || !resource || !action) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, resource, action' },
        { status: 400 }
      )
    }

    const validation = await roleManagementService.validateUserPermission(
      userId,
      resource,
      action,
      context
    )

    return NextResponse.json({
      success: true,
      data: validation
    })

  } catch (error) {
    console.error('Error validating permission:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Validar múltiplas permissões de uma vez
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, permissions } = body

    if (!userId || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'userId e permissions (array) são obrigatórios' },
        { status: 400 }
      )
    }

    const results = []

    for (const perm of permissions) {
      const { resource, action, context } = perm
      
      if (!resource || !action) {
        results.push({
          resource,
          action,
          allowed: false,
          reason: 'resource e action são obrigatórios'
        })
        continue
      }

      try {
        const validation = await roleManagementService.validateUserPermission(
          userId,
          resource,
          action,
          context
        )

        results.push({
          resource,
          action,
          ...validation
        })
      } catch (error) {
        results.push({
          resource,
          action,
          allowed: false,
          reason: 'Erro na validação'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        results
      }
    })

  } catch (error) {
    console.error('Error validating multiple permissions:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}