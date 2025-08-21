'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  Users, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import { AuditStatsChart } from './audit-stats-chart'
import { RecentActivityList } from './recent-activity-list'
import { SecurityAlertsPanel } from './security-alerts-panel'

interface DashboardStats {
  totalAuditLogs: number
  totalAccessLogs: number
  totalSecurityEvents: number
  activeUsers: number
  failedLogins: number
  criticalEvents: number
  complianceScore: number
}

export function AuditDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [period, setPeriod] = useState('24h')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [period])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/audit/dashboard?period=${period}&includeCharts=true&includeAlerts=true`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data.summary)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Auditoria</h2>
          <p className="text-muted-foreground">
            Visão geral das atividades e segurança do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logs de Auditoria</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAuditLogs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Atividades registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos de Segurança</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSecurityEvents || 0}</div>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant={stats?.criticalEvents ? 'destructive' : 'secondary'}>
                {stats?.criticalEvents || 0} críticos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.failedLogins || 0} tentativas falhadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.complianceScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Score de conformidade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e atividade recente */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividade ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <AuditStatsChart period={period} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityList />
          </CardContent>
        </Card>
      </div>

      {/* Alertas de segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Alertas de Segurança</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SecurityAlertsPanel />
        </CardContent>
      </Card>
    </div>
  )
}