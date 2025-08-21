import { IMAGE_CONFIG } from '@/lib/constants/products'
import path from 'path'
import { existsSync } from 'fs'
import { writeFile, unlink, mkdir } from 'fs/promises'

export class ImageService {
  private static uploadDir = path.join(process.cwd(), 'public', 'uploads', 'produtos')
  private static thumbnailDir = path.join(ImageService.uploadDir, 'thumbnails')

  /**
   * Valida se um arquivo de imagem é válido
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Verificar tipo
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `Tipo de arquivo não suportado. Use: ${IMAGE_CONFIG.ALLOWED_TYPES.join(', ')}`
      }
    }

    // Verificar tamanho
    if (file.size > IMAGE_CONFIG.MAX_SIZE) {
      const maxSizeMB = IMAGE_CONFIG.MAX_SIZE / (1024 * 1024)
      return {
        isValid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`
      }
    }

    return { isValid: true }
  }

  /**
   * Gera nome único para arquivo
   */
  static generateFileName(originalName: string, productId?: string): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = path.extname(originalName).toLowerCase()
    
    const prefix = productId ? `${productId}_` : ''
    return `${prefix}${timestamp}_${randomString}${extension}`
  }

  /**
   * Otimiza imagem usando Sharp (se disponível)
   */
  static async optimizeImage(buffer: Buffer): Promise<{
    optimizedBuffer: Buffer
    metadata: any
    wasOptimized: boolean
  }> {
    try {
      // Tentar importar Sharp
      const sharp = await import('sharp')
      
      // Obter metadados
      const metadata = await sharp.default(buffer).metadata()
      
      // Otimizar imagem
      const optimizedBuffer = await sharp.default(buffer)
        .resize(IMAGE_CONFIG.DISPLAY_SIZE.width, IMAGE_CONFIG.DISPLAY_SIZE.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: IMAGE_CONFIG.QUALITY })
        .toBuffer()
      
      return {
        optimizedBuffer,
        metadata,
        wasOptimized: true
      }
    } catch (error) {
      console.warn('Sharp não disponível, usando imagem original:', error)
      
      return {
        optimizedBuffer: buffer,
        metadata: { width: null, height: null },
        wasOptimized: false
      }
    }
  }

  /**
   * Gera thumbnail da imagem
   */
  static async generateThumbnail(buffer: Buffer): Promise<{
    thumbnailBuffer: Buffer | null
    wasGenerated: boolean
  }> {
    try {
      const sharp = await import('sharp')
      
      const thumbnailBuffer = await sharp.default(buffer)
        .resize(IMAGE_CONFIG.THUMBNAIL_SIZE.width, IMAGE_CONFIG.THUMBNAIL_SIZE.height, {
          fit: 'cover'
        })
        .jpeg({ quality: IMAGE_CONFIG.THUMBNAIL_QUALITY })
        .toBuffer()
      
      return {
        thumbnailBuffer,
        wasGenerated: true
      }
    } catch (error) {
      console.warn('Não foi possível gerar thumbnail:', error)
      
      return {
        thumbnailBuffer: null,
        wasGenerated: false
      }
    }
  }

  /**
   * Salva imagem no sistema de arquivos
   */
  static async saveImage(
    buffer: Buffer, 
    fileName: string, 
    options: {
      generateThumbnail?: boolean
      optimize?: boolean
    } = {}
  ): Promise<{
    imageUrl: string
    thumbnailUrl?: string
    metadata: any
    optimized: boolean
  }> {
    const { generateThumbnail = true, optimize = true } = options

    // Criar diretórios se necessário
    await this.ensureDirectoriesExist()

    let finalBuffer = buffer
    let metadata: any = {}
    let optimized = false

    // Otimizar se solicitado
    if (optimize) {
      const optimizationResult = await this.optimizeImage(buffer)
      finalBuffer = optimizationResult.optimizedBuffer
      metadata = optimizationResult.metadata
      optimized = optimizationResult.wasOptimized
    }

    // Salvar imagem principal
    const imagePath = path.join(this.uploadDir, fileName)
    await writeFile(imagePath, finalBuffer)

    const imageUrl = `/uploads/produtos/${fileName}`
    let thumbnailUrl: string | undefined

    // Gerar thumbnail se solicitado
    if (generateThumbnail) {
      const thumbnailResult = await this.generateThumbnail(buffer)
      
      if (thumbnailResult.thumbnailBuffer) {
        const thumbnailFileName = `thumb_${fileName}`
        const thumbnailPath = path.join(this.thumbnailDir, thumbnailFileName)
        
        await writeFile(thumbnailPath, thumbnailResult.thumbnailBuffer)
        thumbnailUrl = `/uploads/produtos/thumbnails/${thumbnailFileName}`
      }
    }

    return {
      imageUrl,
      thumbnailUrl,
      metadata,
      optimized
    }
  }

  /**
   * Remove imagem e thumbnail
   */
  static async deleteImage(fileName: string): Promise<{
    imageDeleted: boolean
    thumbnailDeleted: boolean
  }> {
    let imageDeleted = false
    let thumbnailDeleted = false

    try {
      // Remover imagem principal
      const imagePath = path.join(this.uploadDir, fileName)
      if (existsSync(imagePath)) {
        await unlink(imagePath)
        imageDeleted = true
      }

      // Remover thumbnail
      const thumbnailPath = path.join(this.thumbnailDir, `thumb_${fileName}`)
      if (existsSync(thumbnailPath)) {
        await unlink(thumbnailPath)
        thumbnailDeleted = true
      }
    } catch (error) {
      console.error('Erro ao remover imagem:', error)
    }

    return { imageDeleted, thumbnailDeleted }
  }

  /**
   * Verifica se uma imagem existe
   */
  static imageExists(fileName: string): boolean {
    const imagePath = path.join(this.uploadDir, fileName)
    return existsSync(imagePath)
  }

  /**
   * Obtém informações de uma imagem
   */
  static async getImageInfo(fileName: string): Promise<{
    exists: boolean
    size?: number
    metadata?: any
  }> {
    const imagePath = path.join(this.uploadDir, fileName)
    
    if (!existsSync(imagePath)) {
      return { exists: false }
    }

    try {
      const fs = await import('fs/promises')
      const stats = await fs.stat(imagePath)
      
      // Tentar obter metadados com Sharp
      let metadata: any = {}
      try {
        const sharp = await import('sharp')
        const buffer = await fs.readFile(imagePath)
        metadata = await sharp.default(buffer).metadata()
      } catch (error) {
        // Sharp não disponível
      }

      return {
        exists: true,
        size: stats.size,
        metadata
      }
    } catch (error) {
      console.error('Erro ao obter informações da imagem:', error)
      return { exists: false }
    }
  }

  /**
   * Lista todas as imagens
   */
  static async listImages(): Promise<string[]> {
    try {
      const fs = await import('fs/promises')
      
      if (!existsSync(this.uploadDir)) {
        return []
      }

      const files = await fs.readdir(this.uploadDir)
      return files.filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
      })
    } catch (error) {
      console.error('Erro ao listar imagens:', error)
      return []
    }
  }

  /**
   * Limpa imagens órfãs (não referenciadas por produtos)
   */
  static async cleanupOrphanedImages(referencedImages: string[]): Promise<{
    deletedCount: number
    deletedImages: string[]
  }> {
    try {
      const allImages = await this.listImages()
      const orphanedImages = allImages.filter(image => 
        !referencedImages.some(ref => ref.includes(image))
      )

      const deletedImages: string[] = []

      for (const image of orphanedImages) {
        const result = await this.deleteImage(image)
        if (result.imageDeleted) {
          deletedImages.push(image)
        }
      }

      return {
        deletedCount: deletedImages.length,
        deletedImages
      }
    } catch (error) {
      console.error('Erro na limpeza de imagens:', error)
      return { deletedCount: 0, deletedImages: [] }
    }
  }

  /**
   * Garante que os diretórios necessários existem
   */
  private static async ensureDirectoriesExist(): Promise<void> {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true })
    }
    
    if (!existsSync(this.thumbnailDir)) {
      await mkdir(this.thumbnailDir, { recursive: true })
    }
  }

  /**
   * Converte File para Buffer
   */
  static async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Processa upload completo de imagem
   */
  static async processImageUpload(
    file: File,
    productId?: string,
    options: {
      generateThumbnail?: boolean
      optimize?: boolean
    } = {}
  ): Promise<{
    success: boolean
    imageUrl?: string
    thumbnailUrl?: string
    fileName?: string
    metadata?: any
    error?: string
  }> {
    try {
      // Validar arquivo
      const validation = this.validateImageFile(file)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Gerar nome do arquivo
      const fileName = this.generateFileName(file.name, productId)

      // Converter para buffer
      const buffer = await this.fileToBuffer(file)

      // Salvar imagem
      const result = await this.saveImage(buffer, fileName, options)

      return {
        success: true,
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        fileName,
        metadata: result.metadata
      }
    } catch (error) {
      console.error('Erro no processamento de upload:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
}