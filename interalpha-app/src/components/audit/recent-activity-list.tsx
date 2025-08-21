'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  User, 
  Shield, 
  Activity, 
  Clock,
  AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityItem {
  id: string
  type: 'audit' | 'access' | 'security'
  action: string
  userId: string
  timestamp: Date
  result: 'success' | 'failure'
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export function RecentActivityList() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)
      // Simular dados (substituir pela implementação real)
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'security',
          action: 'Tentativa de login suspeita',
          userId: 'user123',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          result: 'failure',
          severity: 'high'
        },
        {
          id: '2',
          type: 'audit',
          action: 'Cliente criado',
          userId: 'admin456',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          result: 'success'
        },
        {
          id: '3',
          type: 'access',
          action: 'Login realizado',
          userId: 'user789',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          result: 'success'
        },
        {
          id: '4',
          type: 'audit',
          action: 'Ordem de serviço atualizada',
          userId: 'user123',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          result: 'success'
        },
        {
          id: '5',
          type: 'security',
          action: 'Múltiplas tentativas de login',
          userId: 'user999',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          result: 'failure',
          severity: 'medium'
        }
      ]
      
      setActivities(mockActivities)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <Shield className="h-4 w-4" />
      case 'access':
        return <User className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string, result: string, severity?: string) => {
    if (type === 'security') {
      switch (severity) {
        case 'critical':
          return 'destructive'
        case 'high':
          return 'destructive'
        case 'medium':
          return 'secondary'
        default:
          return 'outline'
      }
    }
    
    return result === 'success' ? 'default' : 'destructive'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-24 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4">
            <div className={`p-2 rounded-full ${
              activity.type === 'security' ? 'bg-red-100 text-red-600' :
              activity.type === 'access' ? 'bg-blue-100 text-blue-600' :
              'bg-green-100 text-green-600'
            }`}>
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none">
                  {activity.action}
                </p>
                <Badge 
                  variant={getActivityColor(activity.type, activity.result, activity.severity) as any}
                  className="text-xs"
                >
                  {activity.severity || activity.result}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{activity.userId}</span>
                <Clock className="h-3 w-3 ml-2" />
                <span>
                  {formatDistanceToNow(activity.timestamp, { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}