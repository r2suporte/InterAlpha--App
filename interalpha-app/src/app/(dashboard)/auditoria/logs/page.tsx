import { Suspense } from 'react'
import { AuditLogsTable } from '@/components/audit/audit-logs-table'
import { AuditLogsFilters } from '@/components/audit/audit-logs-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
        <p className="text-muted-foreground">
          Visualize e analise todos os logs de atividades do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogsFilters />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <AuditLogsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}