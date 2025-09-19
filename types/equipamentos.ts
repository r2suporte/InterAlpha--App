// Tipos de equipamentos Apple
export type TipoEquipamento = 
  | 'macbook_air'
  | 'macbook_pro' 
  | 'mac_mini'
  | 'imac'
  | 'mac_studio'
  | 'mac_pro'
  | 'ipad'

// Status de garantia
export type StatusGarantia = 
  | 'verificando'
  | 'ativa_apple'
  | 'ativa_loja' 
  | 'expirada'

// Severidade dos danos
export type SeveridadeDano = 'baixa' | 'media' | 'alta'

// Interface para danos no equipamento
export interface DanoEquipamento {
  tipo: string
  descricao: string
  severidade: SeveridadeDano
  observacoes?: string
}

// Interface para garantia
export interface GarantiaInfo {
  tipo: 'apple' | 'loja'
  ativa: boolean
  data_inicio?: Date
  data_fim?: Date
  numero_serie?: string
  observacoes?: string
}

// Interface para validação de serial
export interface SerialValidation {
  isValid: boolean
  message: string
  info?: {
    modelo?: string
    ano?: string
    semana?: string
  }
}

// Interface principal do equipamento
export interface EquipamentoApple {
  id: string
  tipo: TipoEquipamento
  modelo: string
  serial_number: string
  status_garantia: StatusGarantia
  garantia_apple_ate?: Date | null
  garantia_loja_ate?: Date | null
  fora_garantia: boolean
  descricao_problema: string
  problemas_identificados: string[]
  danos_equipamento: DanoEquipamento[]
  observacoes?: string
  created_at?: Date
  updated_at?: Date
}

// Interface para formulário
export interface EquipamentoFormData {
  tipo: TipoEquipamento
  modelo: string
  serial_number: string
  status_garantia: StatusGarantia
  garantia_apple_ate?: Date | null
  garantia_loja_ate?: Date | null
  fora_garantia: boolean
  descricao_problema: string
  problemas_identificados: string[]
  danos_equipamento: DanoEquipamento[]
  observacoes?: string
}

// Interface para histórico de reparos
export interface HistoricoReparo {
  id: string
  equipamento_id: string
  data_reparo: Date
  tipo_reparo: string
  descricao: string
  pecas_trocadas?: string[]
  valor?: number
  tecnico_responsavel?: string
  garantia_reparo_ate?: Date
  observacoes?: string
}

// Interface para validação de serial
export interface SerialValidation {
  isValid: boolean
  message: string
  info?: {
    modelo?: string
    ano?: string
    semana?: string
  }
}

// Labels para exibição
export const TIPO_EQUIPAMENTO_LABELS: Record<TipoEquipamento, string> = {
  macbook_air: 'MacBook Air',
  macbook_pro: 'MacBook Pro', 
  mac_mini: 'Mac Mini',
  imac: 'iMac',
  mac_studio: 'Mac Studio',
  mac_pro: 'Mac Pro',
  ipad: 'iPad'
}

// Modelos disponíveis por tipo de equipamento
export const MODELOS_APPLE: Record<TipoEquipamento, string[]> = {
  macbook_air: [
    'MacBook Air 13" M1 (2020)',
    'MacBook Air 13" M2 (2022)',
    'MacBook Air 15" M2 (2023)',
    'MacBook Air 13" M3 (2024)',
    'MacBook Air 15" M3 (2024)'
  ],
  macbook_pro: [
    'MacBook Pro 13" M1 (2020)',
    'MacBook Pro 14" M1 Pro/Max (2021)',
    'MacBook Pro 16" M1 Pro/Max (2021)',
    'MacBook Pro 13" M2 (2022)',
    'MacBook Pro 14" M2 Pro/Max (2023)',
    'MacBook Pro 16" M2 Pro/Max (2023)',
    'MacBook Pro 14" M3 Pro/Max (2023)',
    'MacBook Pro 16" M3 Pro/Max (2023)'
  ],
  mac_mini: [
    'Mac Mini M1 (2020)',
    'Mac Mini M2 (2023)',
    'Mac Mini M2 Pro (2023)'
  ],
  imac: [
    'iMac 24" M1 (2021)',
    'iMac 24" M3 (2023)'
  ],
  mac_studio: [
    'Mac Studio M1 Max (2022)',
    'Mac Studio M1 Ultra (2022)',
    'Mac Studio M2 Max (2023)',
    'Mac Studio M2 Ultra (2023)'
  ],
  mac_pro: [
    'Mac Pro M2 Ultra (2023)'
  ],
  ipad: [
    'iPad 9ª geração (2021)',
    'iPad 10ª geração (2022)',
    'iPad Air 4ª geração (2020)',
    'iPad Air 5ª geração (2022)',
    'iPad Pro 11" 3ª geração (2021)',
    'iPad Pro 12.9" 5ª geração (2021)',
    'iPad Pro 11" 4ª geração (2022)',
    'iPad Pro 12.9" 6ª geração (2022)',
    'iPad mini 6ª geração (2021)'
  ]
}

