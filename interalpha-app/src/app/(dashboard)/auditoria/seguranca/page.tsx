import { Suspense } from 'react'
import { SecurityEventsTable } from '@/components/audit/security-events-table'
import { SecurityEventsFilters } from '@/components/audit/security-events-filters'
import { SecurityEventsSummary } from '@/components/audit/security-events-summary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function SecurityEventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Eventos de Segurança</h1>
        <p className="text-muted-foreground">
          Monitore e gerencie eventos de segurança do sistema
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <SecurityEventsSummary />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <SecurityEventsFilters />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <SecurityEventsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}