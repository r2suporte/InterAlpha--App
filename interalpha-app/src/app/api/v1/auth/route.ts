import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createRateLimitMiddleware, rateLimitConfigs } from '@/middleware/rate-limit-middleware'

const prisma = new PrismaClient()
const rateLimitAuth = createRateLimitMiddleware(rateLimitConfigs.auth)

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const rateLimitResult = await rateLimitAuth(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const body = await request.json()
    const { email, password, apiKey } = body

    // Validar entrada
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: 'Email e senha são obrigatórios',
          code: 'MISSING_CREDENTIALS'
        },
        { status: 400 }
      )
    }

    // Verificar API Key se fornecida (para integrações externas)
    if (apiKey) {
      // Implementar validação de API Key
      const validApiKey = process.env.API_KEY
      if (apiKey !== validApiKey) {
        return NextResponse.json(
          { 
            error: 'API Key inválida',
            code: 'INVALID_API_KEY'
          },
          { status: 401 }
        )
      }
    }

    // Buscar usuário
    const user = await prisma.employee.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        isActive: true,
        department: true,
        lastLoginAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { 
          error: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { 
          error: 'Conta desativada',
          code: 'ACCOUNT_DISABLED'
        },
        { status: 401 }
      )
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { 
          error: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    // Gerar tokens
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET não configurado')
    }

    const accessToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'access'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { 
        userId: user.id,
        type: 'refresh'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Atualizar último login
    await prisma.employee.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Log de auditoria
    await prisma.accessLogEntry.create({
      data: {
        userId: user.id,
        userType: 'employee',
        action: 'login',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: true,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          lastLoginAt: user.lastLoginAt
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600 // 1 hora em segundos
        }
      }
    })

  } catch (error) {
    console.error('Erro na autenticação API:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}