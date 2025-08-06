'use client'

import { useState, useEffect } from 'react'
import { criarPagamento, atualizarPagamento, buscarOrdensServicoParaSelect } from '@/app/actions/pagamentos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface PagamentoFormProps {
  pagamento?: {
    id: string
    valor: number
    status: string
    metodo: string
    descricao?: string | null
    dataVencimento?: Date | null
    dataPagamento?: Date | null
    ordemServicoId?: string | null
  }
  isEditing?: boolean
  preSelectedOrdemServicoId?: string
}

interface OrdemServico {
  id: string
  titulo: string
  valor: number | null
  cliente: {
    nome: string
  }
}

export default function PagamentoForm({ pagamento, isEditing = false, preSelectedOrdemServicoId }: PagamentoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])
  const [loadingOrdens, setLoadingOrdens] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState(pagamento?.status || 'PENDENTE')

  // Carregar ordens de serviço ao montar o componente
  useEffect(() => {
    async function carregarOrdens() {
      try {
        const ordensData = await buscarOrdensServicoParaSelect()
        setOrdensServico(ordensData)
      } catch (error) {
        setErrors({ ordens: 'Erro ao carregar ordens de serviço' })
      } finally {
        setLoadingOrdens(false)
      }
    }

    carregarOrdens()
  }, [])

  const validateForm = (formData: FormData): boolean => {
    const newErrors: Record<string, string> = {}
    
    const valor = parseFloat(formData.get('valor') as string)

    if (!valor || valor <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero'
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

      if (isEditing && pagamento) {
        await atualizarPagamento(pagamento.id, formData)
      } else {
        await criarPagamento(formData)
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Erro ao salvar pagamento' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return ''
    return value.toFixed(2)
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      {errors.ordens && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          {errors.ordens}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Valor */}
        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) *</Label>
          <Input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={pagamento?.valor ? formatCurrency(pagamento.valor) : ''}
            placeholder="0,00"
            className={errors.valor ? 'border-red-500' : ''}
          />
          {errors.valor && (
            <p className="text-sm text-red-600">{errors.valor}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="CANCELADO">Cancelado</option>
            <option value="ESTORNADO">Estornado</option>
          </Select>
        </div>

        {/* Método */}
        <div className="space-y-2">
          <Label htmlFor="metodo">Método de Pagamento</Label>
          <Select
            id="metodo"
            name="metodo"
            defaultValue={pagamento?.metodo || 'DINHEIRO'}
          >
            <option value="DINHEIRO">Dinheiro</option>
            <option value="PIX">PIX</option>
            <option value="CARTAO_CREDITO">Cartão de Crédito</option>
            <option value="CARTAO_DEBITO">Cartão de Débito</option>
            <option value="TRANSFERENCIA">Transferência</option>
            <option value="BOLETO">Boleto</option>
          </Select>
        </div>

        {/* Ordem de Serviço */}
        <div className="space-y-2">
          <Label htmlFor="ordemServicoId">Ordem de Serviço (Opcional)</Label>
          <Select
            id="ordemServicoId"
            name="ordemServicoId"
            defaultValue={pagamento?.ordemServicoId || preSelectedOrdemServicoId || ''}
            disabled={loadingOrdens}
          >
            <option value="">
              {loadingOrdens ? 'Carregando...' : 'Pagamento avulso (sem O.S.)'}
            </option>
            {ordensServico.map((ordem) => (
              <option key={ordem.id} value={ordem.id}>
                {ordem.titulo} - {ordem.cliente.nome}
                {ordem.valor && ` (R$ ${ordem.valor.toFixed(2)})`}
              </option>
            ))}
          </Select>
        </div>

        {/* Data de Vencimento */}
        <div className="space-y-2">
          <Label htmlFor="dataVencimento">Data de Vencimento</Label>
          <Input
            id="dataVencimento"
            name="dataVencimento"
            type="date"
            defaultValue={formatDateForInput(pagamento?.dataVencimento)}
          />
        </div>

        {/* Data de Pagamento - só aparece se status for PAGO */}
        {selectedStatus === 'PAGO' && (
          <div className="space-y-2">
            <Label htmlFor="dataPagamento">Data de Pagamento</Label>
            <Input
              id="dataPagamento"
              name="dataPagamento"
              type="date"
              defaultValue={formatDateForInput(pagamento?.dataPagamento)}
            />
            <p className="text-xs text-gray-500">
              Se não informada, será usada a data atual
            </p>
          </div>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (Opcional)</Label>
        <Textarea
          id="descricao"
          name="descricao"
          defaultValue={pagamento?.descricao || ''}
          placeholder="Observações sobre o pagamento"
          rows={3}
        />
      </div>

      {/* Botões */}
      <div className="flex items-center gap-4 pt-6">
        <Button
          type="submit"
          disabled={isSubmitting || loadingOrdens}
          className="flex-1 md:flex-none"
        >
          {isSubmitting 
            ? (isEditing ? 'Atualizando...' : 'Criando...') 
            : (isEditing ? 'Atualizar Pagamento' : 'Criar Pagamento')
          }
        </Button>
      </div>
    </form>
  )
}