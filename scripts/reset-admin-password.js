#!/usr/bin/env node

/**
 * Script para resetar a senha do usuário administrador no Supabase Auth
 * e sincronizar/garantir o registro correspondente na tabela `users`.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes (.env.local)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ADMIN_EMAIL = 'adm@interalpha.com.br';
const NEW_PASSWORD = 'InterAlpha2024!';
const ADMIN_NAME = 'Administrador do Sistema';
const ADMIN_ROLE = 'admin';

async function findAuthUserByEmail(email) {
  // Busca paginada para garantir que encontramos o usuário
  let page = 1;
  const perPage = 200;
  while (page <= 10) { // limite de páginas de segurança
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Erro ao listar usuários Auth: ${error.message}`);
    const found = data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (!data || !data.users || data.users.length < perPage) break; // última página
    page++;
  }
  return null;
}

async function ensureUsersTableRecord(authUser) {
  // Verificar registro na tabela users e sincronizar
  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('email', ADMIN_EMAIL)
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    throw new Error(`Erro ao consultar tabela users: ${selectError.message}`);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('users')
      .update({
        id: authUser.id, // garantir alinhamento
        name: ADMIN_NAME,
        role: ADMIN_ROLE,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('email', ADMIN_EMAIL);
    if (updateError) throw new Error(`Erro ao atualizar users: ${updateError.message}`);
  } else {
    const { error: insertError } = await supabase.from('users').insert({
      id: authUser.id,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: ADMIN_ROLE,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (insertError) throw new Error(`Erro ao inserir users: ${insertError.message}`);
  }
}

async function resetAdminPassword() {
  try {
    console.log('🔄 Buscando usuário admin no Supabase Auth...');
    const authUser = await findAuthUserByEmail(ADMIN_EMAIL);
    if (!authUser) {
      console.log('⚠️  Usuário admin não encontrado no Auth. Criando usuário...');
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: NEW_PASSWORD,
        email_confirm: true,
        user_metadata: { name: ADMIN_NAME, role: ADMIN_ROLE },
      });
      if (createError) throw new Error(`Erro ao criar usuário no Auth: ${createError.message}`);
      console.log('✅ Usuário admin criado no Auth');
      await ensureUsersTableRecord(createData.user);
      console.log('✅ Registro sincronizado na tabela users');
      return;
    }

    console.log('🔧 Resetando senha do usuário admin...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: NEW_PASSWORD,
      email_confirm: true,
      user_metadata: { name: ADMIN_NAME, role: ADMIN_ROLE },
    });
    if (updateError) throw new Error(`Erro ao resetar senha: ${updateError.message}`);
    console.log('✅ Senha resetada com sucesso no Auth');

    await ensureUsersTableRecord(authUser);
    console.log('✅ Registro verificado/sincronizado na tabela users');

    console.log('\n📋 Credenciais atualizadas:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${NEW_PASSWORD}`);
  } catch (error) {
    console.error('❌ Erro ao resetar senha do admin:', error.message || error);
    process.exit(1);
  }
}

resetAdminPassword()
  .then(() => {
    console.log('\n🎉 Operação concluída com sucesso!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Falha na operação:', err?.message || err);
    process.exit(1);
  });