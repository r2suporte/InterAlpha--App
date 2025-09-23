"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/hooks/use-permissions"
import { UserRole } from "@/lib/auth/permissions"
import { 
  Settings, 
  Users, 
  FileText, 
  BarChart3, 
  Wrench, 
  Phone,
  Shield,
  Database,
  DollarSign,
  UserCheck,
  ClipboardList,
  Package,
  Calendar,
  MessageSquare,
  TrendingUp
} from "lucide-react"

// Configurações de navegação por role
const getRoleBasedNavigation = (role: UserRole) => {
  const baseNavigation = {
    user: {
      name: "Usuário",
      email: "user@interalpha.com",
      avatar: "/avatars/user.jpg",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: BarChart3,
      },
    ],
    navAnalytics: [
      {
        title: "Relatórios Básicos",
        url: "/analytics/basic",
        icon: FileText,
      },
    ],
    navSecondary: [
      {
        title: "Configurações",
        url: "/settings",
        icon: Settings,
      },
    ],
    navDocuments: [
      {
        name: "Manual do Usuário",
        url: "/docs/user-manual",
        icon: FileText,
      },
    ],
  }

  switch (role) {
    case 'admin':
      return {
        ...baseNavigation,
        user: {
          name: "Super Admin",
          email: "admin@interalpha.com",
          avatar: "/avatars/admin.jpg",
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: "Gestão de Usuários",
            url: "/admin/users",
            icon: Users,
          },
          {
            title: "Sistema",
            url: "/admin/system",
            icon: Database,
          },
          {
            title: "Segurança",
            url: "/admin/security",
            icon: Shield,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics,
          {
            title: "Analytics Completo",
            url: "/analytics/complete",
            icon: TrendingUp,
          },
          {
            title: "Auditoria",
            url: "/analytics/audit",
            icon: Shield,
          },
        ],
        navDocuments: [
          ...baseNavigation.navDocuments,
          {
            name: "Documentação Admin",
            url: "/docs/admin",
            icon: Shield,
          },
        ],
      }

    case 'diretor':
      return {
        ...baseNavigation,
        user: {
          name: "Diretor",
          email: "diretor@interalpha.com",
          avatar: "/avatars/diretor.jpg",
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: "Gestão Estratégica",
            url: "/director/strategy",
            icon: TrendingUp,
          },
          {
            title: "Relatórios Executivos",
            url: "/director/reports",
            icon: BarChart3,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics,
          {
            title: "KPIs Executivos",
            url: "/analytics/executive",
            icon: TrendingUp,
          },
        ],
      }

    case 'gerente_adm':
      return {
        ...baseNavigation,
        user: {
          name: "Gerente Administrativo",
          email: "gerente.adm@interalpha.com",
          avatar: "/avatars/gerente-adm.jpg",
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: "Gestão de Equipe",
            url: "/gerente-adm/team",
            icon: Users,
          },
          {
            title: "Operações",
            url: "/gerente-adm/operations",
            icon: Settings,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics,
          {
            title: "Relatórios Gerenciais",
            url: "/analytics/management",
            icon: BarChart3,
          },
        ],
      }

    case 'gerente_financeiro':
      return {
        ...baseNavigation,
        user: {
          name: "Gerente Financeiro",
          email: "gerente.fin@interalpha.com",
          avatar: "/avatars/financial.jpg",
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: "Financeiro",
            url: "/financial",
            icon: DollarSign,
          },
          {
            title: "Pagamentos",
            url: "/financial/payments",
            icon: DollarSign,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics,
          {
            title: "Relatórios Financeiros",
            url: "/analytics/financial",
            icon: DollarSign,
          },
        ],
      }

    case 'supervisor_tecnico':
      return {
        ...baseNavigation,
        user: {
          name: "Supervisor Técnico",
          email: "supervisor.tecnico@interalpha.com",
          avatar: "/avatars/supervisor-tecnico.jpg",
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: "Ordens de Serviço",
            url: "/supervisor-tecnico/orders",
            icon: ClipboardList,
          },
          {
            title: "Equipe Técnica",
            url: "/supervisor-tecnico/team",
            icon: UserCheck,
          },
          {
            title: "Peças e Estoque",
            url: "/supervisor-tecnico/inventory",
            icon: Package,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics,
          {
            title: "Relatórios Técnicos",
            url: "/analytics/technical",
            icon: Wrench,
          },
        ],
      }

    case 'technician':
      return {
        ...baseNavigation,
        user: {
          name: "Técnico",
          email: "tecnico@interalpha.com",
          avatar: "/avatars/technician.jpg",
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: "Minhas Ordens",
            url: "/technician/orders",
            icon: Wrench,
          },
          {
            title: "Peças",
            url: "/technician/parts",
            icon: Package,
          },
          {
            title: "Agenda",
            url: "/technician/schedule",
            icon: Calendar,
          },
        ],
      }

    case 'atendente':
      return {
        ...baseNavigation,
        user: {
          name: "Atendente",
          email: "atendente@interalpha.com",
          avatar: "/avatars/attendant.jpg",
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: "Clientes",
            url: "/attendant/clients",
            icon: Users,
          },
          {
            title: "Atendimento",
            url: "/attendant/support",
            icon: Phone,
          },
          {
            title: "Ordens de Serviço",
            url: "/attendant/orders",
            icon: ClipboardList,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics,
          {
            title: "Atendimentos",
            url: "/analytics/support",
            icon: MessageSquare,
          },
        ],
      }

    default:
      return baseNavigation
  }
}

export function RoleBasedSidebar({ ...props }: React.ComponentProps<typeof AppSidebar>) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full w-64 items-center justify-center border-r bg-background">
        <div className="text-sm text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-full w-64 items-center justify-center border-r bg-background">
        <div className="text-sm text-muted-foreground">Não autenticado</div>
      </div>
    )
  }

  // Para agora, vamos usar o AppSidebar padrão
  // TODO: Implementar customização baseada em role
  return <AppSidebar {...props} />
}