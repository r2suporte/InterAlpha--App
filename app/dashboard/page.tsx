'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataField } from "@/components/ui/data-display"
import { StatusBadge } from "@/components/ui/status-badge"
import { Plus, TrendingUp, Calendar, Filter, Download, Server, Database, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

import data from "./data.json"

export default function Page() {
  const router = useRouter()

  const handleNewOS = () => {
    router.push('/dashboard/ordem-servico')
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30 min-h-screen">
          <div className="@container/main flex flex-1 flex-col">
            {/* Header Section */}
            <div className="px-4 lg:px-6 py-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    Dashboard Principal
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    Visão geral do seu sistema de gestão de ordens de serviço
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
                    <Calendar className="mr-2 h-4 w-4" />
                    Período
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg" onClick={handleNewOS}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova OS
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-6 py-6">
              {/* Metrics Cards */}
              <SectionCards />
              
              {/* Charts and Analytics */}
              <div className="px-4 lg:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Chart */}
                  <div className="lg:col-span-2">
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl font-semibold">Tendência de Ordens</CardTitle>
                            <CardDescription>Performance dos últimos 6 meses</CardDescription>
                          </div>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +12.5%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ChartAreaInteractive />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-6">
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
                        <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start h-12 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/50" onClick={handleNewOS}>
                          <Plus className="mr-3 h-4 w-4" />
                          Nova Ordem de Serviço
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                          <TrendingUp className="mr-3 h-4 w-4" />
                          Relatório Mensal
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12 border-slate-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-950/50">
                          <Download className="mr-3 h-4 w-4" />
                          Exportar Dados
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                          Status do Sistema
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <DataField
                          label="Servidor"
                          icon="server"
                          value={<StatusBadge status="success" text="Online" />}
                        />
                        <DataField
                          label="Backup"
                          icon="database"
                          value={<StatusBadge status="success" text="Atualizado" />}
                        />
                        <DataField
                          label="Sincronização"
                          icon="refreshCw"
                          value={<StatusBadge status="pending" text="Ativa" />}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="px-4 lg:px-6">
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Ordens de Serviço Recentes</CardTitle>
                    <CardDescription>Últimas ordens criadas e atualizadas</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <DataTable data={data} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
