import { NextRequest, NextResponse } from 'next/server'
import { consultarCPF } from '@/lib/utils/document-validation'

export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json()

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    const result = await consultarCPF(cpf)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao validar CPF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}