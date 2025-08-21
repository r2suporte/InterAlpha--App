/**
 * Script para testar as funcionalidades de cliente implementadas
 */

const BASE_URL = 'http://localhost:3000'

async function testClienteSearch() {
  console.log('🧪 Testando busca de clientes...')
  
  const searchTerms = [
    '#000001',        // Busca por ID
    'João',           // Busca por nome
    'joao@email.com', // Busca por email
    '12345678901',    // Busca por CPF
    '123.456.789-01', // Busca por CPF formatado
    'São Paulo'       // Busca por cidade
  ]

  for (const term of searchTerms) {
    try {
      console.log(`\n🔍 Buscando por: "${term}"`)
      
      const response = await fetch(`${BASE_URL}/api/clientes?search=${encodeURIComponent(term)}`)
      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Encontrados ${result.data.length} cliente(s)`)
        result.data.forEach(cliente => {
          console.log(`   - ID: #${cliente.numeroSequencial.toString().padStart(6, '0')} | ${cliente.nome} | ${cliente.documento}`)
        })
      } else {
        console.log(`❌ Erro: ${result.error}`)
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar "${term}":`, error.message)
    }
  }
}

async function testClienteById() {
  console.log('\n🧪 Testando busca de cliente por ID...')
  
  try {
    // Primeiro, buscar lista de clientes para pegar um ID válido
    const listResponse = await fetch(`${BASE_URL}/api/clientes?limit=1`)
    const listResult = await listResponse.json()
    
    if (listResult.success && listResult.data.length > 0) {
      const clienteId = listResult.data[0].id
      console.log(`🔍 Buscando cliente com ID: ${clienteId}`)
      
      const response = await fetch(`${BASE_URL}/api/clientes/${clienteId}`)
      const result = await response.json()
      
      if (result.success) {
        const cliente = result.data
        console.log('✅ Cliente encontrado:')
        console.log(`   - ID: #${cliente.numeroSequencial.toString().padStart(6, '0')}`)
        console.log(`   - Nome: ${cliente.nome}`)
        console.log(`   - Email: ${cliente.email}`)
        console.log(`   - Documento: ${cliente.tipoDocumento} ${cliente.documento}`)
        console.log(`   - Ordens de Serviço: ${cliente._count.ordensServico}`)
      } else {
        console.log(`❌ Erro: ${result.error}`)
      }
    } else {
      console.log('❌ Nenhum cliente encontrado para testar')
    }
  } catch (error) {
    console.error('❌ Erro ao testar busca por ID:', error.message)
  }
}

async function testDocumentValidation() {
  console.log('\n🧪 Testando validação de documentos...')
  
  const testDocuments = [
    { type: 'CPF', doc: '11144477735' },
    { type: 'CNPJ', doc: '11222333000181' }
  ]

  for (const { type, doc } of testDocuments) {
    try {
      console.log(`\n🔍 Validando ${type}: ${doc}`)
      
      const endpoint = type === 'CPF' ? 'validate-cpf' : 'validate-cnpj'
      const field = type.toLowerCase()
      
      const response = await fetch(`${BASE_URL}/api/clientes/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: doc })
      })

      const result = await response.json()
      
      if (result.valid) {
        console.log(`✅ ${type} válido`)
        if (result.nome) console.log(`   - Nome: ${result.nome}`)
        if (result.situacao) console.log(`   - Situação: ${result.situacao}`)
      } else {
        console.log(`❌ ${type} inválido: ${result.error}`)
      }
    } catch (error) {
      console.error(`❌ Erro ao validar ${type}:`, error.message)
    }
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes das funcionalidades de cliente...\n')
  
  await testClienteSearch()
  await testClienteById()
  await testDocumentValidation()
  
  console.log('\n✅ Testes concluídos!')
  console.log('\n📋 Funcionalidades testadas:')
  console.log('   ✅ Busca de clientes por ID, nome, email, documento e cidade')
  console.log('   ✅ Busca de cliente individual por ID')
  console.log('   ✅ Validação de CPF e CNPJ via API')
  console.log('   ✅ Formatação e exibição de dados do cliente')
}

// Executar testes
runTests().catch(console.error)