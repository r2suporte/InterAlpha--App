import {
  BarChart3,
  Calendar,
  ClipboardList,
  Database,
  DollarSign,
  FileText,
  MessageSquare,
  Package,
  Phone,
  Settings,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  Bell,
  Building2,
  Calculator,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
} from 'lucide-react';

import { UserRole } from '@/lib/auth/permissions';
import { ROUTES } from '@/lib/routes';

export type NavItem = {
  title?: string;
  name?: string;
  url?: string;
  href?: string;
  icon?: any;
  badge?: string | number;
  description?: string;
};

export type RoleNavigation = {
  user: { name: string; email: string; avatar: string };
  navMain: NavItem[];
  navAnalytics?: NavItem[];
  navSecondary?: NavItem[];
  navDocuments?: NavItem[];
};

export const getRoleBasedNavigation = (role: UserRole): RoleNavigation => {
  const baseNavigation: RoleNavigation = {
    user: {
      name: 'Usuário',
      email: 'user@interalpha.com',
      avatar: '/avatars/user.jpg',
    },
    navMain: [
      {
        title: 'Dashboard',
        url: ROUTES.DASHBOARD,
        icon: BarChart3,
      },
    ],
    navAnalytics: [
      {
        title: 'Relatórios Básicos',
        url: '/analytics/basic',
        icon: FileText,
      },
    ],
    navSecondary: [
      {
        title: 'Configurações',
        url: ROUTES.SETTINGS,
        icon: Settings,
      },
    ],
    navDocuments: [
      {
        name: 'Manual do Usuário',
        url: ROUTES.DOCS_USER_MANUAL,
        icon: FileText,
      },
    ],
  };

  switch (role) {
    case 'admin':
      return {
        ...baseNavigation,
        user: {
          name: 'Super Admin',
          email: 'admin@interalpha.com',
          avatar: '/avatars/admin.jpg',
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: 'Gestão de Usuários',
            url: ROUTES.ADMIN_USERS,
            icon: Users,
          },
          {
            title: 'Sistema',
            url: ROUTES.ADMIN_SYSTEM,
            icon: Database,
          },
          {
            title: 'Segurança',
            url: ROUTES.ADMIN_SECURITY,
            icon: Shield,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics!,
          {
            title: 'Analytics Completo',
            url: '/analytics/complete',
            icon: TrendingUp,
          },
          {
            title: 'Auditoria',
            url: '/analytics/audit',
            icon: Shield,
          },
        ],
        navDocuments: [
          ...baseNavigation.navDocuments!,
          {
            name: 'Documentação Admin',
            url: '/docs/admin',
            icon: Shield,
          },
        ],
      };

    case 'diretor':
      return {
        ...baseNavigation,
        user: {
          name: 'Diretor',
          email: 'diretor@interalpha.com',
          avatar: '/avatars/diretor.jpg',
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: 'Gestão Estratégica',
            url: '/director/strategy',
            icon: TrendingUp,
          },
          {
            title: 'Relatórios Executivos',
            url: '/director/reports',
            icon: BarChart3,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics!,
          {
            title: 'KPIs Executivos',
            url: '/analytics/executive',
            icon: TrendingUp,
          },
        ],
      };

    case 'gerente_adm':
      return {
        ...baseNavigation,
        user: {
          name: 'Gerente Administrativo',
          email: 'gerente.adm@interalpha.com',
          avatar: '/avatars/gerente-adm.jpg',
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: 'Gestão de Equipe',
            url: '/gerente-adm/team',
            icon: Users,
          },
          {
            title: 'Operações',
            url: '/gerente-adm/operations',
            icon: Settings,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics!,
          {
            title: 'Relatórios Gerenciais',
            url: '/analytics/management',
            icon: BarChart3,
          },
        ],
      };

    case 'gerente_financeiro':
      return {
        ...baseNavigation,
        user: {
          name: 'Gerente Financeiro',
          email: 'gerente.fin@interalpha.com',
          avatar: '/avatars/financial.jpg',
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: 'Financeiro',
            url: '/financial',
            icon: DollarSign,
          },
          {
            title: 'Pagamentos',
            url: '/financial/payments',
            icon: DollarSign,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics!,
          {
            title: 'Relatórios Financeiros',
            url: '/analytics/financial',
            icon: DollarSign,
          },
        ],
      };

    case 'supervisor_tecnico':
      return {
        ...baseNavigation,
        user: {
          name: 'Supervisor Técnico',
          email: 'supervisor.tecnico@interalpha.com',
          avatar: '/avatars/supervisor-tecnico.jpg',
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: 'Ordens de Serviço',
            url: ROUTES.ORDENS,
            icon: ClipboardList,
          },
          {
            title: 'Equipe Técnica',
            url: '/supervisor-tecnico/team',
            icon: UserCheck,
          },
          {
            title: 'Peças e Estoque',
            url: '/supervisor-tecnico/inventory',
            icon: Package,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics!,
          {
            title: 'Relatórios Técnicos',
            url: '/analytics/technical',
            icon: Wrench,
          },
        ],
      };

    case 'technician':
      return {
        ...baseNavigation,
        user: {
          name: 'Técnico',
          email: 'tecnico@interalpha.com',
          avatar: '/avatars/technician.jpg',
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: 'Minhas Ordens',
            url: '/technician/orders',
            icon: Wrench,
          },
          {
            title: 'Peças',
            url: '/technician/parts',
            icon: Package,
          },
          {
            title: 'Agenda',
            url: '/technician/schedule',
            icon: Calendar,
          },
        ],
      };

    case 'atendente':
      return {
        ...baseNavigation,
        user: {
          name: 'Atendente',
          email: 'atendente@interalpha.com',
          avatar: '/avatars/attendant.jpg',
        },
        navMain: [
          ...baseNavigation.navMain,
          {
            title: 'Clientes',
            url: '/attendant/clients',
            icon: Users,
          },
          {
            title: 'Atendimento',
            url: '/attendant/support',
            icon: Phone,
          },
          {
            title: 'Ordens de Serviço',
            url: '/attendant/orders',
            icon: ClipboardList,
          },
        ],
        navAnalytics: [
          ...baseNavigation.navAnalytics!,
          {
            title: 'Atendimentos',
            url: '/analytics/support',
            icon: MessageSquare,
          },
        ],
      };

    default:
      return baseNavigation;
  }
};

