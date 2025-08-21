/**
 * Teardown global para testes E2E
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Iniciando limpeza global dos testes E2E...')

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'

    // Limpar dados de teste se necessário
    await cleanupTestData(page, baseURL)

    console.log('✅ Limpeza global concluída com sucesso')

  } catch (error) {
    console.error('❌ Erro na limpeza global:', error)
    // Não falhar por causa da limpeza
  } finally {
    await browser.close()
  }
}

async function cleanupTestData(page: any, baseURL: string) {
  try {
    console.log('🗑️ Limpando dados de teste...')

    // Remover produtos de teste
    await page.evaluate(async () => {
      try {
        const response = await fetch('/api/test/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cleanupTestProducts: true,
            cleanupTestUsers: false, // Manter usuários para próximos testes
            cleanupTestOrders: true
          })
        })

        if (response.ok) {
          console.log('✅ Dados de teste removidos')
        }
      } catch (error) {
        console.warn('⚠️ Não foi possível limpar todos os dados de teste:', error)
      }
    })

  } catch (error) {
    console.warn('⚠️ Aviso: Erro na limpeza de dados de teste:', error)
  }
}

export default globalTeardown