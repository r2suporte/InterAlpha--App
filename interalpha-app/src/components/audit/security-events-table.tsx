'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  User,
  CheckCircle,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SecurityEvent {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  userId?: string
  timestamp: Date
  resolved: boolean
  ipAddress: string
}

export function SecurityEventsTable() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSecurityEvents()
  }, [])

  const fetchSecurityEvents = async () => {
    try {
      setLoading(true)
      // Dados mock para demonstração
      const mockEvents: SecurityEvent[] = [
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
          resolved: true,
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
      setEvents(mockEvents)
    } catch (error) {
      console.error('Error fetching security events:', error)
    } finally {
      setLoading(false)
    }
  }

  const resolveEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/audit/security-events/${eventId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: 'Resolvido manualmente' })
      })

      if (response.ok) {
        setEvents(events.map(event => 
          event.id === eventId ? { ...event, resolved: true } : event
        ))
      }
    } catch (error) {
      console.error('Error resolving event:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  if (loading) {
    return <div>Carregando eventos de segurança...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Severidade</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <code className="text-xs">{event.type}</code>
                </div>
              </TableCell>
              <TableCell className="max-w-md">
                {event.description}
              </TableCell>
              <TableCell>
                <Badge variant={getSeverityColor(event.severity) as any}>
                  {event.severity}
                </Badge>
              </TableCell>
              <TableCell>
                {event.userId ? (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{event.userId}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm">
                      {event.timestamp.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(event.timestamp, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {event.resolved ? (
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolvido
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!event.resolved && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => resolveEvent(event.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolver
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}