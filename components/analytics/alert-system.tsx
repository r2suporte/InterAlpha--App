'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle,
  Filter,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// 🚨 Interfaces
interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'security' | 'business' | 'system' | 'anomaly';
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  metric: string;
  currentValue: number;
  threshold: number;
  trend: 'up' | 'down' | 'stable';
  affectedSystems: string[];
  estimatedImpact: string;
  suggestedActions: string[];
  isRead: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'anomaly';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'security' | 'business' | 'system' | 'anomaly';
  enabled: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    slack: boolean;
    webhook: boolean;
  };
  cooldown: number; // minutos
  description: string;
}

interface AnomalyDetection {
  metric: string;
  currentValue: number;
  expectedRange: { min: number; max: number };
  confidence: number;
  anomalyType: 'spike' | 'drop' | 'trend_change' | 'pattern_break';
  severity: number; // 0-1
}

// 🎨 Configurações de cores e ícones
const SEVERITY_COLORS = {
  low: 'text-blue-600 bg-blue-50 border-blue-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  critical: 'text-red-600 bg-red-50 border-red-200',
};

const SEVERITY_ICONS = {
  low: Bell,
  medium: AlertTriangle,
  high: Shield,
  critical: Zap,
};

const CATEGORY_COLORS = {
  performance: 'bg-blue-100 text-blue-800',
  security: 'bg-red-100 text-red-800',
  business: 'bg-green-100 text-green-800',
  system: 'bg-purple-100 text-purple-800',
  anomaly: 'bg-orange-100 text-orange-800',
};

// 🔧 Funções utilitárias
const generateMockAlerts = (): Alert[] => {
  const alerts: Alert[] = [
    {
      id: '1',
      title: 'Alto uso de CPU',
      description: 'CPU acima de 90% por mais de 5 minutos',
      severity: 'critical',
      category: 'performance',
      timestamp: new Date(Date.now() - 300000),
      status: 'active',
      metric: 'cpu_usage',
      currentValue: 95,
      threshold: 80,
      trend: 'up',
      affectedSystems: ['API Server', 'Database'],
      estimatedImpact: 'Degradação de performance',
      suggestedActions: ['Verificar processos', 'Escalar recursos'],
      isRead: false,
    },
    {
      id: '2',
      title: 'Falha de autenticação',
      description: 'Múltiplas tentativas de login falharam',
      severity: 'high',
      category: 'security',
      timestamp: new Date(Date.now() - 600000),
      status: 'acknowledged',
      metric: 'failed_logins',
      currentValue: 25,
      threshold: 10,
      trend: 'up',
      affectedSystems: ['Auth Service'],
      estimatedImpact: 'Possível ataque de força bruta',
      suggestedActions: ['Bloquear IPs suspeitos', 'Revisar logs'],
      isRead: true,
    },
  ];
  return alerts;
};

const generateMockRules = (): AlertRule[] => {
  return [
    {
      id: '1',
      name: 'CPU Alto',
      metric: 'cpu_usage',
      condition: 'greater_than',
      threshold: 80,
      severity: 'high',
      category: 'performance',
      enabled: true,
      notifications: {
        email: true,
        sms: false,
        slack: true,
        webhook: false,
      },
      cooldown: 5,
      description: 'Alerta quando CPU excede 80%',
    },
  ];
};

const detectAnomalies = (): AnomalyDetection[] => {
  return [
    {
      metric: 'response_time',
      currentValue: 2500,
      expectedRange: { min: 100, max: 500 },
      confidence: 0.95,
      anomalyType: 'spike',
      severity: 0.8,
    },
  ];
};

