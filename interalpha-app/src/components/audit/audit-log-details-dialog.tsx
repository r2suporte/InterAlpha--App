'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Activity, 
  Clock, 
  Globe, 
  Monitor,
  FileText,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  userAgent?: string
  reason?: string
  oldData?: any
  newData?: any
  metadata?: any
}

interface AuditLogDetailsDialogProps {
  log: AuditLog
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditLogDetailsDialog({ log, open, onOpenChange }: AuditLogDetailsDialogProps) {
  const formatJsonData = (data: any) => {
    if (!data) return null
    return JSON.stringify(data, null, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Detalhes do Log de Auditoria</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Usuário:</span>
                <span>{log.userId}</span>
                <Badge variant={log.userType === 'employee' ? 'default' : 'secondary'}>
                  {log.userType === 'employee' ? 'Funcionário' : 'Cliente'}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Ação:</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">{log.action}</code>
              </div>

              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Recurso:</span>
                <span>{log.resource}</span>
                {log.resourceId && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <code className="bg-muted px-2 py-1 rounded text-sm">{log.resourceId}</code>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Data/Hora:</span>
                <span>{format(log.timestamp, "PPP 'às' HH:mm:ss", { locale: ptBR })}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">IP:</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">{log.ipAddress}</code>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-medium">Resultado:</span>
                <Badge variant={log.result === 'success' ? 'default' : 'destructive'}>
                  {log.result === 'success' ? 'Sucesso' : 'Falha'}
                </Badge>
              </div>
            </div>
          </div>

          {/* User Agent */}
          {log.userAgent && (
            <>
              <Separator />
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">User Agent:</span>
                </div>
                <code className="block bg-muted p-3 rounded text-sm break-all">
                  {log.userAgent}
                </code>
              </div>
            </>
          )}

          {/* Reason */}
          {log.reason && (
            <>
              <Separator />
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Motivo:</span>
                </div>
                <div className="bg-muted p-3 rounded">
                  {log.reason}
                </div>
              </div>
            </>
          )}

          {/* Data Changes */}
          {(log.oldData || log.newData) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Alterações de Dados</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {log.oldData && (
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-muted-foreground">
                        Dados Anteriores
                      </h5>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        {formatJsonData(log.oldData)}
                      </pre>
                    </div>
                  )}

                  {log.newData && (
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-muted-foreground">
                        Dados Novos
                      </h5>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        {formatJsonData(log.newData)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          {log.metadata && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Metadados</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  {formatJsonData(log.metadata)}
                </pre>
              </div>
            </>
          )}

          {/* ID do Log */}
          <Separator />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">ID do Log:</span> {log.id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}