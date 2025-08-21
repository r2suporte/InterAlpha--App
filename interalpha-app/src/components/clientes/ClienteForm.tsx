'use client'

import { useState } from 'react'
import { criarCliente, atualizarCliente, type ClienteFormData } from '@/app/actions/clientes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { fetchCEP, formatCEP, formatPhone } from '@/lib/utils'
import { isValidCPF, isValidCNPJ } from '@/lib/utils/document-validation'
import { DocumentValidationDialog } from './DocumentValidationDialog'

interface ClienteFormProps {
  cliente?: {
    id: string
    numeroSequencial?: number
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
  const [formData, setFormData] = useState({
    nome: cliente?.nome || '',
    email: cliente?.email || '',
    telefone: cliente?.telefone || '',
    documento: cliente?.documento || '',
    tipoDocumento: cliente?.tipoDocumento || 'CPF',
  })
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

  const handleDocumentValidated = (data: any) => {
    setFormData(prev => ({
      ...prev,
      documento: data.documento,
      tipoDocumento: data.tipoDocumento,
      nome: data.nome || prev.nome
    }))
    
    if (data.endereco) {
      setCepData({
        endereco: `${data.endereco.logradouro}, ${data.endereco.numero}`,
        cidade: data.endereco.municipio,
        estado: data.endereco.uf
      })
    }
  }

  const handleSubmit = async (submitFormData: FormData) => {
    setIsSubmitting(true)
    setErrors({})

    try {
      if (!validateForm(submitFormData)) {
        return
      }

      // Adicionar dados do CEP ao FormData
      submitFormData.set('endereco', cepData.endereco)
      submitFormData.set('cidade', cepData.cidade)
      submitFormData.set('estado', cepData.estado)

      if (isEditing && cliente) {
        await atualizarCliente(cliente.id, submitFormData)
      } else {
        await criarCliente(submitFormData)
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ID do Cliente */}
        <div className="space-y-2">
          <Label htmlFor="clienteId">ID do Cliente</Label>
          <Input
            id="clienteId"
            name="clienteId"
            value={cliente?.numeroSequencial ? `#${cliente.numeroSequencial.toString().padStart(6, '0')}` : 'Será gerado automaticamente'}
            readOnly
            className="bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Nome */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            placeholder="Nome completo"
            className={errors.nome ? 'border-red-500' : ''}
          />
          {errors.nome && (
            <p className="text-sm text-red-600">{errors.nome}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
            value={formData.telefone}
            onChange={(e) => {
              const formatted = formatPhone(e.target.value)
              setFormData(prev => ({ ...prev, telefone: formatted }))
            }}
            placeholder="(11) 99999-9999"
          />
        </div>

        {/* Documento com Validação */}
        <div className="md:col-span-2 space-y-2">
          <Label>Documento *</Label>
          <div className="flex gap-2">
            <Input
              name="documento"
              value={formData.documento}
              onChange={(e) => setFormData(prev => ({ ...prev, documento: e.target.value }))}
              placeholder={formData.tipoDocumento === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
              className={errors.documento ? 'border-red-500' : ''}
            />
            <input type="hidden" name="tipoDocumento" value={formData.tipoDocumento} />
            <DocumentValidationDialog onDocumentValidated={handleDocumentValidated} />
          </div>
          {errors.documento && (
            <p className="text-sm text-red-600">{errors.documento}</p>
          )}
          {formData.documento && (
            <p className="text-sm text-gray-600">
              Tipo: {formData.tipoDocumento}
            </p>
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