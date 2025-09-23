import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Cliente } from '@/types/ordens-servico'

// GET - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')

    const supabase = await createClient()

    let query = supabase
      .from('clientes')
      .select('*')

    // Aplicar filtro de busca
    if (search) {
      query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`)
    }

    // Aplicar paginação
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query
      .order('created_at', { ascending: false })
      .range(from, to)

    const { data: clientes, error, count } = await query

    if (error) {
      console.error('Erro ao buscar clientes:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar clientes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: clientes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Erro na listagem de clientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const { nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep } = await request.json()

    // Validação dos campos obrigatórios
    if (!nome || !email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
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

    // Validação de CPF/CNPJ se fornecido
    if (cpf_cnpj) {
      const cpfCnpjLimpo = cpf_cnpj.replace(/\D/g, '')
      if (cpfCnpjLimpo.length !== 11 && cpfCnpjLimpo.length !== 14) {
        return NextResponse.json(
          { error: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos' },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Verificar se já existe cliente com o mesmo email
    const { data: clienteExistente, error: errorBusca } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', email)
      .single()

    if (errorBusca && errorBusca.code !== 'PGRST116') {
      console.error('Erro ao buscar cliente:', errorBusca)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (clienteExistente) {
      return NextResponse.json(
        { error: 'Já existe um cliente cadastrado com este email' },
        { status: 409 }
      )
    }

    // Verificar se já existe cliente com o mesmo CPF/CNPJ (se fornecido)
    if (cpf_cnpj) {
      const { data: clienteCpfCnpj, error: errorBuscaCpfCnpj } = await supabase
        .from('clientes')
        .select('*')
        .eq('cpf_cnpj', cpf_cnpj)
        .single()

      if (errorBuscaCpfCnpj && errorBuscaCpfCnpj.code !== 'PGRST116') {
        console.error('Erro ao buscar cliente por CPF/CNPJ:', errorBuscaCpfCnpj)
        return NextResponse.json(
          { error: 'Erro interno do servidor' },
          { status: 500 }
        )
      }

      if (clienteCpfCnpj) {
        return NextResponse.json(
          { error: 'Já existe um cliente cadastrado com este CPF/CNPJ' },
          { status: 409 }
        )
      }
    }

    // Gerar numero_cliente manualmente (solução temporária)
    const currentYear = new Date().getFullYear()
    const { data: lastCliente } = await supabase
      .from('clientes')
      .select('numero_cliente')
      .like('numero_cliente', `CL${currentYear}%`)
      .order('numero_cliente', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (lastCliente?.numero_cliente) {
      const lastNumber = parseInt(lastCliente.numero_cliente.substring(6))
      nextNumber = lastNumber + 1
    }

    const numeroCliente = `CL${currentYear}${nextNumber.toString().padStart(6, '0')}`

    // Preparar dados para inserção
    const clienteData = {
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      telefone: telefone?.trim() || null,
      cpf_cnpj: cpf_cnpj?.replace(/\D/g, '') || null,
      endereco: endereco?.trim() || null,
      cidade: cidade?.trim() || null,
      estado: estado?.trim() || null,
      cep: cep?.replace(/\D/g, '') || null,
      numero_cliente: numeroCliente
    }

    // Inserir novo cliente
    const { data: novoCliente, error: errorCriacao } = await supabase
      .from('clientes')
      .insert(clienteData)
      .select()
      .single()

    if (errorCriacao) {
      console.error('Erro ao criar cliente:', errorCriacao)
      return NextResponse.json(
        { error: 'Erro ao criar cliente' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente criado com sucesso',
      data: novoCliente
    }, { status: 201 })

  } catch (error) {
    console.error('Erro na criação do cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar cliente existente
export async function PUT(request: NextRequest) {
  try {
    const { id, nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep } = await request.json()

    // Validação dos campos obrigatórios
    if (!id || !nome || !email) {
      return NextResponse.json(
        { error: 'ID, nome e email são obrigatórios' },
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

    // Verificar se o cliente existe
    const { data: clienteExistente, error: errorBusca } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (errorBusca) {
      console.error('Erro ao buscar cliente:', errorBusca)
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se email já está em uso por outro cliente
    const { data: clienteEmail, error: errorBuscaEmail } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', email)
      .neq('id', id)
      .single()

    if (errorBuscaEmail && errorBuscaEmail.code !== 'PGRST116') {
      console.error('Erro ao buscar cliente por email:', errorBuscaEmail)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (clienteEmail) {
      return NextResponse.json(
        { error: 'Email já está em uso por outro cliente' },
        { status: 409 }
      )
    }

    // Preparar dados para atualização
    const clienteData = {
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      telefone: telefone?.trim() || null,
      cpf_cnpj: cpf_cnpj?.replace(/\D/g, '') || null,
      endereco: endereco?.trim() || null,
      cidade: cidade?.trim() || null,
      estado: estado?.trim() || null,
      cep: cep?.replace(/\D/g, '') || null,
      updated_at: new Date().toISOString()
    }

    // Atualizar cliente
    const { data: clienteAtualizado, error: errorAtualizacao } = await supabase
      .from('clientes')
      .update(clienteData)
      .eq('id', id)
      .select()
      .single()

    if (errorAtualizacao) {
      console.error('Erro ao atualizar cliente:', errorAtualizacao)
      return NextResponse.json(
        { error: 'Erro ao atualizar cliente' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente atualizado com sucesso',
      data: clienteAtualizado
    })

  } catch (error) {
    console.error('Erro na atualização do cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}