import { SupabaseClient } from '@supabase/supabase-js';

/**
 * 🚀 Query Optimizer - Utilitários para otimização de consultas
 * 
 * Este módulo fornece funções e padrões para otimizar queries do Supabase,
 * incluindo paginação eficiente, seleção de campos, índices e cache.
 */

// 📊 Interface para configuração de paginação
export interface PaginationConfig {
  page: number;
  limit: number;
  maxLimit?: number;
}

// 🔍 Interface para configuração de busca
export interface SearchConfig {
  query?: string;
  fields: string[];
  operator?: 'ilike' | 'like' | 'eq' | 'in';
}

// 📈 Interface para configuração de ordenação
export interface SortConfig {
  field: string;
  ascending?: boolean;
}

// 🎯 Interface para configuração de filtros
export interface FilterConfig {
  [key: string]: {
    value: any;
    operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'is' | 'ilike';
  };
}

// 📋 Interface para configuração completa de query
export interface QueryConfig {
  select?: string;
  pagination?: PaginationConfig;
  search?: SearchConfig;
  sort?: SortConfig;
  filters?: FilterConfig;
  relations?: string[];
}

/**
 * 🏗️ Query Builder - Construtor de queries otimizadas
 */
export class QueryBuilder {
  private supabase: SupabaseClient;
  private tableName: string;
  private query: any;

  constructor(supabase: SupabaseClient, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
    this.query = supabase.from(tableName);
  }

  /**
   * 🎯 Selecionar campos específicos (evita SELECT *)
   */
  select(fields: string = '*'): this {
    this.query = this.query.select(fields);
    return this;
  }

  /**
   * 🔍 Aplicar busca otimizada
   */
  search(config: SearchConfig): this {
    if (!config.query || config.query.trim() === '') {
      return this;
    }

    const searchTerm = config.query.trim();
    const operator = config.operator || 'ilike';
    
    if (config.fields.length === 1) {
      // Busca em um campo único
      const field = config.fields[0];
      if (operator === 'ilike') {
        this.query = this.query.ilike(field, `%${searchTerm}%`);
      } else {
        this.query = this.query[operator](field, searchTerm);
      }
    } else {
      // Busca em múltiplos campos usando OR
      const searchConditions = config.fields.map(field => {
        if (operator === 'ilike') {
          return `${field}.ilike.%${searchTerm}%`;
        }
        return `${field}.${operator}.${searchTerm}`;
      }).join(',');
      
      this.query = this.query.or(searchConditions);
    }

    return this;
  }

  /**
   * 🎛️ Aplicar filtros
   */
  filter(filters: FilterConfig): this {
    Object.entries(filters).forEach(([field, config]) => {
      const { value, operator = 'eq' } = config;
      
      if (value !== undefined && value !== null && value !== '') {
        this.query = this.query[operator](field, value);
      }
    });

    return this;
  }

  /**
   * 📈 Aplicar ordenação
   */
  sort(config: SortConfig): this {
    this.query = this.query.order(config.field, { 
      ascending: config.ascending !== false 
    });
    return this;
  }

  /**
   * 📄 Aplicar paginação eficiente
   */
  paginate(config: PaginationConfig): this {
    const { page, limit, maxLimit = 100 } = config;
    
    // Limitar o tamanho máximo da página
    const safeLimit = Math.min(limit, maxLimit);
    const from = (page - 1) * safeLimit;
    const to = from + safeLimit - 1;

    this.query = this.query.range(from, to);
    return this;
  }

  /**
   * 🔗 Incluir relações (joins)
   */
  include(relations: string[]): this {
    if (relations.length > 0) {
      const selectFields = relations.join(',');
      this.query = this.query.select(`*, ${selectFields}`);
    }
    return this;
  }

  /**
   * ⚡ Executar query com contagem otimizada
   */
  async execute(includeCount: boolean = false): Promise<{
    data: any[] | null;
    error: any;
    count?: number;
  }> {
    if (includeCount) {
      const { data, error, count } = await this.query;
      return { data, error, count };
    } else {
      const { data, error } = await this.query;
      return { data, error };
    }
  }

  /**
   * 📊 Executar query com contagem separada (mais eficiente para grandes datasets)
   */
  async executeWithSeparateCount(): Promise<{
    data: any[] | null;
    error: any;
    count: number;
  }> {
    // Executar query principal
    const { data, error } = await this.query;
    
    if (error) {
      return { data, error, count: 0 };
    }

    // Executar contagem separada (mais eficiente)
    const { count, error: countError } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    return {
      data,
      error: countError,
      count: count || 0
    };
  }
}