export default getRoleBasedNavigation;

// Tipos e grupos de navegação para sidebars mais ricas (EnhancedSidebar)
export type SidebarNavItem = {
  title: string;
  href: string;
  icon: any;
  badge?: string | number;
  description?: string;
};

export type NavGroup = {
  label: string;
  items: SidebarNavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export const navigationGroups: NavGroup[] = [
  {
    label: 'Visão Geral',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Painel principal com métricas e resumos',
      },
      {
        title: 'Alertas',
        href: '/dashboard/alerts',
        icon: Bell,
        badge: '3',
        description: 'Notificações e alertas importantes',
      },
    ],
    defaultOpen: true,
  },
  {
    label: 'Operações',
    items: [
      {
        title: 'Clientes',
        href: '/dashboard/clientes',
        icon: Building2,
        description: 'Gerenciar clientes e contatos',
      },
      {
        title: 'Equipamentos',
        href: '/equipamentos',
        icon: HelpCircle,
        description: 'Controle de equipamentos',
      },
      {
        title: 'Ordens de Serviço',
        href: '/dashboard/ordens-servico',
        icon: LayoutDashboard,
        description: 'Gerenciar ordens de serviço',
      },
      {
        title: 'Peças',
        href: '/dashboard/pecas',
        icon: LayoutDashboard,
        description: 'Estoque e controle de peças',
      },
      {
        title: 'Pagamentos',
        href: '/dashboard/pagamentos',
        icon: CreditCard,
        description: 'Controle de pagamentos',
      },
    ],
    collapsible: true,
    defaultOpen: true,
  },
  {
    label: 'Financeiro',
    items: [
      {
        title: 'Visão Geral',
        href: '/dashboard/financeiro',
        icon: TrendingUp,
        description: 'Resumo financeiro',
      },
      {
        title: 'Receitas',
        href: '/dashboard/financeiro/receitas',
        icon: TrendingUp,
        description: 'Controle de receitas',
      },
      {
        title: 'Despesas',
        href: '/dashboard/financeiro/despesas',
        icon: TrendingUp,
        description: 'Controle de despesas',
      },
      {
        title: 'Calculadora',
        href: '/dashboard/calculadora',
        icon: Calculator,
        description: 'Calculadora financeira',
      },
    ],
    collapsible: true,
    defaultOpen: false,
  },
  {
    label: 'Análises',
    items: [
      {
        title: 'Relatórios',
        href: '/dashboard/relatorios',
        icon: BarChart3,
        description: 'Relatórios e análises',
      },
      {
        title: 'Métricas',
        href: '/dashboard/metricas',
        icon: TrendingUp,
        description: 'Métricas de performance',
      },
    ],
    collapsible: true,
    defaultOpen: false,
  },
  {
    label: 'Administração',
    items: [
      {
        title: 'Configurações',
        href: '/dashboard/configuracoes',
        icon: Settings,
        description: 'Configurações do sistema',
      },
      {
        title: 'Empresa',
        href: '/dashboard/empresa',
        icon: Building2,
        description: 'Dados da empresa',
      },
      {
        title: 'Ajuda',
        href: '/dashboard/ajuda',
        icon: HelpCircle,
        description: 'Central de ajuda',
      },
    ],
    collapsible: true,
    defaultOpen: false,
  },
];
