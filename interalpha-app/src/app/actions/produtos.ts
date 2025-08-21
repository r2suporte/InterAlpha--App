'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'
import { productFormDataSchema } from '@/lib/validations/product'
import { AUDIT_ACTIONS } from '@/lib/constants/products'

/**
 * Server Action para criar um novo produto
 */
export async function createProduct(formData: FormData) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    // Extrair e validar dados do formulário
    const rawData = {
      partNumber: formData.get('partNumber') as string,
      description: formData.get('description') as string,
      costPrice: formData.get('costPrice') as string,
      salePrice: formData.get('salePrice') as string
    }

    // Validar dados
    const validatedData = productFormDataSchema.parse(rawData)

    // Criar produto usando o serviço
    const product = await ProductService.createProduct(validatedData, userId)

    // Registrar auditoria
    await logAuditAction(userId, AUDIT_ACTIONS.PRODUCT_CREATED, product.id, null, product)

    // Revalidar cache das páginas relacionadas
    revalidatePath('/produtos')
    revalidatePath('/dashboard')

    // Redirecionar para a página de produtos com mensagem de sucesso
    redirect('/produtos?success=created')

  } catch (error) {
    console.error('Erro ao criar produto:', error)
    
    // Se for erro de validação, redirecionar com erro específico
    if (error instanceof Error) {
      const errorMessage = encodeURIComponent(error.message)
      redirect(`/produtos/novo?error=${errorMessage}`)
    }
    
    // Erro genérico
    redirect('/produtos/novo?error=Erro+interno+do+servidor')
  }
}

/**
 * Server Action para atualizar um produto existente
 */
export async function updateProduct(id: string, formData: FormData) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    // Buscar produto atual para auditoria
    const currentProduct = await ProductService.getProductById(id)
    if (!currentProduct) {
      throw new Error('Produto não encontrado')
    }

    // Extrair e validar dados do formulário
    const rawData = {
      partNumber: formData.get('partNumber') as string,
      description: formData.get('description') as string,
      costPrice: formData.get('costPrice') as string,
      salePrice: formData.get('salePrice') as string
    }

    // Validar dados
    const validatedData = productFormDataSchema.parse(rawData)

    // Atualizar produto usando o serviço
    const updatedProduct = await ProductService.updateProduct(id, validatedData)

    // Registrar auditoria
    await logAuditAction(userId, AUDIT_ACTIONS.PRODUCT_UPDATED, id, currentProduct, updatedProduct)

    // Revalidar cache das páginas relacionadas
    revalidatePath('/produtos')
    revalidatePath(`/produtos/${id}`)
    revalidatePath('/dashboard')

    // Redirecionar para a página de produtos com mensagem de sucesso
    redirect('/produtos?success=updated')

  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    
    // Se for erro de validação, redirecionar com erro específico
    if (error instanceof Error) {
      const errorMessage = encodeURIComponent(error.message)
      redirect(`/produtos/${id}/editar?error=${errorMessage}`)
    }
    
    // Erro genérico
    redirect(`/produtos/${id}/editar?error=Erro+interno+do+servidor`)
  }
}

/**
 * Server Action para excluir um produto
 */
export async function deleteProduct(id: string) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    // Buscar produto para auditoria
    const product = await ProductService.getProductById(id)
    if (!product) {
      throw new Error('Produto não encontrado')
    }

    // Excluir produto usando o serviço
    await ProductService.deleteProduct(id)

    // Registrar auditoria
    await logAuditAction(userId, AUDIT_ACTIONS.PRODUCT_DELETED, id, product, null)

    // Revalidar cache das páginas relacionadas
    revalidatePath('/produtos')
    revalidatePath('/dashboard')

    // Redirecionar para a página de produtos com mensagem de sucesso
    redirect('/produtos?success=deleted')

  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    
    // Se for erro de validação, redirecionar com erro específico
    if (error instanceof Error) {
      const errorMessage = encodeURIComponent(error.message)
      redirect(`/produtos?error=${errorMessage}`)
    }
    
    // Erro genérico
    redirect('/produtos?error=Erro+interno+do+servidor')
  }
}

/**
 * Server Action para alternar status ativo/inativo de um produto
 */
export async function toggleProductStatus(id: string) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    // Buscar produto atual
    const currentProduct = await ProductService.getProductById(id)
    if (!currentProduct) {
      throw new Error('Produto não encontrado')
    }

    // Alternar status
    const updatedProduct = await ProductService.updateProduct(id, {
      isActive: !currentProduct.isActive
    } as any)

    // Registrar auditoria
    await logAuditAction(
      userId, 
      AUDIT_ACTIONS.PRODUCT_UPDATED, 
      id, 
      { isActive: currentProduct.isActive }, 
      { isActive: updatedProduct.isActive }
    )

    // Revalidar cache
    revalidatePath('/produtos')
    revalidatePath(`/produtos/${id}`)

    return { success: true, isActive: updatedProduct.isActive }

  } catch (error) {
    console.error('Erro ao alterar status do produto:', error)
    throw new Error('Erro ao alterar status do produto')
  }
}

