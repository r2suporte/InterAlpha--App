'use client'

import { NextRequest, NextResponse } from 'next/server'
import { cpf, cnpj } from 'cpf-cnpj-validator'

export async function POST(request: NextRequest) {
  try {
    const { document, type } = await request.json()

    if (!document) {
      return NextResponse.json(
        { valid: false, error: 'Documento é obrigatório' },
        { status: 400 }
      )
    }

    // Remove formatação (pontos, traços, barras)
    const cleanDocument = document.replace(/[^\d]/g, '')

    // Detecta automaticamente o tipo se não fornecido
    let documentType = type
    if (!documentType || type === 'auto') {
      documentType = cleanDocument.length === 11 ? 'CPF' : 'CNPJ'
    }

    let isValid = false
    let errorMessage = ''

    if (documentType === 'CPF') {
      if (cleanDocument.length !== 11) {
        errorMessage = 'CPF deve ter 11 dígitos'
      } else {
        isValid = cpf.isValid(cleanDocument)
        if (!isValid) {
          errorMessage = 'CPF inválido'
        }
      }
    } else if (documentType === 'CNPJ') {
      if (cleanDocument.length !== 14) {
        errorMessage = 'CNPJ deve ter 14 dígitos'
      } else {
        isValid = cnpj.isValid(cleanDocument)
        if (!isValid) {
          errorMessage = 'CNPJ inválido'
        }
      }
    } else {
      errorMessage = 'Tipo de documento inválido'
    }

    if (isValid) {
      return NextResponse.json({
        valid: true,
        type: documentType,
        formatted: documentType === 'CPF' 
          ? cpf.format(cleanDocument)
          : cnpj.format(cleanDocument),
        clean: cleanDocument
      })
    } else {
      return NextResponse.json({
        valid: false,
        error: errorMessage,
        type: documentType
      })
    }

  } catch (error) {
    console.error('Erro na validação CPF/CNPJ:', error)
    return NextResponse.json(
      { valid: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}