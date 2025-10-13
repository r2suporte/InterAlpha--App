// Centraliza as rotas usadas pela aplicação para evitar strings literais espalhadas
export const ROUTES = {
  ROOT: '/',
  DASHBOARD: '/dashboard',
  ORDENS: '/dashboard/ordens-servico',
  ORDENS_NOVA: '/dashboard/ordens-servico/nova',
  PECAS: '/dashboard/pecas',
  PAGAMENTOS: '/dashboard/pagamentos',
  FINANCEIRO: '/dashboard/financeiro',
  FINANCEIRO_RECEITAS: '/dashboard/financeiro/receitas',
  FINANCEIRO_DESPESAS: '/dashboard/financeiro/despesas',
  CALCULADORA: '/dashboard/calculadora',
  RELATORIOS: '/dashboard/relatorios',
  METRICAS: '/dashboard/metricas',
  CLIENTES: '/dashboard/clientes',
  EQUIPAMENTOS: '/equipamentos',
  SETTINGS: '/settings',
  ADMIN_USERS: '/admin/users',
  ADMIN_SYSTEM: '/admin/system',
  ADMIN_SECURITY: '/admin/security',
  DOCS_USER_MANUAL: '/docs/user-manual',
  DOCS_ADMIN: '/docs/admin',
  PORTAL_LOGIN: '/portal/cliente/login',
};

export default ROUTES;
