'use client';

import { LazyPresets, createLazyComponent } from '@/lib/utils/lazy-loading';

// Dashboard Financeiro
export const LazyDashboardFinanceiro = createLazyComponent(
  () => import('@/components/DashboardFinanceiro'),
  LazyPresets.dashboard
);

// Formulários
export const LazyOrdemServicoForm = createLazyComponent(
  () => import('@/components/OrdemServicoForm'),
  LazyPresets.form
);

export const LazyEquipamentoForm = createLazyComponent(
  () => import('@/components/equipamentos/EquipamentoForm'),
  LazyPresets.form
);

export const LazyPecaForm = createLazyComponent(
  () => import('@/components/PecaForm'),
  LazyPresets.form
);

// Tabelas e listas
export const LazyPecasOrdemServico = createLazyComponent(
  () => import('@/components/PecasOrdemServico'),
  LazyPresets.table
);

// Dashboards e visualizações
export const LazyMetricsDashboard = createLazyComponent(
  () => import('@/components/dashboard/metrics-dashboard'),
  LazyPresets.dashboard
);

export const LazyAlertsDashboard = createLazyComponent(
  () => import('@/components/alerts/alerts-dashboard'),
  LazyPresets.dashboard
);

// Componentes específicos de páginas
export const LazyClientesPage = createLazyComponent(
  () => import('@/app/dashboard/clientes/page'),
  LazyPresets.dashboard
);

export const LazyPecasPage = createLazyComponent(
  () => import('@/app/dashboard/pecas/page'),
  LazyPresets.dashboard
);

export const LazyPagamentosPage = createLazyComponent(
  () => import('@/app/dashboard/pagamentos/page'),
  LazyPresets.dashboard
);

export const LazyOrdensServicoPage = createLazyComponent(
  () => import('@/app/dashboard/ordens-servico/page'),
  LazyPresets.dashboard
);

// Exportação padrão com todos os componentes lazy
export default {
  DashboardFinanceiro: LazyDashboardFinanceiro,
  OrdemServicoForm: LazyOrdemServicoForm,
  EquipamentoForm: LazyEquipamentoForm,
  PecaForm: LazyPecaForm,
  PecasOrdemServico: LazyPecasOrdemServico,
  MetricsDashboard: LazyMetricsDashboard,
  AlertsDashboard: LazyAlertsDashboard,
  ClientesPage: LazyClientesPage,
  PecasPage: LazyPecasPage,
  PagamentosPage: LazyPagamentosPage,
  OrdensServicoPage: LazyOrdensServicoPage,
};
