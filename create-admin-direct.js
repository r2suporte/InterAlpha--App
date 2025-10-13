#!/usr/bin/env node

/**
 * 🔧 Criação Direta de Usuário Administrador
 * 
 * Este script cria o usuário administrador diretamente via API do Supabase
 */

const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

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

// Hash da senha usando bcrypt simplificado
function hashPassword(password) {
  // Para desenvolvimento, vamos usar um hash simples
  // Em produção, use bcrypt adequado
  return crypto.createHash('sha256').update(`${password  }salt`).digest('hex');
}

async function createAdminUser() {
  console.log('👤 Criando usuário administrador...\n');
  
  // Carregar variáveis de ambiente
  const env = loadEnv();
  if (!env) {
    console.log('❌ Falha ao carregar variáveis de ambiente');
    return;
  }
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Credenciais do Supabase não encontradas!');
    return;
  }
  
  console.log('🔧 Configurações:');
  console.log('   URL:', supabaseUrl);
  console.log('   Service Key:', `${serviceKey.substring(0, 20)  }...`);
  
  try {
    // Primeiro, vamos verificar se a tabela users existe
    console.log('\n📊 Verificando tabela users...');
    const checkUrl = `${supabaseUrl}/rest/v1/users?select=count`;
    const checkResponse = await makeRequest(checkUrl, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    console.log(`Status da verificação: ${checkResponse.statusCode}`);
    
    if (checkResponse.statusCode === 404) {
      console.log('❌ Tabela users não encontrada!');
      console.log('💡 Execute: npx prisma db push');
      return;
    }
    
    if (checkResponse.statusCode !== 200) {
      console.log('❌ Erro ao verificar tabela users');
      console.log('Resposta:', checkResponse.data);
      return;
    }
    
    console.log('✅ Tabela users encontrada');
    
    // Criar usuário administrador
    console.log('\n👤 Criando usuário administrador...');
    
    const adminUser = {
      id: crypto.randomUUID(),
      email: 'adm@interalpha.com.br',
      name: 'Administrador',
      role: 'ADMIN',
      is_active: true,
      password: hashPassword('InterAlpha2024!'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const createUrl = `${supabaseUrl}/rest/v1/users`;
    const createResponse = await makeRequest(createUrl, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(adminUser)
    });
    
    console.log(`Status da criação: ${createResponse.statusCode}`);
    
    if (createResponse.statusCode === 201) {
      console.log('✅ Usuário administrador criado com sucesso!');
      console.log('\n🔑 Credenciais de acesso:');
      console.log('   Email: adm@interalpha.com.br');
      console.log('   Senha: InterAlpha2024!');
      console.log('   URL: http://localhost:3000/auth/login');
    } else if (createResponse.statusCode === 409) {
      console.log('⚠️ Usuário já existe - tentando atualizar...');
      
      // Tentar atualizar o usuário existente
      const updateUrl = `${supabaseUrl}/rest/v1/users?email=eq.adm@interalpha.com.br`;
      const updateResponse = await makeRequest(updateUrl, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: 'Administrador',
          role: 'ADMIN',
          is_active: true,
          password: hashPassword('InterAlpha2024!'),
          updated_at: new Date().toISOString()
        })
      });
      
      if (updateResponse.statusCode === 200) {
        console.log('✅ Usuário administrador atualizado!');
      } else {
        console.log('❌ Erro ao atualizar usuário');
        console.log('Resposta:', updateResponse.data);
      }
    } else {
      console.log('❌ Erro ao criar usuário');
      console.log('Resposta:', createResponse.data);
    }
    
  } catch (error) {
    console.log('\n❌ Erro na operação:');
    console.log('   Erro:', error.message);
  }
}

createAdminUser();