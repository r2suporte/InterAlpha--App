'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface ReportFilters {
  dateFrom?: string
  dateTo?: string
  categoryId?: string
  isActive?: boolean
  minPrice?: number
  maxPrice?: number
  minMargin?: number
  reportType?: 'summary' | 'detailed' | 'performance' | 'inventory'
}

interface CustomReportConfig {
  filters: ReportFilters
  columns: string[]
  groupBy: string[]
  orderBy: string[]
  format: 'json' | 'csv'
  includeCharts: boolean
}

interface ReportData {
  overview?: {
    totalProducts: number
    activeProducts: number
    inactiveProducts: number
    totalValue: string
    totalCost: string
    averageMargin: string
  }
  distributions?: {
    priceRanges: Record<string, number>
    marginRanges: Record<string, number>
  }
  topProducts?: {
    highestValue: Array<{
      partNumber: string
      description: string
      salePrice: string
    }>
    highestMargin: Array<{
      partNumber: string
      description: string
      margin: string
    }>
  }
  products?: any[]
  summary?: any
  [key: string]: any
}

export function useProductReports() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportProgress, setReportProgress] = useState(0)
  const [lastReport, setLastReport] = useState<{
    type: string
    data: ReportData
    generatedAt: string
    filters: ReportFilters
  } | null>(null)

  const generateReport = useCallback(async (
    reportType: 'summary' | 'detailed' | 'performance' | 'inventory',
    filters: ReportFilters = {}
  ) => {
    setIsGenerating(true)
    setReportProgress(0)

    try {
      // Simular progresso
      setReportProgress(25)

      const searchParams = new URLSearchParams()
      searchParams.append('reportType', reportType)
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })

      setReportProgress(50)

      const response = await fetch(`/api/produtos/relatorios?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar relatório')
      }

      setReportProgress(75)

      const reportData = {
        type: reportType,
        data: result.data,
        generatedAt: result.generatedAt,
        filters: result.filters
      }

      setLastReport(reportData)
      setReportProgress(100)

      toast.success(`Relatório ${reportType} gerado com sucesso!`)

      return {
        success: true,
        data: reportData
      }

    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar relatório')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsGenerating(false)
      setReportProgress(0)
    }
  }, [])

  const generateCustomReport = useCallback(async (config: CustomReportConfig) => {
    setIsGenerating(true)
    setReportProgress(0)

    try {
      setReportProgress(25)

      const response = await fetch('/api/produtos/relatorios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      setReportProgress(50)

      if (config.format === 'csv') {
        // Para CSV, fazer download direto
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao gerar relatório CSV')
        }

        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        
        const contentDisposition = response.headers.get('content-disposition')
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `relatorio_personalizado_${new Date().toISOString().split('T')[0]}.csv`

        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100)

        setReportProgress(100)
        toast.success('Relatório CSV baixado com sucesso!')

        return {
          success: true,
          downloadUrl: filename
        }
      } else {
        // Para JSON, retornar dados
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao gerar relatório')
        }

        setReportProgress(75)

        const reportData = {
          type: 'custom',
          data: result.data,
          generatedAt: new Date().toISOString(),
          filters: config.filters,
          configuration: config
        }

        setLastReport(reportData)
        setReportProgress(100)

        toast.success('Relatório personalizado gerado!')

        return {
          success: true,
          data: reportData
        }
      }

    } catch (error) {
      console.error('Erro ao gerar relatório personalizado:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar relatório')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsGenerating(false)
      setReportProgress(0)
    }
  }, [])

  const exportReport = useCallback(async (reportData: any, format: 'csv' | 'pdf' | 'excel') => {
    try {
      if (format === 'csv') {
        // Gerar CSV dos dados do relatório
        const csvContent = generateCSVFromReportData(reportData)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        
        link.setAttribute('href', url)
        link.setAttribute('download', `relatorio_${reportData.type}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('Relatório exportado em CSV!')
        return { success: true }
      }

      if (format === 'pdf') {
        // TODO: Implementar exportação PDF
        toast.info('Exportação PDF em desenvolvimento')
        return { success: false, error: 'PDF não implementado ainda' }
      }

      if (format === 'excel') {
        // TODO: Implementar exportação Excel
        toast.info('Exportação Excel em desenvolvimento')
        return { success: false, error: 'Excel não implementado ainda' }
      }

    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
      toast.error('Erro ao exportar relatório')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  const scheduleReport = useCallback(async (config: {
    reportType: string
    filters: ReportFilters
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly'
      time: string
      recipients: string[]
    }
  }) => {
    try {
      // TODO: Implementar agendamento de relatórios
      toast.info('Agendamento de relatórios em desenvolvimento')
      return { success: false, error: 'Agendamento não implementado ainda' }

    } catch (error) {
      console.error('Erro ao agendar relatório:', error)
      toast.error('Erro ao agendar relatório')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  const clearLastReport = useCallback(() => {
    setLastReport(null)
  }, [])

  return {
    // State
    isGenerating,
    reportProgress,
    lastReport,
    
    // Actions
    generateReport,
    generateCustomReport,
    exportReport,
    scheduleReport,
    clearLastReport
  }
}

/**
 * Gera CSV a partir dos dados do relatório
 */
function generateCSVFromReportData(reportData: any): string {
  try {
    if (reportData.data.products && Array.isArray(reportData.data.products)) {
      // Relatório detalhado com produtos
      const headers = [
        'Part Number',
        'Descrição',
        'Preço de Custo',
        'Preço de Venda',
        'Margem (%)',
        'Status',
        'Categoria de Preço',
        'Categoria de Margem'
      ]
      
      let csv = headers.join(',') + '\n'
      
      reportData.data.products.forEach((product: any) => {
        const row = [
          `"${product.partNumber || ''}"`,
          `"${(product.description || '').replace(/"/g, '""')}"`,
          `"${product.costPrice || 0}"`,
          `"${product.salePrice || 0}"`,
          `"${product.margin || 0}"`,
          `"${product.isActive ? 'Ativo' : 'Inativo'}"`,
          `"${product.priceCategory || ''}"`,
          `"${product.marginCategory || ''}"`
        ]
        csv += row.join(',') + '\n'
      })
      
      return csv
    }
    
    // Relatório resumo
    if (reportData.data.overview) {
      let csv = 'Métrica,Valor\n'
      csv += `"Total de Produtos","${reportData.data.overview.totalProducts}"\n`
      csv += `"Produtos Ativos","${reportData.data.overview.activeProducts}"\n`
      csv += `"Produtos Inativos","${reportData.data.overview.inactiveProducts}"\n`
      csv += `"Valor Total","${reportData.data.overview.totalValue}"\n`
      csv += `"Custo Total","${reportData.data.overview.totalCost}"\n`
      csv += `"Margem Média","${reportData.data.overview.averageMargin}"\n`
      
      return csv
    }
    
    return 'Dados,Valor\n"Nenhum dado disponível",""\n'
    
  } catch (error) {
    console.error('Erro ao gerar CSV:', error)
    return 'Erro,Mensagem\n"Erro ao gerar CSV","Dados inválidos"\n'
  }
}