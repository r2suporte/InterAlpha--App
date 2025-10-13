import { createBrowserClient } from '@supabase/ssr';

// Mock client para desenvolvimento quando Supabase não está disponível
const createMockClient = () => {
  const mockQueryBuilder = {
    select: (columns?: string) => mockQueryBuilder,
    insert: (data: any) => mockQueryBuilder,
    update: (data: any) => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    eq: (column: string, value: any) => mockQueryBuilder,
    neq: (column: string, value: any) => mockQueryBuilder,
    gt: (column: string, value: any) => mockQueryBuilder,
    gte: (column: string, value: any) => mockQueryBuilder,
    lt: (column: string, value: any) => mockQueryBuilder,
    lte: (column: string, value: any) => mockQueryBuilder,
    like: (column: string, pattern: string) => mockQueryBuilder,
    ilike: (column: string, pattern: string) => mockQueryBuilder,
    is: (column: string, value: any) => mockQueryBuilder,
    in: (column: string, values: any[]) => mockQueryBuilder,
    contains: (column: string, value: any) => mockQueryBuilder,
    containedBy: (column: string, value: any) => mockQueryBuilder,
    rangeGt: (column: string, value: any) => mockQueryBuilder,
    rangeGte: (column: string, value: any) => mockQueryBuilder,
    rangeLt: (column: string, value: any) => mockQueryBuilder,
    rangeLte: (column: string, value: any) => mockQueryBuilder,
    rangeAdjacent: (column: string, value: any) => mockQueryBuilder,
    overlaps: (column: string, value: any) => mockQueryBuilder,
    textSearch: (column: string, query: string) => mockQueryBuilder,
    match: (query: Record<string, any>) => mockQueryBuilder,
    not: (column: string, operator: string, value: any) => mockQueryBuilder,
    or: (filters: string) => mockQueryBuilder,
    filter: (column: string, operator: string, value: any) => mockQueryBuilder,
    order: (column: string, options?: { ascending?: boolean }) => mockQueryBuilder,
    limit: (count: number) => mockQueryBuilder,
    range: (from: number, to: number) => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (value: any) => any) => {
      return Promise.resolve({ data: [], error: null }).then(resolve);
    },
  };

  return {
    auth: {
      getUser: () => Promise.resolve({ 
        data: { user: { id: 'dev-user', email: 'dev@test.com' } }, 
        error: null 
      }),
      getSession: () => Promise.resolve({ 
        data: { session: { user: { id: 'dev-user', email: 'dev@test.com' } } }, 
        error: null 
      }),
      signOut: () => Promise.resolve({ error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      // Adiciona suporte ao método utilizado pela UI
      signInWithPassword: ({ email }: { email: string; password: string }) =>
        Promise.resolve({
          data: {
            user: { id: 'dev-user', email },
            session: {
              access_token: 'dev-access-token',
              refresh_token: 'dev-refresh-token',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            },
          },
          error: null,
        }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: (table: string) => mockQueryBuilder,
    rpc: (fn: string, params?: any) => Promise.resolve({ data: null, error: null }),
    storage: {
      from: (bucket: string) => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
      }),
    },
  } as any;
};

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Forçar modo de desenvolvimento offline para evitar erros de conexão
  // Remova esta condição quando tiver credenciais válidas do Supabase
  const isDevelopmentMode = false; // Alterado para false - credenciais do Supabase configuradas

  // Se as variáveis não estão configuradas, são inválidas, ou estamos em modo dev
  if (isDevelopmentMode || !supabaseUrl || !supabaseKey || 
      supabaseUrl.includes('localhost') || 
      supabaseKey.includes('Ej8Ej8Ej8') ||
      supabaseKey.length < 100) { // Chaves JWT válidas são longas
    console.warn('🔧 Supabase não configurado - usando modo de desenvolvimento offline');
    return createMockClient();
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error);
    console.warn('🔧 Usando modo de desenvolvimento offline');
    return createMockClient();
  }
}
