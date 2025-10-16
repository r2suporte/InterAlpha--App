import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppService } from '@/services/whatsapp/whatsapp-service';
import twilio from 'twilio';

// Webhook para receber mensagens WhatsApp do Twilio
export async function POST(request: NextRequest) {
  try {
    // Verificar se é uma requisição válida do Twilio
    const signature = request.headers.get('x-twilio-signature');
    const {url} = request;
    const formData = await request.formData();
    
    // Converter FormData para objeto
    const body: Record<string, any> = {};
    formData.forEach((value, key) => {
      body[key] = value.toString();
    });

    // Validar assinatura do Twilio (opcional, mas recomendado)
    if (process.env.TWILIO_AUTH_TOKEN && signature) {
      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        signature,
        url,
        body
      );

      if (!isValid) {
        console.error('❌ Assinatura Twilio inválida');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Parse dos dados do webhook
    const params = new URLSearchParams(body);
    const webhookData = {
      MessageSid: params.get('MessageSid'),
      From: params.get('From'),
      To: params.get('To'),
      Body: params.get('Body'),
      ProfileName: params.get('ProfileName'),
      MediaUrl0: params.get('MediaUrl0'),
      MediaContentType0: params.get('MediaContentType0'),
      NumMedia: params.get('NumMedia'),
      AccountSid: params.get('AccountSid'),
    };

    console.log('📱 Webhook WhatsApp recebido:', {
      from: webhookData.From,
      to: webhookData.To,
      body: webhookData.Body,
      profileName: webhookData.ProfileName,
    });

    // Processar mensagem recebida
    const whatsappService = getWhatsAppService();
    await whatsappService.handleIncomingMessage(webhookData);

    // Responder ao Twilio que recebemos o webhook
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Erro no webhook WhatsApp:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se o webhook está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'WhatsApp webhook ativo',
    timestamp: new Date().toISOString(),
    endpoint: '/api/webhooks/whatsapp',
    methods: ['POST'],
    description: 'Webhook para receber mensagens WhatsApp via Twilio',
  });
}