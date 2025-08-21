import { Suspense } from 'react'
import { AuditConfigForm } from '@/components/audit/audit-config-form'
import { AlertRulesManager } from '@/components/audit/alert-rules-manager'
import { RetentionPoliciesManager } from '@/components/audit/retention-policies-manager'
import { NotificationSettings } from '@/components/audit/notification-settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

export default function AuditConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações de Auditoria</h1>
        <p className="text-muted-foreground">
          Configure o sistema de auditoria, alertas e políticas de retenção
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="alerts">Regras de Alerta</TabsTrigger>
          <TabsTrigger value="retention">Políticas de Retenção</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <AuditConfigForm />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <NotificationSettings />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Alerta</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <AlertRulesManager />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Políticas de Retenção de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <RetentionPoliciesManager />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}