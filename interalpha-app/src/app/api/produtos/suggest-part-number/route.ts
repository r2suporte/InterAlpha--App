import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'

/**
 * GET /api/produtos/suggest-part-number - Sugerir próximo part number disponível
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const { searchParams } = new URL(request.url)
    const basePartNumber = searchParams.get('base') || ''
    const pattern = searchParams.get('pattern') || 'auto'
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)
    
    // Gerar sugestões baseadas no part number fornecido
    const suggestions = await generatePartNumberSuggestions(basePartNumber, pattern, limit)
    
    return NextResponse.json({
      success: true,
      data: {
        basePartNumber,
        pattern,
        suggestions,
        recommended: suggestions[0] || null
      },
      meta: {
        total: suggestions.length,
        pattern,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao gerar sugestões de part number:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/produtos/suggest-part-number - Sugerir baseado em critérios específicos
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      category = '',
      prefix = '',
      description = '',
      generatePattern = 'sequential',
      count = 5
    } = body
    
    // Gerar sugestões baseadas nos critérios
    const suggestions = await generateSmartSuggestions({
      category,
      prefix,
      description,
      generatePattern,
      count
    })
    
    return NextResponse.json({
      success: true,
      data: {
        criteria: { category, prefix, description, generatePattern },
        suggestions,
        recommended: suggestions[0] || null
      },
      message: `${suggestions.length} sugestões geradas`
    })

  } catch (error) {
    console.error('Erro ao gerar sugestões inteligentes:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

/**
 * Gera sugestões de part number baseadas em um número base
 */
async function generatePartNumberSuggestions(
  basePartNumber: string, 
  pattern: string, 
  limit: number
): Promise<Array<{
  partNumber: string
  available: boolean
  reason: string
  confidence: number
}>> {
  try {
    const suggestions = []
    
    if (!basePartNumber) {
      // Se não há base, gerar sugestões genéricas
      const genericSuggestions = await generateGenericSuggestions(limit)
      return genericSuggestions
    }
    
    // Limpar e normalizar o part number base
    const cleanBase = basePartNumber.toUpperCase().trim()
    
    // Estratégia 1: Incrementar número no final
    const numericSuggestions = await generateNumericIncrements(cleanBase, limit)
    suggestions.push(...numericSuggestions)
    
    // Estratégia 2: Adicionar sufixos
    if (suggestions.length < limit) {
      const suffixSuggestions = await generateSuffixVariations(cleanBase, limit - suggestions.length)
      suggestions.push(...suffixSuggestions)
    }
    
    // Estratégia 3: Variações de prefixo
    if (suggestions.length < limit) {
      const prefixSuggestions = await generatePrefixVariations(cleanBase, limit - suggestions.length)
      suggestions.push(...prefixSuggestions)
    }
    
    // Verificar disponibilidade de cada sugestão
    const checkedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => ({
        ...suggestion,
        available: await isPartNumberAvailable(suggestion.partNumber)
      }))
    )
    
    // Ordenar por disponibilidade e confiança
    return checkedSuggestions
      .sort((a, b) => {
        if (a.available !== b.available) {
          return a.available ? -1 : 1 // Disponíveis primeiro
        }
        return b.confidence - a.confidence // Maior confiança primeiro
      })
      .slice(0, limit)
    
  } catch (error) {
    console.error('Erro ao gerar sugestões:', error)
    return []
  }
}

/**
 * Gera incrementos numéricos baseados no part number
 */
async function generateNumericIncrements(basePartNumber: string, limit: number) {
  const suggestions = []
  
  // Extrair número do final do part number
  const match = basePartNumber.match(/^(.+?)(\d+)$/)
  
  if (match) {
    const [, prefix, numberStr] = match
    const baseNumber = parseInt(numberStr)
    const numberLength = numberStr.length
    
    // Gerar incrementos
    for (let i = 1; i <= limit * 2; i++) {
      const newNumber = baseNumber + i
      const paddedNumber = newNumber.toString().padStart(numberLength, '0')
      const newPartNumber = `${prefix}${paddedNumber}`
      
      suggestions.push({
        partNumber: newPartNumber,
        available: false, // Será verificado depois
        reason: `Incremento sequencial (+${i})`,
        confidence: Math.max(0.9 - (i * 0.1), 0.1)
      })
      
      if (suggestions.length >= limit) break
    }
  } else {
    // Se não há número no final, adicionar números
    for (let i = 1; i <= limit; i++) {
      const newPartNumber = `${basePartNumber}-${i.toString().padStart(3, '0')}`
      
      suggestions.push({
        partNumber: newPartNumber,
        available: false,
        reason: `Adição de numeração sequencial`,
        confidence: 0.8
      })
    }
  }
  
  return suggestions
}

