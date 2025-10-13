#!/usr/bin/env node

/**
 * 📱 Script de Teste Manual - SMS
 *
 * Este script permite testar manualmente o envio de SMS para o número fornecido:
 * (11) 99380-4816
 *
 * Uso:
 * node scripts/test-sms-manual.js [tipo] [mensagem]
 *
 * Tipos disponíveis:
 * - simples: Envia SMS simples
 * - ordem-criacao: Simula SMS de criação de ordem de serviço
 * - ordem-atualizacao: Simula SMS de atualização de ordem de serviço
 * - ordem-conclusao: Simula SMS de conclusão de ordem de serviço
 * - teste-conexao: Testa conexão com Twilio
 *
 * Exemplos:
 * node scripts/test-sms-manual.js simples "Teste de SMS manual"
 * node scripts/test-sms-manual.js ordem-criacao
 * node scripts/test-sms-manual.js teste-conexao
 */

const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
require('dotenv').config();

// Número de teste fornecido
const NUMERO_TESTE = '+5511993804816'; // (11) 99380-4816

// Verificar se as variáveis de ambiente estão configuradas
function verificarConfiguracao() {
  const variaveis = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
  ];

  const faltando = variaveis.filter(v => !process.env[v]);

  if (faltando.length > 0) {
    console.error('❌ Variáveis de ambiente não configuradas:');
    faltando.forEach(v => console.error(`   - ${v}`));
    console.error('\nConfigure as variáveis no arquivo .env');
    process.exit(1);
  }

  console.log('✅ Configuração do Twilio verificada');
}

// Simular dados de ordem de serviço para testes
function gerarDadosOrdemTeste() {
  return {
    id: `OS-TEST-${  Date.now()}`,
    numero:
      `OS${ 
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`,
    cliente: {
      nome: 'Cliente Teste',
      telefone: NUMERO_TESTE,
    },
    servico: 'Teste de SMS Manual',
    status: 'criada',
    data_criacao: new Date().toISOString(),
    valor: 150.0,
    tecnico: 'Técnico Teste',
  };
}

// Função para enviar SMS simples
async function enviarSMSSimples(mensagem) {
  try {
    console.log('📱 Enviando SMS simples...');
    console.log(`Para: ${NUMERO_TESTE}`);
    console.log(`Mensagem: ${mensagem}`);

    const response = await fetch('http://localhost:3000/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: NUMERO_TESTE,
        message: mensagem,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SMS enviado com sucesso!');
      console.log(`Message SID: ${result.messageSid}`);
    } else {
      console.error('❌ Erro ao enviar SMS:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return null;
  }
}

// Função para enviar SMS de ordem de serviço
async function enviarSMSOrdem(tipo) {
  try {
    const ordem = gerarDadosOrdemTeste();

    // Ajustar status baseado no tipo
    switch (tipo) {
      case 'ordem-criacao':
        ordem.status = 'criada';
        break;
      case 'ordem-atualizacao':
        ordem.status = 'em_andamento';
        break;
      case 'ordem-conclusao':
        ordem.status = 'concluida';
        break;
    }

    console.log(`📱 Enviando SMS de ${tipo}...`);
    console.log(`Ordem: ${ordem.numero}`);
    console.log(`Cliente: ${ordem.cliente.nome}`);
    console.log(`Para: ${NUMERO_TESTE}`);

    const response = await fetch(
      'http://localhost:3000/api/ordens-servico/sms',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ordemId: ordem.id,
          tipo: tipo.replace('ordem-', ''),
          numeroTelefone: NUMERO_TESTE,
          dadosOrdem: ordem,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SMS de ordem enviado com sucesso!');
      console.log(`Message SID: ${result.messageSid}`);
      console.log(`Conteúdo: ${result.conteudo}`);
    } else {
      console.error('❌ Erro ao enviar SMS de ordem:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return null;
  }
}

// Função para testar conexão com Twilio
async function testarConexao() {
  try {
    console.log('🔍 Testando conexão com Twilio...');

    const response = await fetch(
      'http://localhost:3000/api/ordens-servico/sms/test',
      {
        method: 'GET',
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Conexão com Twilio OK!');
      console.log(`Account SID: ${result.accountSid}`);
      console.log(`Phone Number: ${result.phoneNumber}`);
    } else {
      console.error('❌ Erro na conexão:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return null;
  }
}

// Função para processar SMS pendentes
async function processarSMSPendentes() {
  try {
    console.log('📤 Processando SMS pendentes...');

    const response = await fetch(
      'http://localhost:3000/api/ordens-servico/processar-sms',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SMS pendentes processados!');
      console.log(`Total processados: ${result.processados}`);
      console.log(`Sucessos: ${result.sucessos}`);
      console.log(`Falhas: ${result.falhas}`);
    } else {
      console.error('❌ Erro ao processar SMS:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return null;
  }
}

// Função para exibir ajuda
function exibirAjuda() {
  console.log(`
📱 Script de Teste Manual - SMS

Uso: node scripts/test-sms-manual.js [tipo] [mensagem]

Tipos disponíveis:
  simples              Envia SMS simples (requer mensagem)
  ordem-criacao        Simula SMS de criação de ordem de serviço
  ordem-atualizacao    Simula SMS de atualização de ordem de serviço
  ordem-conclusao      Simula SMS de conclusão de ordem de serviço
  teste-conexao        Testa conexão com Twilio
  processar-pendentes  Processa SMS pendentes no banco
  help                 Exibe esta ajuda

Exemplos:
  node scripts/test-sms-manual.js simples "Teste de SMS manual"
  node scripts/test-sms-manual.js ordem-criacao
  node scripts/test-sms-manual.js teste-conexao
  node scripts/test-sms-manual.js processar-pendentes

Número de teste: ${NUMERO_TESTE}

Nota: Certifique-se de que o servidor está rodando em http://localhost:3000
`);
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const tipo = args[0];
  const mensagem = args[1];

  console.log('🚀 Iniciando teste manual de SMS...\n');

  // Verificar configuração
  verificarConfiguracao();

  if (!tipo || tipo === 'help') {
    exibirAjuda();
    return;
  }

  console.log(`📋 Tipo de teste: ${tipo}`);
  console.log(`📞 Número de destino: ${NUMERO_TESTE}\n`);

  let resultado;

  switch (tipo) {
    case 'simples':
      if (!mensagem) {
        console.error('❌ Mensagem é obrigatória para SMS simples');
        console.log(
          'Uso: node scripts/test-sms-manual.js simples "Sua mensagem"'
        );
        return;
      }
      resultado = await enviarSMSSimples(mensagem);
      break;

    case 'ordem-criacao':
    case 'ordem-atualizacao':
    case 'ordem-conclusao':
      resultado = await enviarSMSOrdem(tipo);
      break;

    case 'teste-conexao':
      resultado = await testarConexao();
      break;

    case 'processar-pendentes':
      resultado = await processarSMSPendentes();
      break;

    default:
      console.error(`❌ Tipo de teste inválido: ${tipo}`);
      exibirAjuda();
      return;
  }

  if (resultado) {
    console.log('\n📊 Resultado completo:');
    console.log(JSON.stringify(resultado, null, 2));
  }

  console.log('\n✨ Teste concluído!');
}

// Executar script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  enviarSMSSimples,
  enviarSMSOrdem,
  testarConexao,
  processarSMSPendentes,
  NUMERO_TESTE,
};
