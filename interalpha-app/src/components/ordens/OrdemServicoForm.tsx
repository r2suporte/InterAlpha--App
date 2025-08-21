'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { OrderProductSelector } from './OrderProductSelector'
import { toast } from 'sonner'

// Schema de validação
const ordemServicoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  status: z.string().default('PENDENTE'),
  prioridade: z.string().default('MEDIA'),
  valor: z.number().min(0, 'Valor deve ser positivo').optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional()
})

type OrdemServicoFormData = z.infer<typeof ordemServicoSchema>

interface Cliente {
  id: string
  nome: string
  email: string
  telefone?: string
}

interface OrderItem {
  id?: string
  productId: string
  product?: any
  quantity: number
  unitPrice: number
  totalPrice: number
  description?: string
}

interface OrdemServicoFormProps {
  ordem?: any // Ordem existente para edição
  onSubmit?: (data: any) => void
  onCancel?: () => void
  isLoading?: boolean
}

export function OrdemServicoForm({
  ordem,
  onSubmit,
  onCancel,
  isLoading = false
}: OrdemServicoFormProps) {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<OrdemServicoFormData>({
    resolver: zodResolver(ordemServicoSchema),
    defaultValues: {
      titulo: ordem?.titulo || '',
      descricao: ordem?.descricao || '',
      clienteId: ordem?.clienteId || '',
      status: ordem?.status || 'PENDENTE',
      prioridade: ordem?.prioridade || 'MEDIA',
      valor: ordem?.valor || 0,
      dataInicio: ordem?.dataInicio ? new Date(ordem.dataInicio).toISOString().slice(0, 16) : '',
      dataFim: ordem?.dataFim ? new Date(ordem.dataFim).toISOString().slice(0, 16) : ''
    }
  })

  // Carregar clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch('/api/clientes')
        if (response.ok) {
          const data = await response.json()
          setClientes(data.clientes || [])
        }
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
        toast.error('Erro ao carregar clientes')
      }
    }

    fetchClientes()
  }, [])

  // Carregar itens se editando ordem existente
  useEffect(() => {
    if (ordem?.items) {
      const items = ordem.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        description: item.description
      }))
      setSelectedItems(items)
    }
  }, [ordem])

  // Calcular valores
  const valorServico = watch('valor') || 0
  const valorProdutos = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const valorTotal = valorServico + valorProdutos

  // Submeter formulário
  const handleFormSubmit = async (data: OrdemServicoFormData) => {
    setIsSubmitting(true)

    try {
      const submitData = {
        ...data,
        valor: data.valor || 0,
        dataInicio: data.dataInicio ? new Date(data.dataInicio).toISOString() : null,
        dataFim: data.dataFim ? new Date(data.dataFim).toISOString() : null,
        items: selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.description
        }))
      }

      if (onSubmit) {
        await onSubmit(submitData)
      } else {
        // Submissão padrão
        const url = ordem ? `/api/ordens-servico/${ordem.id}` : '/api/ordens-servico'
        const method = ordem ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })

        if (response.ok) {
          const result = await response.json()
          toast.success(ordem ? 'Ordem atualizada com sucesso!' : 'Ordem criada com sucesso!')
          router.push(`/ordens/${result.data.id}`)
        } else {
          const error = await response.json()
          toast.error(error.error || 'Erro ao salvar ordem')
        }
      }
    } catch (error) {
      console.error('Erro ao submeter formulário:', error)
      toast.error('Erro interno do servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Ordem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                {...register('titulo')}
                placeholder="Ex: Manutenção preventiva"
                disabled={isLoading || isSubmitting}
              />
              {errors.titulo && (
                <p className="text-sm text-red-600">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clienteId">Cliente *</Label>
              <Select
                value={watch('clienteId')}
                onValueChange={(value) => setValue('clienteId', value)}
                disabled={isLoading || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome} - {cliente.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clienteId && (
                <p className="text-sm text-red-600">{errors.clienteId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Descreva os detalhes da ordem de serviço..."
              rows={3}
              disabled={isLoading || isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value)}
                disabled={isLoading || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={watch('prioridade')}
                onValueChange={(value) => setValue('prioridade', value)}
                disabled={isLoading || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor do Serviço (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                {...register('valor', { valueAsNumber: true })}
                placeholder="0,00"
                disabled={isLoading || isSubmitting}
              />
              {errors.valor && (
                <p className="text-sm text-red-600">{errors.valor.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="datetime-local"
                {...register('dataInicio')}
                disabled={isLoading || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input
                id="dataFim"
                type="datetime-local"
                {...register('dataFim')}
                disabled={isLoading || isSubmitting}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
          <p className="text-sm text-gray-600">
            Adicione produtos que serão utilizados nesta ordem de serviço
          </p>
        </CardHeader>
        <CardContent>
          <OrderProductSelector
            selectedItems={selectedItems}
            onItemsChange={setSelectedItems}
            disabled={isLoading || isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Resumo de Valores */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor dos Serviços:</span>
              <span className="font-medium">R$ {valorServico.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Valor dos Produtos:</span>
              <span className="font-medium">R$ {valorProdutos.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Valor Total:</span>
              <span className="text-green-600">R$ {valorTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => router.back())}
          disabled={isLoading || isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading || isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : ordem ? 'Atualizar Ordem' : 'Criar Ordem'}
        </Button>
      </div>
    </form>
  )
}