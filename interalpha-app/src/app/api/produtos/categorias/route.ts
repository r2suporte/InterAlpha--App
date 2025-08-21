import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

// Schema de validação para categoria
const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
})

/**
 * GET /api/produtos/categorias - Listar categorias
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const parentId = searchParams.get('parentId')
    const hierarchical = searchParams.get('hierarchical') === 'true'
    
    // Buscar categorias
    const categories = await getCategories({
      includeInactive,
      parentId,
      hierarchical
    })
    
    return NextResponse.json({
      success: true,
      data: categories,
      meta: {
        total: categories.length,
        hierarchical,
        includeInactive,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        data: []
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/produtos/categorias - Criar nova categoria
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar dados
    const validatedData = categorySchema.parse(body)
    
    // Verificar se nome já existe
    const existingCategory = await getCategoryByName(validatedData.name)
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma categoria com este nome' },
        { status: 409 }
      )
    }
    
    // Verificar categoria pai se especificada
    if (validatedData.parentId) {
      const parentCategory = await getCategoryById(validatedData.parentId)
      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: 'Categoria pai não encontrada' },
          { status: 400 }
        )
      }
    }
    
    // Criar categoria
    const newCategory = await createCategory({
      ...validatedData,
      createdBy: userId
    })
    
    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Categoria criada com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

/**
 * Busca categorias com filtros
 */
async function getCategories(options: {
  includeInactive?: boolean
  parentId?: string | null
  hierarchical?: boolean
}) {
  try {
    // TODO: Implementar busca real no banco
    // const categories = await prisma.productCategory.findMany({
    //   where: {
    //     ...(options.includeInactive ? {} : { isActive: true }),
    //     ...(options.parentId ? { parentId: options.parentId } : {})
    //   },
    //   include: {
    //     parent: true,
    //     children: options.hierarchical,
    //     _count: {
    //       select: { products: true }
    //     }
    //   },
    //   orderBy: [
    //     { sortOrder: 'asc' },
    //     { name: 'asc' }
    //   ]
    // })
    
    // Mock data para demonstração
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Eletrônicos',
        description: 'Produtos eletrônicos e componentes',
        parentId: null,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        _count: { products: 45 },
        children: options.hierarchical ? [
          {
            id: 'cat-1-1',
            name: 'Componentes',
            description: 'Componentes eletrônicos',
            parentId: 'cat-1',
            isActive: true,
            sortOrder: 1,
            _count: { products: 23 }
          },
          {
            id: 'cat-1-2',
            name: 'Cabos',
            description: 'Cabos e conectores',
            parentId: 'cat-1',
            isActive: true,
            sortOrder: 2,
            _count: { products: 22 }
          }
        ] : undefined
      },
      {
        id: 'cat-2',
        name: 'Ferramentas',
        description: 'Ferramentas e equipamentos',
        parentId: null,
        isActive: true,
        sortOrder: 2,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
        _count: { products: 67 },
        children: options.hierarchical ? [
          {
            id: 'cat-2-1',
            name: 'Manuais',
            description: 'Ferramentas manuais',
            parentId: 'cat-2',
            isActive: true,
            sortOrder: 1,
            _count: { products: 34 }
          }
        ] : undefined
      },
      {
        id: 'cat-3',
        name: 'Materiais',
        description: 'Materiais diversos',
        parentId: null,
        isActive: false,
        sortOrder: 3,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20'),
        _count: { products: 12 }
      }
    ]
    
    let filteredCategories = mockCategories
    
    // Aplicar filtros
    if (!options.includeInactive) {
      filteredCategories = filteredCategories.filter(cat => cat.isActive)
    }
    
    if (options.parentId) {
      filteredCategories = filteredCategories.filter(cat => cat.parentId === options.parentId)
    }
    
    return filteredCategories
    
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return []
  }
}

/**
 * Busca categoria por nome
 */
async function getCategoryByName(name: string) {
  try {
    // TODO: Implementar busca real
    // return await prisma.productCategory.findFirst({
    //   where: { name: { equals: name, mode: 'insensitive' } }
    // })
    
    // Mock - simular que não existe
    return null
    
  } catch (error) {
    console.error('Erro ao buscar categoria por nome:', error)
    return null
  }
}

/**
 * Busca categoria por ID
 */
async function getCategoryById(id: string) {
  try {
    // TODO: Implementar busca real
    // return await prisma.productCategory.findUnique({
    //   where: { id }
    // })
    
    // Mock - simular que existe
    return {
      id,
      name: 'Categoria Exemplo',
      isActive: true
    }
    
  } catch (error) {
    console.error('Erro ao buscar categoria por ID:', error)
    return null
  }
}

/**
 * Cria nova categoria
 */
async function createCategory(data: any) {
  try {
    // TODO: Implementar criação real
    // const category = await prisma.productCategory.create({
    //   data: {
    //     name: data.name,
    //     description: data.description,
    //     parentId: data.parentId,
    //     isActive: data.isActive,
    //     sortOrder: data.sortOrder,
    //     createdBy: data.createdBy,
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   },
    //   include: {
    //     parent: true,
    //     _count: {
    //       select: { products: true }
    //     }
    //   }
    // })
    
    // Mock category
    const mockCategory = {
      id: `cat-${Date.now()}`,
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { products: 0 }
    }
    
    console.log('Category Created:', mockCategory)
    
    return mockCategory
    
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    throw error
  }
}