// Problemas comuns por tipo de equipamento
export const PROBLEMAS_COMUNS: Record<TipoEquipamento, string[]> = {
  macbook_air: [
    'Não liga',
    'Tela preta',
    'Superaquecimento',
    'Bateria não carrega',
    'Teclado não funciona',
    'Trackpad não responde',
    'Wi-Fi não conecta',
    'Som não funciona',
    'Câmera não funciona'
  ],
  macbook_pro: [
    'Não liga',
    'Tela preta',
    'Superaquecimento',
    'Bateria não carrega',
    'Teclado não funciona',
    'Trackpad não responde',
    'Wi-Fi não conecta',
    'Som não funciona',
    'Câmera não funciona',
    'Touch Bar não funciona',
    'Portas Thunderbolt não funcionam'
  ],
  mac_mini: [
    'Não liga',
    'Não dá vídeo',
    'Superaquecimento',
    'Wi-Fi não conecta',
    'Bluetooth não funciona',
    'Portas USB não funcionam',
    'Som não funciona'
  ],
  imac: [
    'Não liga',
    'Tela com problemas',
    'Superaquecimento',
    'Wi-Fi não conecta',
    'Bluetooth não funciona',
    'Câmera não funciona',
    'Som não funciona',
    'Portas não funcionam'
  ],
  mac_studio: [
    'Não liga',
    'Superaquecimento',
    'Wi-Fi não conecta',
    'Bluetooth não funciona',
    'Portas Thunderbolt não funcionam',
    'Som não funciona'
  ],
  mac_pro: [
    'Não liga',
    'Superaquecimento',
    'Wi-Fi não conecta',
    'Bluetooth não funciona',
    'Portas Thunderbolt não funcionam',
    'Som não funciona',
    'Problemas com placas de expansão'
  ],
  ipad: [
    'Não liga',
    'Tela quebrada',
    'Touch não funciona',
    'Bateria não carrega',
    'Wi-Fi não conecta',
    'Câmera não funciona',
    'Som não funciona',
    'Apple Pencil não funciona',
    'Botão Home não funciona'
  ]
}

// Função para validar serial number Apple
export function validarSerialApple(serial: string): SerialValidation {
  if (!serial || serial.length < 8) {
    return { isValid: false, message: 'Serial number deve ter pelo menos 8 caracteres' }
  }

  if (serial.length > 12) {
    return { isValid: false, message: 'Serial number não pode ter mais de 12 caracteres' }
  }

  // Validação básica de formato (letras e números)
  const serialRegex = /^[A-Z0-9]+$/
  if (!serialRegex.test(serial)) {
    return { isValid: false, message: 'Serial number deve conter apenas letras maiúsculas e números' }
  }

  // Extrair informações do serial (simulação baseada em padrões Apple)
  let info: { modelo?: string; ano?: string; semana?: string } = {}
  
  if (serial.length >= 10) {
    // Para seriais de 10+ caracteres (formato mais recente)
    const anoChar = serial.charAt(3)
    const semanaChars = serial.substring(4, 6)
    
    // Mapeamento simplificado de anos (baseado em padrões Apple)
    const anoMap: Record<string, string> = {
      'H': '2020', 'J': '2021', 'K': '2022', 'L': '2023', 'M': '2024', 'N': '2025'
    }
    
    info = {
      ano: anoMap[anoChar] || 'Desconhecido',
      semana: semanaChars
    }
  }

  return { 
    isValid: true, 
    message: 'Serial number válido',
    info
  }
}

// Função para consultar garantia Apple (simulação)
export function consultarGarantiaApple(serial: string): Promise<{
  status: StatusGarantia
  garantia_apple_ate?: Date
  garantia_loja_ate?: Date
  modelo_detectado?: string
}> {
  return new Promise((resolve) => {
    // Simular delay de consulta
    setTimeout(() => {
      const validation = validarSerialApple(serial)
      
      if (!validation.isValid) {
        resolve({
          status: 'expirada'
        })
        return
      }

      // Simular diferentes cenários baseados no serial
      const lastChar = serial.charAt(serial.length - 1)
      const now = new Date()
      
      if (['A', 'B', 'C'].includes(lastChar)) {
        // Garantia Apple ativa
        const garantiaApple = new Date(now)
        garantiaApple.setFullYear(now.getFullYear() + 1)
        
        resolve({
          status: 'ativa_apple',
          garantia_apple_ate: garantiaApple,
          modelo_detectado: 'MacBook Pro 14" M3 (2023)'
        })
      } else if (['D', 'E', 'F'].includes(lastChar)) {
        // Garantia da loja ativa
        const garantiaLoja = new Date(now)
        garantiaLoja.setFullYear(now.getFullYear() + 2)
        
        resolve({
          status: 'ativa_loja',
          garantia_loja_ate: garantiaLoja,
          modelo_detectado: 'MacBook Air 13" M2 (2022)'
        })
      } else {
        // Garantia expirada
        resolve({
          status: 'expirada',
          modelo_detectado: 'iMac 24" M1 (2021)'
        })
      }
    }, 1500) // Simular 1.5s de consulta
  })
}