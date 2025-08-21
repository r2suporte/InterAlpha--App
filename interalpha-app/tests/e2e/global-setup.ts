/**
 * Setup global para testes E2E
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global dos testes E2E...')

  // Criar browser para setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Verificar se a aplicação está rodando
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
    
    console.log(`📡 Verificando se a aplicação está disponível em ${baseURL}...`)
    
    await page.goto(baseURL, { timeout: 30000 })
    
    // Verificar se a página carregou corretamente
    await page.waitForSelector('body', { timeout: 10000 })
    
    console.log('✅ Aplicação está disponível e respondendo')

    // Setup de dados de teste se necessário
    await setupTestData(page, baseURL)

    console.log('✅ Setup global concluído com sucesso')

  } catch (error) {
    console.error('❌ Erro no setup global:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestData(page: any, baseURL: string) {
  try {
    console.log('📊 Configurando dados de teste...')

    // Fazer login como admin para setup
    await page.goto(`${baseURL}/login`)
    
    // Verificar se já existe usuário de teste
    const hasTestUser = await page.locator('[data-testid="test-user-exists"]').isVisible().catch(() => false)
    
    if (!hasTestUser) {
      console.log('👤 Criando usuário de teste...')
      
      // Criar usuário de teste via API ou interface
      await page.evaluate(async () => {
        // Aqui você pode fazer chamadas para APIs de setup
        // ou usar a interface para criar dados necessários
        
        const response = await fetch('/api/test/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            createTestUser: true,
            createTestProducts: true,
            createTestCategories: true
          })
        })
        
        if (!response.ok) {
          throw new Error('Falha ao criar dados de teste')
        }
      })
    }

    // Verificar se existem produtos de teste
    await page.goto(`${baseURL}/api/produtos?limit=1`)
    const response = await page.textContent('body')
    const data = JSON.parse(response || '{}')
    
    if (!data.products || data.products.length === 0) {
      console.log('📦 Criando produtos de teste...')
      
      // Criar produtos de teste
      const testProducts = [
        {
          partNumber: 'TEST001',
          description: 'Produto de Teste 1',
          costPrice: 50.00,
          salePrice: 75.00,
          quantity: 100,
          minStock: 10
        },
        {
          partNumber: 'TEST002', 
          description: 'Produto de Teste 2',
          costPrice: 30.00,
          salePrice: 45.00,
          quantity: 50,
          minStock: 5
        }
      ]

      for (const product of testProducts) {
        await page.evaluate(async (productData) => {
          await fetch('/api/produtos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          })
        }, product)
      }
    }

    console.log('✅ Dados de teste configurados')

  } catch (error) {
    console.warn('⚠️ Aviso: Não foi possível configurar todos os dados de teste:', error)
    // Não falhar o setup por causa disso
  }
}

export default globalSetup