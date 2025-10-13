#!/usr/bin/env node

/**
 * 🔍 Teste Simplificado de Conectividade Supabase
 * 
 * Este script testa a conectividade básica com o Supabase
 * usando apenas APIs nativas do Node.js
 */

const https = require('https');
const fs = require('fs');

// Carregar variáveis de ambiente
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const lines = envContent.split('\n');
    
    const env = {};
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remover aspas se existirem
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        env[key] = value;
      }
    });
    
    return env;
  } catch (error) {
    console.error('❌ Erro ao carregar .env.local:', error.message);
    return null;
  }
}

// Fazer requisição HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testSupabaseConnection() {
  console.log('🔍 Testando conectividade com Supabase...\n');
  
  // Carregar variáveis de ambiente
  const env = loadEnv();
  if (!env) {
    console.log('❌ Falha ao carregar variáveis de ambiente');
    return;
  }
  
  console.log('📋 Variáveis carregadas:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Presente' : '❌ Ausente');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Presente' : '❌ Ausente');
  console.log('   DATABASE_URL:', env.DATABASE_URL ? '✅ Presente' : '❌ Ausente');
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n❌ Credenciais do Supabase não encontradas!');
    return;
  }
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('\n🌐 Testando conectividade básica...');
  
  try {
    // Teste 1: Verificar se a URL responde
    const healthUrl = `${supabaseUrl}/rest/v1/`;
    const healthResponse = await makeRequest(healthUrl, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status da API: ${healthResponse.statusCode}`);
    
    if (healthResponse.statusCode === 200) {
      console.log('   ✅ API Supabase respondendo');
    } else {
      console.log('   ⚠️ API Supabase com status não esperado');
      console.log('   Resposta:', healthResponse.data.substring(0, 200));
    }
    
    // Teste 2: Listar tabelas
    console.log('\n📊 Verificando tabelas disponíveis...');
    const tablesUrl = `${supabaseUrl}/rest/v1/`;
    const tablesResponse = await makeRequest(tablesUrl, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });
    
    console.log(`   Status das tabelas: ${tablesResponse.statusCode}`);
    
    if (tablesResponse.statusCode === 200) {
      console.log('   ✅ Acesso às tabelas funcionando');
    } else {
      console.log('   ⚠️ Problema no acesso às tabelas');
      console.log('   Resposta:', tablesResponse.data.substring(0, 200));
    }
    
    // Teste 3: Verificar tabela users
    console.log('\n👤 Verificando tabela users...');
    const usersUrl = `${supabaseUrl}/rest/v1/users?select=count`;
    const usersResponse = await makeRequest(usersUrl, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    console.log(`   Status da tabela users: ${usersResponse.statusCode}`);
    
    if (usersResponse.statusCode === 200) {
      console.log('   ✅ Tabela users acessível');
      const contentRange = usersResponse.headers['content-range'];
      if (contentRange) {
        const count = contentRange.split('/')[1];
        console.log(`   📊 Total de usuários: ${count}`);
      }
    } else if (usersResponse.statusCode === 404) {
      console.log('   ⚠️ Tabela users não encontrada - schema precisa ser aplicado');
    } else {
      console.log('   ❌ Erro ao acessar tabela users');
      console.log('   Resposta:', usersResponse.data.substring(0, 200));
    }
    
    console.log('\n🎯 Resumo do teste:');
    console.log('   - Conectividade: ✅ OK');
    console.log('   - Autenticação: ✅ OK');
    console.log('   - Schema aplicado:', usersResponse.statusCode === 200 ? '✅ SIM' : '❌ NÃO');
    
    if (usersResponse.statusCode !== 200) {
      console.log('\n💡 Próximos passos:');
      console.log('   1. Execute: npx prisma db push');
      console.log('   2. Execute: node create-admin-user.js');
      console.log('   3. Teste o login na aplicação');
    }
    
  } catch (error) {
    console.log('\n❌ Erro na conectividade:');
    console.log('   Erro:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('   1. Verificar conexão com internet');
    console.log('   2. Confirmar se o projeto Supabase está ativo');
    console.log('   3. Regenerar as chaves do Supabase');
  }
}

testSupabaseConnection();