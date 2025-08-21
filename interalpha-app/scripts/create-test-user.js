#!/usr/bin/env node

/**
 * Script para criar usuário de teste no sistema InterAlpha
 * 
 * Como o Clerk é um serviço externo, este script fornece instruções
 * para criar um usuário de teste através do dashboard do Clerk.
 */

const chalk = require('chalk')

console.log(chalk.blue.bold('\n🔐 CONFIGURAÇÃO DE USUÁRIO DE TESTE - INTERALPHA\n'))

console.log(chalk.yellow('📋 INSTRUÇÕES PARA CRIAR USUÁRIO DE TESTE:\n'))

console.log(chalk.white('1. Acesse o Dashboard do Clerk:'))
console.log(chalk.cyan('   https://dashboard.clerk.com/\n'))

console.log(chalk.white('2. Faça login com sua conta Clerk\n'))

console.log(chalk.white('3. Selecione seu projeto InterAlpha\n'))

console.log(chalk.white('4. No menu lateral, clique em "Users"\n'))

console.log(chalk.white('5. Clique no botão "Create user"\n'))

console.log(chalk.white('6. Preencha os dados do usuário de teste:'))
console.log(chalk.green('   📧 Email: teste@interalpha.com'))
console.log(chalk.green('   🔑 Password: Teste123!'))
console.log(chalk.green('   👤 First Name: Usuário'))
console.log(chalk.green('   👤 Last Name: Teste\n'))

console.log(chalk.white('7. Clique em "Create user"\n'))

console.log(chalk.yellow('🚀 ALTERNATIVA - REGISTRO DIRETO:\n'))

console.log(chalk.white('1. Execute o servidor de desenvolvimento:'))
console.log(chalk.cyan('   npm run dev\n'))

console.log(chalk.white('2. Acesse: http://localhost:3000\n'))

console.log(chalk.white('3. Clique em "Começar Agora" ou "Entrar"\n'))

console.log(chalk.white('4. Na tela de login, clique em "Sign up"\n'))

console.log(chalk.white('5. Crie uma conta com:'))
console.log(chalk.green('   📧 Email: teste@interalpha.com'))
console.log(chalk.green('   🔑 Password: Teste123!\n'))

console.log(chalk.yellow('📝 CREDENCIAIS DE TESTE SUGERIDAS:\n'))

console.log(chalk.bgGreen.black(' USUÁRIO ADMINISTRADOR '))
console.log(chalk.green('Email: admin@interalpha.com'))
console.log(chalk.green('Senha: Admin123!\n'))

console.log(chalk.bgBlue.black(' USUÁRIO FUNCIONÁRIO '))
console.log(chalk.blue('Email: funcionario@interalpha.com'))
console.log(chalk.blue('Senha: Func123!\n'))

console.log(chalk.bgYellow.black(' USUÁRIO TESTE '))
console.log(chalk.yellow('Email: teste@interalpha.com'))
console.log(chalk.yellow('Senha: Teste123!\n'))

console.log(chalk.red('⚠️  IMPORTANTE:\n'))
console.log(chalk.white('- Use senhas fortes em produção'))
console.log(chalk.white('- Estes são apenas usuários de teste para desenvolvimento'))
console.log(chalk.white('- Configure 2FA para usuários administrativos em produção\n'))

console.log(chalk.green('✅ APÓS CRIAR O USUÁRIO:\n'))
console.log(chalk.white('1. Execute: npm run dev'))
console.log(chalk.white('2. Acesse: http://localhost:3000'))
console.log(chalk.white('3. Faça login com as credenciais criadas'))
console.log(chalk.white('4. Você será redirecionado para o dashboard\n'))

console.log(chalk.blue('🔧 CONFIGURAÇÕES ADICIONAIS:\n'))
console.log(chalk.white('- O sistema já está configurado com Clerk'))
console.log(chalk.white('- As rotas estão protegidas pelo middleware'))
console.log(chalk.white('- O redirecionamento automático está ativo'))
console.log(chalk.white('- Todas as APIs de produtos estão funcionais\n'))

console.log(chalk.magenta('🎯 PRÓXIMOS PASSOS:\n'))
console.log(chalk.white('1. Criar usuário de teste'))
console.log(chalk.white('2. Fazer login no sistema'))
console.log(chalk.white('3. Testar funcionalidades de produtos'))
console.log(chalk.white('4. Verificar APIs implementadas\n'))

console.log(chalk.green.bold('🚀 Sistema pronto para uso!\n'))