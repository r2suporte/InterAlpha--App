'use client';

import React, { useEffect, useState } from 'react';

import {
  AlertCircle,
  Calculator,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { formatarMoeda } from '../types/financeiro';
import { PecaUtilizada } from '../types/ordens-servico';
import { calcularMargemLucro } from '@/lib/utils/pricing';
import { Peca } from '../types/pecas';

interface PecasOrdemServicoProps {
  ordemServicoId: string;
  pecasUtilizadas: PecaUtilizada[];
  onPecasChange: (_pecas: PecaUtilizada[]) => void;
  readonly?: boolean;
}

interface PecaSelecionada extends PecaUtilizada {
  peca?: Peca;
  margem_lucro?: number;
}

export default function PecasOrdemServico({
  ordemServicoId,
  pecasUtilizadas,
  onPecasChange,
  readonly = false,
}: PecasOrdemServicoProps) {
  const [pecasDisponiveis, setPecasDisponiveis] = useState<Peca[]>([]);
  const [pecasSelecionadas, setPecasSelecionadas] = useState<PecaSelecionada[]>(
    []
  );
  const [busca, setBusca] = useState('');
  const [mostrarBusca, setMostrarBusca] = useState(false);

  // Simular dados de peças disponíveis
  useEffect(() => {
    const pecasSimuladas: Peca[] = [
      {
        id: '1',
        part_number: 'A2337',
        nome: 'Tela LCD iPhone 13',
        descricao: 'Tela LCD original para iPhone 13',
        categoria: 'tela',
        preco_custo: 180.0,
        preco_venda: 280.0,
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
        created_by: 'sistema',
      },
      {
        id: '2',
        part_number: 'A2484',
        nome: 'Bateria iPhone 13',
        descricao: 'Bateria original para iPhone 13',
        categoria: 'bateria',
        preco_custo: 85.0,
        preco_venda: 150.0,
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
        created_by: 'sistema',
      },
      {
        id: '3',
        part_number: 'A2633',
        nome: 'Câmera Traseira iPhone 13',
        descricao: 'Câmera traseira original para iPhone 13',
        categoria: 'camera',
        preco_custo: 120.0,
        preco_venda: 200.0,
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
        created_by: 'sistema',
      },
    ];
    setPecasDisponiveis(pecasSimuladas);
  }, []);

  // Converter peças utilizadas para formato com dados completos
  useEffect(() => {
    const pecasComDados = pecasUtilizadas.map(pecaUtilizada => {
      const pecaCompleta = pecasDisponiveis.find(
        p => p.id === pecaUtilizada.id
      );
      const margem = pecaCompleta
        ? calcularMargemLucro(
          pecaCompleta.preco_custo,
          pecaUtilizada.valor_unitario
        )
        : 0;

      return {
        ...pecaUtilizada,
        peca: pecaCompleta,
        margem_lucro: margem,
      };
    });
    setPecasSelecionadas(pecasComDados);
  }, [pecasUtilizadas, pecasDisponiveis]);

  const pecasFiltradas = pecasDisponiveis.filter(
    peca =>
      peca.nome.toLowerCase().includes(busca.toLowerCase()) ||
      peca.part_number.toLowerCase().includes(busca.toLowerCase())
  );

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
      created_at: new Date().toISOString(),
    };

    const novasPecas = [...pecasUtilizadas, novaPecaUtilizada];
    onPecasChange(novasPecas);
    setMostrarBusca(false);
    setBusca('');
  };

  const removerPeca = (index: number) => {
    const novasPecas = pecasUtilizadas.filter((_, i) => i !== index);
    onPecasChange(novasPecas);
  };

  const atualizarQuantidade = (index: number, quantidade: number) => {
    if (quantidade <= 0) return;

    const novasPecas = [...pecasUtilizadas];
    novasPecas[index] = {
      ...novasPecas[index],
      quantidade,
      valor_total: quantidade * novasPecas[index].valor_unitario,
    };
    onPecasChange(novasPecas);
  };

  const atualizarPreco = (index: number, preco: number) => {
    if (preco < 0) return;

    const novasPecas = [...pecasUtilizadas];
    novasPecas[index] = {
      ...novasPecas[index],
      valor_unitario: preco,
      valor_total: preco * novasPecas[index].quantidade,
    };
    onPecasChange(novasPecas);
  };

  const calcularTotalPecas = () => {
    return pecasUtilizadas.reduce((total, peca) => total + peca.valor_total, 0);
  };

  const calcularMargemMedia = () => {
    if (pecasSelecionadas.length === 0) return 0;
    const margemTotal = pecasSelecionadas.reduce(
      (total, peca) => total + (peca.margem_lucro || 0),
      0
    );
    return margemTotal / pecasSelecionadas.length;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Peças Utilizadas
          </h3>
        </div>

        {!readonly && (
          <button
            onClick={() => setMostrarBusca(!mostrarBusca)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar Peça
          </button>
        )}
      </div>

      {/* Busca de peças */}
      {mostrarBusca && !readonly && (
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou part number..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto">
            {pecasFiltradas.map(peca => (
              <div
                key={peca.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border bg-white p-3 hover:border-blue-300"
                onClick={() => adicionarPeca(peca)}
              >
                <div>
                  <p className="font-medium text-gray-900">{peca.nome}</p>
                  <p className="text-sm text-gray-500">
                    Part Number: {peca.part_number}
                  </p>
                  <p className="text-sm text-gray-500">
                    Estoque: {peca.quantidade_estoque} unidades
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatarMoeda(peca.preco_venda)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Custo: {formatarMoeda(peca.preco_custo)}
                  </p>
                </div>
              </div>
            ))}

            {pecasFiltradas.length === 0 && busca && (
              <p className="py-4 text-center text-gray-500">
                Nenhuma peça encontrada
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lista de peças selecionadas */}
      <div className="space-y-3">
        {pecasSelecionadas.map((peca, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h4 className="font-medium text-gray-900">{peca.nome}</h4>
                  {peca.codigo_peca && (
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {peca.codigo_peca}
                    </span>
                  )}
                  {peca.codigo_apple && (
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                      Apple: {peca.codigo_apple}
                    </span>
                  )}
                  {peca.tipo_peca && (
                    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                      {peca.tipo_peca}
                    </span>
                  )}
                </div>

                {/* Campos específicos da Apple */}
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Código Apple
                    </label>
                    <input
                      type="text"
                      value={peca.codigo_apple || ''}
                      onChange={e => {
                        const novasPecas = [...pecasUtilizadas];
                        novasPecas[index] = {
                          ...novasPecas[index],
                          codigo_apple: e.target.value,
                        };
                        onPecasChange(novasPecas);
                      }}
                      disabled={readonly}
                      placeholder="Ex: 661-12345"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Tipo de Peça
                    </label>
                    <select
                      value={peca.tipo_peca || ''}
                      onChange={e => {
                        const novasPecas = [...pecasUtilizadas];
                        novasPecas[index] = {
                          ...novasPecas[index],
                          tipo_peca: e.target.value as any,
                        };
                        onPecasChange(novasPecas);
                      }}
                      disabled={readonly}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="original_apple">Original Apple</option>
                      <option value="compativel">Compatível</option>
                      <option value="recondicionada">Recondicionada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={peca.quantidade}
                      onChange={e =>
                        atualizarQuantidade(
                          index,
                          Number.parseInt(e.target.value, 10) || 1
                        )
                      }
                      disabled={readonly}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Preço Unitário
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={peca.valor_unitario}
                      onChange={e =>
                        atualizarPreco(index, parseFloat(e.target.value) || 0)
                      }
                      disabled={readonly}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Total
                    </label>
                    <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                      {formatarMoeda(peca.valor_total)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Margem
                    </label>
                    <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                      {peca.margem_lucro
                        ? `${peca.margem_lucro.toFixed(1)}%`
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                {peca.peca &&
                  peca.quantidade > peca.peca.quantidade_estoque && (
                    <div className="mt-2 flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Quantidade solicitada ({peca.quantidade}) excede estoque
                        disponível ({peca.peca.quantidade_estoque})
                      </span>
                    </div>
                  )}
              </div>

              {!readonly && (
                <button
                  onClick={() => removerPeca(index)}
                  className="ml-4 rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {pecasSelecionadas.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p>Nenhuma peça adicionada</p>
            {!readonly && (
              <p className="text-sm">Clique em "Adicionar Peça" para começar</p>
            )}
          </div>
        )}
      </div>

      {/* Resumo financeiro */}
      {pecasSelecionadas.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 flex items-center gap-3">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Resumo Financeiro</h4>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-blue-700">Total em Peças</p>
              <p className="text-lg font-bold text-blue-900">
                {formatarMoeda(calcularTotalPecas())}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Margem Média</p>
              <p className="text-lg font-bold text-blue-900">
                {calcularMargemMedia().toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Itens</p>
              <p className="text-lg font-bold text-blue-900">
                {pecasSelecionadas.length} peças
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