/**
 * Server Action para duplicar um produto
 */
export async function duplicateProduct(id: string) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    // Buscar produto original
    const originalProduct = await ProductService.getProductById(id)
    if (!originalProduct) {
      throw new Error('Produto não encontrado')
    }

    // Gerar novo part number
    const basePartNumber = originalProduct.partNumber
    let newPartNumber = `${basePartNumber}-COPY`
    let counter = 1

    // Verificar se part number está disponível
    while (!(await ProductService.isPartNumberAvailable(newPartNumber))) {
      newPartNumber = `${basePartNumber}-COPY-${counter}`
      counter++
    }

    // Criar produto duplicado
    const duplicatedProduct = await ProductService.createProduct({
      partNumber: newPartNumber,
      description: `${originalProduct.description} (Cópia)`,
      costPrice: originalProduct.costPrice,
      salePrice: originalProduct.salePrice
    }, userId)

    // Registrar auditoria
    await logAuditAction(userId, AUDIT_ACTIONS.PRODUCT_CREATED, duplicatedProduct.id, null, duplicatedProduct)

    // Revalidar cache
    revalidatePath('/produtos')

    // Redirecionar para edição do produto duplicado
    redirect(`/produtos/${duplicatedProduct.id}/editar?success=duplicated`)

  } catch (error) {
    console.error('Erro ao duplicar produto:', error)
    
    if (error instanceof Error) {
      const errorMessage = encodeURIComponent(error.message)
      redirect(`/produtos?error=${errorMessage}`)
    }
    
    redirect('/produtos?error=Erro+ao+duplicar+produto')
  }
}

/**
 * Server Action para validar part number em tempo real
 */
export async function validatePartNumber(partNumber: string, excludeId?: string) {
  try {
    if (!partNumber || partNumber.trim().length === 0) {
      return { isValid: false, message: 'Part number é obrigatório' }
    }

    const normalizedPartNumber = partNumber.toUpperCase().trim()
    
    // Validar formato
    if (!/^[A-Za-z0-9-]+$/.test(normalizedPartNumber)) {
      return { 
        isValid: false, 
        message: 'Part number deve conter apenas letras, números e hífens' 
      }
    }

    // Verificar disponibilidade
    const isAvailable = await ProductService.isPartNumberAvailable(normalizedPartNumber, excludeId)
    
    if (!isAvailable) {
      return { 
        isValid: false, 
        message: 'Este part number já existe' 
      }
    }

    return { 
      isValid: true, 
      message: 'Part number disponível' 
    }

  } catch (error) {
    console.error('Erro ao validar part number:', error)
    return { 
      isValid: false, 
      message: 'Erro ao validar part number' 
    }
  }
}

/**
 * Server Action para buscar produtos para seleção em ordens
 */
export async function searchProductsForOrder(search: string) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    if (!search || search.trim().length < 2) {
      return []
    }

    const products = await ProductService.searchProductsForOrder(search.trim(), 10)
    
    return products.map(product => ({
      id: product.id,
      partNumber: product.partNumber,
      description: product.description,
      salePrice: product.salePrice,
      imageUrl: product.imageUrl,
      label: `${product.partNumber} - ${product.description}`,
      value: product.id
    }))

  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return []
  }
}

/**
 * Função auxiliar para registrar ações de auditoria
 */
async function logAuditAction(
  userId: string,
  action: string,
  resourceId: string,
  oldData: any,
  newData: any
) {
  try {
    // Implementar integração com sistema de auditoria existente
    // Por enquanto, apenas log no console
    console.log('Audit Log:', {
      userId,
      action,
      resourceId,
      oldData: oldData ? JSON.stringify(oldData) : null,
      newData: newData ? JSON.stringify(newData) : null,
      timestamp: new Date().toISOString()
    })

    // TODO: Integrar com PrismaClient para salvar no banco
    // await prisma.auditEntry.create({
    //   data: {
    //     userId,
    //     userType: 'employee',
    //     action,
    //     resource: 'product',
    //     resourceId,
    //     oldData: oldData ? JSON.stringify(oldData) : null,
    //     newData: newData ? JSON.stringify(newData) : null,
    //     timestamp: new Date(),
    //     ipAddress: getClientIP(),
    //     userAgent: getUserAgent()
    //   }
    // })

  } catch (error) {
    console.error('Erro ao registrar auditoria:', error)
    // Não falhar a operação principal por erro de auditoria
  }
}

/**
 * Server Action para exportar produtos
 */
export async function exportProducts(filters?: any) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    // Exportar produtos
    const exportData = await ProductService.exportProducts(filters)

    // Registrar auditoria
    await logAuditAction(userId, AUDIT_ACTIONS.PRODUCTS_EXPORTED, 'bulk', null, { count: exportData.length })

    return exportData

  } catch (error) {
    console.error('Erro ao exportar produtos:', error)
    throw new Error('Erro ao exportar produtos')
  }
}