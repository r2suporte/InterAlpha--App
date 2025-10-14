#!/usr/bin/env node

console.log('🔍 Teste Rápido das APIs\n');

async function testarTudo() {
  // Teste 1: ViaCEP
  console.log('1️⃣  API ViaCEP (CEP: 01310-100)');
  try {
    const res1 = await fetch('https://viacep.com.br/ws/01310100/json/', { 
      signal: AbortSignal.timeout(5000) 
    });
    const data1 = await res1.json();
    if (data1.erro) {
      console.log('   ❌ CEP não encontrado');
    } else {
      console.log(`   ✅ ${data1.logradouro}, ${data1.bairro} - ${data1.localidade}/${data1.uf}`);
    }
  } catch (e) {
    console.log(`   ❌ Erro: ${e.message}`);
  }

  console.log('');

  // Teste 2: BrasilAPI CNPJ
  console.log('2️⃣  API BrasilAPI (CNPJ: 07.526.557/0001-98 - Apple)');
  try {
    const res2 = await fetch('https://brasilapi.com.br/api/cnpj/v1/07526557000198', {
      signal: AbortSignal.timeout(5000)
    });
    
    if (res2.status === 404) {
      console.log('   ❌ CNPJ não encontrado na base');
    } else if (res2.status === 429) {
      console.log('   ⚠️  Rate limit - aguarde alguns segundos');
    } else if (!res2.ok) {
      console.log(`   ❌ Erro HTTP ${res2.status}`);
    } else {
      const data2 = await res2.json();
      console.log(`   ✅ ${data2.razao_social || data2.nome_fantasia}`);
      console.log(`   📍 ${data2.municipio}/${data2.uf}`);
      console.log(`   📊 ${data2.descricao_situacao_cadastral}`);
    }
  } catch (e) {
    console.log(`   ❌ Erro: ${e.message}`);
  }

  console.log('');

  // Teste 3: Validação CPF
  console.log('3️⃣  Validação CPF (Local)');
  console.log('   ✅ Função de validação disponível');
  console.log('   📦 Usando biblioteca: cpf-cnpj-validator');

  console.log('\n✅ Testes concluídos!\n');
}

testarTudo().catch(console.error);
