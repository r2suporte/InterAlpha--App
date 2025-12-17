'use client';

import { useEffect, useState } from 'react';

import {
  DollarSign,
  FileText,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Metricas {
  totalClientes: number;
  totalOrdens: number;
  ordensAbertas: number;
  faturamentoTotal: number;
  faturamentoMes: number;
  ticketMedio: number;
}

interface MetricasCardProps {
  className?: string;
}

export default function MetricasCard({ className }: MetricasCardProps) {
  const [metricas, setMetricas] = useState<Metricas>({
    totalClientes: 0,
    totalOrdens: 0,
    ordensAbertas: 0,
    faturamentoTotal: 0,
    faturamentoMes: 0,
    ticketMedio: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetricas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas');
      }

      const data = await response.json();

      setMetricas({
        totalClientes: data.totalClientes || 0,
        totalOrdens: data.totalOrdens || 0,
        ordensAbertas: data.ordensAbertas || 0,
        faturamentoTotal: data.faturamentoTotal || 0,
        faturamentoMes: data.faturamentoMes || 0,
        ticketMedio: data.ticketMedio || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      setError('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricas();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calcularPercentualConclusao = () => {
    if (metricas.totalOrdens === 0) return 0;
    const concluidas = metricas.totalOrdens - metricas.ordensAbertas;
    return Math.round((concluidas / metricas.totalOrdens) * 100);
  };

  const getStatusColor = (status: 'success' | 'warning' | 'info') => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}
      >
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-8 w-1/2 rounded bg-gray-200"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <FileText className="mx-auto mb-2 h-8 w-8" />
            <p>{error}</p>
            <button
              onClick={fetchMetricas}
              className="mt-2 rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentualConclusao = calcularPercentualConclusao();

  return (
    <div
      className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ${className}`}
    >
      {/* Total de Clientes */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Clientes
          </CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {metricas.totalClientes}
          </div>
          <Badge variant="secondary" className="mt-2">
            <TrendingUp className="mr-1 h-3 w-3" />
            Ativo
          </Badge>
        </CardContent>
      </Card>

      {/* Total de Ordens */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ordens de Serviço
          </CardTitle>
          <FileText className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {metricas.totalOrdens}
          </div>
          <Badge variant="secondary" className="mt-2">
            Total
          </Badge>
        </CardContent>
      </Card>

      {/* Ordens Abertas */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ordens Abertas
          </CardTitle>
          <Target className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {metricas.ordensAbertas}
          </div>
          <Badge
            variant={metricas.ordensAbertas > 0 ? 'destructive' : 'secondary'}
            className="mt-2"
          >
            {metricas.ordensAbertas > 0 ? 'Pendente' : 'Em dia'}
          </Badge>
        </CardContent>
      </Card>

      {/* Taxa de Conclusão */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Conclusão
          </CardTitle>
          {percentualConclusao >= 80 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${percentualConclusao >= 80 ? 'text-green-600' : 'text-red-600'}`}
          >
            {percentualConclusao}%
          </div>
          <Badge
            variant={percentualConclusao >= 80 ? 'default' : 'destructive'}
            className="mt-2"
          >
            {percentualConclusao >= 80 ? 'Excelente' : 'Atenção'}
          </Badge>
        </CardContent>
      </Card>

      {/* Faturamento Total */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Faturamento Total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(metricas.faturamentoTotal)}
          </div>
          <Badge variant="secondary" className="mt-2">
            Acumulado
          </Badge>
        </CardContent>
      </Card>

      {/* Ticket Médio */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ticket Médio
          </CardTitle>
          <DollarSign className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(metricas.ticketMedio)}
          </div>
          <Badge variant="secondary" className="mt-2">
            Por ordem
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