/**
 * 🎯 Factory function para criar QueryBuilder
 */
export function createQueryBuilder(supabase: SupabaseClient, tableName: string): QueryBuilder {
  return new QueryBuilder(supabase, tableName);
}

/**
 * 🚀 Função utilitária para queries otimizadas
 */
export async function optimizedQuery(
  supabase: SupabaseClient,
  tableName: string,
  config: QueryConfig
): Promise<{
  data: any[] | null;
  error: any;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const builder = createQueryBuilder(supabase, tableName);

  // Aplicar seleção de campos
  if (config.select) {
    builder.select(config.select);
  }

  // Aplicar busca
  if (config.search) {
    builder.search(config.search);
  }

  // Aplicar filtros
  if (config.filters) {
    builder.filter(config.filters);
  }

  // Aplicar ordenação
  if (config.sort) {
    builder.sort(config.sort);
  }

  // Aplicar relações
  if (config.relations) {
    builder.include(config.relations);
  }

  // Aplicar paginação
  if (config.pagination) {
    builder.paginate(config.pagination);
    
    // Executar com contagem para paginação
    const { data, error, count } = await builder.execute(true);
    
    const pagination = {
      page: config.pagination.page,
      limit: config.pagination.limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / config.pagination.limit)
    };

    return { data, error, count, pagination };
  } else {
    // Executar sem paginação
    const { data, error } = await builder.execute(false);
    return { data, error };
  }
}

/**
 * 📈 Utilitários para índices e performance
 */
export class PerformanceUtils {
  /**
   * 🔍 Sugestões de índices baseadas em queries comuns
   */
  static getIndexSuggestions(tableName: string): string[] {
    const suggestions: Record<string, string[]> = {
      'clientes': [
        'CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);',
        'CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);',
        'CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at DESC);',
        'CREATE INDEX IF NOT EXISTS idx_clientes_search ON clientes USING gin(to_tsvector(\'portuguese\', nome || \' \' || email));'
      ],
      'ordens_servico': [
        'CREATE INDEX IF NOT EXISTS idx_ordens_cliente_id ON ordens_servico(cliente_id);',
        'CREATE INDEX IF NOT EXISTS idx_ordens_status ON ordens_servico(status);',
        'CREATE INDEX IF NOT EXISTS idx_ordens_created_at ON ordens_servico(created_at DESC);',
        'CREATE INDEX IF NOT EXISTS idx_ordens_data_entrega ON ordens_servico(data_entrega_prevista);'
      ],
      'pecas': [
        'CREATE INDEX IF NOT EXISTS idx_pecas_part_number ON pecas(part_number);',
        'CREATE INDEX IF NOT EXISTS idx_pecas_fornecedor ON pecas(fornecedor_id);',
        'CREATE INDEX IF NOT EXISTS idx_pecas_categoria ON pecas(categoria_id);',
        'CREATE INDEX IF NOT EXISTS idx_pecas_estoque ON pecas(quantidade_estoque);'
      ],
      'communication_metrics': [
        'CREATE INDEX IF NOT EXISTS idx_metrics_service ON communication_metrics(service);',
        'CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON communication_metrics(timestamp DESC);',
        'CREATE INDEX IF NOT EXISTS idx_metrics_success ON communication_metrics(success);'
      ]
    };

    return suggestions[tableName] || [];
  }

  /**
   * ⚡ Verificar performance de query
   */
  static async analyzeQuery(
    supabase: SupabaseClient,
    query: string
  ): Promise<{ executionTime: number; plan?: any }> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.rpc('explain_query', { 
        query_text: query 
      });
      
      const executionTime = performance.now() - startTime;
      
      return {
        executionTime,
        plan: data
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      console.warn('Não foi possível analisar a query:', error);
      return { executionTime };
    }
  }

  /**
   * 📊 Métricas de performance de tabela
   */
  static async getTableStats(
    supabase: SupabaseClient,
    tableName: string
  ): Promise<{
    rowCount: number;
    tableSize: string;
    indexSize: string;
    lastAnalyze?: string;
  }> {
    try {
      const { data } = await supabase.rpc('get_table_stats', {
        table_name: tableName
      });

      return data || {
        rowCount: 0,
        tableSize: '0 bytes',
        indexSize: '0 bytes'
      };
    } catch (error) {
      console.warn('Não foi possível obter estatísticas da tabela:', error);
      return {
        rowCount: 0,
        tableSize: '0 bytes',
        indexSize: '0 bytes'
      };
    }
  }
}

export default QueryBuilder;