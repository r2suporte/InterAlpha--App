'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Eye,
  Settings,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';

interface Alert {
  id: string;
  rule_id: string;
  rule_name: string;
  metric: string;
  current_value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'resolved' | 'acknowledged';
  triggered_at: string;
  resolved_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown_minutes: number;
}

interface AlertStats {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  alerts_by_severity: Record<string, number>;
  alerts_by_metric: Record<string, number>;
  resolution_time_avg: number;
}

interface AlertsData {
  alerts: Alert[];
  stats: AlertStats;
}

export default function AlertsDashboard() {
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      
      if (data.success) {
        setAlertsData(data.data);
        setError(null);
      } else {
        setError(data.error || 'Erro ao carregar alertas');
      }
    } catch (err) {
      setError('Erro de conexão');
      console.error('Erro ao buscar alertas:', err);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/alerts/rules');
      const data = await response.json();
      
      if (data.success) {
        setRules(data.data);
      } else {
        console.error('Erro ao carregar regras:', data.error);
      }
    } catch (err) {
      console.error('Erro ao buscar regras:', err);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'acknowledge',
          acknowledged_by: 'current_user' // Em um app real, viria do contexto de autenticação
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAlerts(); // Recarregar alertas
      } else {
        setError(data.error || 'Erro ao reconhecer alerta');
      }
    } catch (err) {
      setError('Erro de conexão');
      console.error('Erro ao reconhecer alerta:', err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resolve'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAlerts(); // Recarregar alertas
      } else {
        setError(data.error || 'Erro ao resolver alerta');
      }
    } catch (err) {
      setError('Erro de conexão');
      console.error('Erro ao resolver alerta:', err);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/alerts/rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchRules(); // Recarregar regras
      } else {
        setError(data.error || 'Erro ao atualizar regra');
      }
    } catch (err) {
      setError('Erro de conexão');
      console.error('Erro ao atualizar regra:', err);
    }
  };

  const checkAlerts = async () => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAlerts(); // Recarregar alertas após verificação
      } else {
        setError(data.error || 'Erro ao verificar alertas');
      }
    } catch (err) {
      setError('Erro de conexão');
      console.error('Erro ao verificar alertas:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAlerts(), fetchRules()]);
      setLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'acknowledged':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando alertas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alertas</h1>
          <p className="text-muted-foreground">
            Monitoramento e gerenciamento de alertas do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={checkAlerts}
          >
            <RefreshCw className="h-4 w-4" />
            Verificar Alertas
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {alertsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertsData.stats.total_alerts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {alertsData.stats.active_alerts}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {alertsData.stats.critical_alerts}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Resolução</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(alertsData.stats.resolution_time_avg)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alertsData?.alerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Nenhum alerta ativo</h3>
                  <p className="text-muted-foreground">
                    Todos os sistemas estão funcionando normalmente
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alertsData?.alerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(alert.severity)}
                        <CardTitle className="text-lg">{alert.rule_name}</CardTitle>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          {getStatusIcon(alert.status)}
                          <span>{alert.status.toUpperCase()}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Reconhecer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolver
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      Métrica: {alert.metric} | Valor atual: {alert.current_value} | 
                      Limite: {alert.threshold}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{alert.message}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Disparado em: {formatDate(alert.triggered_at)}</span>
                      {alert.acknowledged_at && (
                        <span>Reconhecido em: {formatDate(alert.acknowledged_at)}</span>
                      )}
                      {alert.resolved_at && (
                        <span>Resolvido em: {formatDate(alert.resolved_at)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(rule.severity)}
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <Badge className={getSeverityColor(rule.severity)}>
                        {rule.severity.toUpperCase()}
                      </Badge>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "ATIVA" : "INATIVA"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRule(rule.id, !rule.enabled)}
                      >
                        {rule.enabled ? "Desativar" : "Ativar"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{rule.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Métrica:</span>
                      <p className="text-muted-foreground">{rule.metric}</p>
                    </div>
                    <div>
                      <span className="font-medium">Condição:</span>
                      <p className="text-muted-foreground">
                        {rule.condition.replace('_', ' ')} {rule.threshold}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Cooldown:</span>
                      <p className="text-muted-foreground">{rule.cooldown_minutes} min</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <p className={rule.enabled ? "text-green-600" : "text-gray-500"}>
                        {rule.enabled ? "Ativa" : "Inativa"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}