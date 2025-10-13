import React, { useEffect, useState } from 'react';

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Filter,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import {
  FORMA_PAGAMENTO_LABELS,
  FormaPagamento,
  MetricasFinanceiras,
  STATUS_FINANCEIRO_LABELS,
  StatusFinanceiro,
} from '../types/financeiro';

interface DashboardFinanceiroProps {
  className?: string;
}

interface FiltrosDashboard {
  periodo: 'hoje' | 'semana' | 'mes' | 'trimestre' | 'ano';
  status?: StatusFinanceiro;
  forma_pagamento?: FormaPagamento;
  data_inicio?: string;
  data_fim?: string;
}

// Dados simulados para demonstração
const dadosSimulados: MetricasFinanceiras = {
  receita_total_mes: 35000,
  receita_total_ano: 420000,
  receita_media_diaria: 1166,
  total_orcamentos_pendentes: 7,
  total_aguardando_pagamento: 12,
  total_pagos_mes: 156,
  valor_orcamentos_pendentes: 15000,
  valor_aguardando_pagamento: 28000,
  valor_recebido_mes: 35000,
  valor_recebido_ano: 420000,
  ticket_medio: 850,
  taxa_aprovacao_orcamentos: 84.4,
  tempo_medio_pagamento: 5,
  distribuicao_formas_pagamento: [
    { forma: 'pix', quantidade: 45, valor_total: 15750, percentual: 45 },
    {
      forma: 'cartao_credito',
      quantidade: 32,
      valor_total: 11200,
      percentual: 32,
    },
    { forma: 'dinheiro', quantidade: 18, valor_total: 6300, percentual: 18 },
    { forma: 'cartao_debito', quantidade: 5, valor_total: 1750, percentual: 5 },
  ],
  crescimento_receita_mes: 12.5,
  ordens_em_atraso: 3,
};

const statusColors = {
  aguardando_orcamento: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  orcamento_enviado: 'bg-blue-100 text-blue-800 border-blue-200',
  aguardando_pagamento: 'bg-orange-100 text-orange-800 border-orange-200',
  pago: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
};

export default function DashboardFinanceiro({
  className = '',
}: DashboardFinanceiroProps) {
  const [metricas, setMetricas] = useState<MetricasFinanceiras>(dadosSimulados);
  const [filtros, setFiltros] = useState<FiltrosDashboard>({
    periodo: 'mes',
  });
  const [loading, setLoading] = useState(false);

  const carregarMetricas = async () => {
    setLoading(true);
    try {
      // Aqui seria feita a chamada para a API
      // const response = await fetch('/api/dashboard/financeiro', { ... })
      // const data = await response.json()
      // setMetricas(data)

      // Simulando delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMetricas(dadosSimulados);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMetricas();
  }, [filtros]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarPorcentagem = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com filtros */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Financeiro
          </h1>
          <p className="mt-1 text-gray-600">
            Visão geral das métricas financeiras
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Filtro de período */}
          <select
            value={filtros.periodo}
            onChange={e =>
              setFiltros(prev => ({ ...prev, periodo: e.target.value as any }))
            }
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="ano">Este Ano</option>
          </select>

          {/* Filtro de status */}
          <select
            value={filtros.status || ''}
            onChange={e =>
              setFiltros(prev => ({
                ...prev,
                status: e.target.value
                  ? (e.target.value as StatusFinanceiro)
                  : undefined,
              }))
            }
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Status</option>
            {Object.entries(STATUS_FINANCEIRO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Receita do Ano */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Receita do Ano
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatarMoeda(metricas.receita_total_ano)}
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="font-medium text-green-600">
              +{metricas.crescimento_receita_mes}%
            </span>
            <span className="ml-1 text-gray-500">vs mês anterior</span>
          </div>
        </div>

        {/* Receita do Mês */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Receita do Mês
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatarMoeda(metricas.receita_total_mes)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="mr-1 h-4 w-4 text-blue-500" />
            <span className="font-medium text-blue-600">
              +{metricas.crescimento_receita_mes}%
            </span>
            <span className="ml-1 text-gray-500">vs mês anterior</span>
          </div>
        </div>

        {/* Aguardando Pagamento */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Aguardando Pagamento
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatarMoeda(metricas.valor_aguardando_pagamento)}
              </p>
            </div>
            <div className="rounded-lg bg-yellow-100 p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <AlertCircle className="mr-1 h-4 w-4 text-yellow-500" />
            <span className="font-medium text-yellow-600">
              {metricas.total_aguardando_pagamento}
            </span>
            <span className="ml-1 text-gray-500">ordens pendentes</span>
          </div>
        </div>

        {/* Taxa de Aprovação */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Taxa de Aprovação
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatarPorcentagem(metricas.taxa_aprovacao_orcamentos)}
              </p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">
              {metricas.total_orcamentos_pendentes}
            </span>
            <span className="ml-1 text-gray-500">orçamentos pendentes</span>
          </div>
        </div>
      </div>

      {/* Gráficos e tabelas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Resumo de Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Resumo de Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Orçamentos Pendentes
              </span>
              <span className="font-medium text-gray-900">
                {metricas.total_orcamentos_pendentes}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Aguardando Pagamento
              </span>
              <span className="font-medium text-gray-900">
                {metricas.total_aguardando_pagamento}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pagos no Mês</span>
              <span className="font-medium text-gray-900">
                {metricas.total_pagos_mes}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ordens em Atraso</span>
              <span className="font-medium text-gray-900">
                {metricas.ordens_em_atraso}
              </span>
            </div>
          </div>
        </div>

        {/* Formas de Pagamento */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Formas de Pagamento
          </h3>
          <div className="space-y-3">
            {metricas.distribuicao_formas_pagamento.map(item => (
              <div
                key={item.forma}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="mr-3 h-3 w-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm capitalize text-gray-600">
                    {item.forma.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {formatarMoeda(item.valor_total)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.percentual}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas adicionais */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Ticket Médio</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatarMoeda(metricas.ticket_medio)}
          </p>
          <p className="mt-1 text-sm text-gray-600">Por ordem de serviço</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">
              Receita Média Diária
            </h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatarMoeda(metricas.receita_media_diaria)}
          </p>
          <p className="mt-1 text-sm text-gray-600">Baseado no mês atual</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Tempo Médio</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {metricas.tempo_medio_pagamento.toFixed(1)} dias
          </p>
          <p className="mt-1 text-sm text-gray-600">Para recebimento</p>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span>Carregando métricas...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
