import { Suspense } from 'react'
import { AuditReportsTable } from '@/components/audit/audit-reports-table'
import { ReportGenerator } from '@/components/audit/report-generator'
import { ComplianceReports } from '@/components/audit/compliance-reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

export default function AuditReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios de Auditoria</h1>
        <p className="text-muted-foreground">
          Gere e gerencie relatórios de auditoria e compliance
        </p>
      </div>

      <Tabs defaultValue="generator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generator">Gerar Relatório</TabsTrigger>
          <TabsTrigger value="audit-reports">Relatórios de Auditoria</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerador de Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Gerados</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <AuditReportsTable />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ComplianceReports />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}