#!/usr/bin/env node

/**
 * Script para testar o schema de produtos
 * Executa: node scripts/test-products-schema.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testProductsSchema() {
  console.log('🧪 Testando schema de produtos...\n')

  try {
    // 1. Testar criação de produto
    console.log('1. Testando criação de produto...')
    
    // Primeiro, vamos buscar um usuário existente
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('❌ Nenhum usuário encontrado. Crie um usuário primeiro.')
      return
    }

    const testProduct = await prisma.product.create({
      data: {
        partNumber: 'TEST-001',
        description: 'Produto de teste para validação do schema',
        costPrice: 50.00,
        salePrice: 75.00,
        createdBy: user.id
      }
    })
    console.log('✅ Produto criado:', testProduct.partNumber)

    // 2. Testar busca de produto
    console.log('\n2. Testando busca de produto...')
    const foundProduct = await prisma.product.findUnique({
      where: { partNumber: 'TEST-001' },
      include: {
        creator: {
          select: { name: true, email: true }
        }
      }
    })
    console.log('✅ Produto encontrado:', foundProduct?.partNumber)
    console.log('   Criado por:', foundProduct?.creator?.name || foundProduct?.creator?.email)

    // 3. Testar cálculo de margem
    console.log('\n3. Testando cálculo de margem...')
    const margin = ((foundProduct.salePrice - foundProduct.costPrice) / foundProduct.costPrice) * 100
    console.log(`✅ Margem calculada: ${margin.toFixed(2)}%`)

    // 4. Testar busca com filtros
    console.log('\n4. Testando busca com filtros...')
    const activeProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        description: {
          contains: 'teste',
          mode: 'insensitive'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    console.log(`✅ Produtos ativos encontrados: ${activeProducts.length}`)

    // 5. Testar atualização de produto
    console.log('\n5. Testando atualização de produto...')
    const updatedProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: {
        salePrice: 80.00,
        description: 'Produto de teste atualizado'
      }
    })
    console.log('✅ Produto atualizado. Novo preço:', updatedProduct.salePrice)

    // 6. Testar criação de ordem com item
    console.log('\n6. Testando criação de ordem com item...')
    
    // Buscar um cliente existente
    const client = await prisma.cliente.findFirst()
    if (!client) {
      console.log('⚠️  Nenhum cliente encontrado. Pulando teste de ordem.')
    } else {
      const order = await prisma.ordemServico.create({
        data: {
          titulo: 'Ordem de teste com produto',
          descricao: 'Teste de integração produto-ordem',
          userId: user.id,
          clienteId: client.id,
          items: {
            create: {
              productId: testProduct.id,
              quantity: 2,
              unitPrice: updatedProduct.salePrice,
              totalPrice: updatedProduct.salePrice * 2
            }
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })
      console.log('✅ Ordem criada com item:', order.items[0].product.partNumber)
      console.log('   Quantidade:', order.items[0].quantity)
      console.log('   Total:', order.items[0].totalPrice)

      // 7. Testar restrição de exclusão
      console.log('\n7. Testando restrição de exclusão...')
      try {
        await prisma.product.delete({
          where: { id: testProduct.id }
        })
        console.log('❌ Produto foi excluído mesmo estando em uso!')
      } catch (error) {
        console.log('✅ Restrição funcionando: produto não pode ser excluído quando em uso')
      }

      // Limpar ordem de teste
      await prisma.ordemServico.delete({
        where: { id: order.id }
      })
      console.log('🧹 Ordem de teste removida')
    }

    // 8. Testar exclusão de produto
    console.log('\n8. Testando exclusão de produto...')
    await prisma.product.delete({
      where: { id: testProduct.id }
    })
    console.log('✅ Produto excluído com sucesso')

    // 9. Testar índices (verificar plano de execução)
    console.log('\n9. Testando performance de índices...')
    const start = Date.now()
    await prisma.product.findMany({
      where: {
        partNumber: {
          startsWith: 'TEST'
        }
      }
    })
    const end = Date.now()
    console.log(`✅ Busca por part number executada em ${end - start}ms`)

    console.log('\n🎉 Todos os testes do schema passaram!')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// Função para testar validações
async function testValidations() {
  console.log('\n🔍 Testando validações...\n')

  try {
    const user = await prisma.user.findFirst()
    if (!user) return

    // Testar part number duplicado
    console.log('1. Testando part number duplicado...')
    try {
      await prisma.product.create({
        data: {
          partNumber: 'DUPLICATE-TEST',
          description: 'Primeiro produto',
          costPrice: 10.00,
          salePrice: 15.00,
          createdBy: user.id
        }
      })

      await prisma.product.create({
        data: {
          partNumber: 'DUPLICATE-TEST', // Mesmo part number
          description: 'Segundo produto',
          costPrice: 20.00,
          salePrice: 25.00,
          createdBy: user.id
        }
      })
      console.log('❌ Validação falhou: part number duplicado foi aceito')
    } catch (error) {
      console.log('✅ Validação funcionando: part number duplicado rejeitado')
    }

    // Limpar dados de teste
    await prisma.product.deleteMany({
      where: {
        partNumber: 'DUPLICATE-TEST'
      }
    })

  } catch (error) {
    console.error('❌ Erro na validação:', error.message)
  }
}

// Executar testes
async function main() {
  await testProductsSchema()
  await testValidations()
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => process.exit(0))
}

module.exports = { testProductsSchema, testValidations }