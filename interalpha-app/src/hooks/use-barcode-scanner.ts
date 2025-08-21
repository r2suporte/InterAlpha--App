'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface Product {
  id: string
  partNumber: string
  description: string
  salePrice: number
  costPrice: number
  imageUrl?: string
  isActive: boolean
  barcode?: {
    partNumber: string
    searchMethod: string
    foundAt: string
  }
  pricing?: {
    unitPrice: number
    costPrice: number
    margin: number
    marginStatus: string
  }
}

interface ScanResult {
  success: boolean
  product?: Product
  error?: string
  partNumber?: string
}

export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])

  const scanProduct = async (partNumber: string): Promise<ScanResult> => {
    if (!partNumber || partNumber.trim() === '') {
      const result: ScanResult = {
        success: false,
        error: 'Part number é obrigatório',
        partNumber
      }
      setLastScanResult(result)
      return result
    }

    setIsScanning(true)

    try {
      // Limpar e formatar part number
      const cleanPartNumber = partNumber.trim().toUpperCase()

      const response = await fetch(`/api/produtos/barcode/${encodeURIComponent(cleanPartNumber)}`)
      const result = await response.json()

      if (!response.ok) {
        const scanResult: ScanResult = {
          success: false,
          error: result.error || 'Produto não encontrado',
          partNumber: cleanPartNumber
        }

        setLastScanResult(scanResult)
        setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]) // Manter últimos 10
        
        toast.error(`Produto ${cleanPartNumber} não encontrado`)
        return scanResult
      }

      const scanResult: ScanResult = {
        success: true,
        product: result.data,
        partNumber: cleanPartNumber
      }

      setLastScanResult(scanResult)
      setScanHistory(prev => [scanResult, ...prev.slice(0, 9)])
      
      toast.success(`Produto ${cleanPartNumber} encontrado!`)
      return scanResult

    } catch (error) {
      console.error('Erro ao escanear produto:', error)
      const scanResult: ScanResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar produto',
        partNumber
      }

      setLastScanResult(scanResult)
      setScanHistory(prev => [scanResult, ...prev.slice(0, 9)])
      
      toast.error('Erro ao escanear código de barras')
      return scanResult
    } finally {
      setIsScanning(false)
    }
  }

  const generateBarcode = async (partNumber: string, options: {
    format?: string
    width?: number
    height?: number
  } = {}) => {
    try {
      const { format = 'CODE128', width = 200, height = 100 } = options

      const response = await fetch(`/api/produtos/barcode/${encodeURIComponent(partNumber)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format,
          width,
          height
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar código de barras')
      }

      toast.success('Código de barras gerado com sucesso!')
      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('Erro ao gerar código de barras:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar código de barras')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // Simular scanner de câmera (para implementação futura)
  const startCameraScanner = useCallback(async () => {
    try {
      // TODO: Implementar scanner de câmera real
      // Por enquanto, simular com input manual
      toast.info('Scanner de câmera não implementado ainda. Use o campo de entrada manual.')
      return false
    } catch (error) {
      toast.error('Erro ao acessar câmera')
      return false
    }
  }, [])

  const clearHistory = () => {
    setScanHistory([])
    setLastScanResult(null)
  }

  const clearLastResult = () => {
    setLastScanResult(null)
  }

  // Função para detectar entrada de scanner físico
  const handleKeyboardInput = useCallback((event: KeyboardEvent) => {
    // Detectar padrão de scanner (entrada rápida seguida de Enter)
    // TODO: Implementar lógica de detecção de scanner físico
  }, [])

  return {
    scanProduct,
    generateBarcode,
    startCameraScanner,
    clearHistory,
    clearLastResult,
    handleKeyboardInput,
    isScanning,
    lastScanResult,
    scanHistory
  }
}