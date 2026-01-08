#!/usr/bin/env node

/**
 * 🔍 Teste de Conectividade com Supabase
 * Teste simples usando apenas APIs nativas do Node.js
 */

const https = require('https');
const fs = require('fs');

// Ler variáveis de ambiente do arquivo .env.local
function loadEnvFile() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // Remover aspas se existirem
          value = value.replace(/^["']|["']$/g, '');
          envVars[key] = value;
        }
      }
    });

    return envVars;
  } catch (error) {
    console.error('❌ Erro ao ler .env.local:', error.message);
    return {};
  }
}

// Fazer requisição HTTPS
function makeRequest(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
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

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testSupabaseConnection() {
  console.log('🔍 Testando conectividade com Supabase...\n');

  // Carregar variáveis de ambiente
  const env = loadEnvFile();

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('📋 Configurações:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Service Key: ${supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NÃO ENCONTRADA'}`);
  console.log('');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais do Supabase não encontradas!');
    return false;
  }

  try {
    // Testar conexão básica com a API REST do Supabase
    console.log('🔄 Testando conexão básica...');

    const testUrl = `${supabaseUrl}/rest/v1/`;
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    const response = await makeRequest(testUrl, headers);

    console.log(`📡 Status da resposta: ${response.statusCode}`);

    if (response.statusCode === 200) {
      console.log('✅ Conexão com Supabase estabelecida!');

      // Tentar listar tabelas
      console.log('\n🔄 Verificando tabelas disponíveis...');

      const tablesUrl = `${supabaseUrl}/rest/v1/`;
      const tablesResponse = await makeRequest(tablesUrl, headers);

      if (tablesResponse.statusCode === 200) {
        console.log('✅ API REST do Supabase está funcionando');

        // Tentar acessar a tabela users
        console.log('\n🔄 Testando acesso à tabela users...');

        const usersUrl = `${supabaseUrl}/rest/v1/users?select=count&limit=1`;
        const usersResponse = await makeRequest(usersUrl, headers);

        console.log(`📊 Status da consulta users: ${usersResponse.statusCode}`);

        if (usersResponse.statusCode === 200) {
          console.log('✅ Tabela users acessível!');
          console.log('📄 Resposta:', usersResponse.data);
        } else if (usersResponse.statusCode === 404) {
          console.log('⚠️  Tabela users não encontrada');
          console.log('💡 Execute: npx prisma db push');
        } else {
          console.log('⚠️  Erro ao acessar tabela users:', usersResponse.data);
        }
      }

      return true;

    } else if (response.statusCode === 401) {
      console.error('❌ Erro de autenticação (401)');
      console.log('💡 Possíveis problemas:');
      console.log('   - Service Role Key inválida');
      console.log('   - Projeto Supabase inativo');
      return false;

    } else if (response.statusCode === 404) {
      console.error('❌ Projeto não encontrado (404)');
      console.log('💡 Possíveis problemas:');
      console.log('   - URL do projeto incorreta');
      console.log('   - Projeto foi deletado');
      return false;

    }
    console.error(`❌ Erro HTTP ${response.statusCode}`);
    console.log('📄 Resposta:', response.data);
    return false;


  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);

    if (error.message.includes('timeout')) {
      console.log('💡 Problema de timeout - verifique sua conexão com a internet');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Problema de DNS - verifique a URL do Supabase');
    }

    return false;
  }
}

testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Teste de conectividade concluído com sucesso!');
      console.log('\n📋 Próximos passos:');
      console.log('   1. Execute: npx prisma db push');
      console.log('   2. Execute: node scripts/create-admin-user.js');
      console.log('   3. Acesse: http://localhost:3000/auth/login');
    } else {
      console.log('\n❌ Teste de conectividade falhou');
      console.log('\n🔧 Soluções possíveis:');
      console.log('   1. Verifique as credenciais no Supabase Dashboard');
      console.log('   2. Confirme se o projeto está ativo');
      console.log('   3. Regenere as chaves se necessário');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });