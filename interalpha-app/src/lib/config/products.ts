// Configurações específicas do módulo de produtos

export const PRODUCTS_CONFIG = {
  // Configurações de feature flags
  FEATURES: {
    ENABLE_IMAGE_UPLOAD: true,
    ENABLE_BARCODE_SCANNER: false, // Para implementação futura
    ENABLE_BULK_OPERATIONS: true,
    ENABLE_EXPORT_IMPORT: true,
    ENABLE_ADVANCED_FILTERS: true,
    ENABLE_PRODUCT_CATEGORIES: false, // Para implementação futura
    ENABLE_INVENTORY_TRACKING: false // Para implementação futura
  },

  // Configurações de UI
  UI: {
    DEFAULT_VIEW: 'table', // 'table' | 'grid' | 'list'
    ITEMS_PER_PAGE: 20,
    ENABLE_INFINITE_SCROLL: false,
    SHOW_THUMBNAILS: true,
    COMPACT_MODE: false
  },

  // Configurações de performance
  PERFORMANCE: {
    ENABLE_VIRTUALIZATION: false, // Para listas muito grandes
    DEBOUNCE_SEARCH_MS: 300,
    CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutos
    PREFETCH_NEXT_PAGE: true
  },

  // Configurações de validação
  VALIDATION: {
    STRICT_PART_NUMBER: true,
    ALLOW_DUPLICATE_DESCRIPTIONS: true,
    REQUIRE_IMAGE: false,
    MIN_MARGIN_WARNING: 5, // Avisar se margem < 5%
    MAX_PRICE_DIGITS: 8
  },

  // Configurações de storage
  STORAGE: {
    PROVIDER: 'local', // 'local' | 's3' | 'cloudinary'
    BASE_PATH: '/uploads/produtos',
    GENERATE_THUMBNAILS: true,
    OPTIMIZE_IMAGES: true,
    BACKUP_ORIGINALS: false
  },

  // Configurações de auditoria
  AUDIT: {
    ENABLE_AUDIT_LOG: true,
    LOG_VIEW_ACTIONS: false,
    LOG_SEARCH_ACTIONS: false,
    RETENTION_DAYS: 90
  },

  // Configurações de notificações
  NOTIFICATIONS: {
    ENABLE_EMAIL_ALERTS: false,
    ENABLE_BROWSER_NOTIFICATIONS: true,
    ALERT_ON_LOW_MARGIN: true,
    ALERT_ON_PRICE_CHANGES: true
  },

  // Configurações de integração
  INTEGRATIONS: {
    ENABLE_ORDER_INTEGRATION: true,
    ENABLE_REPORT_INTEGRATION: true,
    ENABLE_WEBHOOK_NOTIFICATIONS: false,
    SYNC_WITH_EXTERNAL_SYSTEMS: false
  }
} as const

// Função para verificar se uma feature está habilitada
export function isFeatureEnabled(feature: keyof typeof PRODUCTS_CONFIG.FEATURES): boolean {
  return PRODUCTS_CONFIG.FEATURES[feature]
}

// Função para obter configuração de UI
export function getUIConfig<K extends keyof typeof PRODUCTS_CONFIG.UI>(
  key: K
): typeof PRODUCTS_CONFIG.UI[K] {
  return PRODUCTS_CONFIG.UI[key]
}

// Função para obter configuração de performance
export function getPerformanceConfig<K extends keyof typeof PRODUCTS_CONFIG.PERFORMANCE>(
  key: K
): typeof PRODUCTS_CONFIG.PERFORMANCE[K] {
  return PRODUCTS_CONFIG.PERFORMANCE[key]
}

// Configurações específicas do ambiente
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  enableDebugLogs: process.env.NODE_ENV === 'development',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880'), // 5MB default
  cacheEnabled: process.env.REDIS_URL ? true : false
} as const