/**
 * Testes E2E para sistema de produtos
 */

import { test, expect, Page } from '@playwright/test'

// Configuração de teste
test.describe('Sistema de Gestão de Produtos', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    
    // Login (assumindo que existe um sistema de auth)
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@interalpha.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Aguardar redirecionamento
    await page.waitForURL('/dashboard')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test.describe('Listagem de Produtos', () => {
    test('deve exibir lista de produtos', async () => {
      await page.goto('/produtos')
      
      // Verificar se a página carregou
      await expect(page.locator('[data-testid="products-list"]')).toBeVisible()
      
      // Verificar se há produtos na lista
      const productCards = page.locator('[data-testid="product-card"]')
      await expect(productCards).toHaveCountGreaterThan(0)
      
      // Verificar estrutura do card
      const firstCard = productCards.first()
      await expect(firstCard.locator('[data-testid="product-partnumber"]')).toBeVisible()
      await expect(firstCard.locator('[data-testid="product-description"]')).toBeVisible()
      await expect(firstCard.locator('[data-testid="product-price"]')).toBeVisible()
    })

    test('deve filtrar produtos por busca', async () => {
      await page.goto('/produtos')
      
      // Aguardar carregamento
      await page.waitForSelector('[data-testid="products-list"]')
      
      // Contar produtos iniciais
      const initialCount = await page.locator('[data-testid="product-card"]').count()
      
      // Fazer busca
      await page.fill('[data-testid="search-input"]', 'PROD001')
      await page.waitForTimeout(500) // Aguardar debounce
      
      // Verificar se filtrou
      const filteredCount = await page.locator('[data-testid="product-card"]').count()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
      
      // Verificar se o resultado contém o termo buscado
      if (filteredCount > 0) {
        const firstResult = page.locator('[data-testid="product-card"]').first()
        const partNumber = await firstResult.locator('[data-testid="product-partnumber"]').textContent()
        expect(partNumber).toContain('PROD001')
      }
    })

    test('deve paginar resultados', async () => {
      await page.goto('/produtos')
      
      // Aguardar carregamento
      await page.waitForSelector('[data-testid="products-list"]')
      
      // Verificar se há paginação
      const pagination = page.locator('[data-testid="pagination"]')
      if (await pagination.isVisible()) {
        // Ir para próxima página
        await page.click('[data-testid="next-page"]')
        
        // Verificar se mudou de página
        await expect(page.locator('[data-testid="current-page"]')).toContainText('2')
        
        // Verificar se carregou novos produtos
        await expect(page.locator('[data-testid="product-card"]')).toHaveCountGreaterThan(0)
      }
    })
  })

  test.describe('Cadastro de Produtos', () => {
    test('deve criar novo produto com sucesso', async () => {
      await page.goto('/produtos/novo')
      
      // Preencher formulário
      const timestamp = Date.now()
      await page.fill('[data-testid="partnumber-input"]', `TEST${timestamp}`)
      await page.fill('[data-testid="description-input"]', `Produto de teste ${timestamp}`)
      await page.fill('[data-testid="cost-price-input"]', '50.00')
      await page.fill('[data-testid="sale-price-input"]', '75.00')
      await page.fill('[data-testid="quantity-input"]', '100')
      await page.fill('[data-testid="min-stock-input"]', '10')
      
      // Submeter formulário
      await page.click('[data-testid="submit-button"]')
      
      // Verificar sucesso
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Verificar redirecionamento para detalhes
      await page.waitForURL(/\/produtos\/[a-zA-Z0-9]+/)
      
      // Verificar se os dados estão corretos
      await expect(page.locator('[data-testid="product-partnumber"]')).toContainText(`TEST${timestamp}`)
      await expect(page.locator('[data-testid="product-description"]')).toContainText(`Produto de teste ${timestamp}`)
    })

    test('deve validar campos obrigatórios', async () => {
      await page.goto('/produtos/novo')
      
      // Tentar submeter sem preencher
      await page.click('[data-testid="submit-button"]')
      
      // Verificar mensagens de erro
      await expect(page.locator('[data-testid="partnumber-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="description-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="cost-price-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="sale-price-error"]')).toBeVisible()
    })

    test('deve validar part number único', async () => {
      await page.goto('/produtos/novo')
      
      // Preencher com part number existente
      await page.fill('[data-testid="partnumber-input"]', 'PROD001') // Assumindo que existe
      await page.fill('[data-testid="description-input"]', 'Teste duplicado')
      await page.fill('[data-testid="cost-price-input"]', '50.00')
      await page.fill('[data-testid="sale-price-input"]', '75.00')
      
      // Submeter
      await page.click('[data-testid="submit-button"]')
      
      // Verificar erro de duplicação
      await expect(page.locator('[data-testid="partnumber-error"]')).toContainText('já existe')
    })
  })

  test.describe('Edição de Produtos', () => {
    test('deve editar produto existente', async () => {
      // Ir para lista e selecionar primeiro produto
      await page.goto('/produtos')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      await firstProduct.click()
      
      // Ir para edição
      await page.click('[data-testid="edit-button"]')
      
      // Modificar descrição
      const newDescription = `Descrição editada ${Date.now()}`
      await page.fill('[data-testid="description-input"]', newDescription)
      
      // Salvar
      await page.click('[data-testid="submit-button"]')
      
      // Verificar sucesso
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Verificar se a mudança foi salva
      await expect(page.locator('[data-testid="product-description"]')).toContainText(newDescription)
    })
  })

  test.describe('Controle de Estoque', () => {
    test('deve registrar entrada de estoque', async () => {
      // Ir para um produto específico
      await page.goto('/produtos')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      await firstProduct.click()
      
      // Obter estoque atual
      const currentStockText = await page.locator('[data-testid="current-stock"]').textContent()
      const currentStock = parseInt(currentStockText?.replace(/\D/g, '') || '0')
      
      // Abrir modal de movimentação
      await page.click('[data-testid="stock-movement-button"]')
      
      // Preencher entrada
      await page.selectOption('[data-testid="movement-type"]', 'IN')
      await page.fill('[data-testid="quantity-input"]', '10')
      await page.fill('[data-testid="reason-input"]', 'Entrada de teste E2E')
      
      // Confirmar
      await page.click('[data-testid="confirm-movement"]')
      
      // Verificar sucesso
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Verificar se o estoque foi atualizado
      await page.reload()
      const newStockText = await page.locator('[data-testid="current-stock"]').textContent()
      const newStock = parseInt(newStockText?.replace(/\D/g, '') || '0')
      
      expect(newStock).toBe(currentStock + 10)
    })

    test('deve exibir alertas de estoque baixo', async () => {
      await page.goto('/produtos')
      
      // Verificar se há produtos com estoque baixo
      const lowStockAlerts = page.locator('[data-testid="low-stock-alert"]')
      
      if (await lowStockAlerts.count() > 0) {
        // Verificar estrutura do alerta
        const firstAlert = lowStockAlerts.first()
        await expect(firstAlert.locator('[data-testid="product-name"]')).toBeVisible()
        await expect(firstAlert.locator('[data-testid="current-stock"]')).toBeVisible()
        await expect(firstAlert.locator('[data-testid="min-stock"]')).toBeVisible()
      }
    })
  })

  test.describe('Integração com Ordens de Serviço', () => {
    test('deve adicionar produtos a uma ordem de serviço', async () => {
      await page.goto('/ordens/nova')
      
      // Preencher dados básicos da ordem
      await page.fill('[data-testid="titulo-input"]', `Ordem de teste ${Date.now()}`)
      await page.fill('[data-testid="descricao-input"]', 'Ordem para teste E2E')
      
      // Selecionar cliente (assumindo que existe)
      await page.selectOption('[data-testid="cliente-select"]', { index: 1 })
      
      // Adicionar produto
      await page.fill('[data-testid="product-search"]', 'PROD')
      await page.waitForSelector('[data-testid="product-result"]')
      
      // Selecionar primeiro resultado
      await page.click('[data-testid="product-result"]')
      
      // Verificar se produto foi adicionado
      await expect(page.locator('[data-testid="selected-product"]')).toBeVisible()
      
      // Verificar cálculo de totais
      const valorProdutos = await page.locator('[data-testid="valor-produtos"]').textContent()
      expect(valorProdutos).toMatch(/R\$\s*\d+,\d{2}/)
      
      // Submeter ordem
      await page.click('[data-testid="submit-button"]')
      
      // Verificar sucesso
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    })
  })

  test.describe('Dashboard e Relatórios', () => {
    test('deve exibir métricas no dashboard', async () => {
      await page.goto('/produtos/dashboard')
      
      // Verificar KPIs principais
      await expect(page.locator('[data-testid="total-products"]')).toBeVisible()
      await expect(page.locator('[data-testid="low-stock-count"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-stock-value"]')).toBeVisible()
      
      // Verificar gráficos
      await expect(page.locator('[data-testid="products-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="stock-chart"]')).toBeVisible()
      
      // Verificar top produtos
      const topProducts = page.locator('[data-testid="top-products"]')
      await expect(topProducts).toBeVisible()
      
      if (await topProducts.locator('[data-testid="product-item"]').count() > 0) {
        await expect(topProducts.locator('[data-testid="product-item"]').first()).toBeVisible()
      }
    })
  })

  test.describe('Importação e Exportação', () => {
    test('deve exportar produtos para CSV', async () => {
      await page.goto('/produtos')
      
      // Clicar em exportar
      await page.click('[data-testid="export-button"]')
      
      // Selecionar formato CSV
      await page.selectOption('[data-testid="export-format"]', 'csv')
      
      // Configurar opções
      await page.check('[data-testid="include-stock"]')
      await page.check('[data-testid="include-categories"]')
      
      // Iniciar download
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="start-export"]')
      
      const download = await downloadPromise
      
      // Verificar se o arquivo foi baixado
      expect(download.suggestedFilename()).toMatch(/produtos.*\.csv/)
    })

    test('deve validar arquivo de importação', async () => {
      await page.goto('/produtos/importar')
      
      // Upload de arquivo inválido
      const fileInput = page.locator('[data-testid="file-input"]')
      await fileInput.setInputFiles({
        name: 'invalid.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('invalid,csv,content')
      })
      
      // Verificar validação
      await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible()
      
      // Verificar se mostra erros específicos
      await expect(page.locator('[data-testid="error-message"]')).toContainText('obrigatório')
    })
  })

  test.describe('Performance e Responsividade', () => {
    test('deve carregar lista de produtos rapidamente', async () => {
      const startTime = Date.now()
      
      await page.goto('/produtos')
      await page.waitForSelector('[data-testid="products-list"]')
      
      const loadTime = Date.now() - startTime
      
      // Verificar se carregou em menos de 3 segundos
      expect(loadTime).toBeLessThan(3000)
    })

    test('deve ser responsivo em dispositivos móveis', async () => {
      // Simular dispositivo móvel
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/produtos')
      
      // Verificar se o menu mobile está visível
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
      
      // Verificar se os cards se adaptam ao mobile
      const productCard = page.locator('[data-testid="product-card"]').first()
      if (await productCard.isVisible()) {
        const boundingBox = await productCard.boundingBox()
        expect(boundingBox?.width).toBeLessThan(400) // Deve caber na tela mobile
      }
    })
  })

  test.describe('Acessibilidade', () => {
    test('deve ter navegação por teclado', async () => {
      await page.goto('/produtos')
      
      // Navegar usando Tab
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Verificar se o foco está visível
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('deve ter labels apropriados', async () => {
      await page.goto('/produtos/novo')
      
      // Verificar se inputs têm labels
      const partNumberInput = page.locator('[data-testid="partnumber-input"]')
      const label = await partNumberInput.getAttribute('aria-label') || 
                   await page.locator('label[for="partnumber-input"]').textContent()
      
      expect(label).toBeTruthy()
    })
  })
})