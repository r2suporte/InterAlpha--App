// 🔍 Script para verificar estrutura das tabelas
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura das tabelas...');

    // Tentar inserir um registro de teste para ver quais colunas existem
    console.log('\n📋 Testando estrutura da tabela CLIENTES...');

    const testData1 = {
      nome: 'Teste Cliente',
      email: 'teste@teste.com',
    };

    const { error: error1 } = await supabase
      .from('clientes')
      .insert(testData1)
      .select();

    if (error1) {
      console.log('❌ Erro com estrutura básica:', error1.message);

      // Tentar com documento
      const testData2 = {
        nome: 'Teste Cliente',
        email: 'teste@teste.com',
        telefone: '11999999999',
        documento: '12345678901',
        tipo_documento: 'CPF',
      };

      const { error: error2 } = await supabase
        .from('clientes')
        .insert(testData2)
        .select();

      if (error2) {
        console.log('❌ Erro com documento:', error2.message);

        // Tentar com cep
        const testData3 = {
          nome: 'Teste Cliente',
          email: 'teste@teste.com',
          telefone: '11999999999',
          documento: '12345678901',
          tipo_documento: 'CPF',
          cep: '01234567',
        };

        const { error: error3 } = await supabase
          .from('clientes')
          .insert(testData3)
          .select();

        if (error3) {
          console.log('❌ Erro com cep:', error3.message);
        } else {
          console.log('✅ Estrutura com CEP funciona!');
          await supabase.from('clientes').delete().eq('nome', 'Teste Cliente');
        }
      } else {
        console.log('✅ Estrutura com documento funciona!');
        await supabase.from('clientes').delete().eq('nome', 'Teste Cliente');
      }
    } else {
      console.log('✅ Estrutura básica funciona!');
      await supabase.from('clientes').delete().eq('nome', 'Teste Cliente');
    }

    // Verificar dados existentes
    console.log('\n📊 Verificando dados existentes...');

    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .limit(1);

    if (clientesError) {
      console.log('❌ Erro ao buscar clientes:', clientesError.message);
    } else {
      console.log('👥 Total de clientes:', clientes?.length || 0);
      if (clientes && clientes.length > 0) {
        console.log('📋 Estrutura do cliente:', Object.keys(clientes[0]));
      }
    }

    const { data: ordens, error: ordensError } = await supabase
      .from('ordens_servico')
      .select('*')
      .limit(1);

    if (ordensError) {
      console.log('❌ Erro ao buscar ordens:', ordensError.message);
    } else {
      console.log('📋 Total de ordens:', ordens?.length || 0);
    }

    const { data: equipamentos, error: equipamentosError } = await supabase
      .from('equipamentos')
      .select('*')
      .limit(1);

    if (equipamentosError) {
      console.log('❌ Erro ao buscar equipamentos:', equipamentosError.message);
    } else {
      console.log('🔧 Total de equipamentos:', equipamentos?.length || 0);
    }
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

checkTableStructure();
