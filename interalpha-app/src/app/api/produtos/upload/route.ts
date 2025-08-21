import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { imageSchema } from '@/lib/validations/product'
import { IMAGE_CONFIG } from '@/lib/constants/products'

/**
 * POST /api/produtos/upload - Upload de imagens para Client Components
 * Usado por: ImageUpload component
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

    const formData = await request.formData()
    const file = formData.get('image') as File
    const productId = formData.get('productId') as string
    const generateThumbnail = formData.get('generateThumbnail') === 'true'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar arquivo
    try {
      imageSchema.parse({ file })
    } catch (validationError: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Arquivo inválido',
          details: validationError.errors?.map((err: any) => err.message) || []
        },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = path.extname(file.name).toLowerCase()
    const fileName = `${timestamp}-${randomString}${extension}`
    
    // Definir diretórios
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'produtos')
    const thumbnailDir = path.join(uploadDir, 'thumbnails')
    
    // Criar diretórios se não existirem
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    if (generateThumbnail && !existsSync(thumbnailDir)) {
      await mkdir(thumbnailDir, { recursive: true })
    }

    // Converter arquivo para buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Processar imagem (otimização e redimensionamento)
    const processedImages = await processImage(buffer, fileName, {
      generateThumbnail,
      uploadDir,
      thumbnailDir
    })

    // URLs públicas
    const imageUrl = `/uploads/produtos/${fileName}`
    const thumbnailUrl = generateThumbnail 
      ? `/uploads/produtos/thumbnails/thumb_${fileName}`
      : null

    // Log da operação
    console.log(`Imagem enviada: ${fileName} por usuário ${userId}`)

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        thumbnailUrl,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        dimensions: processedImages.dimensions,
        optimized: processedImages.optimized
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro no upload de imagem:', error)
    
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
 * DELETE /api/produtos/upload - Remover imagem
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'Nome do arquivo é obrigatório' },
        { status: 400 }
      )
    }

    // Remover arquivos
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'produtos')
    const thumbnailDir = path.join(uploadDir, 'thumbnails')
    
    const filePath = path.join(uploadDir, fileName)
    const thumbnailPath = path.join(thumbnailDir, `thumb_${fileName}`)

    try {
      // Remover arquivo principal
      if (existsSync(filePath)) {
        await import('fs/promises').then(fs => fs.unlink(filePath))
      }
      
      // Remover thumbnail
      if (existsSync(thumbnailPath)) {
        await import('fs/promises').then(fs => fs.unlink(thumbnailPath))
      }

      console.log(`Imagem removida: ${fileName} por usuário ${userId}`)

      return NextResponse.json({
        success: true,
        message: 'Imagem removida com sucesso',
        fileName
      })

    } catch (fileError) {
      console.error('Erro ao remover arquivo:', fileError)
      return NextResponse.json(
        { success: false, error: 'Erro ao remover arquivo' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro na remoção de imagem:', error)
    
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
 * Processa imagem (otimização e redimensionamento)
 */
async function processImage(
  buffer: Buffer, 
  fileName: string, 
  options: {
    generateThumbnail: boolean
    uploadDir: string
    thumbnailDir: string
  }
) {
  const { generateThumbnail, uploadDir, thumbnailDir } = options
  
  try {
    // Tentar usar Sharp se disponível
    const sharp = await import('sharp').catch(() => null)
    
    if (sharp) {
      return await processWithSharp(buffer, fileName, options, sharp.default)
    } else {
      // Fallback: salvar arquivo original
      return await processWithoutSharp(buffer, fileName, options)
    }
  } catch (error) {
    console.error('Erro no processamento de imagem:', error)
    // Fallback: salvar arquivo original
    return await processWithoutSharp(buffer, fileName, options)
  }
}

/**
 * Processamento com Sharp (otimizado)
 */
async function processWithSharp(
  buffer: Buffer, 
  fileName: string, 
  options: any, 
  sharp: any
) {
  const { generateThumbnail, uploadDir, thumbnailDir } = options
  
  // Obter metadados da imagem
  const metadata = await sharp(buffer).metadata()
  
  // Otimizar imagem principal
  const optimizedBuffer = await sharp(buffer)
    .resize(IMAGE_CONFIG.DISPLAY_SIZE.width, IMAGE_CONFIG.DISPLAY_SIZE.height, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: IMAGE_CONFIG.QUALITY })
    .toBuffer()
  
  // Salvar imagem otimizada
  const filePath = path.join(uploadDir, fileName)
  await writeFile(filePath, optimizedBuffer)
  
  let thumbnailCreated = false
  
  // Gerar thumbnail se solicitado
  if (generateThumbnail) {
    try {
      const thumbnailBuffer = await sharp(buffer)
        .resize(IMAGE_CONFIG.THUMBNAIL_SIZE.width, IMAGE_CONFIG.THUMBNAIL_SIZE.height, {
          fit: 'cover'
        })
        .jpeg({ quality: IMAGE_CONFIG.THUMBNAIL_QUALITY })
        .toBuffer()
      
      const thumbnailPath = path.join(thumbnailDir, `thumb_${fileName}`)
      await writeFile(thumbnailPath, thumbnailBuffer)
      thumbnailCreated = true
    } catch (thumbnailError) {
      console.error('Erro ao gerar thumbnail:', thumbnailError)
    }
  }
  
  return {
    optimized: true,
    thumbnailCreated,
    dimensions: {
      width: metadata.width,
      height: metadata.height,
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length
    }
  }
}

/**
 * Processamento sem Sharp (fallback)
 */
async function processWithoutSharp(
  buffer: Buffer, 
  fileName: string, 
  options: any
) {
  const { uploadDir } = options
  
  // Salvar arquivo original
  const filePath = path.join(uploadDir, fileName)
  await writeFile(filePath, buffer)
  
  return {
    optimized: false,
    thumbnailCreated: false,
    dimensions: {
      width: null,
      height: null,
      originalSize: buffer.length,
      optimizedSize: buffer.length
    }
  }
}