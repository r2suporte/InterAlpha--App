#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Diretório raiz do projeto
const rootDir = path.join(__dirname, '..');

// Função para substituir imports do Vitest por Jest
function replaceVitestImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Substituir imports do Vitest
    content = content.replace(
      /import\s*{([^}]+)}\s*from\s*['"]vitest['"]/g,
      (match, imports) => {
        // Remover espaços e quebras de linha
        const cleanImports = imports.replace(/\s+/g, ' ').trim();
        return `import { ${cleanImports} } from '@jest/globals'`;
      }
    );
    
    // Substituir vi.mock por jest.mock
    content = content.replace(/vi\.mock/g, 'jest.mock');
    
    // Substituir vi.fn() por jest.fn()
    content = content.replace(/vi\.fn/g, 'jest.fn');
    
    // Substituir vi.mocked por jest.mocked (se existir)
    content = content.replace(/vi\.mocked/g, 'jest.mocked');
    
    // Escrever o arquivo atualizado
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Atualizado: ${filePath}`);
  } catch (error) {
    console.error(`✗ Erro ao atualizar ${filePath}:`, error.message);
  }
}

// Função para corrigir problemas de await em funções síncronas
function fixAwaitIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remover await de importações em funções síncronas
    content = content.replace(
      /const\s+{([^}]+)}\s*=\s*vi\.mocked\(await\s+import\(['"][^'"]+['"]\)\)/g,
      'const { $1 } = require(\'fs\')'
    );
    
    // Escrever o arquivo atualizado
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Corrigido await em: ${filePath}`);
  } catch (error) {
    console.error(`✗ Erro ao corrigir await em ${filePath}:`, error.message);
  }
}

// Função para encontrar e processar todos os arquivos de teste
function processTestFiles() {
  const testFiles = [];
  
  // Função recursiva para procurar arquivos
  function searchDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ignorar node_modules
        if (file !== 'node_modules') {
          searchDirectory(filePath);
        }
      } else if (stat.isFile() && (file.endsWith('.test.ts') || file.endsWith('.test.tsx'))) {
        testFiles.push(filePath);
      }
    });
  }
  
  // Iniciar busca a partir do diretório src
  searchDirectory(path.join(rootDir, 'src'));
  
  console.log(`Encontrados ${testFiles.length} arquivos de teste para processar...\n`);
  
  // Processar cada arquivo
  testFiles.forEach(filePath => {
    replaceVitestImports(filePath);
    fixAwaitIssues(filePath);
  });
  
  console.log('\n✓ Processamento concluído!');
}

// Executar o processamento
processTestFiles();