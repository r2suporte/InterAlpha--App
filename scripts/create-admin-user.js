#!/usr/bin/env node

/**
 * Script para criar o usuário administrador do sistema
 * Este script deve ser executado apenas uma vez para configurar o admin inicial
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  const adminEmail = 'adm@interalpha.com.br'
  const adminPassword = 'InterAlpha2024!' // Senha temporária - deve ser alterada no primeiro login
  const adminName = 'Administrador do Sistema'

  try {
    console.log('🔄 Criando usuário administrador...')

    // 1. Verificar se o usuário já existe na tabela users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single()

    if (existingUser) {
      console.log('⚠️  Usuário administrador já existe na tabela users')
      
      // Atualizar para garantir que seja admin
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          name: adminName,
          is_active: true
        })
        .eq('email', adminEmail)

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError)
        return
      }

      console.log('✅ Usuário administrador atualizado com sucesso!')
      return
    }

    // 2. Criar usuário no Supabase Auth
    console.log('🔄 Criando usuário no Supabase Auth...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        name: adminName,
        role: 'admin'
      }
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError)
      return
    }

    console.log('✅ Usuário criado no Supabase Auth')

    // 3. Criar usuário na tabela users
    console.log('🔄 Criando usuário na tabela users...')
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        name: adminName,
        role: 'admin',
        is_active: true
      })

    if (insertError) {
      console.error('❌ Erro ao inserir usuário na tabela:', insertError)
      return
    }

    console.log('✅ Usuário administrador criado com sucesso!')
    console.log('')
    console.log('📋 Detalhes do usuário administrador:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Senha temporária: ${adminPassword}`)
    console.log(`   Role: admin`)
    console.log('')
    console.log('⚠️  IMPORTANTE: Altere a senha no primeiro login!')

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

// Executar o script
createAdminUser()
  .then(() => {
    console.log('🎉 Script executado com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro na execução do script:', error)
    process.exit(1)
  })