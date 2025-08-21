/**
 * Script para testar as APIs de validação de CPF e CNPJ
 */

const BASE_URL = 'http://localhost:3000'

async function testCPFValidation() {
  console.log('🧪 Testando validação de CPF...')
  
  const testCPFs = [
    '11144477735', // CPF válido
    '12345678901', // CPF inválido
    '000.000.000-00' // CPF inválido
  ]

  for (const cpf of testCPFs) {
    try {
      const response = await fetch(`${BASE_URL}/api/clientes/validate-cpf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf })
      })

      const result = await response.json()
      console.log(`CPF ${cpf}:`, result)
    } catch (error) {
      console.error(`Erro ao testar CPF ${cpf}:`, error.message)
    }
  }
}

async function testCNPJValidation() {
  console.log('\n🧪 Testando validação de CNPJ...')
  
  const testCNPJs = [
    '11.222.333/0001-81', // CNPJ válido
    '12345678000195', // CNPJ inválido
    '00.000.000/0000-00' // CNPJ inválido
  ]

  for (const cnpj of testCNPJs) {
    try {
      const response = await fetch(`${BASE_URL}/api/clientes/validate-cnpj`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cnpj })
      })

      const result = await response.json()
      console.log(`CNPJ ${cnpj}:`, result)
    } catch (error) {
      console.error(`Erro ao testar CNPJ ${cnpj}:`, error.message)
    }
  }
}

async function testClienteAPI() {
  console.log('\n🧪 Testando API de clientes...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/clientes`)
    const result = await response.json()
    console.log('Lista de clientes:', result)
  } catch (error) {
    console.error('Erro ao testar API de clientes:', error.message)
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de validação de documentos...\n')
  
  await testCPFValidation()
  await testCNPJValidation()
  await testClienteAPI()
  
  console.log('\n✅ Testes concluídos!')
}

// Executar testes
runTests().catch(console.error)