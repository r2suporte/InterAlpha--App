// Constantes para o módulo de produtos

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  ITEMS_PER_PAGE_OPTIONS: [10, 20, 50, 100]
} as const

// Configurações de imagem
export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  THUMBNAIL_SIZE: { width: 200, height: 200 },
  DISPLAY_SIZE: { width: 800, height: 600 },
  QUALITY: 85,
  THUMBNAIL_QUALITY: 70
} as const

// Configurações de validação
export const VALIDATION = {
  PART_NUMBER: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[A-Za-z0-9-]+$/,
    PATTERN_MESSAGE: 'Apenas letras, números e hífens são permitidos'
  },
  DESCRIPTION: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500
  },
  PRICE: {
    MIN_VALUE: 0.01,
    MAX_VALUE: 999999.99,
    DECIMAL_PLACES: 2
  }
} as const

// Status de produtos
export const PRODUCT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const

// Status de margem de lucro
export const MARGIN_STATUS = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative', 
  ZERO: 'zero'
} as const

// Cores para status de margem
export const MARGIN_COLORS = {
  [MARGIN_STATUS.POSITIVE]: 'text-green-600 bg-green-50',
  [MARGIN_STATUS.NEGATIVE]: 'text-red-600 bg-red-50',
  [MARGIN_STATUS.ZERO]: 'text-yellow-600 bg-yellow-50'
} as const

// Opções de ordenação
export const SORT_OPTIONS = [
  { value: 'partNumber', label: 'Part Number', icon: '🔤' },
  { value: 'description', label: 'Descrição', icon: '📝' },
  { value: 'costPrice', label: 'Preço de Custo', icon: '💰' },
  { value: 'salePrice', label: 'Preço de Venda', icon: '💵' },
  { value: 'profitMargin', label: 'Margem de Lucro', icon: '📈' },
  { value: 'createdAt', label: 'Data de Criação', icon: '📅' }
] as const

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  PART_NUMBER_REQUIRED: 'Part number é obrigatório',
  PART_NUMBER_INVALID: 'Part number deve conter apenas letras, números e hífens',
  PART_NUMBER_TOO_LONG: `Part number deve ter no máximo ${VALIDATION.PART_NUMBER.MAX_LENGTH} caracteres`,
  PART_NUMBER_EXISTS: 'Este part number já existe',
  
  DESCRIPTION_REQUIRED: 'Descrição é obrigatória',
  DESCRIPTION_TOO_LONG: `Descrição deve ter no máximo ${VALIDATION.DESCRIPTION.MAX_LENGTH} caracteres`,
  
  COST_PRICE_REQUIRED: 'Preço de custo é obrigatório',
  COST_PRICE_INVALID: 'Preço de custo deve ser um número válido',
  COST_PRICE_TOO_LOW: 'Preço de custo deve ser maior que zero',
  COST_PRICE_TOO_HIGH: `Preço de custo deve ser no máximo R$ ${VALIDATION.PRICE.MAX_VALUE.toLocaleString('pt-BR')}`,
  
  SALE_PRICE_REQUIRED: 'Preço de venda é obrigatório',
  SALE_PRICE_INVALID: 'Preço de venda deve ser um número válido',
  SALE_PRICE_TOO_LOW: 'Preço de venda deve ser maior que zero',
  SALE_PRICE_TOO_HIGH: `Preço de venda deve ser no máximo R$ ${VALIDATION.PRICE.MAX_VALUE.toLocaleString('pt-BR')}`,
  
  IMAGE_TOO_LARGE: `Imagem deve ter no máximo ${IMAGE_CONFIG.MAX_SIZE / (1024 * 1024)}MB`,
  IMAGE_INVALID_TYPE: 'Formato de imagem inválido. Use JPG, PNG ou WebP',
  
  PRODUCT_IN_USE: 'Produto não pode ser excluído pois está sendo usado em ordens de serviço',
  PRODUCT_NOT_FOUND: 'Produto não encontrado',
  
  GENERIC_ERROR: 'Ocorreu um erro inesperado. Tente novamente.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos e tente novamente.'
} as const

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Produto cadastrado com sucesso!',
  PRODUCT_UPDATED: 'Produto atualizado com sucesso!',
  PRODUCT_DELETED: 'Produto excluído com sucesso!',
  IMAGE_UPLOADED: 'Imagem enviada com sucesso!',
  DATA_EXPORTED: 'Dados exportados com sucesso!',
  DATA_IMPORTED: 'Dados importados com sucesso!'
} as const

// Configurações de cache
export const CACHE_CONFIG = {
  PRODUCTS_LIST: 'products:list',
  PRODUCT_STATS: 'products:stats',
  PRODUCT_DETAIL: 'products:detail',
  TTL: {
    PRODUCTS_LIST: 300, // 5 minutos
    PRODUCT_STATS: 600, // 10 minutos
    PRODUCT_DETAIL: 1800 // 30 minutos
  }
} as const

// Configurações de auditoria
export const AUDIT_ACTIONS = {
  PRODUCT_CREATED: 'product_created',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  PRODUCT_VIEWED: 'product_viewed',
  PRODUCTS_EXPORTED: 'products_exported',
  PRODUCTS_IMPORTED: 'products_imported'
} as const

// Configurações de notificação
export const NOTIFICATION_TYPES = {
  LOW_MARGIN_WARNING: 'low_margin_warning',
  PRICE_CHANGE_ALERT: 'price_change_alert',
  PRODUCT_USAGE_REPORT: 'product_usage_report'
} as const

// Thresholds para alertas
export const ALERT_THRESHOLDS = {
  LOW_MARGIN_PERCENTAGE: 10, // Alertar se margem < 10%
  SIGNIFICANT_PRICE_CHANGE: 20 // Alertar se mudança de preço > 20%
} as const