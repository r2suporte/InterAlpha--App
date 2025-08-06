'use client'

import { useState, useEffect } from 'react'
import { criarOrdemServico, atualizarOrdemServico, buscarClientesParaSelect } from '@/app/actions/ordens-servico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface OrdemServicoFormProps {
  ordemServico?: {
    id: string
    titulo: string
    descricao?: string | null
    status: string
    prioridade: string
    valor?: number | null
    dataInicio?: Date | null
    dataFim?: Date | null
    clienteId: string
  }
  isEditing?: boolean
  preSelectedClienteId?: string
}

interface Cliente {
  id: string
  nome: string
  email: string
}

export default function OrdemServicoForm({ ordemServico, isEditing = false, preSelectedClienteId }: OrdemServicoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(true)

  // Carregar clientes ao montar o componente
  useEffect(() => {
    async function carregarClientes() {
      try {
        const clientesData = await buscarClientesParaSelect()
        setClientes(clientesData)
      } catch (error) {
        setErrors({ clientes: 'Erro ao carregar clientes' })
      } finally {
        setLoadingClientes(false)
      }
    }

    carregarClientes()
  }, [])

  const validateForm = (formData: FormData): boolean => {
    const newErrors: Record<string, string> = {}
    
    const titulo = formData.get('titulo') as string
    const clienteId = formData.get('clienteId') as string

    if (!titulo || titulo.length < 3) {
      newErrors.titulo = 'Título deve ter pelo menos 3 caracteres'
    }

    if (!clienteId) {
      newErrors.clienteId = 'Cliente é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setErrors({})

    try {
      if (!validateForm(formData)) {
        return
      }

      if (isEditing && ordemServico) {
        await atualizarOrdemServico(ordemServico.id, formData)
      } else {
        await criarOrdemServico(formData)
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Erro ao salvar ordem de serviço' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      {errors.clientes && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          {errors.clientes}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Título */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input
            id="titulo"
            name="titulo"
            defaultValue={ordemServico?.titulo}
            placeholder="Título da ordem de serviço"
            className={errors.titulo ? 'border-red-500' : ''}
          />
          {errors.titulo && (
            <p className="text-sm text-red-600">{errors.titulo}</p>
          )}
        </div>

        {/* Cliente */}
        <div className="space-y-2">
          <Label htmlFor="clienteId">Cliente *</Label>
          <Select
            id="clienteId"
            name="clienteId"
            defaultValue={ordemServico?.clienteId || preSelectedClienteId || ''}
            disabled={loadingClientes}
            className={errors.clienteId ? 'border-red-500' : ''}
          >
            <option value="">
              {loadingClientes ? 'Carregando clientes...' : 'Selecione um cliente'}
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome} - {cliente.email}
              </option>
            ))}
          </Select>
          {errors.clienteId && (
            <p className="text-sm text-red-600">{errors.clienteId}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={ordemServico?.status || 'PENDENTE'}
          >
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </Select>
        </div>

        {/* Prioridade */}
        <div className="space-y-2">
          <Label htmlFor="prioridade">Prioridade</Label>
          <Select
            id="prioridade"
            name="prioridade"
            defaultValue={ordemServico?.prioridade || 'MEDIA'}
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </Select>
        </div>

        {/* Valor */}
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$)</Label>
          <Input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0"
            defaultValue={ordemServico?.valor || ''}
            placeholder="0,00"
          />
        </div>

        {/* Data de Início */}
        <div className="space-y-2">
          <Label htmlFor="dataInicio">Data de Início</Label>
          <Input
            id="dataInicio"
            name="dataInicio"
            type="date"
            defaultValue={formatDateForInput(ordemServico?.dataInicio)}
          />
        </div>

        {/* Data de Fim */}
        <div className="space-y-2">
          <Label htmlFor="dataFim">Data de Fim</Label>
          <Input
            id="dataFim"
            name="dataFim"
            type="date"
            defaultValue={formatDateForInput(ordemServico?.dataFim)}
          />
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          name="descricao"
          defaultValue={ordemServico?.descricao || ''}
          placeholder="Descreva os detalhes da ordem de serviço"
          rows={4}
        />
      </div>

      {/* Botões */}
      <div className="flex items-center gap-4 pt-6">
        <Button
          type="submit"
          disabled={isSubmitting || loadingClientes}
          className="flex-1 md:flex-none"
        >
          {isSubmitting 
            ? (isEditing ? 'Atualizando...' : 'Criando...') 
            : (isEditing ? 'Atualizar O.S.' : 'Criar O.S.')
          }
        </Button>
      </div>
    </form>
  )
}