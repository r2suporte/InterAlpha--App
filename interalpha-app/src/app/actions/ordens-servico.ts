'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { emailNotifications } from '@/services/email/email-notifications'
import { smsNotifications } from '@/services/sms/sms-notifications'
import { whatsappNotifications } from '@/services/whatsapp/whatsapp-notifications'
import { workflowTriggers } from '@/services/workflow/workflow-triggers'

// Schema de validação para ordem de serviço
const ordemServicoSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
  valor: z.number().min(0, 'Valor deve ser positivo').optional(),
  dataInicio: z.date().optional(),
  dataFim: z.date().optional(),
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
})

export type OrdemServicoFormData = z.infer<typeof ordemServicoSchema>

export async function criarOrdemServico(formData: FormData) {
  try {
    // Extrair dados do FormData
    const data = {
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string || undefined,
      status: formData.get('status') as 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA',
      prioridade: formData.get('prioridade') as 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE',
      valor: formData.get('valor') ? parseFloat(formData.get('valor') as string) : undefined,
      dataInicio: formData.get('dataInicio') ? new Date(formData.get('dataInicio') as string) : undefined,
      dataFim: formData.get('dataFim') ? new Date(formData.get('dataFim') as string) : undefined,
      clienteId: formData.get('clienteId') as string,
    }

    // Validar dados
    const validatedData = ordemServicoSchema.parse(data)

    // TODO: Obter userId do Clerk quando implementado
    const userId = 'temp-user-id' // Temporário

    // Criar ordem de serviço no banco
    const ordemServico = await prisma.ordemServico.create({
      data: {
        ...validatedData,
        userId,
      },
      include: {
        cliente: {
          select: {
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    })

    // Enviar notificações para o cliente
    try {
      // Email
      await emailNotifications.sendOrderCreated({
        clientName: ordemServico.cliente.nome,
        clientEmail: ordemServico.cliente.email,
        orderNumber: ordemServico.id,
        serviceName: ordemServico.titulo,
        status: ordemServico.status,
        description: ordemServico.descricao || undefined,
        createdAt: ordemServico.createdAt,
      })

      // SMS (se telefone disponível)
      if (ordemServico.cliente.telefone) {
        await smsNotifications.sendOrderCreated({
          clientName: ordemServico.cliente.nome,
          clientPhone: ordemServico.cliente.telefone,
          orderNumber: ordemServico.id,
          serviceName: ordemServico.titulo,
          status: ordemServico.status,
        })

        // WhatsApp (fallback se SMS falhar ou como canal adicional)
        await whatsappNotifications.sendOrderCreated({
          clientName: ordemServico.cliente.nome,
          clientPhone: ordemServico.cliente.telefone,
          orderNumber: ordemServico.id,
          serviceName: ordemServico.titulo,
          status: ordemServico.status,
        })
      }
    } catch (notificationError) {
      console.error('Erro ao enviar notificações de ordem criada:', notificationError)
      // Não falhar a criação da ordem por causa das notificações
    }

    // Disparar workflows automáticos
    try {
      await workflowTriggers.onOrderCreated({
        id: ordemServico.id,
        titulo: ordemServico.titulo,
        status: ordemServico.status,
        prioridade: ordemServico.prioridade,
        clienteId: ordemServico.clienteId,
        valor: ordemServico.valor || undefined,
        createdAt: ordemServico.createdAt,
      })
    } catch (workflowError) {
      console.error('Erro ao disparar workflows:', workflowError)
      // Não falhar a criação da ordem por causa dos workflows
    }

    revalidatePath('/ordens-servico')
    redirect('/ordens-servico')
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Erro de validação: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw new Error('Erro ao criar ordem de serviço')
  }
}

export async function atualizarOrdemServico(id: string, formData: FormData) {
  try {
    const data = {
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string || undefined,
      status: formData.get('status') as 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA',
      prioridade: formData.get('prioridade') as 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE',
      valor: formData.get('valor') ? parseFloat(formData.get('valor') as string) : undefined,
      dataInicio: formData.get('dataInicio') ? new Date(formData.get('dataInicio') as string) : undefined,
      dataFim: formData.get('dataFim') ? new Date(formData.get('dataFim') as string) : undefined,
      clienteId: formData.get('clienteId') as string,
    }

    const validatedData = ordemServicoSchema.parse(data)

    // Buscar ordem atual para comparar status
    const ordemAtual = await prisma.ordemServico.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    })

    if (!ordemAtual) {
      throw new Error('Ordem de serviço não encontrada')
    }

    // Atualizar ordem de serviço
    const ordemAtualizada = await prisma.ordemServico.update({
      where: { id },
      data: validatedData,
      include: {
        cliente: {
          select: {
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    })

    // Verificar se houve mudança de status e enviar notificações
    if (ordemAtual.status !== ordemAtualizada.status) {
      try {
        if (ordemAtualizada.status === 'CONCLUIDA') {
          // Enviar notificações de ordem concluída
          await emailNotifications.sendOrderCompleted({
            clientName: ordemAtualizada.cliente.nome,
            clientEmail: ordemAtualizada.cliente.email,
            orderNumber: ordemAtualizada.id,
            serviceName: ordemAtualizada.titulo,
            completedAt: new Date(),
            notes: ordemAtualizada.descricao || undefined,
          })

          // SMS se telefone disponível
          if (ordemAtualizada.cliente.telefone) {
            await smsNotifications.sendOrderCompleted({
              clientName: ordemAtualizada.cliente.nome,
              clientPhone: ordemAtualizada.cliente.telefone,
              orderNumber: ordemAtualizada.id,
              serviceName: ordemAtualizada.titulo,
            })
          }
        } else {
          // Enviar notificações de mudança de status
          await emailNotifications.sendOrderStatusChanged({
            clientName: ordemAtualizada.cliente.nome,
            clientEmail: ordemAtualizada.cliente.email,
            orderNumber: ordemAtualizada.id,
            serviceName: ordemAtualizada.titulo,
            previousStatus: ordemAtual.status,
            newStatus: ordemAtualizada.status,
            updatedAt: new Date(),
          })

          // SMS se telefone disponível
          if (ordemAtualizada.cliente.telefone) {
            await smsNotifications.sendOrderStatusChanged({
              clientName: ordemAtualizada.cliente.nome,
              clientPhone: ordemAtualizada.cliente.telefone,
              orderNumber: ordemAtualizada.id,
              serviceName: ordemAtualizada.titulo,
              previousStatus: ordemAtual.status,
              newStatus: ordemAtualizada.status,
            })
          }
        }
      } catch (notificationError) {
        console.error('Erro ao enviar notificações de atualização:', notificationError)
        // Não falhar a atualização por causa das notificações
      }

      // Disparar workflows para mudança de status
      try {
        await workflowTriggers.onOrderStatusChanged({
          id: ordemAtualizada.id,
          titulo: ordemAtualizada.titulo,
          previousStatus: ordemAtual.status,
          newStatus: ordemAtualizada.status,
          prioridade: ordemAtualizada.prioridade,
          clienteId: ordemAtualizada.clienteId,
          updatedAt: new Date(),
        })
      } catch (workflowError) {
        console.error('Erro ao disparar workflows de status:', workflowError)
        // Não falhar a atualização por causa dos workflows
      }
    }

    revalidatePath('/ordens-servico')
    revalidatePath(`/ordens-servico/${id}`)
    redirect('/ordens-servico')
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Erro de validação: ${error.issues.map(e => e.message).join(', ')}`)
    }
    throw new Error('Erro ao atualizar ordem de serviço')
  }
}

export async function excluirOrdemServico(id: string) {
  try {
    await prisma.ordemServico.delete({
      where: { id },
    })

    revalidatePath('/ordens-servico')
  } catch (error) {
    throw new Error('Erro ao excluir ordem de serviço')
  }
}

export async function buscarOrdensServico(query?: string, status?: string) {
  try {
    const ordensServico = await prisma.ordemServico.findMany({
      where: {
        AND: [
          query ? {
            OR: [
              { titulo: { contains: query, mode: 'insensitive' } },
              { descricao: { contains: query, mode: 'insensitive' } },
              { cliente: { nome: { contains: query, mode: 'insensitive' } } },
            ],
          } : {},
          status ? { status } : {},
        ],
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        _count: {
          select: { pagamentos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ordensServico
  } catch (error) {
    throw new Error('Erro ao buscar ordens de serviço')
  }
}

export async function buscarClientesParaSelect() {
  try {
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
      },
      orderBy: { nome: 'asc' },
    })

    return clientes
  } catch (error) {
    throw new Error('Erro ao buscar clientes')
  }
}

// Função para obter estatísticas das ordens de serviço
export async function obterEstatisticasOrdens() {
  try {
    const [total, pendentes, emAndamento, concluidas] = await Promise.all([
      prisma.ordemServico.count(),
      prisma.ordemServico.count({ where: { status: 'PENDENTE' } }),
      prisma.ordemServico.count({ where: { status: 'EM_ANDAMENTO' } }),
      prisma.ordemServico.count({ where: { status: 'CONCLUIDA' } }),
    ])

    return {
      total,
      pendentes,
      emAndamento,
      concluidas,
    }
  } catch (error) {
    throw new Error('Erro ao obter estatísticas')
  }
}