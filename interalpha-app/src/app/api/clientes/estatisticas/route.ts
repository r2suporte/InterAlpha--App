import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Mock data para estatísticas de clientes
const mockEstatisticas = {
  total: 25,
  novosEsteMs: 8,
  ativos: 22,
  inativos: 3,
  porTipo: {
    cpf: 18,
    cnpj: 7
  },
  porEstado: [
    { estado: 'SP', count: 12 },
    { estado: 'RJ', count: 6 },
    { estado: 'MG', count: 4 },
    { estado: 'RS', count: 2 },
    { estado: 'PR', count: 1 }
  ],
  crescimento: {
    percentual: 15.2,
    periodo: 'últimos 30 dias'
  }
}

export async function GET() {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    // Simular um pequeno delay para mostrar loading
    await new Promise(resolve => setTimeout(resolve, 150))

    return NextResponse.json(mockEstatisticas)

  } catch (error) {
    console.error('Erro ao buscar estatísticas de clientes:', error)
    
    // Retornar estatísticas zeradas em caso de erro
    return NextResponse.json({
      total: 0,
      novosEsteMs: 0,
      ativos: 0,
      inativos: 0,
      porTipo: { cpf: 0, cnpj: 0 },
      porEstado: [],
      crescimento: { percentual: 0, periodo: 'últimos 30 dias' }
    })
  }
}