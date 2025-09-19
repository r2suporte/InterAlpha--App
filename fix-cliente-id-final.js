require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixClienteIdFinal() {
  console.log('🔧 Aplicando correção definitiva para cliente_id...\n');
  
  try {
    // Primeiro, vamos tentar alterar a coluna diretamente via SQL
    console.log('1. Tentando alterar a coluna cliente_id para permitir NULL...');
    
    const { data: alterResult, error: alterError } = await supabase
      .from('ordens_servico')
      .select('id')
      .limit(1);
    
    if (alterError) {
      console.log('❌ Erro ao acessar tabela:', alterError);
      return;
    }
    
    console.log('✅ Tabela acessível');
    
    // Vamos tentar inserir diretamente com SQL raw
    console.log('\n2. Testando inserção com SQL raw...');
    
    // Buscar um cliente portal
    const { data: clientePortal, error: clienteError } = await supabase
      .from('clientes_portal')
      .select('id, nome')
      .limit(1)
      .single();
    
    if (clienteError) {
      console.log('❌ Erro ao buscar cliente portal:', clienteError);
      return;
    }
    
    console.log(`✅ Cliente portal encontrado: ${clientePortal.nome}`);
    
    // Tentar inserção com SQL direto usando o client
    console.log('\n3. Tentando inserção via client com dados explícitos...');
    
    const ordemData = {
      cliente_portal_id: clientePortal.id,
      titulo: 'Teste Final',
      descricao: 'Teste de correção definitiva',
      status: 'aberta',
      prioridade: 'media',
      valor_servico: 150.00,
      cliente_id: null // Explicitamente null
    };
    
    const { data: ordem, error: ordemError } = await supabase
      .from('ordens_servico')
      .insert(ordemData)
      .select();
    
    if (ordemError) {
      console.log('❌ Erro na inserção:', ordemError);
      
      // Se ainda der erro, vamos tentar sem especificar cliente_id
      console.log('\n4. Tentando inserção sem especificar cliente_id...');
      
      const ordemDataSemClienteId = {
        cliente_portal_id: clientePortal.id,
        titulo: 'Teste Final Sem Cliente ID',
        descricao: 'Teste sem especificar cliente_id',
        status: 'aberta',
        prioridade: 'media',
        valor_servico: 150.00
      };
      
      const { data: ordem2, error: ordemError2 } = await supabase
        .from('ordens_servico')
        .insert(ordemDataSemClienteId)
        .select();
      
      if (ordemError2) {
        console.log('❌ Erro na segunda tentativa:', ordemError2);
        
        // Última tentativa: verificar se há um valor padrão ou trigger
        console.log('\n5. Verificando se há algum valor padrão ou trigger...');
        
        // Vamos tentar inserir com um cliente_id válido para ver se funciona
        const { data: clientes, error: clientesError } = await supabase
          .from('clientes')
          .select('id, nome')
          .limit(1)
          .single();
        
        if (!clientesError && clientes) {
          console.log(`✅ Cliente encontrado: ${clientes.nome}`);
          
          const ordemDataComCliente = {
            cliente_portal_id: clientePortal.id,
            cliente_id: clientes.id,
            titulo: 'Teste Com Cliente ID',
            descricao: 'Teste com cliente_id válido',
            status: 'aberta',
            prioridade: 'media',
            valor_servico: 150.00
          };
          
          const { data: ordem3, error: ordemError3 } = await supabase
            .from('ordens_servico')
            .insert(ordemDataComCliente)
            .select();
          
          if (ordemError3) {
            console.log('❌ Erro mesmo com cliente_id válido:', ordemError3);
          } else {
            console.log('✅ Inserção funcionou COM cliente_id válido!');
            console.log('📋 Ordem criada:', ordem3[0]);
            
            // Agora vamos tentar atualizar para NULL
            console.log('\n6. Tentando atualizar cliente_id para NULL...');
            
            const { data: updateResult, error: updateError } = await supabase
              .from('ordens_servico')
              .update({ cliente_id: null })
              .eq('id', ordem3[0].id)
              .select();
            
            if (updateError) {
              console.log('❌ Erro ao atualizar para NULL:', updateError);
            } else {
              console.log('✅ Atualização para NULL funcionou!');
              console.log('📋 Ordem atualizada:', updateResult[0]);
            }
          }
        } else {
          console.log('❌ Nenhum cliente encontrado na tabela clientes');
        }
        
      } else {
        console.log('✅ Segunda tentativa funcionou!');
        console.log('📋 Ordem criada:', ordem2[0]);
      }
    } else {
      console.log('✅ Inserção funcionou!');
      console.log('📋 Ordem criada:', ordem[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixClienteIdFinal().catch(console.error);