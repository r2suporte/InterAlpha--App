import { z } from 'zod'
import { PRODUCT_LIMITS, ALLOWED_IMAGE_TYPES } from '@/types/product'

// Schema principal para validação de produto
export const productSchema = z.object({
  partNumber: z.string()
    .min(1, 'Part number é obrigatório')
    .max(PRODUCT_LIMITS.PART_NUMBER_MAX_LENGTH, `Part number deve ter no máximo ${PRODUCT_LIMITS.PART_NUMBER_MAX_LENGTH} caracteres`)
    .regex(/^[A-Za-z0-9-]+$/, 'Part number deve conter apenas letras, números e hífens')
    .transform(val => val.toUpperCase().trim()),
  
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(PRODUCT_LIMITS.DESCRIPTION_MAX_LENGTH, `Descrição deve ter no máximo ${PRODUCT_LIMITS.DESCRIPTION_MAX_LENGTH} caracteres`)
    .transform(val => val.trim()),
  
  costPrice: z.number()
    .positive('Preço de custo deve ser positivo')
    .max(PRODUCT_LIMITS.MAX_PRICE, `Preço de custo deve ser no máximo R$ ${PRODUCT_LIMITS.MAX_PRICE.toLocaleString('pt-BR')}`)
    .transform(val => Math.round(val * 100) / 100), // Arredondar para 2 casas decimais
  
  salePrice: z.number()
    .positive('Preço de venda deve ser positivo')
    .max(PRODUCT_LIMITS.MAX_PRICE, `Preço de venda deve ser no máximo R$ ${PRODUCT_LIMITS.MAX_PRICE.toLocaleString('pt-BR')}`)
    .transform(val => Math.round(val * 100) / 100), // Arredondar para 2 casas decimais
})

// Schema para validação de imagem
export const imageSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= PRODUCT_LIMITS.IMAGE_MAX_SIZE, 
            `Arquivo deve ter no máximo ${PRODUCT_LIMITS.IMAGE_MAX_SIZE / (1024 * 1024)}MB`)
    .refine(file => ALLOWED_IMAGE_TYPES.includes(file.type as any), 
            'Formato deve ser JPG, PNG ou WebP')
})

// Schema para filtros de busca
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['partNumber', 'description', 'costPrice', 'salePrice', 'profitMargin', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
})

// Schema para FormData (usado em Server Actions)
export const productFormDataSchema = z.object({
  partNumber: z.string().min(1, 'Part number é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  costPrice: z.string().transform(val => {
    const num = parseFloat(val.replace(',', '.'))
    if (isNaN(num)) throw new Error('Preço de custo inválido')
    return num
  }),
  salePrice: z.string().transform(val => {
    const num = parseFloat(val.replace(',', '.'))
    if (isNaN(num)) throw new Error('Preço de venda inválido')
    return num
  })
}).transform(data => ({
  ...data,
  partNumber: data.partNumber.toUpperCase().trim(),
  description: data.description.trim()
}))

// Validações customizadas
export function validatePartNumberUniqueness(partNumber: string, excludeId?: string) {
  // Esta função será implementada no service para verificar unicidade
  return {
    isValid: true,
    message: ''
  }
}

export function validatePriceMargin(costPrice: number, salePrice: number) {
  const margin = ((salePrice - costPrice) / costPrice) * 100
  
  if (margin < 0) {
    return {
      isValid: false,
      message: 'Preço de venda não pode ser menor que o preço de custo',
      margin
    }
  }
  
  if (margin === 0) {
    return {
      isValid: true,
      message: 'Margem de lucro é zero - produto será vendido pelo preço de custo',
      margin
    }
  }
  
  return {
    isValid: true,
    message: `Margem de lucro: ${margin.toFixed(2)}%`,
    margin
  }
}

// Função para sanitizar entrada de texto
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres potencialmente perigosos
    .substring(0, 1000) // Limita tamanho
}

// Validação de part number em tempo real
export function validatePartNumberFormat(partNumber: string): {
  isValid: boolean
  message: string
} {
  if (!partNumber) {
    return { isValid: false, message: 'Part number é obrigatório' }
  }
  
  if (partNumber.length > PRODUCT_LIMITS.PART_NUMBER_MAX_LENGTH) {
    return { 
      isValid: false, 
      message: `Part number deve ter no máximo ${PRODUCT_LIMITS.PART_NUMBER_MAX_LENGTH} caracteres` 
    }
  }
  
  if (!/^[A-Za-z0-9-]+$/.test(partNumber)) {
    return { 
      isValid: false, 
      message: 'Part number deve conter apenas letras, números e hífens' 
    }
  }
  
  return { isValid: true, message: 'Part number válido' }
}

// Tipos derivados dos schemas
export type ProductFormInput = z.infer<typeof productSchema>
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>
export type ProductFormDataInput = z.infer<typeof productFormDataSchema>
export type ImageInput = z.infer<typeof imageSchema>