import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateClientCredentials, hashPassword } from '@/lib/auth/client-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, nome, telefone, cpf_cnpj, endereco, cidade, estado, cep } = await request.json()

    // Validação dos campos obrigatórios
    if (!email || !nome) {
      return NextResponse.json(
        { error: 'Email e nome são obrigatórios' },
        { status: 400 }
      )
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se o usuário já existe
    const { data: usuarioExistente, error: errorBusca } = await supabase
      .from('clientes_portal')
      .select('*')
      .eq('email', email)
      .single()

    if (errorBusca && errorBusca.code !== 'PGRST116') {
      console.error('Erro ao buscar usuário:', errorBusca)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuário já existe com este email' },
        { status: 409 }
      )
    }

    // Gerar credenciais para o novo usuário
    const credenciais = generateClientCredentials(email, nome)
    const senhaHash = await hashPassword(credenciais.senha)

    // Criar novo usuário no portal
    const { data: novoUsuario, error: errorCriacao } = await supabase
      .from('clientes_portal')
      .insert({
        email,
        nome,
        telefone: telefone || null,
        login: credenciais.login,
        senha_hash: senhaHash,
        senha_temporaria: credenciais.senha,
        ativo: true,
        primeiro_acesso: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (errorCriacao) {
      console.error('Erro ao criar usuário:', errorCriacao)
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    // Retornar dados do usuário criado (sem senha hash)
    const { senha_hash, ...usuarioSemSenha } = novoUsuario

    return NextResponse.json({
      success: true,
      message: 'Usuário registrado com sucesso',
      usuario: usuarioSemSenha,
      credenciais: {
        login: credenciais.login,
        senha_temporaria: credenciais.senha
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}