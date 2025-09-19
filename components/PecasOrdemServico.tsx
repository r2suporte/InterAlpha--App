'use client'

import React, { useState, useEffect } from 'react'
import { Search, Plus, Trash2, Package, Calculator, AlertCircle } from 'lucide-react'
import { Peca, calcularMargemLucro } from '../types/pecas'
import { PecaUtilizada } from '../types/ordens-servico'
import { formatarMoeda } from '../types/financeiro'

interface PecasOrdemServicoProps {
  ordemServicoId: string
  pecasUtilizadas: PecaUtilizada[]
  onPecasChange: (pecas: PecaUtilizada[]) => void
  readonly?: boolean
}

interface PecaSelecionada extends PecaUtilizada {
  peca?: Peca
  margem_lucro?: number
}

export default function PecasOrdemServico({
  ordemServicoId,
  pecasUtilizadas,
  onPecasChange,
  readonly = false
}: PecasOrdemServicoProps) {
  const [pecasDisponiveis, setPecasDisponiveis] = useState<Peca[]>([])
  const [pecasSelecionadas, setPecasSelecionadas] = useState<PecaSelecionada[]>([])
  const [busca, setBusca] = useState('')
  const [mostrarBusca, setMostrarBusca] = useState(false)
  const [carregando, setCarregando] = useState(false)

  // Simular dados de peças disponíveis
  useEffect(() => {
    const pecasSimuladas: Peca[] = [
      {
        id: '1',
        part_number: 'A2337',
        nome: 'Tela LCD iPhone 13',
        descricao: 'Tela LCD original para iPhone 13',
        categoria: 'tela',
        preco_custo: 180.00,
        preco_venda: 280.00,
        margem_lucro: 35.7,
        quantidade_estoque: 15,
        estoque_minimo: 5,
        fornecedor_id: 'fornecedor-1',
        localizacao_estoque: 'A1-B2',
        status: 'disponivel',
        garantia_meses: 6,
        ativo: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'sistema'
      },
      {
        id: '2',
        part_number: 'A2484',
        nome: 'Bateria iPhone 13',
        descricao: 'Bateria original para iPhone 13',
        categoria: 'bateria',
        preco_custo: 85.00,
        preco_venda: 150.00,
        margem_lucro: 43.3,
        quantidade_estoque: 25,
        estoque_minimo: 10,
        fornecedor_id: 'fornecedor-1',
        localizacao_estoque: 'B1-C3',
        status: 'disponivel',
        garantia_meses: 12,
        ativo: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'sistema'
      },
      {
        id: '3',
        part_number: 'A2633',
        nome: 'Câmera Traseira iPhone 13',
        descricao: 'Câmera traseira original para iPhone 13',
        categoria: 'camera',
        preco_custo: 120.00,
        preco_venda: 200.00,
        margem_lucro: 40.0,
        quantidade_estoque: 8,
        estoque_minimo: 3,
        fornecedor_id: 'fornecedor-2',
        localizacao_estoque: 'C1-D2',
        status: 'disponivel',
        garantia_meses: 6,
        ativo: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'sistema'
      }
    ]
    setPecasDisponiveis(pecasSimuladas)
  }, [])

  // Converter peças utilizadas para formato com dados completos
  useEffect(() => {
    const pecasComDados = pecasUtilizadas.map(pecaUtilizada => {
      const pecaCompleta = pecasDisponiveis.find(p => p.id === pecaUtilizada.id)
      const margem = pecaCompleta ? calcularMargemLucro(pecaCompleta.preco_custo, pecaUtilizada.valor_unitario) : 0
      
      return {
        ...pecaUtilizada,
        peca: pecaCompleta,
        margem_lucro: margem
      }
    })
    setPecasSelecionadas(pecasComDados)
  }, [pecasUtilizadas, pecasDisponiveis])

  const pecasFiltradas = pecasDisponiveis.filter(peca =>
    peca.nome.toLowerCase().includes(busca.toLowerCase()) ||
    peca.part_number.toLowerCase().includes(busca.toLowerCase())
  )

  const adicionarPeca = (peca: Peca) => {
    const novaPecaUtilizada: PecaUtilizada = {
      id: `temp-${Date.now()}`,
      ordem_servico_id: ordemServicoId,
      nome: peca.nome,
      codigo_peca: peca.part_number,
      quantidade: 1,
      valor_unitario: peca.preco_venda,
      valor_total: peca.preco_venda,
      fornecedor: 'Fornecedor Principal',
      garantia_dias: (peca.garantia_meses || 0) * 30,
      codigo_apple: '', // Campo específico da Apple
      tipo_peca: 'original_apple', // Valor padrão
      created_at: new Date().toISOString()
    }

    const novasPecas = [...pecasUtilizadas, novaPecaUtilizada]
    onPecasChange(novasPecas)
    setMostrarBusca(false)
    setBusca('')
  }

  const removerPeca = (index: number) => {
    const novasPecas = pecasUtilizadas.filter((_, i) => i !== index)
    onPecasChange(novasPecas)
  }

  const atualizarQuantidade = (index: number, quantidade: number) => {
    if (quantidade <= 0) return

    const novasPecas = [...pecasUtilizadas]
    novasPecas[index] = {
      ...novasPecas[index],
      quantidade,
      valor_total: quantidade * novasPecas[index].valor_unitario
    }
    onPecasChange(novasPecas)
  }

  const atualizarPreco = (index: number, preco: number) => {
    if (preco < 0) return

    const novasPecas = [...pecasUtilizadas]
    novasPecas[index] = {
      ...novasPecas[index],
      valor_unitario: preco,
      valor_total: preco * novasPecas[index].quantidade
    }
    onPecasChange(novasPecas)
  }

  const calcularTotalPecas = () => {
    return pecasUtilizadas.reduce((total, peca) => total + peca.valor_total, 0)
  }

  const calcularMargemMedia = () => {
    if (pecasSelecionadas.length === 0) return 0
    const margemTotal = pecasSelecionadas.reduce((total, peca) => total + (peca.margem_lucro || 0), 0)
    return margemTotal / pecasSelecionadas.length
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Peças Utilizadas</h3>
        </div>
        
        {!readonly && (
          <button
            onClick={() => setMostrarBusca(!mostrarBusca)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Peça
          </button>
        )}
      </div>

      {/* Busca de peças */}
      {mostrarBusca && !readonly && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou part number..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {pecasFiltradas.map(peca => (
              <div
                key={peca.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-blue-300 cursor-pointer"
                onClick={() => adicionarPeca(peca)}
              >
                <div>
                  <p className="font-medium text-gray-900">{peca.nome}</p>
                  <p className="text-sm text-gray-500">Part Number: {peca.part_number}</p>
                  <p className="text-sm text-gray-500">Estoque: {peca.quantidade_estoque} unidades</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatarMoeda(peca.preco_venda)}</p>
                  <p className="text-sm text-gray-500">Custo: {formatarMoeda(peca.preco_custo)}</p>
                </div>
              </div>
            ))}
            
            {pecasFiltradas.length === 0 && busca && (
              <p className="text-center text-gray-500 py-4">Nenhuma peça encontrada</p>
            )}
          </div>
        </div>
      )}

      {/* Lista de peças selecionadas */}
      <div className="space-y-3">
        {pecasSelecionadas.map((peca, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-gray-900">{peca.nome}</h4>
                  {peca.codigo_peca && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {peca.codigo_peca}
                    </span>
                  )}
                  {peca.codigo_apple && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      Apple: {peca.codigo_apple}
                    </span>
                  )}
                  {peca.tipo_peca && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {peca.tipo_peca}
                    </span>
                  )}
                </div>

                {/* Campos específicos da Apple */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Apple
                    </label>
                    <input
                      type="text"
                      value={peca.codigo_apple || ''}
                      onChange={(e) => {
                        const novasPecas = [...pecasUtilizadas]
                        novasPecas[index] = { ...novasPecas[index], codigo_apple: e.target.value }
                        onPecasChange(novasPecas)
                      }}
                      disabled={readonly}
                      placeholder="Ex: 661-12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Peça
                    </label>
                    <select
                      value={peca.tipo_peca || ''}
                      onChange={(e) => {
                        const novasPecas = [...pecasUtilizadas]
                        novasPecas[index] = { ...novasPecas[index], tipo_peca: e.target.value as any }
                        onPecasChange(novasPecas)
                      }}
                      disabled={readonly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="original_apple">Original Apple</option>
                      <option value="compativel">Compatível</option>
                      <option value="recondicionada">Recondicionada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={peca.quantidade}
                      onChange={(e) => atualizarQuantidade(index, parseInt(e.target.value) || 1)}
                      disabled={readonly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Unitário
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={peca.valor_unitario}
                      onChange={(e) => atualizarPreco(index, parseFloat(e.target.value) || 0)}
                      disabled={readonly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                      {formatarMoeda(peca.valor_total)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Margem
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                      {peca.margem_lucro ? `${peca.margem_lucro.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {peca.peca && peca.quantidade > peca.peca.quantidade_estoque && (
                  <div className="flex items-center gap-2 mt-2 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      Quantidade solicitada ({peca.quantidade}) excede estoque disponível ({peca.peca.quantidade_estoque})
                    </span>
                  </div>
                )}
              </div>

              {!readonly && (
                <button
                  onClick={() => removerPeca(index)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {pecasSelecionadas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma peça adicionada</p>
            {!readonly && (
              <p className="text-sm">Clique em "Adicionar Peça" para começar</p>
            )}
          </div>
        )}
      </div>

      {/* Resumo financeiro */}
      {pecasSelecionadas.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Resumo Financeiro</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700">Total em Peças</p>
              <p className="text-lg font-bold text-blue-900">{formatarMoeda(calcularTotalPecas())}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Margem Média</p>
              <p className="text-lg font-bold text-blue-900">{calcularMargemMedia().toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Itens</p>
              <p className="text-lg font-bold text-blue-900">{pecasSelecionadas.length} peças</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}