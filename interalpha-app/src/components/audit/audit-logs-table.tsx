'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
  ChevronLeft, 
  ChevronRight, 
  Eye,
  User,
  Clock,
  Activity
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AuditLogDetailsDialog } from './audit-log-details-dialog'

interface AuditLog {
  id: string
  userId: string
  userType: 'client' | 'employee'
  action: string
  resource: string
  resourceId?: string
  result: 'success' | 'failure'
  timestamp: Date
  ipAddress: string
  reason?: string
}

export function AuditLogsTable() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchAuditLogs()
  }, [searchParams])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', '20')
      
      // Adicionar filtros da URL
      searchParams.forEach((value, key) => {
        if (value) params.set(key, value)
      })

      const response = await fetch(`/api/audit/logs?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setLogs(data.data.entries || [])
        setPagination({
          page: data.data.page || 1,
          totalPages: data.data.totalPages || 1,
          total: data.data.total || 0
        })
      } else {
        // Dados mock para demonstração
        const mockLogs: AuditLog[] = [
          {
            id: '1',
            userId: 'admin123',
            userType: 'employee',
            action: 'create_client',
            resource: 'clients',
            resourceId: 'client-456',
            result: 'success',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            ipAddress: '192.168.1.100'
          },
          {
            id: '2',
            userId: 'user789',
            userType: 'client',
            action: 'view_order',
            resource: 'orders',
            resourceId: 'order-123',
            result: 'success',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            ipAddress: '10.0.0.50'
          },
          {
            id: '3',
            userId: 'admin456',
            userType: 'employee',
            action: 'delete_payment',
            resource: 'payments',
            resourceId: 'payment-789',
            result: 'failure',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            ipAddress: '192.168.1.101',
            reason: 'Insufficient permissions'
          }
        ]
        setLogs(mockLogs)
        setPagination({ page: 1, totalPages: 1, total: mockLogs.length })
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    fetchAuditLogs()
  }

  const getUserTypeColor = (userType: string) => {
    return userType === 'employee' ? 'default' : 'secondary'
  }

  const getResultColor = (result: string) => {
    return result === 'success' ? 'default' : 'destructive'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>IP</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{log.userId}</div>
                      <Badge variant={getUserTypeColor(log.userType) as any} className="text-xs">
                        {log.userType === 'employee' ? 'Funcionário' : 'Cliente'}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{log.action}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{log.resource}</div>
                    {log.resourceId && (
                      <div className="text-xs text-muted-foreground">
                        ID: {log.resourceId}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getResultColor(log.result) as any}>
                    {log.result === 'success' ? 'Sucesso' : 'Falha'}
                  </Badge>
                  {log.reason && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {log.reason}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm">
                        {log.timestamp.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(log.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {log.ipAddress}
                  </code>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {logs.length} de {pagination.total} registros
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <div className="text-sm">
            Página {pagination.page} de {pagination.totalPages}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialog de detalhes */}
      {selectedLog && (
        <AuditLogDetailsDialog
          log={selectedLog}
          open={!!selectedLog}
          onOpenChange={() => setSelectedLog(null)}
        />
      )}
    </div>
  )
}