#!/usr/bin/env node
/**
 * Teste do fallback BrasilAPI → ReceitaWS
 */

console.log('🧪 Testando implementação com fallback\n');
console.log('═══════════════════════════════════════════════════\n');

// Simular a função com fallback
async function buscarDadosCNPJ(cnpjValue) {
  const cleanCnpj = cnpjValue.replace(/\D/g, '');

  console.log(`📋 CNPJ: ${cnpjValue} (${cleanCnpj})`);
  console.log('─────────────────────────────────────────────────\n');

  // TENTATIVA 1: BrasilAPI
  try {
    console.log('1️⃣  Tentando BrasilAPI...');
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ BrasilAPI SUCESSO\n');
      console.log('   📊 Dados recebidos:');
      console.log(`   - Razão Social: ${data.razao_social}`);
      console.log(`   - Situação: ${data.descricao_situacao_cadastral}`);
      console.log(`   - Município: ${data.municipio}/${data.uf}`);
      return { sucesso: true, fonte: 'BrasilAPI', data };
    }

    console.log(`   ⚠️  BrasilAPI retornou ${response.status}`);
    console.log('   ↪️  Tentando fallback...\n');
  } catch (error) {
    console.log(`   ❌ BrasilAPI falhou: ${error.message}`);
    console.log('   ↪️  Tentando fallback...\n');
  }

  // TENTATIVA 2: ReceitaWS
  try {
    console.log('2️⃣  Tentando ReceitaWS (fallback)...');
    const response = await fetch(
      `https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.log('   ⏳ Rate limit atingido (3 req/min)\n');
        return { sucesso: false, erro: 'rate_limit' };
      }
      console.log(`   ❌ ReceitaWS retornou ${response.status}\n`);
      return { sucesso: false, erro: `HTTP ${response.status}` };
    }

    const data = await response.json();

    if (data.status === 'ERROR') {
      console.log(`   ❌ ${data.message}\n`);
      return { sucesso: false, erro: data.message };
    }

    console.log('   ✅ ReceitaWS SUCESSO\n');
    console.log('   📊 Dados recebidos:');
    console.log(`   - Nome: ${data.nome}`);
    console.log(`   - Fantasia: ${data.fantasia || 'N/A'}`);
    console.log(`   - Situação: ${data.situacao}`);
    console.log(`   - Município: ${data.municipio}/${data.uf}`);
    
    return { sucesso: true, fonte: 'ReceitaWS', data };
  } catch (error) {
    console.log(`   ❌ ReceitaWS falhou: ${error.message}\n`);
    return { sucesso: false, erro: error.message };
  }
}

// Executar testes
async function executarTestes() {
  const cnpjs = [
    { cnpj: '00.000.000/0001-91', nome: 'Banco do Brasil' },
    { cnpj: '33.000.167/0001-01', nome: 'Caixa Econômica' },
  ];

  for (const { cnpj, nome } of cnpjs) {
    console.log(`🏢 ${nome}`);
    const resultado = await buscarDadosCNPJ(cnpj);
    
    if (resultado.sucesso) {
      console.log(`\n✅ SUCESSO via ${resultado.fonte}\n`);
    } else {
      console.log(`\n❌ FALHA: ${resultado.erro}\n`);
    }
    
    console.log('═══════════════════════════════════════════════════\n');
    
    // Delay para evitar rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('🎯 Teste de fallback concluído!');
  console.log('\n💡 Como funciona:');
  console.log('   1. Tenta BrasilAPI (rápida mas pode estar bloqueada)');
  console.log('   2. Se falhar, usa ReceitaWS (backup confiável)');
  console.log('   3. Se ambas falharem, retorna mensagem amigável');
}

executarTestes().catch(console.error);
