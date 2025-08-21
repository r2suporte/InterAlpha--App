import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {
      userId: userId
    }

    if (search) {
      // Verificar se é busca por ID (formato #000001)
      const isIdSearch = search.startsWith('#')
      const cleanSearch = isIdSearch ? search.substring(1) : search
      
      if (isIdSearch && /^\d+$/.test(cleanSearch)) {
        // Busca por ID sequencial
        where.numeroSequencial = parseInt(cleanSearch)
      } else {
        // Busca por nome, email, documento ou cidade
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { documento: { contains: search.replace(/\D/g, '') } }, // Remove formatação do documento
          { cidade: { contains: search, mode: 'insensitive' } }
        ]
        
        // Se for um número, também buscar por numeroSequencial
        if (/^\d+$/.test(search)) {
          where.OR.push({ numeroSequencial: parseInt(search) })
        }
      }
    }

    // Buscar clientes
    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { numeroSequencial: 'desc' },
        include: {
          _count: {
            select: { ordensServico: true }
          }
        }
      }),
      prisma.cliente.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: clientes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erro na API de clientes:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      },
      { status: 500 }
    )
  }
}

// POST - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()

    // Validações básicas
    if (!data.nome || !data.email || !data.documento) {
      return NextResponse.json(
        { error: 'Nome, email e documento são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se documento já existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { documento: data.documento }
    })

    if (existingCliente) {
      return NextResponse.json(
        { error: 'Documento já cadastrado' },
        { status: 400 }
      )
    }

    // Criar cliente
    const cliente = await prisma.cliente.create({
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        documento: data.documento,
        tipoDocumento: data.tipoDocumento || 'CPF',
        cep: data.cep,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        observacoes: data.observacoes,
        userId: userId
      },
      include: {
        _count: {
          select: { ordensServico: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: cliente
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}