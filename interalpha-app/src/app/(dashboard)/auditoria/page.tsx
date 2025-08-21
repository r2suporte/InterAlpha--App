import { Suspense } from 'react'
import { AuditDashboard } from '@/components/audit/audit-dashboard'
import { AuditDashboardSkeleton } from '@/components/audit/audit-dashboard-skeleton'

export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistema de Auditoria</h1>
        <p className="text-muted-foreground">
          Monitore atividades, eventos de segurança e compliance do sistema
        </p>
      </div>
      
      <Suspense fallback={<AuditDashboardSkeleton />}>
        <AuditDashboard />
      </Suspense>
    </div>
  )
}