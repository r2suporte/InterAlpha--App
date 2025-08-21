import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { nome, email, empresa, telefone, mensagem } = await request.json()

    // Validação básica
    if (!nome || !email) {
      return NextResponse.json(
        { success: false, error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Simular processamento da solicitação
    console.log('Nova solicitação de chave de acesso:', {
      nome,
      email,
      empresa,
      telefone,
      mensagem,
      timestamp: new Date().toISOString(),
      ip: getClientIP(request)
    })

    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Em produção, aqui você:
    // 1. Salvaria no banco de dados
    // 2. Enviaria email para o administrador
    // 3. Criaria um ticket no sistema
    // 4. Enviaria confirmação por email
    // 5. Geraria uma chave temporária se aprovado automaticamente

    return NextResponse.json({
      success: true,
      message: 'Solicitação enviada com sucesso! Entraremos em contato em até 24 horas.',
      data: {
        requestId: `REQ-${Date.now()}`,
        estimatedResponse: '24 horas'
      }
    })

  } catch (error) {
    console.error('Erro ao processar solicitação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função auxiliar para obter IP do cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}