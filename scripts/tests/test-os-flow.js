/**
 * Script de teste para o fluxo completo de Ordem de Serviço
 * Verifica clientes disponíveis e lista últimas OS criadas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verificarClientes() {
  console.log('\n📋 VERIFICANDO CLIENTES DISPONÍVEIS...\n');
  
  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('id, nome, email, telefone, cpf_cnpj')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    return;
  }
  
  if (!clientes || clientes.length === 0) {
    console.log('⚠️  Nenhum cliente cadastrado no banco.');
    console.log('💡 Crie um cliente em: http://localhost:3000/dashboard/clientes\n');
    return;
  }
  
  console.log(`✅ ${clientes.length} cliente(s) encontrado(s):\n`);
  
  clientes.forEach((c, i) => {
    console.log(`${i + 1}. ${c.nome}`);
    console.log(`   📧 Email: ${c.email || '❌ Não cadastrado'}`);
    console.log(`   📱 Telefone: ${c.telefone || '❌ Não cadastrado'}`);
    console.log(`   🆔 ID: ${c.id}`);
    console.log(`   📄 CPF/CNPJ: ${c.cpf_cnpj || 'Não cadastrado'}`);
    
    // Avisar se faltam dados
    const avisos = [];
    if (!c.email) avisos.push('Email');
    if (!c.telefone) avisos.push('Telefone');
    
    if (avisos.length > 0) {
      console.log(`   ⚠️  Faltando: ${avisos.join(', ')} (necessário para teste completo)`);
    }
    
    console.log('');
  });
}

async function verificarUltimasOS() {
  console.log('\n📊 ÚLTIMAS ORDENS DE SERVIÇO CRIADAS:\n');
  
  const { data: ordens, error } = await supabase
    .from('ordens_servico')
    .select(`
      id,
      numero_os,
      status,
      created_at,
      cliente:cliente_id (
        nome,
        email,
        telefone
      )
    `)
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (error) {
    console.error('❌ Erro ao buscar OS:', error);
    return;
  }
  
  if (!ordens || ordens.length === 0) {
    console.log('⚠️  Nenhuma OS criada ainda.\n');
    return;
  }
  
  ordens.forEach((os, i) => {
    const data = new Date(os.created_at).toLocaleString('pt-BR');
    console.log(`${i + 1}. ${os.numero_os} - ${os.status}`);
    console.log(`   📅 Criada em: ${data}`);
    console.log(`   👤 Cliente: ${os.cliente?.nome || 'N/A'}`);
    console.log(`   📧 Email: ${os.cliente?.email || 'N/A'}`);
    console.log(`   📱 Telefone: ${os.cliente?.telefone || 'N/A'}`);
    console.log('');
  });
}

async function verificarComunicacoes() {
  console.log('\n📬 COMUNICAÇÕES REGISTRADAS (últimas 5):\n');
  
  const { data: comunicacoes, error } = await supabase
    .from('comunicacoes')
    .select(`
      id,
      tipo,
      status,
      created_at,
      ordem_servico:ordem_servico_id (
        numero_os
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('❌ Erro ao buscar comunicações:', error);
    return;
  }
  
  if (!comunicacoes || comunicacoes.length === 0) {
    console.log('⚠️  Nenhuma comunicação registrada ainda.\n');
    return;
  }
  
  comunicacoes.forEach((com, i) => {
    const data = new Date(com.created_at).toLocaleString('pt-BR');
    const emoji = com.tipo === 'email' ? '📧' : com.tipo === 'sms' ? '📲' : '📱';
    const statusEmoji = com.status === 'enviado' ? '✅' : '❌';
    
    console.log(`${i + 1}. ${emoji} ${com.tipo.toUpperCase()} - ${statusEmoji} ${com.status}`);
    console.log(`   🔢 OS: ${com.ordem_servico?.numero_os || 'N/A'}`);
    console.log(`   📅 Enviado em: ${data}`);
    console.log('');
  });
}

async function main() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   🧪 TESTE DE FLUXO COMPLETO - ORDEM DE SERVIÇO');
  console.log('═══════════════════════════════════════════════════════════');
  
  await verificarClientes();
  await verificarUltimasOS();
  await verificarComunicacoes();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📝 PRÓXIMOS PASSOS:\n');
  console.log('1. Acesse: http://localhost:3000/dashboard/ordens-servico');
  console.log('2. Clique em "Nova Ordem de Serviço"');
  console.log('3. Selecione um cliente COM email e telefone');
  console.log('4. Preencha os dados do equipamento e serviço');
  console.log('5. Salve a OS');
  console.log('\n📊 MONITORE OS LOGS:\n');
  console.log('   ✅ PDF gerado para ordem OS-XXX');
  console.log('   ✅ Email enviado para cliente@email.com');
  console.log('   ✅ WhatsApp enviado para (11) 98765-4321');
  console.log('   ✅ SMS enviado');
  console.log('\n💡 Execute novamente após criar a OS para ver as comunicações registradas!');
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main();
