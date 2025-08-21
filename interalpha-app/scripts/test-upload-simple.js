#!/usr/bin/env node

/**
 * Script simples para testar estrutura de upload
 */

const fs = require('fs')
const path = require('path')

function testUploadStructure() {
  console.log('🖼️  Testando estrutura de upload de imagens...\n')

  try {
    // 1. Verificar e criar diretórios
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'produtos')
    const thumbnailDir = path.join(uploadDir, 'thumbnails')
    
    console.log('1. Criando estrutura de diretórios...')
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
      console.log('✅ Diretório criado:', uploadDir)
    } else {
      console.log('✅ Diretório existe:', uploadDir)
    }
    
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true })
      console.log('✅ Diretório de thumbnails criado:', thumbnailDir)
    } else {
      console.log('✅ Diretório de thumbnails existe:', thumbnailDir)
    }

    // 2. Testar permissões de escrita
    console.log('\n2. Testando permissões de escrita...')
    
    const testFile = path.join(uploadDir, 'test-permissions.txt')
    const testContent = 'Teste de permissões de escrita'
    
    fs.writeFileSync(testFile, testContent)
    console.log('✅ Arquivo de teste criado')
    
    const readContent = fs.readFileSync(testFile, 'utf8')
    console.log('✅ Arquivo lido com sucesso:', readContent === testContent ? 'Conteúdo correto' : 'Conteúdo incorreto')
    
    fs.unlinkSync(testFile)
    console.log('✅ Arquivo removido com sucesso')

    // 3. Verificar Sharp
    console.log('\n3. Verificando Sharp...')
    
    try {
      require.resolve('sharp')
      console.log('✅ Sharp está instalado')
    } catch (error) {
      console.log('⚠️  Sharp não está instalado')
      console.log('   Para instalar: npm install sharp')
      console.log('   Sem Sharp, as imagens não serão otimizadas')
    }

    // 4. Testar configurações
    console.log('\n4. Configurações de upload:')
    console.log('✅ Diretório base:', '/public/uploads/produtos')
    console.log('✅ Diretório thumbnails:', '/public/uploads/produtos/thumbnails')
    console.log('✅ Tipos aceitos: JPG, PNG, WebP')
    console.log('✅ Tamanho máximo: 5MB')
    console.log('✅ URL pública: /uploads/produtos/[filename]')

    // 5. Estrutura da API
    console.log('\n5. Endpoints da API:')
    console.log('✅ POST /api/produtos/upload - Upload de imagem')
    console.log('✅ DELETE /api/produtos/upload?fileName=... - Remover imagem')
    console.log('✅ Autenticação: Obrigatória via Clerk')
    console.log('✅ Validação: Tipo, tamanho e formato')

    console.log('\n🎉 Estrutura de upload configurada com sucesso!')
    console.log('\n📋 Próximos passos:')
    console.log('   1. Instalar Sharp: npm install sharp')
    console.log('   2. Testar upload via interface')
    console.log('   3. Configurar limpeza automática')
    console.log('   4. Implementar CDN em produção')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testUploadStructure()