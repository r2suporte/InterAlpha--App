import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

// Schema de validação para atualização de categoria
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional()
})

/**
 * GET /api/produtos/categorias/[id] - Buscar categoria específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get('includeProducts') === 'true'
    const includeChildren = searchParams.get('includeChildren') === 'true'
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar categoria
    const category = await getCategoryWithDetails(id, {
      includeProducts,
      includeChildren
    })
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: category,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    
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
 * PUT /api/produtos/categorias/[id] - Atualizar categoria
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }
    
    // Validar dados
    const validatedData = updateCategorySchema.parse(body)
    
    // Verificar se categoria existe
    const existingCategory = await getCategoryById(id)
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar nome duplicado se alterado
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await getCategoryByName(validatedData.name)
      if (duplicateCategory && duplicateCategory.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Já existe uma categoria com este nome' },
          { status: 409 }
        )
      }
    }
    
    // Verificar categoria pai se alterada
    if (validatedData.parentId && validatedData.parentId !== existingCategory.parentId) {
      // Não permitir que categoria seja pai de si mesma
      if (validatedData.parentId === id) {
        return NextResponse.json(
          { success: false, error: 'Categoria não pode ser pai de si mesma' },
          { status: 400 }
        )
      }
      
      // Verificar se categoria pai existe
      const parentCategory = await getCategoryById(validatedData.parentId)
      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: 'Categoria pai não encontrada' },
          { status: 400 }
        )
      }
      
      // Verificar se não criaria loop hierárquico
      const wouldCreateLoop = await checkHierarchicalLoop(id, validatedData.parentId)
      if (wouldCreateLoop) {
        return NextResponse.json(
          { success: false, error: 'Esta alteração criaria um loop na hierarquia' },
          { status: 400 }
        )
      }
    }
    
    // Atualizar categoria
    const updatedCategory = await updateCategory(id, {
      ...validatedData,
      updatedBy: userId
    })
    
    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Categoria atualizada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    
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
 * DELETE /api/produtos/categorias/[id] - Excluir categoria
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se categoria existe
    const category = await getCategoryById(id)
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se categoria tem produtos vinculados
    const productCount = await getCategoryProductCount(id)
    if (productCount > 0 && !force) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Categoria possui ${productCount} produto(s) vinculado(s). Use force=true para excluir mesmo assim.`,
          productCount
        },
        { status: 409 }
      )
    }
    
    // Verificar se categoria tem subcategorias
    const childrenCount = await getCategoryChildrenCount(id)
    if (childrenCount > 0 && !force) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Categoria possui ${childrenCount} subcategoria(s). Use force=true para excluir mesmo assim.`,
          childrenCount
        },
        { status: 409 }
      )
    }
    
    // Excluir categoria
    await deleteCategory(id, { force, deletedBy: userId })
    
    return NextResponse.json({
      success: true,
      message: 'Categoria excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    
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
 * Busca categoria com detalhes
 */
async function getCategoryWithDetails(id: string, options: {
  includeProducts?: boolean
  includeChildren?: boolean
}) {
  try {
    // TODO: Implementar busca real
    // const category = await prisma.productCategory.findUnique({
    //   where: { id },
    //   include: {
    //     parent: true,
    //     children: options.includeChildren,
    //     products: options.includeProducts ? {
    //       select: {
    //         id: true,
    //         partNumber: true,
    //         description: true,
    //         salePrice: true,
    //         isActive: true
    //       }
    //     } : false,
    //     _count: {
    //       select: {
    //         products: true,
    //         children: true
    //       }
    //     }
    //   }
    // })
    
    // Mock category
    const mockCategory = {
      id,
      name: 'Eletrônicos',
      description: 'Produtos eletrônicos e componentes',
      parentId: null,
      isActive: true,
      sortOrder: 1,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      parent: null,
      children: options.includeChildren ? [
        {
          id: 'cat-child-1',
          name: 'Componentes',
          description: 'Componentes eletrônicos',
          isActive: true,
          _count: { products: 23 }
        }
      ] : undefined,
      products: options.includeProducts ? [
        {
          id: 'prod-1',
          partNumber: 'COMP-001',
          description: 'Resistor 10K',
          salePrice: 0.50,
          isActive: true
        }
      ] : undefined,
      _count: {
        products: 45,
        children: 3
      }
    }
    
    return mockCategory
    
  } catch (error) {
    console.error('Erro ao buscar categoria com detalhes:', error)
    return null
  }
}

/**
 * Busca categoria por ID
 */
async function getCategoryById(id: string) {
  try {
    // TODO: Implementar busca real
    return {
      id,
      name: 'Categoria Exemplo',
      parentId: null,
      isActive: true
    }
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    return null
  }
}

/**
 * Busca categoria por nome
 */
async function getCategoryByName(name: string) {
  try {
    // TODO: Implementar busca real
    return null // Simular que não existe
  } catch (error) {
    console.error('Erro ao buscar categoria por nome:', error)
    return null
  }
}

/**
 * Verifica se alteração criaria loop hierárquico
 */
async function checkHierarchicalLoop(categoryId: string, newParentId: string): Promise<boolean> {
  try {
    // TODO: Implementar verificação real de loop
    // Verificar se newParentId é descendente de categoryId
    return false // Simular que não há loop
  } catch (error) {
    console.error('Erro ao verificar loop hierárquico:', error)
    return true // Em caso de erro, assumir que há loop por segurança
  }
}

/**
 * Conta produtos da categoria
 */
async function getCategoryProductCount(categoryId: string): Promise<number> {
  try {
    // TODO: Implementar contagem real
    // return await prisma.product.count({
    //   where: { categoryId }
    // })
    return 0 // Mock
  } catch (error) {
    console.error('Erro ao contar produtos da categoria:', error)
    return 0
  }
}

/**
 * Conta subcategorias
 */
async function getCategoryChildrenCount(categoryId: string): Promise<number> {
  try {
    // TODO: Implementar contagem real
    // return await prisma.productCategory.count({
    //   where: { parentId: categoryId }
    // })
    return 0 // Mock
  } catch (error) {
    console.error('Erro ao contar subcategorias:', error)
    return 0
  }
}

/**
 * Atualiza categoria
 */
async function updateCategory(id: string, data: any) {
  try {
    // TODO: Implementar atualização real
    const mockUpdatedCategory = {
      id,
      ...data,
      updatedAt: new Date()
    }
    
    console.log('Category Updated:', mockUpdatedCategory)
    return mockUpdatedCategory
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    throw error
  }
}

/**
 * Exclui categoria
 */
async function deleteCategory(id: string, options: { force: boolean, deletedBy: string }) {
  try {
    // TODO: Implementar exclusão real
    console.log('Category Deleted:', { id, options })
    
    if (options.force) {
      // Se force=true, remover vínculos primeiro
      // await prisma.product.updateMany({
      //   where: { categoryId: id },
      //   data: { categoryId: null }
      // })
      
      // await prisma.productCategory.updateMany({
      //   where: { parentId: id },
      //   data: { parentId: null }
      // })
    }
    
    // await prisma.productCategory.delete({
    //   where: { id }
    // })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    throw error
  }
}