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
    <Sidebar 
      collapsible="icon" 
      className="bg-gradient-to-b from-slate-50/95 via-white/90 to-slate-100/95 dark:from-slate-900/95 dark:via-slate-950/90 dark:to-slate-900/95 border-r border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl shadow-xl sidebar-transition" 
      {...props}
    >
      <SidebarHeader className="border-b border-slate-200/30 dark:border-slate-700/30 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-blue-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-all duration-300"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-sidebar-primary-foreground shadow-lg">
                <Building2 className="size-4 text-white" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-lg bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
                  InterAlpha
                </span>
                <span className="truncate text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Sistema de Gestão
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-slate-50/30 via-white/50 to-slate-50/30 dark:from-slate-900/30 dark:via-slate-950/50 dark:to-slate-900/30 backdrop-blur-sm">
        <div className="px-4 py-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
            Principal
          </div>
          <NavMain items={data.navMain} />
        </div>
        
        <div className="px-4 py-3 border-t border-slate-200/30 dark:border-slate-700/30">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
            Análises
          </div>
          <NavAnalytics items={data.navAnalytics} />
        </div>
        
        <div className="px-4 py-3 border-t border-slate-200/30 dark:border-slate-700/30">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
            Ferramentas
          </div>
          <NavDocuments items={data.documents} />
        </div>
        
        <div className="mt-auto px-4 py-3 border-t border-slate-200/30 dark:border-slate-700/30">
          <NavSecondary items={data.navSecondary} />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/80 via-blue-50/40 to-slate-50/80 dark:from-slate-900/80 dark:via-blue-950/40 dark:to-slate-900/80 backdrop-blur-sm">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
