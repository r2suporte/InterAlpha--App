#!/usr/bin/env node

/**
 * 👤 Script para Criar Usuário Administrador - SQLite
 * 
 * Cria o usuário administrador no banco SQLite local
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('👤 Criando usuário administrador...');

    // Hash da senha
    const hashedPassword = await bcrypt.hash('InterAlpha2024!', 12);

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'adm@interalpha.com.br' }
    });

    if (existingUser) {
      // Atualizar usuário existente
      await prisma.user.update({
        where: { email: 'adm@interalpha.com.br' },
        data: {
          name: 'Administrador',
          role: 'admin',
          password: hashedPassword,
          isActive: true,
          updatedAt: new Date()
        }
      });
      console.log('✅ Usuário administrador atualizado com sucesso!');
    } else {
      // Criar novo usuário
      await prisma.user.create({
        data: {
          email: 'adm@interalpha.com.br',
          name: 'Administrador',
          role: 'admin',
          password: hashedPassword,
          isActive: true
        }
      });
      console.log('✅ Usuário administrador criado com sucesso!');
    }

    // Criar usuários de teste adicionais
    const testUsers = [
      { email: 'diretor@interalpha.com.br', name: 'Diretor Teste', role: 'diretor' },
      { email: 'gerente@interalpha.com.br', name: 'Gerente Teste', role: 'gerente' },
      { email: 'tecnico@interalpha.com.br', name: 'Técnico Teste', role: 'tecnico' },
      { email: 'atendente@interalpha.com.br', name: 'Atendente Teste', role: 'atendente' }
    ];

    for (const user of testUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            ...user,
            password: hashedPassword, // Mesma senha para todos
            isActive: true
          }
        });
        console.log(`✅ Usuário ${user.role} criado: ${user.email}`);
      }
    }

    console.log('\n📋 Credenciais criadas:');
    console.log('   Email: adm@interalpha.com.br');
    console.log('   Senha: InterAlpha2024!');
    console.log('\n   Outros usuários de teste:');
    console.log('   - diretor@interalpha.com.br');
    console.log('   - gerente@interalpha.com.br');
    console.log('   - tecnico@interalpha.com.br');
    console.log('   - atendente@interalpha.com.br');
    console.log('   (Todos com a mesma senha)');

  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();