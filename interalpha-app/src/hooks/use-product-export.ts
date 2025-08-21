'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface ExportOptions {
  format?: 'csv' | 'json'
  filters?: {
    search?: string
    isActive?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  columns?: string[]
}

interface ExportResult {
  success: boolean
  data?: any
  error?: string
  downloadUrl?: string
}

export function useProductExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const exportProducts = async (options: ExportOptions = {}): Promise<ExportResult> => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      const { format = 'csv', filters = {}, columns = [] } = options

      // Simular progresso
      setExportProgress(25)

      let url = `/api/produtos/export?format=${format}`
      
      // Adicionar filtros à URL se for GET
      if (Object.keys(filters).length > 0) {
        const searchParams = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value))
          }
        })
        url += `&${searchParams.toString()}`
      }

      setExportProgress(50)

      const response = await fetch(url, {
        method: columns.length > 0 ? 'POST' : 'GET',
        headers: columns.length > 0 ? {
          'Content-Type': 'application/json'
        } : undefined,
        body: columns.length > 0 ? JSON.stringify({
          filters,
          format,
          columns
        }) : undefined
      })

      setExportProgress(75)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na exportação')
      }

      setExportProgress(90)

      if (format === 'csv') {
        // Para CSV, criar download direto
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        
        // Extrair nome do arquivo do header
        const contentDisposition = response.headers.get('content-disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `produtos_${new Date().toISOString().split('T')[0]}.csv`

        // Criar link de download
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Limpar URL
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100)

        setExportProgress(100)
        toast.success('Exportação concluída com sucesso!')

        return {
          success: true,
          downloadUrl: filename
        }
      } else {
        // Para JSON, retornar dados
        const data = await response.json()
        setExportProgress(100)
        
        toast.success(`${data.data?.length || 0} produtos exportados com sucesso!`)

        return {
          success: true,
          data: data.data
        }
      }

    } catch (error) {
      console.error('Erro na exportação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro na exportação')
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const downloadTemplate = async (format: 'csv' | 'json' = 'csv', withExamples = true) => {
    try {
      const response = await fetch(`/api/produtos/import/template?format=${format}&examples=${withExamples}`)
      
      if (!response.ok) {
        throw new Error('Erro ao baixar template')
      }

      if (format === 'csv') {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `template_importacao_produtos.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100)
        toast.success('Template baixado com sucesso!')
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data.template, null, 2)], { 
          type: 'application/json' 
        })
        const downloadUrl = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `template_importacao_produtos.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100)
        toast.success('Template JSON baixado com sucesso!')
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao baixar template:', error)
      toast.error('Erro ao baixar template')
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }

  return {
    exportProducts,
    downloadTemplate,
    isExporting,
    exportProgress
  }
}