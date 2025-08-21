import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Mock data para estatísticas
const mockEstatisticas = {
  total: 15,
  pendentes: 5,
  emAndamento: 7,
  concluidas: 3,
  valorTotal: 45000.00,
  valorMedio: 3000.00
}

export async function GET() {
  try {
    // Tentar autenticação, mas não falhar se não conseguir
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    // Simular um pequeno delay para mostrar loading
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json(mockEstatisticas)

  } catch (error) {
    console.error('Erro ao buscar estatísticas de ordens de serviço:', error)
    
    // Retornar estatísticas zeradas em caso de erro
    return NextResponse.json({
      total: 0,
      pendentes: 0,
      emAndamento: 0,
      concluidas: 0,
      valorTotal: 0,
      valorMedio: 0
    })
  }
}