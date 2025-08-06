'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'

// Schema de validação para cliente
const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  documento: z.string().min(11, 'Documento deve ter pelo menos 11 caracteres'),
  tipoDocumento: z.enum(['CPF', 'CNPJ']),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  observacoes: z.string().optional(),
})

export type ClienteFormData = z.infer<typeof clienteSchema>

export async function criarCliente(formData: FormData) {
  try {
    // Extrair dados do FormData
    const data = {
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string || undefined,
      documento: formData.get('documento') as string,
      tipoDocumento: formData.get('tipoDocumento') as 'CPF' | 'CNPJ',
      cep: formData.get('cep') as string || undefined,
      endereco: formData.get('endereco') as string || undefined,
      cidade: formData.get('cidade') as string || undefined,
      estado: formData.get('estado') as string || undefined,
      observacoes: formData.get('observacoes') as string || undefined,
    }

    // Validar dados
    const validatedData = clienteSchema.parse(data)

    // TODO: Obter userId do Clerk quando implementado
    const userId = 'temp-user-id' // Temporário

    // Criar cliente no banco
    const cliente = await prisma.cliente.create({
      data: {
        ...validatedData,
        userId,
      },
    })

    revalidatePath('/clientes')
    redirect('/clientes')
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Erro de validação: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw new Error('Erro ao criar cliente')
  }
}

export async function atualizarCliente(id: string, formData: FormData) {
  try {
    const data = {
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string || undefined,
      documento: formData.get('documento') as string,
      tipoDocumento: formData.get('tipoDocumento') as 'CPF' | 'CNPJ',
      cep: formData.get('cep') as string || undefined,
      endereco: formData.get('endereco') as string || undefined,
      cidade: formData.get('cidade') as string || undefined,
      estado: formData.get('estado') as string || undefined,
      observacoes: formData.get('observacoes') as string || undefined,
    }

    const validatedData = clienteSchema.parse(data)

    await prisma.cliente.update({
      where: { id },
      data: validatedData,
    })

    revalidatePath('/clientes')
    revalidatePath(`/clientes/${id}`)
    redirect('/clientes')
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Erro de validação: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw new Error('Erro ao atualizar cliente')
  }
}

export async function excluirCliente(id: string) {
  try {
    await prisma.cliente.delete({
      where: { id },
    })

    revalidatePath('/clientes')
  } catch (error) {
    throw new Error('Erro ao excluir cliente')
  }
}

export async function buscarClientes(query?: string) {
  try {
    const clientes = await prisma.cliente.findMany({
      where: query ? {
        OR: [
          { nome: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { documento: { contains: query, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { ordensServico: true },
        },
      },
    })

    return clientes
  } catch (error) {
    throw new Error('Erro ao buscar clientes')
  }
}