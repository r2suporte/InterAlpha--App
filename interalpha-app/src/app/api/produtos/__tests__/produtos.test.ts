/**
 * Testes de Integração para APIs de Produtos
 */

// Mock do Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({ userId: 'test-user-123' })
}))

// Mock do ProductService
jest.mock('@/lib/services/product-service', () => ({
  productService: {
    createProduct: jest.fn(),
    getProducts: jest.fn(),
    getProductById: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn()
  }
}))

// Mock do auditMiddleware
jest.mock('@/middleware/audit-middleware', () => ({
  auditMiddleware: jest.fn().mockResolvedValue(undefined)
}))

import { NextRequest } from 'next/server'
import { POST, GET } from '../route'
import { GET as GET_ID, PUT, DELETE } from '../[id]/route'
import { productService } from '@/lib/services/product-service'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

const mockProductService = productService as jest.Mocked<typeof productService>

describe('/api/produtos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/produtos', () => {
    const validProductData = {
      partNumber: 'TEST-001',
      description: 'Produto de teste',
      costPrice: 100,
      salePrice: 150
    }

    it('should create product with valid data', async () => {
      const mockCreatedProduct = {
        id: 'product-123',
        ...validProductData,
        createdBy: 'test-user-123',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: 'test-user-123',
          name: 'Test User',
          email: 'test@example.com'
        }
      }

      mockProductService.createProduct.mockResolvedValue(mockCreatedProduct as any)

      const request = new NextRequest('http://localhost/api/produtos', {
        method: 'POST',
        body: JSON.stringify(validProductData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('product-123')
      expect(mockProductService.createProduct).toHaveBeenCalledWith({
        ...validProductData,
        createdBy: 'test-user-123'
      })
    })

    it('should return 409 for duplicate part number', async () => {
      mockProductService.createProduct.mockRejectedValue(
        new Error('PART_NUMBER_EXISTS')
      )

      const request = new NextRequest('http://localhost/api/produtos', {
        method: 'POST',
        body: JSON.stringify(validProductData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('Part number já existe')
      expect(data.code).toBe('DUPLICATE_PART_NUMBER')
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        partNumber: '', // Inválido
        description: 'Test',
        costPrice: -10, // Inválido
        salePrice: 150
      }

      const request = new NextRequest('http://localhost/api/produtos', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/produtos', () => {
    it('should return paginated products', async () => {
      const mockResult = {
        products: [
          {
            id: 'product-1',
            partNumber: 'TEST-001',
            description: 'Product 1',
            costPrice: 100,
            salePrice: 150,
            profitMargin: 50,
            profitAmount: 50,
            marginStatus: 'positive' as const,
            formattedCostPrice: 'R$ 100,00',
            formattedSalePrice: 'R$ 150,00',
            formattedProfitAmount: 'R$ 50,00'
          }
        ],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }

      mockProductService.getProducts.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/produtos?page=1&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.products).toHaveLength(1)
      expect(data.data.totalCount).toBe(1)
    })

    it('should handle search filters', async () => {
      mockProductService.getProducts.mockResolvedValue({
        products: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      })

      const request = new NextRequest('http://localhost/api/produtos?search=test&isActive=true')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockProductService.getProducts).toHaveBeenCalledWith({
        search: 'test',
        isActive: true,
        sortBy: undefined,
        sortOrder: undefined,
        page: undefined,
        limit: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minMargin: undefined,
        maxMargin: undefined
      })
    })
  })

  describe('GET /api/produtos/[id]', () => {
    it('should return product by id', async () => {
      const mockProduct = {
        id: 'product-123',
        partNumber: 'TEST-001',
        description: 'Test Product',
        costPrice: 100,
        salePrice: 150
      }

      mockProductService.getProductById.mockResolvedValue(mockProduct as any)

      const request = new NextRequest('http://localhost/api/produtos/product-123')
      const response = await GET_ID(request, { params: { id: 'product-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('product-123')
    })

    it('should return 404 for non-existent product', async () => {
      mockProductService.getProductById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/produtos/nonexistent')
      const response = await GET_ID(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.code).toBe('PRODUCT_NOT_FOUND')
    })
  })

  describe('PUT /api/produtos/[id]', () => {
    it('should update product', async () => {
      const existingProduct = {
        id: 'product-123',
        partNumber: 'TEST-001',
        description: 'Original description'
      }

      const updateData = {
        description: 'Updated description',
        salePrice: 200
      }

      const updatedProduct = {
        ...existingProduct,
        ...updateData
      }

      mockProductService.getProductById.mockResolvedValue(existingProduct as any)
      mockProductService.updateProduct.mockResolvedValue(updatedProduct as any)

      const request = new NextRequest('http://localhost/api/produtos/product-123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: { id: 'product-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.description).toBe('Updated description')
    })
  })

  describe('DELETE /api/produtos/[id]', () => {
    it('should delete product', async () => {
      const existingProduct = {
        id: 'product-123',
        partNumber: 'TEST-001'
      }

      mockProductService.getProductById.mockResolvedValue(existingProduct as any)
      mockProductService.deleteProduct.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost/api/produtos/product-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'product-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith('product-123')
    })

    it('should return 409 when product is in use', async () => {
      const existingProduct = { id: 'product-123' }

      mockProductService.getProductById.mockResolvedValue(existingProduct as any)
      mockProductService.deleteProduct.mockRejectedValue(
        new Error('PRODUCT_IN_USE')
      )

      const request = new NextRequest('http://localhost/api/produtos/product-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'product-123' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.code).toBe('PRODUCT_IN_USE')
    })
  })
})