/**
 * Gera variações com sufixos
 */
async function generateSuffixVariations(basePartNumber: string, limit: number) {
  const suffixes = ['A', 'B', 'V2', 'NEW', 'X', 'PRO', 'PLUS', 'EX']
  const suggestions = []
  
  for (let i = 0; i < Math.min(suffixes.length, limit); i++) {
    const suffix = suffixes[i]
    const newPartNumber = `${basePartNumber}-${suffix}`
    
    suggestions.push({
      partNumber: newPartNumber,
      available: false,
      reason: `Variação com sufixo "${suffix}"`,
      confidence: 0.7 - (i * 0.05)
    })
  }
  
  return suggestions
}

/**
 * Gera variações de prefixo
 */
async function generatePrefixVariations(basePartNumber: string, limit: number) {
  const prefixes = ['NEW-', 'V2-', 'UPD-', 'REV-']
  const suggestions = []
  
  for (let i = 0; i < Math.min(prefixes.length, limit); i++) {
    const prefix = prefixes[i]
    const newPartNumber = `${prefix}${basePartNumber}`
    
    suggestions.push({
      partNumber: newPartNumber,
      available: false,
      reason: `Variação com prefixo "${prefix}"`,
      confidence: 0.6 - (i * 0.05)
    })
  }
  
  return suggestions
}

/**
 * Gera sugestões genéricas quando não há base
 */
async function generateGenericSuggestions(limit: number) {
  const currentYear = new Date().getFullYear()
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
  const suggestions = []
  
  // Padrões comuns
  const patterns = [
    `PROD-${currentYear}-`,
    `ITEM-${currentMonth}-`,
    'PART-',
    'SKU-',
    'CODE-'
  ]
  
  for (let i = 0; i < limit; i++) {
    const pattern = patterns[i % patterns.length]
    const number = (i + 1).toString().padStart(3, '0')
    const partNumber = `${pattern}${number}`
    
    suggestions.push({
      partNumber,
      available: false,
      reason: 'Sugestão baseada em padrões comuns',
      confidence: 0.5
    })
  }
  
  return suggestions
}

/**
 * Gera sugestões inteligentes baseadas em critérios
 */
async function generateSmartSuggestions(criteria: {
  category: string
  prefix: string
  description: string
  generatePattern: string
  count: number
}) {
  const suggestions = []
  
  // Gerar baseado na categoria
  let basePrefix = criteria.prefix || ''
  
  if (criteria.category && !basePrefix) {
    const categoryPrefixes: Record<string, string> = {
      'eletronicos': 'ELE',
      'ferramentas': 'TOOL',
      'materiais': 'MAT',
      'componentes': 'COMP',
      'cabos': 'CABO',
      'conectores': 'CONN'
    }
    
    basePrefix = categoryPrefixes[criteria.category.toLowerCase()] || 'PROD'
  }
  
  if (!basePrefix) {
    basePrefix = 'PROD'
  }
  
  // Gerar baseado no padrão
  const currentYear = new Date().getFullYear().toString().slice(-2)
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
  
  for (let i = 1; i <= criteria.count; i++) {
    let partNumber = ''
    
    switch (criteria.generatePattern) {
      case 'sequential':
        partNumber = `${basePrefix}-${i.toString().padStart(3, '0')}`
        break
      case 'yearly':
        partNumber = `${basePrefix}-${currentYear}-${i.toString().padStart(3, '0')}`
        break
      case 'monthly':
        partNumber = `${basePrefix}-${currentYear}${currentMonth}-${i.toString().padStart(2, '0')}`
        break
      case 'descriptive':
        const descWords = criteria.description
          .toUpperCase()
          .replace(/[^A-Z0-9\s]/g, '')
          .split(' ')
          .filter(word => word.length > 2)
          .slice(0, 2)
          .map(word => word.slice(0, 3))
          .join('')
        partNumber = `${basePrefix}-${descWords}-${i.toString().padStart(2, '0')}`
        break
      default:
        partNumber = `${basePrefix}-${i.toString().padStart(3, '0')}`
    }
    
    suggestions.push({
      partNumber,
      available: await isPartNumberAvailable(partNumber),
      reason: `Gerado pelo padrão ${criteria.generatePattern}`,
      confidence: 0.8
    })
  }
  
  return suggestions.sort((a, b) => a.available ? -1 : 1)
}

/**
 * Verifica se um part number está disponível
 */
async function isPartNumberAvailable(partNumber: string): Promise<boolean> {
  try {
    const existingProduct = await ProductService.getProductByPartNumber(partNumber)
    return !existingProduct
  } catch (error) {
    // Em caso de erro, assumir que não está disponível por segurança
    return false
  }
}