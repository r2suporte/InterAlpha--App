/**
 * Utilitários de validação de imagem para o lado do cliente
 */

'use client'

import { PRODUCT_CONSTANTS } from '@/types/product'

export interface ImageValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validar arquivo de imagem no lado do cliente
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Verificar tamanho
  if (file.size > PRODUCT_CONSTANTS.MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo ${PRODUCT_CONSTANTS.MAX_IMAGE_SIZE / (1024 * 1024)}MB`
    }
  }

  // Verificar tipo
  if (!PRODUCT_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato inválido. Use JPG, PNG ou WebP'
    }
  }

  return { valid: true }
}

/**
 * Gerar preview de imagem
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Erro ao gerar preview'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Redimensionar imagem no canvas (lado do cliente)
 */
export function resizeImageOnCanvas(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    if (!ctx) {
      reject(new Error('Canvas não suportado'))
      return
    }
    
    img.onload = () => {
      // Calcular dimensões mantendo proporção
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      // Configurar canvas
      canvas.width = width
      canvas.height = height
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height)
      
      // Converter para blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Erro ao processar imagem'))
          }
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Converter File para base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string)
      } else {
        reject(new Error('Erro ao converter arquivo'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Obter dimensões da imagem
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
    
    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Verificar se o arquivo é uma imagem válida
 */
export function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/') && 
         PRODUCT_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.type)
}

/**
 * Formatar tamanho do arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}