#!/usr/bin/env node
/**
 * Script de teste para verificar o funcionamento das APIs externas
 * - API ViaCEP (busca de endereço por CEP)
 * - API BrasilAPI (busca de dados CNPJ)
 * - Validações de CPF
 */

console.log('🔍 Iniciando testes das APIs externas...\n');

// ============================================
// TESTE 1: API ViaCEP
// ============================================
async function testarViaCEP() {
  console.log('📍 1. Testando API ViaCEP');
  console.log('─────────────────────────────────');
  
  const cepsParaTestar = [
    { cep: '01310100', descricao: 'Av Paulista, São Paulo' },
    { cep: '20040020', descricao: 'Praça XV, Rio de Janeiro' },
    { cep: '30130100', descricao: 'Av Afonso Pena, Belo Horizonte' },
  ];

  for (const { cep, descricao } of cepsParaTestar) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      
      if (!response.ok) {
        console.log(`❌ ${descricao} (${cep}): HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data.erro) {
        console.log(`❌ ${descricao} (${cep}): CEP não encontrado`);
      } else {
        console.log(`✅ ${descricao} (${cep})`);
        console.log(`   📫 ${data.logradouro}, ${data.bairro}`);
        console.log(`   🏙️  ${data.localidade}/${data.uf}`);
      }
    } catch (error) {
      console.log(`❌ ${descricao} (${cep}): ${error.message}`);
    }
  }
  
  console.log('');
}

// ============================================
// TESTE 2: API BrasilAPI (CNPJ)
// ============================================
async function testarBrasilAPICNPJ() {
  console.log('🏢 2. Testando API BrasilAPI (CNPJ)');
  console.log('─────────────────────────────────');
  
  const cnpjsParaTestar = [
    { cnpj: '00000000000191', descricao: 'Banco do Brasil' },
    { cnpj: '33000167000101', descricao: 'Caixa Econômica Federal' },
    { cnpj: '07526557000198', descricao: 'Apple Computer Brasil' },
  ];

  for (const { cnpj, descricao } of cnpjsParaTestar) {
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`❌ ${descricao} (${cnpj}): CNPJ não encontrado`);
        } else if (response.status === 429) {
          console.log(`⚠️  ${descricao} (${cnpj}): Rate limit atingido, aguarde...`);
        } else {
          console.log(`❌ ${descricao} (${cnpj}): HTTP ${response.status}`);
        }
        continue;
      }

      const data = await response.json();
      
      console.log(`✅ ${descricao} (${cnpj})`);
      console.log(`   🏢 Razão Social: ${data.razao_social || 'N/A'}`);
      console.log(`   🏪 Nome Fantasia: ${data.nome_fantasia || 'N/A'}`);
      console.log(`   📊 Situação: ${data.descricao_situacao_cadastral || 'N/A'}`);
      console.log(`   📍 Município: ${data.municipio || 'N/A'}/${data.uf || 'N/A'}`);
      
    } catch (error) {
      console.log(`❌ ${descricao} (${cnpj}): ${error.message}`);
    }
    
    // Delay para evitar rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('');
}

// ============================================
// TESTE 3: Validação de CPF (Local)
// ============================================
function testarValidacaoCPF() {
  console.log('🪪 3. Testando Validação de CPF (Local)');
  console.log('─────────────────────────────────');
  
  const cpfsParaTestar = [
    { cpf: '111.111.111-11', valido: false, descricao: 'CPF com dígitos repetidos' },
    { cpf: '123.456.789-00', valido: false, descricao: 'CPF inválido' },
    { cpf: '000.000.000-00', valido: false, descricao: 'CPF zerado' },
  ];

  // Função simples de validação CPF
  function validarCPF(cpf) {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCpf)) return false;
    
    // Validação dos dígitos verificadores
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCpf.substring(10, 11))) return false;
    
    return true;
  }

  cpfsParaTestar.forEach(({ cpf, valido, descricao }) => {
    const resultado = validarCPF(cpf);
    const emoji = resultado === valido ? '✅' : '❌';
    const status = resultado ? 'VÁLIDO' : 'INVÁLIDO';
    console.log(`${emoji} ${cpf} - ${status} (${descricao})`);
  });
  
  console.log('');
}

// ============================================
// TESTE 4: Conectividade Geral
// ============================================
async function testarConectividade() {
  console.log('🌐 4. Testando Conectividade das APIs');
  console.log('─────────────────────────────────');
  
  const apis = [
    { nome: 'ViaCEP', url: 'https://viacep.com.br' },
    { nome: 'BrasilAPI', url: 'https://brasilapi.com.br/api' },
  ];

  for (const { nome, url } of apis) {
    try {
      const start = Date.now();
      const response = await fetch(url, { method: 'HEAD' });
      const tempo = Date.now() - start;
      
      if (response.ok || response.status === 404) { // 404 é ok para testar conectividade
        console.log(`✅ ${nome}: Online (${tempo}ms)`);
      } else {
        console.log(`⚠️  ${nome}: Status ${response.status} (${tempo}ms)`);
      }
    } catch (error) {
      console.log(`❌ ${nome}: Offline ou inacessível`);
      console.log(`   Erro: ${error.message}`);
    }
  }
  
  console.log('');
}

// ============================================
// EXECUTAR TODOS OS TESTES
// ============================================
async function executarTestes() {
  const inicio = Date.now();
  
  await testarConectividade();
  await testarViaCEP();
  await testarBrasilAPICNPJ();
  testarValidacaoCPF();
  
  const tempo = ((Date.now() - inicio) / 1000).toFixed(2);
  
  console.log('═══════════════════════════════════');
  console.log(`✅ Testes concluídos em ${tempo}s`);
  console.log('═══════════════════════════════════\n');
}

// Executar
executarTestes().catch(error => {
  console.error('❌ Erro ao executar testes:', error);
  process.exit(1);
});
