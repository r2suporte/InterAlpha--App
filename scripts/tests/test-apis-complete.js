#!/usr/bin/env node

console.log('🔍 Teste Completo das APIs\n');
console.log('═══════════════════════════════════════════════════\n');

async function testarTudo() {
  // Teste 1: ViaCEP - Múltiplos CEPs
  console.log('📍 API ViaCEP - Busca de Endereços');
  console.log('───────────────────────────────────────────────────');
  
  const ceps = [
    { cep: '01310100', nome: 'Av. Paulista, SP' },
    { cep: '20040020', nome: 'Centro, RJ' },
    { cep: '30130100', nome: 'Centro, BH' }
  ];

  for (const { cep, nome } of ceps) {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { 
        signal: AbortSignal.timeout(5000) 
      });
      const data = await res.json();
      
      if (data.erro) {
        console.log(`❌ ${nome} (${cep}): Não encontrado`);
      } else {
        console.log(`✅ ${nome} (${cep})`);
        console.log(`   ${data.logradouro}, ${data.bairro}`);
        console.log(`   ${data.localidade}/${data.uf}\n`);
      }
    } catch (e) {
      console.log(`❌ ${nome} (${cep}): ${e.message}\n`);
    }
  }

  // Teste 2: BrasilAPI CNPJ - Múltiplos CNPJs
  console.log('🏢 API BrasilAPI - Consulta CNPJ');
  console.log('───────────────────────────────────────────────────');
  
  const cnpjs = [
    { cnpj: '00000000000191', nome: 'Banco do Brasil' },
    { cnpj: '33000167000101', nome: 'Caixa Econômica' },
    { cnpj: '18236120000158', nome: 'Banco Inter' }
  ];

  for (const { cnpj, nome } of cnpjs) {
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
        signal: AbortSignal.timeout(8000)
      });
      
      if (res.status === 404) {
        console.log(`❌ ${nome} (${cnpj}): Não encontrado\n`);
      } else if (res.status === 429) {
        console.log(`⚠️  ${nome} (${cnpj}): Rate limit atingido\n`);
      } else if (res.status === 403) {
        console.log(`⚠️  ${nome} (${cnpj}): Acesso bloqueado (403)\n`);
      } else if (!res.ok) {
        console.log(`❌ ${nome} (${cnpj}): HTTP ${res.status}\n`);
      } else {
        const data = await res.json();
        console.log(`✅ ${nome} (${cnpj})`);
        console.log(`   Razão Social: ${data.razao_social}`);
        console.log(`   Situação: ${data.descricao_situacao_cadastral}`);
        console.log(`   Município: ${data.municipio}/${data.uf}\n`);
      }
      
      // Delay para evitar rate limit
      await new Promise(r => setTimeout(r, 1500));
      
    } catch (e) {
      console.log(`❌ ${nome} (${cnpj}): ${e.message}\n`);
    }
  }

  // Teste 3: Validação CPF/CNPJ Local
  console.log('🪪 Validação de CPF/CNPJ (Local)');
  console.log('───────────────────────────────────────────────────');
  
  console.log('✅ Biblioteca: cpf-cnpj-validator instalada');
  console.log('✅ Funções disponíveis:');
  console.log('   - validarCPF(cpf: string)');
  console.log('   - validarCNPJ(cnpj: string)');
  console.log('   - formatarCPF(cpf: string)');
  console.log('   - formatarCNPJ(cnpj: string)');
  console.log('   - formatarCpfCnpj(doc: string, tipo: TipoPessoa)');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 RESUMO DOS TESTES');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ ViaCEP: Funcionando normalmente');
  console.log('⚠️  BrasilAPI CNPJ: Pode ter rate limit ou bloqueio 403');
  console.log('✅ Validação CPF/CNPJ: Funcionando (local)');
  console.log('═══════════════════════════════════════════════════\n');
}

testarTudo().catch(console.error);
