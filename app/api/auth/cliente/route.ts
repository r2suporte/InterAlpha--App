import { NextRequest, NextResponse } from 'next/server';

import {
  generateClientCredentials,
  hashPassword,
  verifyPassword,
} from '@/lib/auth/client-auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, nome, telefone, ordem_servico_id } = await request.json();

    if (!email || !nome || !ordem_servico_id) {
      return NextResponse.json(
        { error: 'Email, nome e ordem_servico_id são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se o cliente já existe
    const { data: clienteExistente, error: errorBusca } = await supabase
      .from('clientes_portal')
      .select('*')
      .eq('email', email)
      .single();

    if (errorBusca && errorBusca.code !== 'PGRST116') {
      console.error('Erro ao buscar cliente:', errorBusca);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    let cliente;
    let credenciais;

    if (clienteExistente) {
      // Cliente já existe, retornar credenciais existentes
      cliente = clienteExistente;
      credenciais = {
        login: cliente.login,
        senha: cliente.senha_temporaria || 'Senha já foi alterada',
      };
    } else {
      // Gerar novas credenciais
      credenciais = generateClientCredentials(email, nome);
      const senhaHash = await hashPassword(credenciais.senha);

      // Criar novo cliente no portal
      const { data: novoCliente, error: errorCriacao } = await supabase
        .from('clientes_portal')
        .insert({
          email,
          nome,
          telefone,
          login: credenciais.login,
          senha_hash: senhaHash,
          senha_temporaria: credenciais.senha,
          primeiro_acesso: true,
          ativo: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (errorCriacao) {
        console.error('Erro ao criar cliente:', errorCriacao);
        return NextResponse.json(
          { error: 'Erro ao criar cliente no portal' },
          { status: 500 }
        );
      }

      cliente = novoCliente;
    }

    // Associar cliente à ordem de serviço
    const { error: errorAssociacao } = await supabase
      .from('ordens_servico')
      .update({ cliente_portal_id: cliente.id })
      .eq('id', ordem_servico_id);

    if (errorAssociacao) {
      console.error('Erro ao associar cliente à OS:', errorAssociacao);
    }

    return NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        login: credenciais.login,
      },
      credenciais: {
        login: credenciais.login,
        senha: credenciais.senha,
      },
      primeiro_acesso: cliente.primeiro_acesso,
    });
  } catch (error) {
    console.error('Erro na API de autenticação do cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { login, senha_atual, nova_senha } = await request.json();

    if (!login || !senha_atual || !nova_senha) {
      return NextResponse.json(
        { error: 'Login, senha atual e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar cliente
    const { data: cliente, error: errorBusca } = await supabase
      .from('clientes_portal')
      .select('*')
      .eq('login', login)
      .single();

    if (errorBusca || !cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar senha atual
    const senhaValida = await verifyPassword(senha_atual, cliente.senha_hash);
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 401 }
      );
    }

    // Atualizar senha
    const novaSenhaHash = await hashPassword(nova_senha);
    const { error: errorUpdate } = await supabase
      .from('clientes_portal')
      .update({
        senha_hash: novaSenhaHash,
        senha_temporaria: null,
        primeiro_acesso: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cliente.id);

    if (errorUpdate) {
      console.error('Erro ao atualizar senha:', errorUpdate);
      return NextResponse.json(
        { error: 'Erro ao atualizar senha' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
