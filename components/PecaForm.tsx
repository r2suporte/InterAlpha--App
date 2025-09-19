'use client'

import React, { useState, useEffect } from 'react'
import { X, Package, DollarSign, Settings, Loader2 } from 'lucide-react'
import { 
  Peca, 
  CategoriaPeca, 
  StatusPeca, 
  Fornecedor,
  validarPartNumber,
  calcularMargemLucro,
  CATEGORIA_PECA_LABELS,
  STATUS_PECA_LABELS
} from '../types/pecas'

interface PecaFormData {
  part_number: string
  nome: string
  descricao: string
  categoria: CategoriaPeca | ''
  fornecedor_id: string
  preco_custo: string
  preco_venda: string
  estoque_minimo: string
  estoque_atual: string
  localizacao: string
  observacoes: string
  status: StatusPeca
  peso: string
  dimensoes: string
  garantia_meses: string
}

interface PecaFormProps {
  peca?: Peca
  onSubmit: (data: PecaFormData) => Promise<void>
  onCancel: () => void
  fornecedores: Fornecedor[]
  isLoading?: boolean
}

export default function PecaForm({ 
  peca, 
  onSubmit, 
  onCancel, 
  fornecedores,
  isLoading = false 
}: PecaFormProps) {
  const [formData, setFormData] = useState<PecaFormData>({
    part_number: '',
    nome: '',
    descricao: '',
    categoria: '' as CategoriaPeca,
    fornecedor_id: '',
    preco_custo: '',
    preco_venda: '',
    estoque_minimo: '',
    estoque_atual: '',
    localizacao: '',
    observacoes: '',
    status: 'ativo' as StatusPeca,
    peso: '',
    dimensoes: '',
    garantia_meses: '12'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [partNumberValidation, setPartNumberValidation] = useState<{
    isValid: boolean
    message: string
  }>({ isValid: true, message: '' })

  // Preencher formulário se editando
  useEffect(() => {
    if (peca) {
      setFormData({
        part_number: peca.part_number,
        nome: peca.nome,
        descricao: peca.descricao,
        categoria: peca.categoria,
        fornecedor_id: peca.fornecedor_id || '',
        preco_custo: peca.preco_custo.toString(),
        preco_venda: peca.preco_venda.toString(),
        estoque_minimo: peca.estoque_minimo.toString(),
        estoque_atual: peca.quantidade_estoque.toString(),
        localizacao: peca.localizacao_estoque || '',
        observacoes: '',
        status: peca.status,
        peso: '',
        dimensoes: '',
        garantia_meses: (peca.garantia_meses || 12).toString()
      })
    }
  }, [peca])

  // Calcular margem de lucro
  const calcularMargem = () => {
    const custo = parseFloat(formData.preco_custo)
    const venda = parseFloat(formData.preco_venda)
    
    if (custo > 0 && venda > 0) {
      const percentual = calcularMargemLucro(custo, venda)
      const valor = venda - custo
      return {
        percentual,
        valor
      }
    }
    return null
  }

  // Validar part number
  const handlePartNumberChange = (value: string) => {
    setFormData((prev: PecaFormData) => ({ ...prev, part_number: value }))
    
    const validation = validarPartNumber(value)
    setPartNumberValidation(validation)
    
    if (!validation.isValid) {
      setErrors((prev: Record<string, string>) => ({ ...prev, part_number: validation.message }))
    } else {
      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev }
        delete newErrors.part_number
        return newErrors
      })
    }
  }

  // Calcular preço de venda baseado na margem
  const calcularPrecoVenda = (precoCusto: number, margemDesejada: number = 30) => {
    return precoCusto * (1 + margemDesejada / 100)
  }

  // Sugerir preço de venda
  const sugerirPrecoVenda = () => {
    const custo = parseFloat(formData.preco_custo)
    if (custo > 0) {
      const precoSugerido = calcularPrecoVenda(custo, 30)
      setFormData((prev: PecaFormData) => ({ 
        ...prev, 
        preco_venda: precoSugerido.toFixed(2) 
      }))
    }
  }

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.part_number.trim()) {
      newErrors.part_number = 'Part Number é obrigatório'
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória'
    }

    if (!formData.preco_custo || parseFloat(formData.preco_custo) <= 0) {
      newErrors.preco_custo = 'Preço de custo deve ser maior que zero'
    }

    if (!formData.preco_venda || parseFloat(formData.preco_venda) <= 0) {
      newErrors.preco_venda = 'Preço de venda deve ser maior que zero'
    }

    if (parseFloat(formData.preco_venda) <= parseFloat(formData.preco_custo)) {
      newErrors.preco_venda = 'Preço de venda deve ser maior que o preço de custo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Erro ao salvar peça:', error)
    }
  }

  const margem = calcularMargem()

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {peca ? 'Editar Peça' : 'Nova Peça'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Informações Básicas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Part Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part Number *
              </label>
              <input
                type="text"
                value={formData.part_number}
                onChange={(e) => handlePartNumberChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.part_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: APL-001-2024"
              />
              {partNumberValidation && (
                <div className={`mt-1 text-sm ${
                  partNumberValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {partNumberValidation.message}
                </div>
              )}
              {errors.part_number && (
                <p className="mt-1 text-sm text-red-600">{errors.part_number}</p>
              )}
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, nome: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nome da peça"
              />
              {errors.nome && (
                <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData((prev: PecaFormData) => ({ 
                  ...prev, 
                  categoria: e.target.value as CategoriaPeca | '' 
                }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.categoria ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione uma categoria</option>
                {Object.entries(CATEGORIA_PECA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{String(label)}</option>
                ))}
              </select>
              {errors.categoria && (
                <p className="mt-1 text-sm text-red-600">{errors.categoria}</p>
              )}
            </div>

            {/* Fornecedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fornecedor
              </label>
              <select
                value={formData.fornecedor_id}
                onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, fornecedor_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, descricao: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição detalhada da peça"
            />
          </div>
        </div>

        {/* Preços */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Preços
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preço de Custo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço de Custo *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_custo}
                  onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, preco_custo: e.target.value }))}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.preco_custo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                />
              </div>
              {errors.preco_custo && (
                <p className="mt-1 text-sm text-red-600">{errors.preco_custo}</p>
              )}
            </div>

            {/* Preço de Venda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço de Venda *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_venda}
                  onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, preco_venda: e.target.value }))}
                  className={`w-full pl-10 pr-20 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.preco_venda ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                />
                <button
                  type="button"
                  onClick={sugerirPrecoVenda}
                  className="absolute right-2 top-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                >
                  Sugerir
                </button>
              </div>
              {errors.preco_venda && (
                <p className="mt-1 text-sm text-red-600">{errors.preco_venda}</p>
              )}
            </div>
          </div>

          {/* Margem de Lucro */}
          {margem && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Margem de Lucro:
                </span>
                <span className={`text-sm font-bold ${
                  margem.percentual >= 20 ? 'text-green-600' : 
                  margem.percentual >= 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {margem.percentual.toFixed(1)}% (R$ {margem.valor.toFixed(2)})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Estoque */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Controle de Estoque
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Estoque Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque Mínimo
              </label>
              <input
                type="number"
                min="0"
                value={formData.estoque_minimo}
                onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, estoque_minimo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            {/* Estoque Atual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque Atual
              </label>
              <input
                type="number"
                min="0"
                value={formData.estoque_atual}
                onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, estoque_atual: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            {/* Localização */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Localização
              </label>
              <input
                type="text"
                value={formData.localizacao}
                onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, localizacao: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Prateleira A1"
              />
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Informações Adicionais
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev: PecaFormData) => ({ 
                  ...prev, 
                  status: e.target.value as StatusPeca 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STATUS_PECA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{String(label)}</option>
                ))}
              </select>
            </div>

            {/* Peso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.peso}
                onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, peso: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0,000"
              />
            </div>

            {/* Garantia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Garantia (meses)
              </label>
              <input
                type="number"
                min="0"
                value={formData.garantia_meses}
                onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, garantia_meses: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12"
              />
            </div>
          </div>

          {/* Dimensões */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dimensões (C x L x A)
            </label>
            <input
              type="text"
              value={formData.dimensoes}
              onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, dimensoes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 10cm x 5cm x 2cm"
            />
          </div>

          {/* Observações */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData((prev: PecaFormData) => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observações adicionais sobre a peça"
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {peca ? 'Atualizar' : 'Salvar'} Peça
          </button>
        </div>
      </form>
    </div>
  )
}