'use client'

import { useState } from 'react'
import { criarCliente, atualizarCliente, type ClienteFormData } from '@/app/actions/clientes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { fetchCEP, formatCEP, formatPhone, isValidCPF, isValidCNPJ } from '@/lib/utils'

interface ClienteFormProps {
  cliente?: {
    id: string
    nome: string
    email: string
    telefone?: string | null
    documento: string
    tipoDocumento: string
    cep?: string | null
    endereco?: string | null
    cidade?: string | null
    estado?: string | null
    observacoes?: string | null
  }
  isEditing?: boolean
}

export default function ClienteForm({ cliente, isEditing = false }: ClienteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cepData, setCepData] = useState({
    endereco: cliente?.endereco || '',
    cidade: cliente?.cidade || '',
    estado: cliente?.estado || '',
  })

  const handleCEPChange = async (cep: string) => {
    const cleanedCEP = cep.replace(/\D/g, '')

    if (cleanedCEP.length === 8) {
      try {
        const data = await fetchCEP(cleanedCEP)
        setCepData({
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
        })
        setErrors(prev => ({ ...prev, cep: '' }))
      } catch (error) {
        setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }))
      }
    }
  }

  const validateForm = (formData: FormData): boolean => {
    const newErrors: Record<string, string> = {}

    const nome = formData.get('nome') as string
    const email = formData.get('email') as string
    const documento = formData.get('documento') as string
    const tipoDocumento = formData.get('tipoDocumento') as string

    if (!nome || nome.length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!email || !email.includes('@')) {
      newErrors.email = 'Email inválido'
    }

    if (!documento) {
      newErrors.documento = 'Documento é obrigatório'
    } else if (tipoDocumento === 'CPF' && !isValidCPF(documento)) {
      newErrors.documento = 'CPF inválido'
    } else if (tipoDocumento === 'CNPJ' && !isValidCNPJ(documento)) {
      newErrors.documento = 'CNPJ inválido'
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

      // Adicionar dados do CEP ao FormData
      formData.set('endereco', cepData.endereco)
      formData.set('cidade', cepData.cidade)
      formData.set('estado', cepData.estado)

      if (isEditing && cliente) {
        await atualizarCliente(cliente.id, formData)
      } else {
        await criarCliente(formData)
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Erro ao salvar cliente' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            name="nome"
            defaultValue={cliente?.nome}
            placeholder="Nome completo"
            className={errors.nome ? 'border-red-500' : ''}
          />
          {errors.nome && (
            <p className="text-sm text-red-600">{errors.nome}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={cliente?.email}
            placeholder="email@exemplo.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            defaultValue={cliente?.telefone || ''}
            placeholder="(11) 99999-9999"
            onChange={(e) => {
              e.target.value = formatPhone(e.target.value)
            }}
          />
        </div>

        {/* Tipo de Documento */}
        <div className="space-y-2">
          <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
          <Select
            id="tipoDocumento"
            name="tipoDocumento"
            defaultValue={cliente?.tipoDocumento || 'CPF'}
          >
            <option value="CPF">CPF</option>
            <option value="CNPJ">CNPJ</option>
          </Select>
        </div>

        {/* Documento */}
        <div className="space-y-2">
          <Label htmlFor="documento">Documento *</Label>
          <Input
            id="documento"
            name="documento"
            defaultValue={cliente?.documento}
            placeholder="000.000.000-00"
            className={errors.documento ? 'border-red-500' : ''}
          />
          {errors.documento && (
            <p className="text-sm text-red-600">{errors.documento}</p>
          )}
        </div>

        {/* CEP */}
        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            name="cep"
            defaultValue={cliente?.cep || ''}
            placeholder="00000-000"
            className={errors.cep ? 'border-red-500' : ''}
            onChange={(e) => {
              const formatted = formatCEP(e.target.value)
              e.target.value = formatted
              handleCEPChange(formatted)
            }}
          />
          {errors.cep && (
            <p className="text-sm text-red-600">{errors.cep}</p>
          )}
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          name="endereco"
          value={cepData.endereco}
          onChange={(e) => setCepData(prev => ({ ...prev, endereco: e.target.value }))}
          placeholder="Rua, número"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cidade */}
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            name="cidade"
            value={cepData.cidade}
            onChange={(e) => setCepData(prev => ({ ...prev, cidade: e.target.value }))}
            placeholder="Cidade"
          />
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Input
            id="estado"
            name="estado"
            value={cepData.estado}
            onChange={(e) => setCepData(prev => ({ ...prev, estado: e.target.value }))}
            placeholder="UF"
            maxLength={2}
          />
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          defaultValue={cliente?.observacoes || ''}
          placeholder="Observações adicionais sobre o cliente"
          rows={4}
        />
      </div>

      {/* Botões */}
      <div className="flex items-center gap-4 pt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 md:flex-none"
        >
          {isSubmitting
            ? (isEditing ? 'Atualizando...' : 'Criando...')
            : (isEditing ? 'Atualizar Cliente' : 'Criar Cliente')
          }
        </Button>
      </div>
    </form>
  )
}