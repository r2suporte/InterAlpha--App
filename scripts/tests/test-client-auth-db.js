const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

// Setup clients
const prisma = new PrismaClient();

// Note: We can't easily test the Next.js API route directly via node script without running the server.
// However, we can simulate the DB logic or use fetch if the server is running.
// Since we don't know if the server is running, we will test the DB logic directly (Unit Test specific to Auth logic)
// OR better: we can manually create a session and verify strictly via DB operations to ensure the model works.

async function testAuthSchema() {
    console.log('🔐 Testando Schema de Autenticação...');

    try {
        // 1. Get a test client
        console.log('1. Buscando cliente de teste...');
        const cliente = await prisma.cliente.findFirst();

        let testCliente = cliente;

        if (!testCliente) {
            console.log('⚠️ Nenhum cliente encontrado. Criando cliente de teste...');
            testCliente = await prisma.cliente.create({
                data: {
                    nome: 'Test Client',
                    email: `test-${Date.now()}@example.com`,
                    login: `user${Date.now()}`,
                    senhaHash: 'password123',
                    cpfCnpj: '12345678901',
                    telefone: '11999999999',
                    endereco: 'Rua Teste, 123 - Centro',
                    cidade: 'São Paulo',
                    estado: 'SP',
                    cep: '01001000'
                }
            });
            console.log(`✅ Cliente de teste criado: ${testCliente.id}`);
        } else {
            console.log(`✅ Cliente encontrado: ${testCliente.id} (${testCliente.nome})`);
        }

        // 2. Create a Session
        console.log('2. Criando sessão...');
        const token = `test-token-${Date.now()}`;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const session = await prisma.clientSession.create({
            data: {
                clienteId: testCliente.id,
                token: token,
                ipAddress: '127.0.0.1',
                userAgent: 'TestScript/1.0',
                expiresAt: expiresAt
            }
        });

        if (session) {
            console.log(`✅ Sessão criada com sucesso: ${session.id}`);
        } else {
            throw new Error('Falha ao criar sessão');
        }

        // 3. Verify Session exists
        console.log('3. Verificando sessão no banco...');
        const savedSession = await prisma.clientSession.findUnique({
            where: { token: token }
        });

        if (savedSession && savedSession.clienteId === testCliente.id) {
            console.log('✅ Sessão verificada no banco!');
        } else {
            throw new Error('Sessão não encontrada ou incorreta');
        }

        // 4. Delete Session (Logout)
        console.log('4. Removendo sessão (Logout)...');
        await prisma.clientSession.deleteMany({
            where: { token: token }
        });

        // 5. Verify Deletion
        const deletedSession = await prisma.clientSession.findUnique({
            where: { token: token }
        });

        if (!deletedSession) {
            console.log('✅ Sessão removida com sucesso!');
        } else {
            throw new Error('Sessão ainda existe após remoção');
        }

        console.log('\n🎉 Fluxo de Autenticação (DB) verificado com sucesso!');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAuthSchema();