// 📊 Componente de card de alerta
const AlertCard: React.FC<{
  alert: Alert;
  onAcknowledge: (_id: string) => void;
  onResolve: (_id: string) => void;
  onMarkRead: (_id: string) => void;
}> = ({ alert, onAcknowledge, onResolve, onMarkRead }) => {
  const SeverityIcon = SEVERITY_ICONS[alert.severity];
  const TrendIcon = alert.trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <Card className={cn('border-l-4', SEVERITY_COLORS[alert.severity])}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <SeverityIcon className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">{alert.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {alert.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={CATEGORY_COLORS[alert.category]}>
              {alert.category}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkRead(alert.id)}
            >
              {alert.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <TrendIcon className="h-4 w-4" />
              <span>Valor: {alert.currentValue}</span>
            </div>
            <div>Limite: {alert.threshold}</div>
            <div>Status: {alert.status}</div>
          </div>
          
          <div className="flex gap-2">
            {alert.status === 'active' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAcknowledge(alert.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Reconhecer
              </Button>
            )}
            {alert.status === 'acknowledged' && (
              <Button
                size="sm"
                onClick={() => onResolve(alert.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Resolver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ⚙️ Componente de configuração de regras
const RuleConfiguration: React.FC<{
  rules: AlertRule[];
  onUpdateRule: (_rule: AlertRule) => void;
}> = ({ rules, onUpdateRule }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Regras de Alerta</h3>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{rule.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle
                    pressed={rule.enabled}
                    onPressedChange={(enabled) =>
                      onUpdateRule({ ...rule, enabled })
                    }
                  />
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// 🔍 Componente de detecção de anomalias
const AnomalyDetector: React.FC<{
  anomalies: AnomalyDetection[];
}> = ({ anomalies }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Detecção de Anomalias</h3>
      
      <div className="grid gap-4">
        {anomalies.map((anomaly, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{anomaly.metric}</h4>
                  <p className="text-sm text-muted-foreground">
                    Valor atual: {anomaly.currentValue} (esperado: {anomaly.expectedRange.min}-{anomaly.expectedRange.max})
                  </p>
                </div>
                <Badge variant="outline">
                  {Math.round(anomaly.confidence * 100)}% confiança
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// 🚨 Componente principal do sistema de alertas
export const AlertSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setAlerts(generateMockAlerts());
        setRules(generateMockRules());
        setAnomalies(detectAnomalies());
      } catch (_error) {
        console.error('Erro ao carregar dados:', _error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular novos alertas ocasionalmente
      if (Math.random() > 0.8) {
        const newAlert: Alert = {
          id: Date.now().toString(),
          title: 'Novo alerta detectado',
          description: 'Anomalia detectada automaticamente',
          severity: 'medium',
          category: 'anomaly',
          timestamp: new Date(),
          status: 'active',
          metric: 'auto_detected',
          currentValue: Math.random() * 100,
          threshold: 50,
          trend: 'up',
          affectedSystems: ['Sistema Automático'],
          estimatedImpact: 'Impacto sendo analisado',
          suggestedActions: ['Investigar causa raiz'],
          isRead: false,
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'active') return alert.status === 'active';
    return alert.severity === filter;
  });

  // Handlers
  const handleAcknowledge = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, status: 'acknowledged' as const } : alert
      )
    );
  };

  const handleResolve = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, status: 'resolved' as const } : alert
      )
    );
  };

  const handleMarkRead = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, isRead: !alert.isRead } : alert
      )
    );
  };

  const handleUpdateRule = (updatedRule: AlertRule) => {
    setRules(prev =>
      prev.map(rule => (rule.id === updatedRule.id ? updatedRule : rule))
    );
  };

  // Estatísticas
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    unread: alerts.filter(a => !a.isRead).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Alertas</h2>
          <p className="text-muted-foreground">
            Monitoramento e detecção de anomalias em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium">{stats.active} ativos</span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Críticos</p>
                <p className="text-2xl font-bold">{stats.critical}</p>
              </div>
              <Zap className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Não lidos</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtrar:</span>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="unread">Não lidos</SelectItem>
            <SelectItem value="critical">Críticos</SelectItem>
            <SelectItem value="high">Alta prioridade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalias</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Nenhum alerta encontrado</h3>
                  <p className="text-muted-foreground">
                    Todos os sistemas estão funcionando normalmente
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                  onResolve={handleResolve}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules">
          <RuleConfiguration
            rules={rules}
            onUpdateRule={handleUpdateRule}
          />
        </TabsContent>

        <TabsContent value="anomalies">
          <AnomalyDetector anomalies={anomalies} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertSystem;