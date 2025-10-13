// 📋 API SMS Templates - Listar Templates Disponíveis
// Endpoint para consultar templates de SMS
import { NextResponse } from 'next/server';

// 📋 GET - Listar templates disponíveis
export async function GET() {
  try {
    const templates = {
      bemVindo: {
        name: 'Bem-vindo',
        description: 'Mensagem de boas-vindas para novos clientes',
        parameters: ['nome'],
        example: 'bemVindo("João")',
        preview:
          '🎉 Bem-vindo à InterAlpha, João! Estamos prontos para cuidar dos seus equipamentos Apple com excelência.',
      },
      lembreteManutencao: {
        name: 'Lembrete de Manutenção',
        description: 'Lembrete para manutenção preventiva',
        parameters: ['nome', 'equipamento'],
        example: 'lembreteManutencao("Maria", "MacBook Pro")',
        preview:
          '🔧 Maria, que tal agendar uma manutenção preventiva para seu MacBook Pro? Entre em contato conosco!',
      },
      promocao: {
        name: 'Promoção',
        description: 'Mensagem promocional com desconto',
        parameters: ['nome', 'desconto'],
        example: 'promocao("Carlos", "20%")',
        preview:
          '🎁 Carlos, oferta especial! 20% de desconto em serviços. Válido até o final do mês!',
      },
      agendamento: {
        name: 'Confirmação de Agendamento',
        description: 'Confirmação de agendamento de serviço',
        parameters: ['nome', 'data', 'hora'],
        example: 'agendamento("Ana", "15/01/2024", "14:30")',
        preview:
          '📅 Ana, seu agendamento está confirmado para 15/01/2024 às 14:30. Aguardamos você!',
      },
    };

    return NextResponse.json({
      success: true,
      templates,
      totalTemplates: Object.keys(templates).length,
    });
  } catch (error) {
    console.error('❌ Erro ao listar templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
