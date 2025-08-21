/**
 * Configuração específica do Prisma para Ordens de Serviço Apple
 */

import { PrismaClient } from '@prisma/client'

declare global {
  var prismaApple: PrismaClient | undefined
}

export const prismaApple = globalThis.prismaApple || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaApple = prismaApple
}

// Funções utilitárias para Ordens de Serviço Apple
export const ordemServicoAppleUtils = {
  // Gerar número único para ordem de serviço
  gerarNumero: () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `OSA-${timestamp}-${random}`
  },

  // Calcular valor total
  calcularValorTotal: (valorPecas: number, valorMaoDeObra: number, desconto: number = 0) => {
    return Math.max(0, valorPecas + valorMaoDeObra - desconto)
  },

  // Verificar se garantia está ativa
  isGarantiaAtiva: (dataFim: Date) => {
    return new Date() <= dataFim
  },

  // Calcular dias restantes de garantia
  diasRestantesGarantia: (dataFim: Date) => {
    const hoje = new Date()
    const diff = dataFim.getTime() - hoje.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  },

  // Formatar status para exibição
  formatarStatus: (status: string) => {
    const statusMap: Record<string, string> = {
      'Recebido': 'Recebido',
      'Diagnosticando': 'Em Diagnóstico',
      'Aguardando Peças': 'Aguardando Peças',
      'Em Reparo': 'Em Reparo',
      'Testando': 'Em Teste',
      'Concluído': 'Concluído',
      'Entregue': 'Entregue',
      'Cancelado': 'Cancelado'
    }
    return statusMap[status] || status
  },

  // Formatar prioridade para exibição
  formatarPrioridade: (prioridade: string) => {
    const prioridadeMap: Record<string, string> = {
      'Baixa': 'Baixa',
      'Normal': 'Normal',
      'Alta': 'Alta',
      'Urgente': 'Urgente'
    }
    return prioridadeMap[prioridade] || prioridade
  },

  // Validar número de série Apple
  validarNumeroSerie: (numeroSerie: string) => {
    // Números de série Apple geralmente têm 10-12 caracteres alfanuméricos
    const regex = /^[A-Z0-9]{8,12}$/
    return regex.test(numeroSerie.toUpperCase())
  },

  // Validar IMEI
  validarIMEI: (imei: string) => {
    // IMEI deve ter 15 dígitos
    const regex = /^\d{15}$/
    return regex.test(imei)
  },

  // Obter cor do status para UI
  getStatusColor: (status: string) => {
    const colorMap: Record<string, string> = {
      'Recebido': 'blue',
      'Diagnosticando': 'yellow',
      'Aguardando Peças': 'orange',
      'Em Reparo': 'purple',
      'Testando': 'indigo',
      'Concluído': 'green',
      'Entregue': 'green',
      'Cancelado': 'red'
    }
    return colorMap[status] || 'gray'
  },

  // Obter cor da prioridade para UI
  getPrioridadeColor: (prioridade: string) => {
    const colorMap: Record<string, string> = {
      'Baixa': 'green',
      'Normal': 'blue',
      'Alta': 'orange',
      'Urgente': 'red'
    }
    return colorMap[prioridade] || 'gray'
  },

  // Obter cor da garantia para UI
  getGarantiaColor: (tipo: string) => {
    const colorMap: Record<string, string> = {
      'Garantia Apple': 'gray',
      'Garantia InterAlpha': 'blue',
      'Fora de Garantia': 'orange'
    }
    return colorMap[tipo] || 'gray'
  }
}

export default prismaApple