'use client';

import type { ReactNode } from 'react';

import {
  AlertCircle,
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricaCard {
  titulo: string;
  valor: string;
  descricao?: string;
  tendencia?: {
    valor: number;
    tipo: 'positiva' | 'negativa' | 'neutra';
  };
  icone: ReactNode;
  cor?: 'default' | 'success' | 'warning' | 'danger';
}

interface MetricasFinanceirasProps {
  className?: string;
}

const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarPercentual = (valor: number): string => {
  return `${valor > 0 ? '+' : ''}${valor.toFixed(1)}%`;
};

export function MetricasFinanceiras({
  className = '',
}: MetricasFinanceirasProps) {
  // Dados simulados - em produção viriam de uma API
  const metricas: MetricaCard[] = [
    {
      titulo: 'Receita do Mês',
      valor: formatarMoeda(35000),
      descricao: 'Janeiro 2024',
      tendencia: {
        valor: 12.5,
        tipo: 'positiva',
      },
      icone: <DollarSign className="h-4 w-4" />,
      cor: 'success',
    },
    {
      titulo: 'Aguardando Pagamento',
      valor: formatarMoeda(28000),
      descricao: '12 ordens de serviço',
      tendencia: {
        valor: -5.2,
        tipo: 'negativa',
      },
      icone: <Clock className="h-4 w-4" />,
      cor: 'warning',
    },
    {
      titulo: 'Ticket Médio',
      valor: formatarMoeda(850),
      descricao: 'Últimos 30 dias',
      tendencia: {
        valor: 8.3,
        tipo: 'positiva',
      },
      icone: <TrendingUp className="h-4 w-4" />,
      cor: 'default',
    },
    {
      titulo: 'Taxa de Aprovação',
      valor: '84.4%',
      descricao: 'Orçamentos aprovados',
      tendencia: {
        valor: 2.1,
        tipo: 'positiva',
      },
      icone: <CheckCircle className="h-4 w-4" />,
      cor: 'success',
    },
    {
      titulo: 'Ordens em Atraso',
      valor: '3',
      descricao: 'Requer atenção',
      icone: <AlertCircle className="h-4 w-4" />,
      cor: 'danger',
    },
    {
      titulo: 'Pagamentos PIX',
      valor: '45%',
      descricao: formatarMoeda(15750),
      tendencia: {
        valor: 15.8,
        tipo: 'positiva',
      },
      icone: <Banknote className="h-4 w-4" />,
      cor: 'default',
    },
    {
      titulo: 'Cartão de Crédito',
      valor: '32%',
      descricao: formatarMoeda(11200),
      tendencia: {
        valor: -3.2,
        tipo: 'negativa',
      },
      icone: <CreditCard className="h-4 w-4" />,
      cor: 'default',
    },
    {
      titulo: 'Tempo Médio Pagamento',
      valor: '5 dias',
      descricao: 'Meta: 3 dias',
      tendencia: {
        valor: -1.5,
        tipo: 'positiva',
      },
      icone: <Clock className="h-4 w-4" />,
      cor: 'warning',
    },
  ];

  const getCardColor = (cor: string) => {
    switch (cor) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'danger':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getTendenciaColor = (tipo: string) => {
    switch (tipo) {
      case 'positiva':
        return 'text-green-600';
      case 'negativa':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTendenciaIcon = (tipo: string) => {
    switch (tipo) {
      case 'positiva':
        return <TrendingUp className="h-3 w-3" />;
      case 'negativa':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {metricas.map((metrica, index) => (
        <Card
          key={index}
          className={`transition-all hover:shadow-md ${getCardColor(metrica.cor || 'default')}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metrica.titulo}
            </CardTitle>
            <div className="text-gray-400">{metrica.icone}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metrica.valor}
            </div>
            {metrica.descricao && (
              <p className="mt-1 text-xs text-gray-500">{metrica.descricao}</p>
            )}
            {metrica.tendencia && (
              <div
                className={`mt-2 flex items-center text-xs ${getTendenciaColor(metrica.tendencia.tipo)}`}
              >
                {getTendenciaIcon(metrica.tendencia.tipo)}
                <span className="ml-1">
                  {formatarPercentual(metrica.tendencia.valor)} vs mês anterior
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
