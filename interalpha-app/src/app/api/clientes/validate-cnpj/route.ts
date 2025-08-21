import { NextRequest, NextResponse } from 'next/server'
import { consultarCNPJ } from '@/lib/utils/document-validation'

export async function POST(request: NextRequest) {
  try {
    const { cnpj } = await request.json()

    if (!cnpj) {
      return NextResponse.json(
        { error: 'CNPJ é obrigatório' },
        { status: 400 }
      )
    }

    const result = await consultarCNPJ(cnpj)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro ao validar CNPJ:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}