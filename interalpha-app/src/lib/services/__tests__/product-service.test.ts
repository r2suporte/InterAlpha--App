import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ProductService } from '../product-service'
import { PrismaClient } from '@prisma/client'

// Mock do Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    product: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    }
  }))
}))

const mockPrisma = new PrismaClient() as any

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        partNumber: 'TEST-001',
        description: 'Produto de teste',
        costPrice: 50.00,
        salePrice: 75.00
      }

      const mockCreatedProduct = {
        id: 'product-1',
        ...productData,
        partNumber: 'TEST-001',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        creator: { name: 'Test User', email: 'test@example.com' }
      }

      mockPrisma.product.findUnique.mockResolvedValue(null) // Part number não existe
      mockPrisma.product.create.mockResolvedValue(mockCreatedProduct)

      const result = await ProductService.createProduct(productData, 'user-1')

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { partNumber: 'TEST-001' }
      })
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          ...productData,
          partNumber: 'TEST-001',
          createdBy: 'user-1'
        },
        include: {
          creator: {
            select: { name: true, email: true }
          }
        }
      })
      expect(result).toEqual(mockCreatedProduct)
    })

    it('should throw error if part number already exists', async () => {
      const productData = {
        partNumber: 'EXISTING-001',
        description: 'Produto existente',
        costPrice: 50.00,
        salePrice: 75.00
      }

      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'existing-product',
        partNumber: 'EXISTING-001'
      })

      await expect(
        ProductService.createProduct(productData, 'user-1')
      ).rejects.toThrow('Part number já existe')
    })

    it('should validate product data', async () => {
      const invalidData = {
        partNumber: '', // Inválido
        description: 'Produto de teste',
        costPrice: -10, // Inválido
        salePrice: 75.00
      }

      await expect(
        ProductService.createProduct(invalidData as any, 'user-1')
      ).rejects.toThrow()
    })
  })

  describe('getProducts', () => {
    it('should return products with pagination', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          partNumber: 'TEST-001',
          description: 'Produto 1',
          costPrice: 50.00,
          salePrice: 75.00,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1',
          creator: { name: 'Test User', email: 'test@example.com' },
          _count: { orderItems: 5 }
        }
      ]

      mockPrisma.product.findMany.mockResolvedValue(mockProducts)
      mockPrisma.product.count.mockResolvedValue(1)

      const result = await ProductService.getProducts({
        page: 1,
        limit: 20
      })

      expect(result.products).toHaveLength(1)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
        hasNext: false,
        hasPrev: false
      })
    })

    it('should filter products by search term', async () => {
      await ProductService.getProducts({
        search: 'test',
        page: 1,
        limit: 20
      })

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              {
                partNumber: {
                  contains: 'test',
                  mode: 'insensitive'
                }
              },
              {
                description: {
                  contains: 'test',
                  mode: 'insensitive'
                }
              }
            ]
          }
        })
      )
    })

    it('should filter products by active status', async () => {
      await ProductService.getProducts({
        isActive: true,
        page: 1,
        limit: 20
      })

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true
          }
        })
      )
    })
  })

  describe('getProductById', () => {
    it('should return product with order history', async () => {
      const mockProduct = {
        id: 'product-1',
        partNumber: 'TEST-001',
        description: 'Produto de teste',
        costPrice: 50.00,
        salePrice: 75.00,
        creator: { name: 'Test User', email: 'test@example.com' },
        orderItems: [
          {
            id: 'item-1',
            quantity: 2,
            order: {
              id: 'order-1',
              titulo: 'Ordem de teste',
              createdAt: new Date(),
              cliente: { nome: 'Cliente Teste' }
            }
          }
        ]
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)

      const result = await ProductService.getProductById('product-1')

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        include: expect.objectContaining({
          creator: {
            select: { name: true, email: true }
          },
          orderItems: expect.any(Object)
        })
      })
      expect(result).toEqual(mockProduct)
    })

    it('should return null if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      const result = await ProductService.getProductById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const existingProduct = {
        id: 'product-1',
        partNumber: 'TEST-001',
        description: 'Produto original',
        costPrice: 50.00,
        salePrice: 75.00
      }

      const updateData = {
        description: 'Produto atualizado',
        salePrice: 80.00
      }

      const updatedProduct = {
        ...existingProduct,
        ...updateData,
        updatedAt: new Date(),
        creator: { name: 'Test User', email: 'test@example.com' }
      }

      mockPrisma.product.findUnique.mockResolvedValue(existingProduct)
      mockPrisma.product.update.mockResolvedValue(updatedProduct)

      const result = await ProductService.updateProduct('product-1', updateData)

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: updateData,
        include: {
          creator: {
            select: { name: true, email: true }
          }
        }
      })
      expect(result).toEqual(updatedProduct)
    })

    it('should throw error if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      await expect(
        ProductService.updateProduct('non-existent', { description: 'Test' })
      ).rejects.toThrow('Produto não encontrado')
    })

    it('should check part number uniqueness when updating', async () => {
      const existingProduct = {
        id: 'product-1',
        partNumber: 'TEST-001'
      }

      const duplicateProduct = {
        id: 'product-2',
        partNumber: 'TEST-002'
      }

      mockPrisma.product.findUnique
        .mockResolvedValueOnce(existingProduct) // Produto existe
        .mockResolvedValueOnce(duplicateProduct) // Part number já existe

      await expect(
        ProductService.updateProduct('product-1', { partNumber: 'TEST-002' })
      ).rejects.toThrow('Part number já existe')
    })
  })

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const mockProduct = {
        id: 'product-1',
        partNumber: 'TEST-001',
        orderItems: [] // Não está sendo usado
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)
      mockPrisma.product.delete.mockResolvedValue(mockProduct)

      await ProductService.deleteProduct('product-1')

      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'product-1' }
      })
    })

    it('should throw error if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      await expect(
        ProductService.deleteProduct('non-existent')
      ).rejects.toThrow('Produto não encontrado')
    })

    it('should throw error if product is being used', async () => {
      const mockProduct = {
        id: 'product-1',
        partNumber: 'TEST-001',
        orderItems: [{ id: 'item-1' }] // Está sendo usado
      }

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct)

      await expect(
        ProductService.deleteProduct('product-1')
      ).rejects.toThrow('Produto não pode ser excluído pois está sendo usado em ordens de serviço')
    })
  })

  describe('getProductStats', () => {
    it('should return product statistics', async () => {
      const mockProducts = [
        { costPrice: 50.00, salePrice: 75.00 },
        { costPrice: 100.00, salePrice: 120.00 }
      ]

      const mockTopProducts = [
        {
          id: 'product-1',
          partNumber: 'TOP-001',
          description: 'Produto mais usado',
          _count: { orderItems: 10 }
        }
      ]

      mockPrisma.product.count
        .mockResolvedValueOnce(100) // Total
        .mockResolvedValueOnce(85)  // Ativos

      mockPrisma.product.findMany
        .mockResolvedValueOnce(mockProducts) // Para margem
        .mockResolvedValueOnce(mockTopProducts) // Top produtos

      const result = await ProductService.getProductStats()

      expect(result).toEqual({
        totalProducts: 100,
        activeProducts: 85,
        averageMargin: 35, // (50% + 20%) / 2
        totalValue: 195, // 75 + 120
        topProducts: [
          {
            id: 'product-1',
            partNumber: 'TOP-001',
            description: 'Produto mais usado',
            timesUsed: 10
          }
        ]
      })
    })
  })

  describe('isPartNumberAvailable', () => {
    it('should return true if part number is available', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      const result = await ProductService.isPartNumberAvailable('NEW-001')

      expect(result).toBe(true)
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { partNumber: 'NEW-001' }
      })
    })

    it('should return false if part number exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'existing-product',
        partNumber: 'EXISTING-001'
      })

      const result = await ProductService.isPartNumberAvailable('EXISTING-001')

      expect(result).toBe(false)
    })

    it('should exclude specific product when checking', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      await ProductService.isPartNumberAvailable('TEST-001', 'product-1')

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: {
          partNumber: 'TEST-001',
          id: { not: 'product-1' }
        }
      })
    })
  })

  describe('validateProductData', () => {
    it('should return valid for correct data', () => {
      const validData = {
        partNumber: 'TEST-001',
        description: 'Produto válido',
        costPrice: 50.00,
        salePrice: 75.00
      }

      const result = ProductService.validateProductData(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should return errors for invalid data', () => {
      const invalidData = {
        partNumber: '', // Inválido
        description: 'Produto',
        costPrice: -10, // Inválido
        salePrice: 75.00
      }

      const result = ProductService.validateProductData(invalidData as any)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveProperty('partNumber')
      expect(result.errors).toHaveProperty('costPrice')
    })
  })
})