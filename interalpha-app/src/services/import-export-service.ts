/**
 * Serviço para importação e exportação de produtos
 */

import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export interface ImportResult {
  success: boolean
  totalRows: number
  successCount: number
  errorCount: number
  errors: Array<{
    row: number
    field: string
    message: string
    data: any
  }>
  createdProducts: string[]
  updatedProducts: string[]
}

export interface ExportOptions {
  format: 'csv' | 'xlsx'
  includeStock: boolean
  includeCategories: boolean
  includeInactive: boolean
  categoryId?: string
  fields?: string[]
}

export interface ImportOptions {
  updateExisting: boolean
  createCategories: boolean
  defaultCategoryId?: string
  userId: string
}

export class ImportExportService {
  /**
   * Template para importação
   */
  getImportTemplate(): any[] {
    return [
      {
        partNumber: 'PROD001',
        description: 'Produto de exemplo',
        costPrice: 50.00,
        salePrice: 75.00,
        category: 'Eletrônicos',
        quantity: 100,
        minStock: 10,
        maxStock: 500,
        stockUnit: 'UN'
      },
      {
        partNumber: 'PROD002',
        description: 'Outro produto exemplo',
        costPrice: 25.00,
        salePrice: 40.00,
        category: 'Acessórios',
        quantity: 50,
        minStock: 5,
        maxStock: 200,
        stockUnit: 'UN'
      }
    ]
  }

  /**
   * Validar dados de importação
   */
  private validateImportData(data: any, row: number): string[] {
    const errors: string[] = []

    // Campos obrigatórios
    if (!data.partNumber || data.partNumber.trim() === '') {
      errors.push(`Linha ${row}: Part Number é obrigatório`)
    }

    if (!data.description || data.description.trim() === '') {
      errors.push(`Linha ${row}: Descrição é obrigatória`)
    }

    if (data.costPrice === undefined || data.costPrice === null || isNaN(data.costPrice)) {
      errors.push(`Linha ${row}: Preço de custo deve ser um número válido`)
    }

    if (data.salePrice === undefined || data.salePrice === null || isNaN(data.salePrice)) {
      errors.push(`Linha ${row}: Preço de venda deve ser um número válido`)
    }

    // Validações de negócio
    if (data.costPrice < 0) {
      errors.push(`Linha ${row}: Preço de custo não pode ser negativo`)
    }

    if (data.salePrice < 0) {
      errors.push(`Linha ${row}: Preço de venda não pode ser negativo`)
    }

    if (data.quantity !== undefined && (isNaN(data.quantity) || data.quantity < 0)) {
      errors.push(`Linha ${row}: Quantidade deve ser um número não negativo`)
    }

    if (data.minStock !== undefined && (isNaN(data.minStock) || data.minStock < 0)) {
      errors.push(`Linha ${row}: Estoque mínimo deve ser um número não negativo`)
    }

    if (data.maxStock !== undefined && data.maxStock !== null && (isNaN(data.maxStock) || data.maxStock < 0)) {
      errors.push(`Linha ${row}: Estoque máximo deve ser um número não negativo`)
    }

    return errors
  }

  /**
   * Importar produtos de arquivo
   */
  async importProducts(
    fileBuffer: Buffer,
    fileName: string,
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      createdProducts: [],
      updatedProducts: []
    }

    try {
      // Ler arquivo
      let data: any[]
      
      if (fileName.endsWith('.csv')) {
        // Processar CSV
        const csvText = fileBuffer.toString('utf-8')
        const lines = csvText.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        data = lines.slice(1)
          .filter(line => line.trim())
          .map((line, index) => {
            const values = line.split(',')
            const obj: any = {}
            headers.forEach((header, i) => {
              obj[header] = values[i]?.trim()
            })
            return obj
          })
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Processar Excel
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet)
      } else {
        throw new Error('Formato de arquivo não suportado. Use CSV ou Excel.')
      }

      result.totalRows = data.length

      // Processar cada linha
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNumber = i + 2 // +2 porque começamos do índice 0 e pulamos o header

