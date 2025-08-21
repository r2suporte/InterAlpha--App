import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createProduct, updateProduct, deleteProduct, validatePartNumber } from '../produtos'
import { ProductService } from '@/lib/services/product-service'

// Mock das dependências
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn()
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

vi.mock('@/lib/services/product-service', () => ({
  ProductService: {
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getProductById: vi.fn(),
    isPartNumberAvailable: vi.fn()
  }
}))

const mockAuth = vi.mocked(await import('@clerk/nextjs/server')).auth
const mockRedirect = vi.mocked(await import('next/navigation')).redirect
const mockRevalidatePath = vi.mocked(await import('next/cache')).revalidatePath

describe('Product Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user-123' })
  })

  describe('createProduct', () => {
    it('should create product and redirect on success', async () => {
      const mockProduct = {
        id: 'product-1',
        partNumber: 'TEST-001',
        description: 'Produto de teste',
        costPrice: 50.00,
        salePrice: 75.00
      }

      const formData = new FormData()
      formData.append('partNumber', 'TEST-001')
      formData.append('description', 'Produto de teste')
      formData.append('costPrice', '50.00')
      formData.append('salePrice', '75.00')

      vi.mocked(ProductService.createProduct).mockResolvedValue(mockProduct as any)

      await createProduct(formData)

      expect(ProductService.createProduct).toHaveBeenCalledWith({
        partNumber: 'TEST-001',
        description: 'Produto de teste',
        costPrice: 50.00,
        salePrice: 75.00
      }, 'user-123')

      expect(mockRevalidatePath).toHaveBeenCalledWith('/produtos')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(mockRedirect).toHaveBeenCalledWith('/produtos?success=created')
    })

    it('should redirect with error if user not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const formData = new FormData()
      formData.append('partNumber', 'TEST-001')
      formData.append('description', 'Produto de teste')
      formData.append('costPrice', '50.00')
      formData.append('salePrice', '75.00')

      await createProduct(formData)

      expect(mockRedirect).toHaveBeenCalledWith('/produtos/novo?error=Usuário+não+autenticado')
    })

    it('should redirect with error if validation fails', async () => {
      const formData = new FormData()
      formData.append('partNumber', '') // Inválido
      formData.append('description', 'Produto de teste')
      formData.append('costPrice', '50.00')
      formData.append('salePrice', '75.00')

      await createProduct(formData)

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.stringContaining('/produtos/novo?error=')
      )
    })

    it('should redirect with error if service throws error', async () => {
      const formData = new FormData()
      formData.append('partNumber', 'EXISTING-001')
      formData.append('description', 'Produto de teste')
      formData.append('costPrice', '50.00')
      formData.append('salePrice', '75.00')

      vi.mocked(ProductService.createProduct).mockRejectedValue(
        new Error('Part number já existe')
      )

      await createProduct(formData)

      expect(mockRedirect).toHaveBeenCalledWith(
        '/produtos/novo?error=Part+number+já+existe'
      )
    })
  })

  describe('updateProduct', () => {
    it('should update product and redirect on success', async () => {
      const mockCurrentProduct = {
        id: 'product-1',
        partNumber: 'TEST-001',
        description: 'Produto original'
      }

      const mockUpdatedProduct = {
        id: 'product-1',
        partNumber: 'TEST-001',
        description: 'Produto atualizado'
      }

      const formData = new FormData()
      formData.append('partNumber', 'TEST-001')
      formData.append('description', 'Produto atualizado')
      formData.append('costPrice', '60.00')
      formData.append('salePrice', '90.00')

      vi.mocked(ProductService.getProductById).mockResolvedValue(mockCurrentProduct as any)
      vi.mocked(ProductService.updateProduct).mockResolvedValue(mockUpdatedProduct as any)

      await updateProduct('product-1', formData)

      expect(ProductService.updateProduct).toHaveBeenCalledWith('product-1', {
        partNumber: 'TEST-001',
        description: 'Produto atualizado',
        costPrice: 60.00,
        salePrice: 90.00
      })

      expect(mockRevalidatePath).toHaveBeenCalledWith('/produtos')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/produtos/product-1')
      expect(mockRedirect).toHaveBeenCalledWith('/produtos?success=updated')
    })

    it('should redirect with error if product not found', async () => {
      const formData = new FormData()
      formData.append('partNumber', 'TEST-001')
      formData.append('description', 'Produto')
      formData.append('costPrice', '50.00')
      formData.append('salePrice', '75.00')

      vi.mocked(ProductService.getProductById).mockResolvedValue(null)

      await updateProduct('non-existent', formData)

      expect(mockRedirect).toHaveBeenCalledWith(
        '/produtos/non-existent/editar?error=Produto+não+encontrado'
      )
    })
  })

  describe('deleteProduct', () => {
    it('should delete product and redirect on success', async () => {
      const mockProduct = {
        id: 'product-1',
        partNumber: 'TEST-001',
        description: 'Produto para excluir'
      }

      vi.mocked(ProductService.getProductById).mockResolvedValue(mockProduct as any)
      vi.mocked(ProductService.deleteProduct).mockResolvedValue(undefined)

      await deleteProduct('product-1')

      expect(ProductService.deleteProduct).toHaveBeenCalledWith('product-1')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/produtos')
      expect(mockRedirect).toHaveBeenCalledWith('/produtos?success=deleted')
    })

    it('should redirect with error if product is being used', async () => {
      const mockProduct = {
        id: 'product-1',
        partNumber: 'TEST-001'
      }

      vi.mocked(ProductService.getProductById).mockResolvedValue(mockProduct as any)
      vi.mocked(ProductService.deleteProduct).mockRejectedValue(
        new Error('Produto não pode ser excluído pois está sendo usado em ordens de serviço')
      )

      await deleteProduct('product-1')

      expect(mockRedirect).toHaveBeenCalledWith(
        '/produtos?error=Produto+não+pode+ser+excluído+pois+está+sendo+usado+em+ordens+de+serviço'
      )
    })
  })

  describe('validatePartNumber', () => {
    it('should return valid for available part number', async () => {
      vi.mocked(ProductService.isPartNumberAvailable).mockResolvedValue(true)

      const result = await validatePartNumber('NEW-001')

      expect(result).toEqual({
        isValid: true,
        message: 'Part number disponível'
      })
      expect(ProductService.isPartNumberAvailable).toHaveBeenCalledWith('NEW-001', undefined)
    })

    it('should return invalid for existing part number', async () => {
      vi.mocked(ProductService.isPartNumberAvailable).mockResolvedValue(false)

      const result = await validatePartNumber('EXISTING-001')

      expect(result).toEqual({
        isValid: false,
        message: 'Este part number já existe'
      })
    })

    it('should return invalid for empty part number', async () => {
      const result = await validatePartNumber('')

      expect(result).toEqual({
        isValid: false,
        message: 'Part number é obrigatório'
      })
    })

    it('should return invalid for invalid format', async () => {
      const result = await validatePartNumber('INVALID@#$')

      expect(result).toEqual({
        isValid: false,
        message: 'Part number deve conter apenas letras, números e hífens'
      })
    })

    it('should exclude specific product when validating', async () => {
      vi.mocked(ProductService.isPartNumberAvailable).mockResolvedValue(true)

      await validatePartNumber('TEST-001', 'product-1')

      expect(ProductService.isPartNumberAvailable).toHaveBeenCalledWith('TEST-001', 'product-1')
    })
  })
})