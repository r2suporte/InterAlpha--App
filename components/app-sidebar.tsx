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
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Building2 className="h-5 w-5" />
                <span className="text-base font-semibold">InterAlpha</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavAnalytics items={data.navAnalytics} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