        try {
          // Validar dados
          const validationErrors = this.validateImportData(row, rowNumber)
          if (validationErrors.length > 0) {
            validationErrors.forEach(error => {
              result.errors.push({
                row: rowNumber,
                field: 'validation',
                message: error,
                data: row
              })
            })
            result.errorCount++
            continue
          }

          // Preparar dados do produto
          const productData: any = {
            partNumber: row.partNumber.trim(),
            description: row.description.trim(),
            costPrice: parseFloat(row.costPrice),
            salePrice: parseFloat(row.salePrice),
            quantity: row.quantity ? parseInt(row.quantity) : 0,
            minStock: row.minStock ? parseInt(row.minStock) : 0,
            maxStock: row.maxStock ? parseInt(row.maxStock) : null,
            stockUnit: row.stockUnit || 'UN',
            createdBy: options.userId
          }

          // Processar categoria
          if (row.category && row.category.trim()) {
            let category = await prisma.productCategory.findFirst({
              where: { name: row.category.trim() }
            })

            if (!category && options.createCategories) {
              category = await prisma.productCategory.create({
                data: {
                  name: row.category.trim(),
                  description: `Categoria criada automaticamente durante importação`
                }
              })
            }

            if (category) {
              productData.categoryId = category.id
            } else if (options.defaultCategoryId) {
              productData.categoryId = options.defaultCategoryId
            }
          } else if (options.defaultCategoryId) {
            productData.categoryId = options.defaultCategoryId
          }

          // Verificar se produto já existe
          const existingProduct = await prisma.product.findUnique({
            where: { partNumber: productData.partNumber }
          })

          if (existingProduct) {
            if (options.updateExisting) {
              // Atualizar produto existente
              await prisma.product.update({
                where: { id: existingProduct.id },
                data: {
                  ...productData,
                  createdBy: undefined // Não alterar o criador original
                }
              })
              result.updatedProducts.push(existingProduct.id)
            } else {
              result.errors.push({
                row: rowNumber,
                field: 'partNumber',
                message: `Produto com Part Number ${productData.partNumber} já existe`,
                data: row
              })
              result.errorCount++
              continue
            }
          } else {
            // Criar novo produto
            const newProduct = await prisma.product.create({
              data: productData
            })
            result.createdProducts.push(newProduct.id)
          }

          result.successCount++

        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            field: 'general',
            message: error.message || 'Erro desconhecido',
            data: row
          })
          result.errorCount++
        }
      }

      result.success = result.errorCount === 0 || result.successCount > 0

    } catch (error: any) {
      result.errors.push({
        row: 0,
        field: 'file',
        message: error.message || 'Erro ao processar arquivo',
        data: null
      })
      result.errorCount++
    }

    return result
  }

  /**
   * Exportar produtos
   */
  async exportProducts(options: ExportOptions): Promise<Buffer> {
    // Construir query
    const where: any = {}
    
    if (!options.includeInactive) {
      where.isActive = true
    }

    if (options.categoryId) {
      where.categoryId = options.categoryId
    }

    // Buscar produtos
    const products = await prisma.product.findMany({
      where,
      include: {
        category: options.includeCategories ? {
          select: {
            name: true
          }
        } : false
      },
      orderBy: { partNumber: 'asc' }
    })

    // Preparar dados para exportação
    const exportData = products.map(product => {
      const data: any = {
        partNumber: product.partNumber,
        description: product.description,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        isActive: product.isActive,
        createdAt: product.createdAt.toISOString()
      }

      if (options.includeStock) {
        data.quantity = product.quantity
        data.minStock = product.minStock
        data.maxStock = product.maxStock
        data.stockUnit = product.stockUnit
      }

      if (options.includeCategories && product.category) {
        data.category = product.category.name
      }

      // Filtrar campos se especificado
      if (options.fields && options.fields.length > 0) {
        const filteredData: any = {}
        options.fields.forEach(field => {
          if (data.hasOwnProperty(field)) {
            filteredData[field] = data[field]
          }
        })
        return filteredData
      }

      return data
    })

    // Gerar arquivo
    if (options.format === 'csv') {
      return this.generateCSV(exportData)
    } else {
      return this.generateExcel(exportData)
    }
  }

  /**
   * Gerar arquivo CSV
   */
  private generateCSV(data: any[]): Buffer {
    if (data.length === 0) {
      return Buffer.from('Nenhum dado para exportar')
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escapar valores que contêm vírgula ou aspas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    return Buffer.from(csvContent, 'utf-8')
  }

  /**
   * Gerar arquivo Excel
   */
  private generateExcel(data: any[]): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos')

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
  }

  /**
   * Validar arquivo de importação
   */
  async validateImportFile(fileBuffer: Buffer, fileName: string): Promise<{
    valid: boolean
    errors: string[]
    preview: any[]
    totalRows: number
  }> {
    const result = {
      valid: true,
      errors: [] as string[],
      preview: [] as any[],
      totalRows: 0
    }

    try {
      let data: any[]

      if (fileName.endsWith('.csv')) {
        const csvText = fileBuffer.toString('utf-8')
        const lines = csvText.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',')
            const obj: any = {}
            headers.forEach((header, i) => {
              obj[header] = values[i]?.trim()
            })
            return obj
          })
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet)
      } else {
        result.valid = false
        result.errors.push('Formato de arquivo não suportado. Use CSV ou Excel.')
        return result
      }

      result.totalRows = data.length
      result.preview = data.slice(0, 5) // Primeiras 5 linhas para preview

      // Validar estrutura básica
      if (data.length === 0) {
        result.valid = false
        result.errors.push('Arquivo está vazio')
        return result
      }

      const requiredFields = ['partNumber', 'description', 'costPrice', 'salePrice']
      const firstRow = data[0]
      const missingFields = requiredFields.filter(field => !firstRow.hasOwnProperty(field))

      if (missingFields.length > 0) {
        result.valid = false
        result.errors.push(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`)
      }

      // Validar algumas linhas para detectar problemas comuns
      const sampleSize = Math.min(10, data.length)
      for (let i = 0; i < sampleSize; i++) {
        const validationErrors = this.validateImportData(data[i], i + 2)
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors.slice(0, 3)) // Máximo 3 erros por linha
        }
      }

      if (result.errors.length > 10) {
        result.errors = result.errors.slice(0, 10)
        result.errors.push('... e mais erros. Corrija os problemas acima primeiro.')
      }

    } catch (error: any) {
      result.valid = false
      result.errors.push(`Erro ao processar arquivo: ${error.message}`)
    }

    return result
  }
}