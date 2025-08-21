'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  User,
  CheckCircle,
  X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SecurityAlert {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  userId?: string
  timestamp: Date
  resolved: boolean
  ipAddress: string
}

export function SecurityAlertsPanel() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSecurityAlerts()
  }, [])

  const fetchSecurityAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/security-events?resolved=false&limit=5')
      const data = await response.json()
      
      if (data.success) {
        setAlerts(data.data.entries || [])
      } else {
        // Dados mock para demonstração
        const mockAlerts: SecurityAlert[] = [
          {
            id: '1',
            type: 'MULTIPLE_FAILED_ATTEMPTS',
            severity: 'high',
            description: '5 tentativas de login falhadas em 10 minutos',
            userId: 'user123',
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            resolved: false,
            ipAddress: '192.168.1.100'
          },
          {
            id: '2',
            type: 'UNUSUAL_ACCESS_PATTERN',
            severity: 'medium',
            description: 'Acesso de localização incomum detectado',
            userId: 'user456',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            resolved: false,
            ipAddress: '10.0.0.50'
          },
          {
            id: '3',
            type: 'SUSPICIOUS_LOGIN',
            severity: 'critical',
            description: 'Tentativa de login com credenciais comprometidas',
            userId: 'admin789',
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
            resolved: false,
            ipAddress: '203.0.113.1'
          }
        ]
        setAlerts(mockAlerts)
      }
    } catch (error) {
      console.error('Error fetching security alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/audit/security-events/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolution: 'Resolvido manualmente pelo administrador'
        })
      })

      if (response.ok) {
        setAlerts(alerts.filter(alert => alert.id !== alertId))
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-48 animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Nenhum alerta ativo</h3>
        <p className="text-muted-foreground">
          Todos os eventos de segurança foram resolvidos
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Card key={alert.id} className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {getSeverityIcon(alert.severity)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{alert.description}</h4>
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {alert.userId && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{alert.userId}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(alert.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    
                    <span>IP: {alert.ipAddress}</span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => resolveAlert(alert.id)}
                className="ml-4"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Resolver
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}