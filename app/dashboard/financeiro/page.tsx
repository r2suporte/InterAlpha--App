"use client"

import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricasFinanceiras } from "@/components/dashboard/MetricasFinanceiras"
import { GraficosFinanceiros } from "@/components/dashboard/GraficosFinanceiros"
import { Button } from "@/components/ui/button"
import { Download, Filter, Calendar } from "lucide-react"

function DashboardFinanceiroSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-80 col-span-full lg:col-span-2" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80 col-span-full" />
      </div>
    </div>
  )
}

export default function FinanceiroPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
              <p className="text-muted-foreground">
                Acompanhe as métricas financeiras e performance do seu negócio
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Período
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <Suspense fallback={<DashboardFinanceiroSkeleton />}>
            <div className="space-y-6">
              {/* Métricas */}
              <MetricasFinanceiras />
              
              {/* Gráficos */}
              <GraficosFinanceiros />
            </div>
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}