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
import { Plus, TrendingUp, Calendar, Filter, Download, Server, Database, RefreshCw, MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { 
  ResponsiveContainer, 
  ResponsiveStack, 
  ResponsiveText, 
  useBreakpoint, 
  ShowHide 
} from '@/components/ui/responsive-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import data from "./data.json"

export default function Page() {
  const router = useRouter()
  const { isMobile } = useBreakpoint()

  const handleNewOS = () => {
    router.push('/dashboard/ordem-servico')
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30 min-h-screen">
          <div className="@container/main flex flex-1 flex-col">
            {/* Header Section */}
            <div className="px-4 lg:px-6 py-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <ResponsiveStack direction="responsive" align="center" className="space-y-4 sm:space-y-0">
                <div className="space-y-1">
                  <ResponsiveText 
                    size={isMobile ? "2xl" : "3xl"}
                    className="font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent"
                  >
                    Dashboard Principal
                  </ResponsiveText>
                  <ResponsiveText 
                    size={isMobile ? "sm" : "base"}
                    className="text-slate-600 dark:text-slate-400"
                  >
                    Visão geral do seu sistema de gestão de ordens de serviço
                  </ResponsiveText>
                </div>
                
                <ShowHide hide={['sm']}>
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
                </ShowHide>

                <ShowHide on={['sm']}>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg" onClick={handleNewOS}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova OS
                    </Button>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </ShowHide>
              </ResponsiveStack>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-6 py-6">
              {/* Metrics Cards */}
              <SectionCards />
              
              {/* Charts and Analytics */}
              <div className="px-4 lg:px-6">
                <ResponsiveStack direction="responsive" className="gap-6">
                  {/* Main Chart */}
                  <div className="w-full lg:flex-[2]">
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <ResponsiveStack direction="responsive" align="center" className="space-y-2 sm:space-y-0">
                          <div>
                            <ResponsiveText 
                              size={isMobile ? "base" : "lg"}
                              className="font-semibold text-slate-900 dark:text-slate-100"
                            >
                              Tendência de Ordens de Serviço
                            </ResponsiveText>
                            <ResponsiveText 
                              size="sm"
                              className="text-slate-600 dark:text-slate-400"
                            >
                              Últimos 30 dias
                            </ResponsiveText>
                          </div>
                          <ShowHide hide={['sm']}>
                            <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700">
                              <Download className="mr-2 h-4 w-4" />
                              Exportar
                            </Button>
                          </ShowHide>
                        </ResponsiveStack>
                      </CardHeader>
                      <CardContent>
                        <ChartAreaInteractive />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <div className="w-full lg:flex-1 space-y-6">
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                      <CardHeader>
                        <ResponsiveText 
                          size={isMobile ? "base" : "lg"}
                          className="font-semibold"
                        >
                          Ações Rápidas
                        </ResponsiveText>
                        <ResponsiveText 
                          size="sm"
                          className="text-slate-600 dark:text-slate-400"
                        >
                          Acesso rápido às principais funcionalidades
                        </ResponsiveText>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start h-12 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/50" onClick={handleNewOS}>
                          <Plus className="mr-3 h-4 w-4" />
                          <ResponsiveText size={isMobile ? "sm" : "base"}>
                            Nova Ordem de Serviço
                          </ResponsiveText>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                          <TrendingUp className="mr-3 h-4 w-4" />
                          <ResponsiveText size={isMobile ? "sm" : "base"}>
                            Relatório Mensal
                          </ResponsiveText>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12 border-slate-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-950/50">
                          <Download className="mr-3 h-4 w-4" />
                          <ResponsiveText size={isMobile ? "sm" : "base"}>
                            Exportar Dados
                          </ResponsiveText>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 backdrop-blur-sm">
                      <CardHeader>
                        <ResponsiveText 
                          size={isMobile ? "base" : "lg"}
                          className="font-semibold text-amber-900 dark:text-amber-100"
                        >
                          Status do Sistema
                        </ResponsiveText>
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
                </ResponsiveStack>
              </div>

              {/* Data Table */}
              <div className="px-4 lg:px-6">
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardHeader>
                    <ResponsiveText 
                      size={isMobile ? "lg" : "xl"}
                      className="font-semibold"
                    >
                      Ordens de Serviço Recentes
                    </ResponsiveText>
                    <ResponsiveText 
                      size="sm"
                      className="text-slate-600 dark:text-slate-400"
                    >
                      Últimas ordens criadas e atualizadas
                    </ResponsiveText>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <DataTable data={data} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  )
}
