import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { GET, POST } from '../route'
import { ProductService } from '@/lib/services/product-service'
import { NextRequest } from 'next/server'

// Mock das dependências
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}))

jest.mock('@/lib/services/product-service', () => ({
  ProductService: {
    getProducts: jest.fn()
  }
}))

const mockAuth = jest.mocked(await import('@clerk/nextjs/server')).auth

describe('/api/produtos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user-123' })
  })

  describe('GET', () => {
    it('should return products with default pagination', async () => {
      const mockResult = {
        products: [
          {
            id: 'product-1',
            partNumber: 'TEST-001',
            description: 'Produto de teste',
            costPrice: 50.00,
            salePrice: 75.00,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'user-1'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
          hasNext: false,
          hasPrev: false
        }
      }

      jest.mocked(ProductService.getProducts).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/produtos')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockResult.products)
      expect(data.pagination).toEqual(mockResult.pagination)
    })

    it('should handle search parameter', async () => {
      const mockResult = {
        products: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      }

      jest.mocked(ProductService.getProducts).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/produtos?search=test&page=2&limit=10')
      const response = await GET(request)

      expect(ProductService.getProducts).toHaveBeenCalledWith({
        search: 'test',
        isActive: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 2,
        limit: 10
      })
    })

    it('should handle boolean parameters correctly', async () => {
      const mockResult = {
        products: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      }

      jest.mocked(ProductService.getProducts).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/produtos?isActive=true')
      await GET(request)

      expect(ProductService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true
        })
      )
    })

    it('should limit maximum items per page', async () => {
      const mockResult = {
        products: [],
        pagination: {
          page: 1,
          limit: 100,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      }

      jest.mocked(ProductService.getProducts).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/produtos?limit=200')
      await GET(request)

      expect(ProductService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100 // Limitado ao máximo
        })
      )
    })

    it('should handle service errors gracefully', async () => {
      jest.mocked(ProductService.getProducts).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost/api/produtos')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
      expect(data.data).toEqual([])
    })

    it('should work without authentication', async () => {
      mockAuth.mockRejectedValue(new Error('Not authenticated'))

      const mockResult = {
        products: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      }

      jest.mocked(ProductService.getProducts).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/produtos')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(ProductService.getProducts).toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    it('should handle advanced search', async () => {
      const mockResult = {
        products: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      }

      jest.mocked(ProductService.getProducts).mockResolvedValue(mockResult)

      const requestBody = {
        search: 'advanced search',
        filters: {
          isActive: true,
          minCostPrice: 10,
          maxCostPrice: 100,
          sortBy: 'partNumber',
          sortOrder: 'asc'
        }
      }

      const request = new NextRequest('http://localhost/api/produtos', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(ProductService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'advanced search',
          isActive: true,
          minCostPrice: 10,
          maxCostPrice: 100,
          sortBy: 'partNumber',
          sortOrder: 'asc'
        })
      )
    })

    it('should handle empty request body', async () => {
      const mockResult = {
        products: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      }

      jest.mocked(ProductService.getProducts).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/produtos', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(ProductService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: '',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          page: 1,
          limit: 20
        })
      )
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/produtos', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})