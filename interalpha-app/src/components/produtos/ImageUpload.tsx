'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IMAGE_CONFIG } from '@/lib/constants/products'
import Image from 'next/image'

interface ImageUploadProps {
  initialImageUrl?: string
  productId?: string
  onImageChange?: (imageUrl: string | null, fileName?: string) => void
  disabled?: boolean
  showPreview?: boolean
  generateThumbnail?: boolean
  maxSize?: number
  acceptedTypes?: string[]
}

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
  success: boolean
}

export default function ImageUpload({
  initialImageUrl,
  productId,
  onImageChange,
  disabled = false,
  showPreview = true,
  generateThumbnail = true,
  maxSize = IMAGE_CONFIG.MAX_SIZE,
  acceptedTypes = IMAGE_CONFIG.ALLOWED_TYPES
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null)
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    success: false
  })
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Verificar tipo
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado. Use: ${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`
    }

    // Verificar tamanho
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`
    }

    return null
  }

  const uploadFile = async (file: File) => {
    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
      success: false
    })

    try {
      const formData = new FormData()
      formData.append('image', file)
      if (productId) {
        formData.append('productId', productId)
      }
      formData.append('generateThumbnail', generateThumbnail.toString())

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }))
      }, 200)

      const response = await fetch('/api/produtos/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro no upload')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro no upload')
      }

      // Upload concluído
      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        success: true
      })

      setImageUrl(result.data.imageUrl)
      onImageChange?.(result.data.imageUrl, result.data.fileName)

      // Limpar sucesso após 3 segundos
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: false }))
      }, 3000)

    } catch (error) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      })
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: validationError,
        success: false
      })
      return
    }

    await uploadFile(file)
  }, [])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)

    if (disabled) return

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [disabled, handleFileSelect])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    if (!disabled) {
      setDragActive(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
  }, [])

  const removeImage = async () => {
    if (!imageUrl) return

    try {
      // Extrair nome do arquivo da URL
      const fileName = imageUrl.split('/').pop()
      if (fileName) {
        await fetch(`/api/produtos/upload?fileName=${fileName}`, {
          method: 'DELETE'
        })
      }

      setImageUrl(null)
      onImageChange?.(null)
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Erro ao remover imagem:', error)
    }
  }

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <Card className={`border-2 border-dashed transition-all duration-200 ${
        dragActive 
          ? 'border-blue-500 bg-blue-50/50' 
          : imageUrl 
            ? 'border-green-300 bg-green-50/30'
            : 'border-gray-300 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <CardContent 
          className="p-6"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            disabled={disabled}
            className="hidden"
          />

          {uploadState.uploading ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Enviando imagem...</p>
                <Progress value={uploadState.progress} className="w-full" />
                <p className="text-xs text-gray-500">{uploadState.progress}%</p>
              </div>
            </div>
          ) : imageUrl && showPreview ? (
            <div className="relative">
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={imageUrl}
                  alt="Preview da imagem"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage()
                }}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {uploadState.success ? (
                  <Check className="h-12 w-12 text-green-600" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {uploadState.success 
                    ? 'Imagem enviada com sucesso!' 
                    : 'Clique ou arraste uma imagem aqui'
                  }
                </p>
                <p className="text-xs text-gray-500">
                  {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} até {maxSize / (1024 * 1024)}MB
                </p>
              </div>

              {!disabled && (
                <Button type="button" variant="outline" size="sm">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensagens de Erro */}
      {uploadState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadState.error}</AlertDescription>
        </Alert>
      )}

      {/* Mensagem de Sucesso */}
      {uploadState.success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Imagem enviada com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {/* Informações da Imagem */}
      {imageUrl && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">Imagem carregada</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeImage}
            disabled={disabled}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Remover
          </Button>
        </div>
      )}
    </div>
  )
}