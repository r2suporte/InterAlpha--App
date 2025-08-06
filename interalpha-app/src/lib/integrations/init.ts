import { validateConfig } from './config';
import { redisConnection } from '../redis';

// Função para inicializar todas as integrações
export async function initializeIntegrations() {
  console.log('🚀 Inicializando integrações avançadas...');

  try {
    // 1. Validar configurações
    const configValid = validateConfig();
    if (!configValid) {
      console.warn('⚠️  Algumas configurações estão faltando. Continuando com funcionalidades limitadas.');
    }

    // 2. Testar conexão Redis
    await testRedisConnection();

    // 3. Inicializar filas (importação lazy para evitar problemas de inicialização)
    await initializeQueues();

    console.log('✅ Integrações inicializadas com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar integrações:', error);
    return false;
  }
}

async function testRedisConnection() {
  try {
    await redisConnection.ping();
    console.log('✅ Conexão Redis estabelecida');
  } catch (error) {
    console.error('❌ Erro na conexão Redis:', error);
    throw new Error('Redis connection failed');
  }
}

async function initializeQueues() {
  try {
    // Importação dinâmica para evitar problemas de inicialização circular
    const { 
      emailQueue, 
      smsQueue, 
      whatsappQueue, 
      calendarQueue, 
      accountingQueue, 
      backupQueue 
    } = await import('./queues');

    // Verificar se as filas estão funcionando
    const queues = [
      { name: 'Email', queue: emailQueue },
      { name: 'SMS', queue: smsQueue },
      { name: 'WhatsApp', queue: whatsappQueue },
      { name: 'Calendar', queue: calendarQueue },
      { name: 'Accounting', queue: accountingQueue },
      { name: 'Backup', queue: backupQueue },
    ];

    for (const { name, queue } of queues) {
      await queue.waitUntilReady();
      console.log(`✅ Fila ${name} inicializada`);
    }

    // Inicializar workers em produção
    if (process.env.NODE_ENV === 'production') {
      await initializeWorkers();
    }

    console.log('✅ Todas as filas inicializadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar filas:', error);
    throw error;
  }
}

async function initializeWorkers() {
  try {
    // Inicializar worker de email
    const { startEmailWorker } = await import('../../workers/email-worker');
    startEmailWorker();
    
    // Inicializar worker de SMS
    const { startSMSWorker } = await import('../../workers/sms-worker');
    startSMSWorker();
    
    // Inicializar worker de workflow
    const { startWorkflowWorker } = await import('../../workers/workflow-worker');
    startWorkflowWorker();
    
    // Inicializar worker de WhatsApp
    const { startWhatsAppWorker } = await import('../../workers/whatsapp-worker');
    startWhatsAppWorker();
    
    console.log('✅ Workers inicializados');
  } catch (error) {
    console.error('❌ Erro ao inicializar workers:', error);
    throw error;
  }
}

// Função para finalizar integrações (cleanup)
export async function shutdownIntegrations() {
  console.log('🛑 Finalizando integrações...');

  try {
    // Fechar conexão Redis
    await redisConnection.quit();
    console.log('✅ Conexão Redis fechada');

    console.log('✅ Integrações finalizadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao finalizar integrações:', error);
  }
}

// Função para verificar saúde das integrações
export async function checkIntegrationsHealth() {
  const health = {
    redis: false,
    queues: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Verificar Redis
    await redisConnection.ping();
    health.redis = true;

    // Verificar filas (importação dinâmica)
    const { getQueueStats, emailQueue } = await import('./queues');
    const stats = await getQueueStats(emailQueue);
    health.queues = true;

    console.log('✅ Health check das integrações passou');
    return { status: 'healthy', details: health };
  } catch (error) {
    console.error('❌ Health check das integrações falhou:', error);
    return { status: 'unhealthy', details: health, error: error.message };
  }
}