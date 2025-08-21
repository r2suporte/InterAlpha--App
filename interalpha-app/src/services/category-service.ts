/**
 * Serviço para gerenciar categorias de produtos
 */

import { prisma } from '@/lib/prisma'

export interface CreateCategoryData {
  name: string
  description?: string
  color?: string
  icon?: string
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  color?: string
  icon?: string
  isActive?: boolean
}

export class CategoryService {
  /**
   * Criar nova categoria
   */
  async create(data: CreateCategoryData) {
    // Verificar se já existe categoria com o mesmo nome
    const existingCategory = await prisma.productCategory.findUnique({
      where: { name: data.name }
    })

    if (existingCategory) {
      throw new Error('Já existe uma categoria com este nome')
    }

    const category = await prisma.productCategory.create({
      data,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return category
  }

  /**
   * Listar todas as categorias
   */
  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true }

    const categories = await prisma.productCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return categories
  }

  /**
   * Buscar categoria por ID
   */
  async findById(id: string) {
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            partNumber: true,
            description: true,
            salePrice: true,
            quantity: true,
            isActive: true
          },
          where: { isActive: true },
          orderBy: { partNumber: 'asc' }
        },
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return category
  }

  /**
   * Atualizar categoria
   */
  async update(id: string, data: UpdateCategoryData) {
    // Verificar se categoria existe
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      throw new Error('Categoria não encontrada')
    }

    // Verificar nome único se estiver sendo alterado
    if (data.name && data.name !== existingCategory.name) {
      const nameExists = await prisma.productCategory.findUnique({
        where: { name: data.name }
      })

      if (nameExists) {
        throw new Error('Já existe uma categoria com este nome')
      }
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return category
  }

  /**
   * Excluir categoria
   */
  async delete(id: string) {
    // Verificar se categoria existe
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!category) {
      throw new Error('Categoria não encontrada')
    }

    // Verificar se há produtos na categoria
    if (category._count.products > 0) {
      throw new Error('Não é possível excluir categoria que possui produtos')
    }

    await prisma.productCategory.delete({
      where: { id }
    })

    return { success: true }
  }

  /**
   * Desativar categoria (soft delete)
   */
  async deactivate(id: string) {
    return this.update(id, { isActive: false })
  }

  /**
   * Ativar categoria
   */
  async activate(id: string) {
    return this.update(id, { isActive: true })
  }

  /**
   * Mover produtos para outra categoria
   */
  async moveProducts(fromCategoryId: string, toCategoryId: string) {
    // Verificar se ambas as categorias existem
    const [fromCategory, toCategory] = await Promise.all([
      prisma.productCategory.findUnique({ where: { id: fromCategoryId } }),
      prisma.productCategory.findUnique({ where: { id: toCategoryId } })
    ])

    if (!fromCategory) {
      throw new Error('Categoria de origem não encontrada')
    }

    if (!toCategory) {
      throw new Error('Categoria de destino não encontrada')
    }

    // Mover produtos
    const result = await prisma.product.updateMany({
      where: { categoryId: fromCategoryId },
      data: { categoryId: toCategoryId }
    })

    return {
      success: true,
      movedProducts: result.count
    }
  }

  /**
   * Remover categoria dos produtos (deixar sem categoria)
   */
  async removeFromProducts(categoryId: string) {
    const result = await prisma.product.updateMany({
      where: { categoryId },
      data: { categoryId: null }
    })

    return {
      success: true,
      updatedProducts: result.count
    }
  }

  /**
   * Estatísticas das categorias
   */
  async getStats() {
    const [
      totalCategories,
      activeCategories,
      categoriesWithProducts,
      productsWithoutCategory
    ] = await Promise.all([
      prisma.productCategory.count(),
      prisma.productCategory.count({ where: { isActive: true } }),
      prisma.productCategory.count({
        where: {
          products: {
            some: {}
          }
        }
      }),
      prisma.product.count({
        where: {
          categoryId: null,
          isActive: true
        }
      })
    ])

    // Categoria com mais produtos
    const categoryWithMostProducts = await prisma.productCategory.findFirst({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        products: {
          _count: 'desc'
        }
      }
    })

    return {
      totalCategories,
      activeCategories,
      categoriesWithProducts,
      productsWithoutCategory,
      categoryWithMostProducts: categoryWithMostProducts ? {
        name: categoryWithMostProducts.name,
        productCount: categoryWithMostProducts._count.products
      } : null
    }
  }

  /**
   * Buscar categorias por nome
   */
  async search(query: string) {
    const categories = await prisma.productCategory.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return categories
  }
}