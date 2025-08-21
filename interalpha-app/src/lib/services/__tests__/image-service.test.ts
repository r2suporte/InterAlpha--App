import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ImageService } from '../image-service'

// Mock do sistema de arquivos
vi.mock('fs', () => ({
  existsSync: vi.fn()
}))

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  unlink: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
  readFile: vi.fn()
}))

// Mock do Sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn(),
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn()
  }))
}))

describe('ImageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateImageFile', () => {
    it('should validate correct image file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

      const result = ImageService.validateImageFile(file)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid file type', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })

      const result = ImageService.validateImageFile(file)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Tipo de arquivo não suportado')
    })

    it('should reject file too large', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }) // 10MB

      const result = ImageService.validateImageFile(file)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Arquivo muito grande')
    })
  })

  describe('generateFileName', () => {
    it('should generate unique filename', () => {
      const originalName = 'test.jpg'
      const fileName1 = ImageService.generateFileName(originalName)
      const fileName2 = ImageService.generateFileName(originalName)

      expect(fileName1).not.toBe(fileName2)
      expect(fileName1).toMatch(/\d+_[a-z0-9]+\.jpg$/)
      expect(fileName2).toMatch(/\d+_[a-z0-9]+\.jpg$/)
    })

    it('should include product ID when provided', () => {
      const originalName = 'test.jpg'
      const productId = 'product-123'
      const fileName = ImageService.generateFileName(originalName, productId)

      expect(fileName).toMatch(/^product-123_\d+_[a-z0-9]+\.jpg$/)
    })

    it('should preserve file extension', () => {
      const pngFile = ImageService.generateFileName('test.png')
      const webpFile = ImageService.generateFileName('test.webp')

      expect(pngFile).toMatch(/\.png$/)
      expect(webpFile).toMatch(/\.webp$/)
    })
  })

  describe('optimizeImage', () => {
    it('should optimize image with Sharp', async () => {
      const mockBuffer = Buffer.from('fake image data')
      const mockOptimizedBuffer = Buffer.from('optimized image data')
      const mockMetadata = { width: 800, height: 600 }

      // Mock Sharp
      const mockSharp = {
        metadata: vi.fn().mockResolvedValue(mockMetadata),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockOptimizedBuffer)
      }

      vi.doMock('sharp', () => ({
        default: vi.fn(() => mockSharp)
      }))

      const result = await ImageService.optimizeImage(mockBuffer)

      expect(result.optimizedBuffer).toBe(mockOptimizedBuffer)
      expect(result.metadata).toBe(mockMetadata)
      expect(result.wasOptimized).toBe(true)
    })

    it('should fallback when Sharp is not available', async () => {
      const mockBuffer = Buffer.from('fake image data')

      // Mock Sharp import failure
      vi.doMock('sharp', () => {
        throw new Error('Sharp not available')
      })

      const result = await ImageService.optimizeImage(mockBuffer)

      expect(result.optimizedBuffer).toBe(mockBuffer)
      expect(result.wasOptimized).toBe(false)
      expect(result.metadata).toEqual({ width: null, height: null })
    })
  })

  describe('generateThumbnail', () => {
    it('should generate thumbnail with Sharp', async () => {
      const mockBuffer = Buffer.from('fake image data')
      const mockThumbnailBuffer = Buffer.from('thumbnail data')

      const mockSharp = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockThumbnailBuffer)
      }

      vi.doMock('sharp', () => ({
        default: vi.fn(() => mockSharp)
      }))

      const result = await ImageService.generateThumbnail(mockBuffer)

      expect(result.thumbnailBuffer).toBe(mockThumbnailBuffer)
      expect(result.wasGenerated).toBe(true)
    })

    it('should handle Sharp unavailability gracefully', async () => {
      const mockBuffer = Buffer.from('fake image data')

      vi.doMock('sharp', () => {
        throw new Error('Sharp not available')
      })

      const result = await ImageService.generateThumbnail(mockBuffer)

      expect(result.thumbnailBuffer).toBeNull()
      expect(result.wasGenerated).toBe(false)
    })
  })

  describe('imageExists', () => {
    it('should return true for existing image', () => {
      const { existsSync } = vi.mocked(await import('fs'))
      existsSync.mockReturnValue(true)

      const result = ImageService.imageExists('test.jpg')

      expect(result).toBe(true)
    })

    it('should return false for non-existing image', () => {
      const { existsSync } = vi.mocked(await import('fs'))
      existsSync.mockReturnValue(false)

      const result = ImageService.imageExists('nonexistent.jpg')

      expect(result).toBe(false)
    })
  })

  describe('processImageUpload', () => {
    it('should process valid image upload', async () => {
      const file = new File(['fake image data'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      // Mock file operations
      const { existsSync } = vi.mocked(await import('fs'))
      const { writeFile, mkdir } = vi.mocked(await import('fs/promises'))
      
      existsSync.mockReturnValue(false)
      writeFile.mockResolvedValue(undefined)
      mkdir.mockResolvedValue(undefined)

      // Mock Sharp
      const mockSharp = {
        metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('optimized'))
      }

      vi.doMock('sharp', () => ({
        default: vi.fn(() => mockSharp)
      }))

      const result = await ImageService.processImageUpload(file, 'product-123')

      expect(result.success).toBe(true)
      expect(result.imageUrl).toMatch(/^\/uploads\/produtos\/product-123_\d+_[a-z0-9]+\.jpg$/)
      expect(result.thumbnailUrl).toMatch(/^\/uploads\/produtos\/thumbnails\/thumb_product-123_\d+_[a-z0-9]+\.jpg$/)
      expect(result.fileName).toMatch(/^product-123_\d+_[a-z0-9]+\.jpg$/)
    })

    it('should return error for invalid file', async () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })

      const result = await ImageService.processImageUpload(file)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Tipo de arquivo não suportado')
    })
  })
})