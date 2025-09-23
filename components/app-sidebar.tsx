"use client"

import * as React from "react"
import {
  BarChart3,
  DollarSign,
  FileText,
  LayoutDashboardIcon,
  Package,
  Settings,
  TrendingUp,
  Users,
  Wrench,
  Calculator,
  PieChart,
  Receipt,
  CreditCard,
  HelpCircle,
  LogOut,
  Building2,
} from "lucide-react"

import { NavAnalytics } from "@/components/nav-analytics"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "InterAlpha",
    email: "admin@interalpha.com",
    avatar: "/avatars/interalpha.svg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Financeiro",
      url: "/dashboard/financeiro",
      icon: DollarSign,
      items: [
        {
          title: "Visão Geral",
          url: "/dashboard/financeiro",
        },
        {
          title: "Receitas",
          url: "/dashboard/financeiro/receitas",
        },
        {
          title: "Despesas",
          url: "/dashboard/financeiro/despesas",
        },
        {
          title: "Fluxo de Caixa",
          url: "/dashboard/financeiro/fluxo-caixa",
        },
      ],
    },
    {
      title: "Ordens de Serviço",
      url: "/dashboard/ordens-servico",
      icon: FileText,
      items: [
        {
          title: "Todas as Ordens",
          url: "/dashboard/ordens-servico",
        },
        {
          title: "Pendentes",
          url: "/dashboard/ordens-servico?status=pendente",
        },
        {
          title: "Em Andamento",
          url: "/dashboard/ordens-servico?status=em_andamento",
        },
        {
          title: "Concluídas",
          url: "/dashboard/ordens-servico?status=concluida",
        },
      ],
    },
    {
      title: "Clientes",
      url: "/dashboard/clientes",
      icon: Users,
    },
    {
      title: "Peças e Estoque",
      url: "/dashboard/pecas",
      icon: Package,
    },
  ],
  navAnalytics: [
    {
      title: "Relatórios",
      icon: BarChart3,
      url: "/dashboard/relatorios",
      items: [
        {
          title: "Relatório Financeiro",
          url: "/dashboard/relatorios/financeiro",
        },
        {
          title: "Relatório de Vendas",
          url: "/dashboard/relatorios/vendas",
        },
        {
          title: "Relatório de Estoque",
          url: "/dashboard/relatorios/estoque",
        },
      ],
    },
    {
      title: "Métricas",
      icon: TrendingUp,
      url: "/dashboard/metricas",
      items: [
        {
          title: "Performance",
          url: "/dashboard/metricas/performance",
        },
        {
          title: "Satisfação do Cliente",
          url: "/dashboard/metricas/satisfacao",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Configurações",
      url: "/dashboard/configuracoes",
      icon: Settings,
    },
    {
      title: "Ajuda",
      url: "/dashboard/ajuda",
      icon: HelpCircle,
    },
  ],
  documents: [
    {
      name: "Calculadora",
      url: "/dashboard/calculadora",
      icon: Calculator,
    },
    {
      name: "Relatórios",
      url: "/dashboard/relatorios",
      icon: Receipt,
    },
    {
      name: "Pagamentos",
      url: "/dashboard/pagamentos",
      icon: CreditCard,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" className="border-r border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm" {...props}>
      <SidebarHeader className="border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-3 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
            >
              <a href="#" className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
                    InterAlpha
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Sistema de Gestão
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-950/50 dark:to-slate-950">
        <div className="px-3 py-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Principal
          </div>
          <NavMain items={data.navMain} />
        </div>
        
        <div className="px-3 py-2 border-t border-slate-200/40 dark:border-slate-800/40">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Análises
          </div>
          <NavAnalytics items={data.navAnalytics} />
        </div>
        
        <div className="px-3 py-2 border-t border-slate-200/40 dark:border-slate-800/40">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Ferramentas
          </div>
          <NavDocuments items={data.documents} />
        </div>
        
        <div className="mt-auto px-3 py-2 border-t border-slate-200/40 dark:border-slate-800/40">
          <NavSecondary items={data.navSecondary} />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
