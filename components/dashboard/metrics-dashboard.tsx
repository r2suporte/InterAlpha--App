'use client';

import React, { useEffect, useState } from 'react';

import {
  Activity,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 📊 Interfaces para Métricas
interface ServiceMetrics {
  service: string;
  totalOperations: number;
  successRate: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorCount: number;
  lastHour: number;
  trend: 'up' | 'down' | 'stable';
}

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'warning' | 'critical';
  lastCheck: string;
  uptime: number;
  issues: string[];
}

interface MetricsData {
  services: ServiceMetrics[];
  health: ServiceHealth[];
  anomalies: Array<{
    service: string;
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'critical';
    timestamp: string;
  }>;
}

// 🎨 Componente de Ícone por Serviço
const ServiceIcon = ({ service }: { service: string }) => {
  const iconProps = { className: 'h-5 w-5' };

  switch (service) {
    case 'email':
      return <Mail {...iconProps} />;
    case 'sms':
      return <Phone {...iconProps} />;
    case 'whatsapp':
      return <MessageSquare {...iconProps} />;
    case 'communication':
      return <Activity {...iconProps} />;
    default:
      return <Activity {...iconProps} />;
  }
};

// 🎯 Componente de Status de Saúde
const HealthStatus = ({ status }: { status: string }) => {
  const statusConfig = {
    healthy: { color: 'bg-green-500', text: 'Saudável', icon: CheckCircle },
    warning: { color: 'bg-yellow-500', text: 'Atenção', icon: Clock },
    critical: { color: 'bg-red-500', text: 'Crítico', icon: XCircle },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.critical;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${config.color}`} />
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
};

// 📈 Componente Principal do Dashboard
export default function MetricsDashboard() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 🔄 Carregar Métricas
  const loadMetrics = async () => {
    try {
      setLoading(true);

      // Buscar métricas da API
      const response = await fetch('/api/metrics?timeRange=24h');

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data: MetricsData = await response.json();

      setMetricsData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);

      // Fallback para dados simulados em caso de erro
      const fallbackData: MetricsData = {
        services: [
          {
            service: 'email',
            totalOperations: 0,
            successRate: 100,
            averageResponseTime: 0,
            p95ResponseTime: 0,
            errorCount: 0,
            lastHour: 0,
            trend: 'stable',
          },
          {
            service: 'sms',
            totalOperations: 0,
            successRate: 100,
            averageResponseTime: 0,
            p95ResponseTime: 0,
            errorCount: 0,
            lastHour: 0,
            trend: 'stable',
          },
          {
            service: 'whatsapp',
            totalOperations: 0,
            successRate: 100,
            averageResponseTime: 0,
            p95ResponseTime: 0,
            errorCount: 0,
            lastHour: 0,
            trend: 'stable',
          },
          {
            service: 'communication',
            totalOperations: 0,
            successRate: 100,
            averageResponseTime: 0,
            p95ResponseTime: 0,
            errorCount: 0,
            lastHour: 0,
            trend: 'stable',
          },
        ],
        health: [
          {
            service: 'email',
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            uptime: 100,
            issues: [],
          },
          {
            service: 'sms',
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            uptime: 100,
            issues: [],
          },
          {
            service: 'whatsapp',
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            uptime: 100,
            issues: [],
          },
          {
            service: 'communication',
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            uptime: 100,
            issues: [],
          },
        ],
        anomalies: [],
      };

      setMetricsData(fallbackData);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Carregar dados na inicialização
  useEffect(() => {
    loadMetrics();

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metricsData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Carregando métricas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Métricas de Performance</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real dos serviços de comunicação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMetrics}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* 🚨 Alertas de Anomalias */}
      {metricsData?.anomalies && metricsData.anomalies.length > 0 && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <strong>Anomalias detectadas:</strong>
              {metricsData.anomalies.map((anomaly, index) => (
                <Badge
                  key={index}
                  variant={
                    anomaly.severity === 'critical'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {anomaly.service}: {anomaly.metric} ({anomaly.value}%)
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="health">Saúde dos Serviços</TabsTrigger>
        </TabsList>

        {/* 📈 Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metricsData?.services.map(service => (
              <Card key={service.service}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {service.service}
                  </CardTitle>
                  <ServiceIcon service={service.service} />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {service.successRate}%
                      </span>
                      {service.trend === 'up' && (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                      {service.trend === 'down' && (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      {service.trend === 'stable' && (
                        <div className="h-4 w-4" />
                      )}
                    </div>
                    <Progress value={service.successRate} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {service.totalOperations} operações • {service.lastHour}{' '}
                      na última hora
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ⚡ Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {metricsData?.services.map(service => (
              <Card key={service.service}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ServiceIcon service={service.service} />
                    <span className="capitalize">{service.service}</span>
                  </CardTitle>
                  <CardDescription>
                    Métricas de performance detalhadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Tempo Médio
                      </div>
                      <div className="text-2xl font-bold">
                        {service.averageResponseTime}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">P95</div>
                      <div className="text-2xl font-bold">
                        {service.p95ResponseTime}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Operações
                      </div>
                      <div className="text-2xl font-bold">
                        {service.totalOperations.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Erros</div>
                      <div className="text-2xl font-bold text-red-500">
                        {service.errorCount}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 🏥 Saúde dos Serviços */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {metricsData?.health.map(health => (
              <Card key={health.service}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ServiceIcon service={health.service} />
                      <span className="capitalize">{health.service}</span>
                    </div>
                    <HealthStatus status={health.status} />
                  </CardTitle>
                  <CardDescription>
                    Última verificação:{' '}
                    {new Date(health.lastCheck).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Uptime
                      </span>
                      <span className="text-sm font-medium">
                        {health.uptime}%
                      </span>
                    </div>
                    <Progress value={health.uptime} className="h-2" />
                  </div>

                  {health.issues.length > 0 && (
                    <div>
                      <div className="mb-2 text-sm font-medium">
                        Problemas Identificados:
                      </div>
                      <ul className="space-y-1">
                        {health.issues.map((issue, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <div className="h-1 w-1 rounded-full bg-yellow-500" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
