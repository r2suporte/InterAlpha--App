'use client';

import React, { useEffect, useState } from 'react';

import {
  Activity,
  AlertTriangle,
  Ban,
  Download,
  Eye,
  RefreshCw,
  Shield,
  TrendingUp,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * 🛡️ Security Dashboard - InterAlpha App
 *
 * Dashboard para monitoramento de segurança em tempo real
 * Visualiza eventos, estatísticas e ameaças detectadas
 */

interface SecurityEvent {
  timestamp: string;
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  userId?: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
}

interface SecurityStats {
  totalEvents: number;
  events24h: number;
  eventsLastHour: number;
  criticalEvents: number;
  highSeverityEvents: number;
  status: 'normal' | 'warning' | 'critical';
}

interface ThreatInfo {
  type: string;
  count: number;
  severity: string;
}

interface DashboardData {
  overview: SecurityStats;
  recentEvents: SecurityEvent[];
  topThreats: ThreatInfo[];
  topIPs: Array<{ ip: string; count: number }>;
  rateLimit: any;
}

export default function SecurityDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/security?action=dashboard');

      if (!response.ok) {
        throw new Error('Erro ao carregar dados de segurança');
      }

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Atualizar a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'normal':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const exportData = () => {
    if (!data) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      overview: data.overview,
      recentEvents: data.recentEvents,
      topThreats: data.topThreats,
      topIPs: data.topIPs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados de segurança...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Sem dados</AlertTitle>
        <AlertDescription>Nenhum dado de segurança disponível</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Segurança</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real de eventos de segurança
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity
              className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`}
            />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>

          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(data.overview.status)}`}
            >
              {data.overview.status.toUpperCase()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos (24h)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.events24h}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.eventsLastHour} na última hora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos Críticos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.overview.criticalEvents}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alta Severidade
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data.overview.highSeverityEvents}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Eventos
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalEvents}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Eventos Recentes</TabsTrigger>
          <TabsTrigger value="threats">Principais Ameaças</TabsTrigger>
          <TabsTrigger value="ips">IPs Suspeitos</TabsTrigger>
          <TabsTrigger value="rate-limit">Rate Limiting</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança Recentes</CardTitle>
              <CardDescription>
                Últimos {data.recentEvents.length} eventos detectados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentEvents.length === 0 ? (
                  <p className="py-4 text-center text-muted-foreground">
                    Nenhum evento recente
                  </p>
                ) : (
                  data.recentEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">
                            {event.eventType.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          <span>{event.ip}</span> •
                          <span className="ml-1">
                            {event.method} {event.endpoint}
                          </span>{' '}
                          •
                          <span className="ml-1">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        {event.details &&
                          Object.keys(event.details).length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {JSON.stringify(event.details, null, 0)}
                            </div>
                          )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Principais Ameaças Detectadas</CardTitle>
              <CardDescription>
                Tipos de ameaças mais frequentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topThreats.map((threat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{threat.type}</div>
                        <Badge variant={getSeverityColor(threat.severity)}>
                          {threat.severity}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{threat.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IPs com Mais Eventos Suspeitos</CardTitle>
              <CardDescription>
                Endereços IP que geraram mais eventos de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topIPs.map((ipData, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-mono font-medium">{ipData.ip}</div>
                        <div className="text-sm text-muted-foreground">
                          {ipData.count} eventos
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Ban className="mr-2 h-4 w-4" />
                        Bloquear
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Rate Limiting</CardTitle>
              <CardDescription>
                Informações sobre limitação de taxa de requisições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">
                    {data.rateLimit?.totalRequests || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total de Requisições
                  </div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {data.rateLimit?.blockedRequests || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Requisições Bloqueadas
                  </div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">
                    {data.rateLimit?.activeIPs || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    IPs Ativos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
