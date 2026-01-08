'use client';

import React, { useEffect, useState } from 'react';

import {
  Calculator,
  Package,
  Plus,
  Search,
} from 'lucide-react';

import { formatarMoeda } from '../types/financeiro';
import { PecaUtilizada } from '../types/ordens-servico';
import { calcularMargemLucro } from '@/lib/utils/pricing';
import { Peca } from '../types/pecas';
import { PecaItem } from './PecaItem';

interface PecasOrdemServicoProps {
  ordemServicoId: string;
  pecasUtilizadas: PecaUtilizada[];
  onPecasChange: (_pecas: PecaUtilizada[]) => void;
  readonly?: boolean;
}

/* Removed unused PecaSelecionada interface */

export default function PecasOrdemServico({
  ordemServicoId,
  pecasUtilizadas,
  onPecasChange,
  readonly = false,
}: PecasOrdemServicoProps) {
  const [pecasDisponiveis, setPecasDisponiveis] = useState<Peca[]>([]);
  /* Removed duplicate state */
  const [busca, setBusca] = useState('');
  const [mostrarBusca, setMostrarBusca] = useState(false);

  useEffect(() => {
    const fetchPecas = async () => {
      try {
        const response = await fetch('/api/estoque/pecas');
        if (!response.ok) throw new Error('Falha ao buscar peças');
        const data = await response.json();
        // Adapt API data format to Peca interface if necessary
        // API returns PascalCase or snake_case? Let's assume standard JSON response matches interface or we adapt.
        // Looking at Peca type: it likely expects snake_case based on previous mock data.
        // API returns mixed? Let's trust the API returns compatible objects or minimal map.
        // Previous API route `app/api/estoque/pecas/route.ts` returns prisma objects directly.
        // Prisma model uses camelCase mainly but map to snake_case in DB.
        // However, Prisma JS client returns camelCase properties by default (e.g. precoCusto) unless we mapped them in Types?
        // Wait, Schema has `@map`. Prisma Client uses field name (camelCase).
        // The Mock Data used `preco_custo`. 
        // I need to map the API response (camelCase) to the component's expected format (snake_case) or update the component to use camelCase.
        // Better to update component to use camelCase matching the typical Typescript/Prisma usage, 
        // BUT existing code throughout this file uses `preco_custo`.
        // So I will map here.

        const mappedPecas: Peca[] = data.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          part_number: p.codigo, // Schema has 'codigo', mock had 'part_number'
          descricao: p.descricao || p.nome,
          categoria: p.categoria || 'geral',
          preco_custo: Number(p.precoCusto),
          preco_venda: Number(p.precoVenda),
          quantidade_estoque: p.quantidade,
          estoque_minimo: p.minimo,
          marca: p.marca,
          modelo: p.modelo,
          // ... map other fields safe defaults
          status: p.quantidade > 0 ? 'disponivel' : 'indisponivel',
          ativo: true
        }));

        setPecasDisponiveis(mappedPecas);
      } catch (error) {
        console.error('Erro ao carregar peças:', error);
      }
    };

    fetchPecas();
  }, []);

  // Converter peças utilizadas para formato com dados completos
  const pecasSelecionadas = React.useMemo(() => {
    return pecasUtilizadas.map(pecaUtilizada => {
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
  }, [pecasUtilizadas, pecasDisponiveis]);

  const pecasFiltradas = React.useMemo(() => pecasDisponiveis.filter(
    peca =>
      peca.nome.toLowerCase().includes(busca.toLowerCase()) ||
      peca.part_number.toLowerCase().includes(busca.toLowerCase())
  ), [pecasDisponiveis, busca]);

  const adicionarPeca = React.useCallback((peca: Peca) => {
    const novaPecaUtilizada: PecaUtilizada = {
      id: `temp-${Date.now()}`,
      ordem_servico_id: ordemServicoId,
      peca_id: peca.id,
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
  }, [pecasUtilizadas, ordemServicoId, onPecasChange]);

  const removerPeca = React.useCallback((index: number) => {
    const novasPecas = pecasUtilizadas.filter((_, i) => i !== index);
    onPecasChange(novasPecas);
  }, [pecasUtilizadas, onPecasChange]);

  const atualizarQuantidade = React.useCallback((index: number, quantidade: number) => {
    if (quantidade <= 0) return;

    const novasPecas = [...pecasUtilizadas];
    novasPecas[index] = {
      ...novasPecas[index],
      quantidade,
      valor_total: quantidade * novasPecas[index].valor_unitario,
    };
    onPecasChange(novasPecas);
  }, [pecasUtilizadas, onPecasChange]);

  const atualizarPreco = React.useCallback((index: number, preco: number) => {
    if (preco < 0) return;

    const novasPecas = [...pecasUtilizadas];
    novasPecas[index] = {
      ...novasPecas[index],
      valor_unitario: preco,
      valor_total: preco * novasPecas[index].quantidade,
    };
    onPecasChange(novasPecas);
  }, [pecasUtilizadas, onPecasChange]);

  const atualizarCodigoApple = React.useCallback((index: number, codigo: string) => {
    const novasPecas = [...pecasUtilizadas];
    novasPecas[index] = {
      ...novasPecas[index],
      codigo_apple: codigo,
    };
    onPecasChange(novasPecas);
  }, [pecasUtilizadas, onPecasChange]);

  const atualizarTipoPeca = React.useCallback((index: number, tipo: string) => {
    const novasPecas = [...pecasUtilizadas];
    novasPecas[index] = {
      ...novasPecas[index],
      tipo_peca: tipo as any,
    };
    onPecasChange(novasPecas);
  }, [pecasUtilizadas, onPecasChange]);

  const totalPecas = React.useMemo(() => {
    return pecasUtilizadas.reduce((total, peca) => total + peca.valor_total, 0);
  }, [pecasUtilizadas]);

  const margemMedia = React.useMemo(() => {
    if (pecasSelecionadas.length === 0) return 0;
    const margemTotal = pecasSelecionadas.reduce(
      (total, peca) => total + (peca.margem_lucro || 0),
      0
    );
    return margemTotal / pecasSelecionadas.length;
  }, [pecasSelecionadas]);

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
          <PecaItem
            key={index}
            peca={peca}
            index={index}
            readonly={readonly}
            onRemove={removerPeca}
            onUpdateQuantidade={atualizarQuantidade}
            onUpdatePreco={atualizarPreco}
            onUpdateCodigoApple={atualizarCodigoApple}
            onUpdateTipoPeca={atualizarTipoPeca}
          />
        ))}

        {pecasSelecionadas.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p>Nenhuma peça adicionada</p>
            {!readonly && (
              <p className="text-sm">Clique em &quot;Adicionar Peça&quot; para começar</p>
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
                {formatarMoeda(totalPecas)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Margem Média</p>
              <p className="text-lg font-bold text-blue-900">
                {margemMedia.toFixed(1)}%
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
