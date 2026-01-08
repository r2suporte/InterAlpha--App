import { useEffect, useState } from 'react';
import {
  DollarSign,
  FileText,
  TrendingDownIcon,
  TrendingUpIcon,
  Users,
  Wrench,
  Loader2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface StatsData {
  orders: {
    total: number;
    open: number;
    newThisMonth: number;
    growth: number;
  };
  clients: {
    active: number;
    newThisMonth: number;
    growth: number;
  };
  inProgress: {
    count: number;
  };
  revenue: {
    current: number;
    growth: number;
  };
}

export function SectionCards() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex h-40 items-center justify-center border-0 bg-slate-50 shadow-sm dark:bg-slate-900/50">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Active Orders Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg transition-all duration-300 hover:shadow-xl @container/card dark:from-blue-950/50 dark:to-blue-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 dark:bg-blue-400/10">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardDescription className="font-medium text-blue-700 dark:text-blue-300">
                Ordens de Serviço
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300"
            >
              <TrendingUpIcon className="mr-1 size-3" />
              {data?.orders.growth.toFixed(1)}%
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tabular-nums text-blue-900 @[250px]/card:text-3xl dark:text-blue-100">
            {data?.orders.total}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-0 text-sm">
          <div className="flex gap-2 line-clamp-1 font-medium text-blue-800 dark:text-blue-200">
            +{data?.orders.newThisMonth} este mês <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-blue-600/70 dark:text-blue-400/70">
            {data?.orders.open} ordens ativas
          </div>
        </CardFooter>
      </Card>

      {/* Active Clients Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-lg transition-all duration-300 hover:shadow-xl @container/card dark:from-emerald-950/50 dark:to-emerald-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2 dark:bg-emerald-400/10">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardDescription className="font-medium text-emerald-700 dark:text-emerald-300">
                Clientes Ativos
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-200 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
            >
              <TrendingUpIcon className="mr-1 size-3" />
              {data?.clients.growth.toFixed(1)}%
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tabular-nums text-emerald-900 @[250px]/card:text-3xl dark:text-emerald-100">
            {data?.clients.active}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-0 text-sm">
          <div className="flex gap-2 line-clamp-1 font-medium text-emerald-800 dark:text-emerald-200">
            +{data?.clients.newThisMonth} novos clientes <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-emerald-600/70 dark:text-emerald-400/70">
            Base de clientes crescendo
          </div>
        </CardFooter>
      </Card>

      {/* In Progress Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-lg transition-all duration-300 hover:shadow-xl @container/card dark:from-amber-950/50 dark:to-amber-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2 dark:bg-amber-400/10">
                <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <CardDescription className="font-medium text-amber-700 dark:text-amber-300">
                Em Andamento
              </CardDescription>
            </div>
            {/* Status of efficiency? */}
            <Badge
              variant="outline"
              className="border-amber-200 text-amber-700 dark:border-amber-700 dark:text-amber-300"
            >
              <Users className="mr-1 size-3" />
              Ativo
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tabular-nums text-amber-900 @[250px]/card:text-3xl dark:text-amber-100">
            {data?.inProgress.count}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-0 text-sm">
          <div className="flex gap-2 line-clamp-1 font-medium text-amber-800 dark:text-amber-200">
            Oficina movimentada <Wrench className="size-4" />
          </div>
          <div className="text-amber-600/70 dark:text-amber-400/70">
            Serviços sendo executados
          </div>
        </CardFooter>
      </Card>

      {/* Revenue Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-50 to-violet-100/50 shadow-lg transition-all duration-300 hover:shadow-xl @container/card dark:from-violet-950/50 dark:to-violet-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-500/10 p-2 dark:bg-violet-400/10">
                <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <CardDescription className="font-medium text-violet-700 dark:text-violet-300">
                Receita Mensal
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-violet-200 text-violet-700 dark:border-violet-700 dark:text-violet-300"
            >
              <TrendingUpIcon className="mr-1 size-3" />
              {data?.revenue.growth.toFixed(1)}%
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tabular-nums text-violet-900 @[250px]/card:text-3xl dark:text-violet-100">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(data?.revenue.current || 0)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pt-0 text-sm">
          <div className="flex gap-2 line-clamp-1 font-medium text-violet-800 dark:text-violet-200">
            Crescimento financeiro <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-violet-600/70 dark:text-violet-400/70">
            Faturamento este mês
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
