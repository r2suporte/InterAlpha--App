"use client"

import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricasFinanceiras } from "@/components/dashboard/MetricasFinanceiras"
import { GraficosFinanceiros } from "@/components/dashboard/GraficosFinanceiros"
import { Button } from "@/components/ui/button"
import { Download, Filter, Calendar, MoreVertical } from "lucide-react"
import { 
  ResponsiveContainer, 
  ResponsiveStack, 
  ResponsiveText,
  useBreakpoint,
  ShowHide
} from "@/components/ui/responsive-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const { isMobile } = useBreakpoint();

  const ActionButtons = () => (
    <>
      <ShowHide on={['md', 'lg', 'xl']}>
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
      </ShowHide>

      <ShowHide hide={['md', 'lg', 'xl']}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Calendar className="mr-2 h-4 w-4" />
              Período
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ShowHide>
    </>
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer padding="md" className="flex-1 space-y-6 pt-6">
          {/* Header */}
          <ResponsiveStack direction="responsive" align="start" className="justify-between">
            <div className="space-y-2">
              <ResponsiveText size="3xl" className="font-bold tracking-tight">
                Dashboard Financeiro
              </ResponsiveText>
              <ResponsiveText size="sm" className="text-muted-foreground">
                Acompanhe as métricas financeiras e performance do seu negócio
              </ResponsiveText>
            </div>
            <ActionButtons />
          </ResponsiveStack>

          {/* Conteúdo Principal */}
          <Suspense fallback={<DashboardFinanceiroSkeleton />}>
            <div className="space-y-6">
              {/* Métricas */}
              <MetricasFinanceiras />
              
              {/* Gráficos */}
              <GraficosFinanceiros />
            </div>
          </Suspense>
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  )
}