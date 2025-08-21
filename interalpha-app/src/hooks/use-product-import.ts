'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface ImportOptions {
  skipDuplicates?: boolean
  updateExisting?: boolean
  validateOnly?: boolean
}

interface ImportResult {
  success: boolean
  data?: {
    summary: {
      total: number
      imported: number
      errors: number
      duplicates: number
      skipped: number
    }
    results: {
      success: any[]
      errors: any[]
      duplicates: any[]
      skipped: any[]
    }
  }
  error?: string
}

export function useProductImport() {
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const importFromFile = async (file: File, options: ImportOptions = {}): Promise<ImportResult> => {
    setIsImporting(true)
    setImportProgress(0)
    setImportResult(null)

    try {
      // Validar arquivo
      if (!file) {
        throw new Error('Nenhum arquivo selecionado')
      }

      if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
        throw new Error('Apenas arquivos CSV e JSON são suportados')
      }

      setImportProgress(10)

      // Preparar FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('skipDuplicates', String(options.skipDuplicates ?? true))
      formData.append('updateExisting', String(options.updateExisting ?? false))
      formData.append('validateOnly', String(options.validateOnly ?? false))

      setImportProgress(25)

      const response = await fetch('/api/produtos/import', {
        method: 'POST',
        body: formData
      })

      setImportProgress(75)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro na importação')
      }

      setImportProgress(100)

      const importResult: ImportResult = {
        success: true,
        data: result.data
      }

      setImportResult(importResult)

      // Mostrar toast baseado no resultado
      const { summary } = result.data
      if (summary.errors > 0) {
        toast.warning(`Importação concluída com ${summary.errors} erro(s). ${summary.imported} produtos importados.`)
      } else {
        toast.success(`${summary.imported} produtos importados com sucesso!`)
      }

      return importResult

    } catch (error) {
      console.error('Erro na importação:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      
      const importResult: ImportResult = {
        success: false,
        error: errorMessage
      }

      setImportResult(importResult)
      return importResult
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const importFromJSON = async (products: any[], options: ImportOptions = {}): Promise<ImportResult> => {
    setIsImporting(true)
    setImportProgress(0)
    setImportResult(null)

    try {
      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('Lista de produtos inválida ou vazia')
      }

      setImportProgress(25)

      const response = await fetch('/api/produtos/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          products,
          options
        })
      })

      setImportProgress(75)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro na importação')
      }

      setImportProgress(100)

      const importResult: ImportResult = {
        success: true,
        data: result.data
      }

      setImportResult(importResult)

      const { summary } = result.data
      if (summary.errors > 0) {
        toast.warning(`Importação concluída com ${summary.errors} erro(s). ${summary.imported} produtos importados.`)
      } else {
        toast.success(`${summary.imported} produtos importados com sucesso!`)
      }

      return importResult

    } catch (error) {
      console.error('Erro na importação JSON:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      
      const importResult: ImportResult = {
        success: false,
        error: errorMessage
      }

      setImportResult(importResult)
      return importResult
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const validateFile = async (file: File): Promise<{ valid: boolean, errors: string[] }> => {
    try {
      if (!file) {
        return { valid: false, errors: ['Nenhum arquivo selecionado'] }
      }

      const errors: string[] = []

      // Validar extensão
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
        errors.push('Apenas arquivos CSV e JSON são suportados')
      }

      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push('Arquivo muito grande (máximo 10MB)')
      }

      // Para CSV, validar estrutura básica
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const lines = text.trim().split('\n')
        
        if (lines.length < 2) {
          errors.push('Arquivo CSV deve ter pelo menos cabeçalho e uma linha de dados')
        }

        // Verificar se tem colunas obrigatórias
        const header = lines[0].toLowerCase()
        const requiredColumns = ['part number', 'partnumber', 'codigo', 'description', 'descricao']
        const hasRequiredColumn = requiredColumns.some(col => header.includes(col))
        
        if (!hasRequiredColumn) {
          errors.push('Arquivo deve conter pelo menos uma coluna de Part Number ou Descrição')
        }
      }

      // Para JSON, validar estrutura
      if (file.name.endsWith('.json')) {
        try {
          const text = await file.text()
          const data = JSON.parse(text)
          
          if (!data.products || !Array.isArray(data.products)) {
            errors.push('Arquivo JSON deve conter um array "products"')
          }
        } catch {
          errors.push('Arquivo JSON inválido')
        }
      }

      return {
        valid: errors.length === 0,
        errors
      }

    } catch (error) {
      return {
        valid: false,
        errors: ['Erro ao validar arquivo']
      }
    }
  }

  const clearResult = () => {
    setImportResult(null)
  }

  return {
    importFromFile,
    importFromJSON,
    validateFile,
    clearResult,
    isImporting,
    importProgress,
    importResult
  }
}