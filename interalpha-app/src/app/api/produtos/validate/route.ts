import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'
import { validatePartNumberFormat } from '@/lib/utils/product-utils'

/**
 * POST /api/produtos/validate - Validação em tempo real para Client Components
 * Usado por: ProductForm, PriceCalculator, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const body = await request.json()
    const { field, value, excludeId, additionalData } = body

    let validationResult = { isValid: true, message: '', suggestions: [] }

    switch (field) {
      case 'partNumber':
        validationResult = await validatePartNumber(value, excludeId)
        break
        
      case 'prices':
        validationResult = validatePrices(additionalData.costPrice, additionalData.salePrice)
        break
        
      case 'description':
        validationResult = validateDescription(value)
        break
        
      default:
        validationResult = {
          isValid: false,
          message: 'Campo de validação não reconhecido',
          suggestions: []
        }
    }

    return NextResponse.json({
      success: true,
      field,
      value,
      validation: validationResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na validação:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        validation: {
          isValid: false,
          message: 'Erro ao validar campo',
          suggestions: []
        }
      },
      { status: 500 }
    )
  }
}

/**
 * Valida part number
 */
async function validatePartNumber(partNumber: string, excludeId?: string) {
  if (!partNumber || partNumber.trim().length === 0) {
    return {
      isValid: false,
      message: 'Part number é obrigatório',
      suggestions: []
    }
  }

  const normalizedPartNumber = partNumber.toUpperCase().trim()
  
  // Validar formato
  const formatValidation = validatePartNumberFormat(normalizedPartNumber)
  if (!formatValidation.isValid) {
    return {
      isValid: false,
      message: formatValidation.message,
      suggestions: [
        'Use apenas letras, números e hífens',
        'Exemplo: PROD-001, ABC123, ITEM-A1'
      ]
    }
  }

  // Verificar disponibilidade
  try {
    const isAvailable = await ProductService.isPartNumberAvailable(normalizedPartNumber, excludeId)
    
    if (!isAvailable) {
      // Gerar sugestões de part numbers alternativos
      const suggestions = await generatePartNumberSuggestions(normalizedPartNumber)
      
      return {
        isValid: false,
        message: 'Este part number já existe',
        suggestions
      }
    }

    return {
      isValid: true,
      message: 'Part number disponível',
      suggestions: []
    }
  } catch (error) {
    return {
      isValid: false,
      message: 'Erro ao verificar disponibilidade',
      suggestions: []
    }
  }
}

/**
 * Valida preços e calcula margem
 */
function validatePrices(costPrice: number, salePrice: number) {
  const errors = []
  const warnings = []
  
  if (!costPrice || costPrice <= 0) {
    errors.push('Preço de custo deve ser maior que zero')
  }
  
  if (!salePrice || salePrice <= 0) {
    errors.push('Preço de venda deve ser maior que zero')
  }
  
  if (costPrice > 0 && salePrice > 0) {
    const margin = ((salePrice - costPrice) / costPrice) * 100
    
    if (salePrice < costPrice) {
      errors.push('Preço de venda não pode ser menor que o preço de custo')
    } else if (margin === 0) {
      warnings.push('Margem de lucro é zero - produto será vendido pelo preço de custo')
    } else if (margin < 10) {
      warnings.push(`Margem baixa: ${margin.toFixed(1)}% - considere aumentar o preço de venda`)
    }
  }
  
  const isValid = errors.length === 0
  const message = errors.length > 0 
    ? errors.join('; ') 
    : warnings.length > 0 
      ? warnings.join('; ')
      : 'Preços válidos'
  
  return {
    isValid,
    message,
    suggestions: isValid && warnings.length === 0 ? [] : [
      'Margem recomendada: 20-50%',
      'Considere custos adicionais (impostos, frete, etc.)'
    ]
  }
}

/**
 * Valida descrição
 */
function validateDescription(description: string) {
  if (!description || description.trim().length === 0) {
    return {
      isValid: false,
      message: 'Descrição é obrigatória',
      suggestions: ['Descreva o produto de forma clara e objetiva']
    }
  }
  
  if (description.length < 10) {
    return {
      isValid: false,
      message: 'Descrição muito curta',
      suggestions: ['Use pelo menos 10 caracteres para uma boa descrição']
    }
  }
  
  if (description.length > 500) {
    return {
      isValid: false,
      message: 'Descrição muito longa (máximo 500 caracteres)',
      suggestions: ['Seja mais conciso na descrição']
    }
  }
  
  return {
    isValid: true,
    message: 'Descrição válida',
    suggestions: []
  }
}

/**
 * Gera sugestões de part numbers alternativos
 */
async function generatePartNumberSuggestions(basePartNumber: string): Promise<string[]> {
  const suggestions = []
  
  // Tentar com sufixos numéricos
  for (let i = 1; i <= 5; i++) {
    const suggestion = `${basePartNumber}-${i.toString().padStart(2, '0')}`
    try {
      const isAvailable = await ProductService.isPartNumberAvailable(suggestion)
      if (isAvailable) {
        suggestions.push(suggestion)
      }
    } catch (error) {
      // Ignorar erros na geração de sugestões
    }
  }
  
  // Tentar com sufixos alfabéticos
  const suffixes = ['A', 'B', 'V2', 'NEW', 'ALT']
  for (const suffix of suffixes) {
    const suggestion = `${basePartNumber}-${suffix}`
    try {
      const isAvailable = await ProductService.isPartNumberAvailable(suggestion)
      if (isAvailable) {
        suggestions.push(suggestion)
      }
    } catch (error) {
      // Ignorar erros na geração de sugestões
    }
  }
  
  return suggestions.slice(0, 3) // Máximo 3 sugestões
}