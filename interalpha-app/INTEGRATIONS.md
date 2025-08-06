# Integrações Avançadas - InterAlpha

Este documento descreve como configurar e usar as integrações avançadas do sistema InterAlpha.

## 🚀 Funcionalidades

- **Sistema de Notificações**: Email, SMS e WhatsApp automáticos
- **Integração WhatsApp Business**: Comunicação via Twilio
- **Sincronização Contábil**: Integração com sistemas contábeis
- **Dashboard Analytics**: Métricas e relatórios avançados
- **Automação de Workflows**: Processos automatizados
- **Google Calendar**: Sincronização de agendamentos
- **Sistema de Backup**: Backup automático do banco
- **API Externa**: Interface para integrações de terceiros

## 📋 Pré-requisitos

### Serviços Externos

1. **Redis** - Sistema de filas
2. **Conta Twilio** - SMS e WhatsApp
3. **Conta Google** - Calendar API
4. **SMTP** - Envio de emails
5. **Sistema Contábil** - API de integração (opcional)

### Instalação do Redis

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 --name redis redis:alpine
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### 2. Configurações Obrigatórias

```env
# Email
SMTP_HOST="smtp.gmail.com"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"

# Twilio
TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_AUTH_TOKEN="xxxxx"
TWILIO_PHONE_NUMBER="+1234567890"

# Google Calendar
GOOGLE_CLIENT_ID="xxxxx"
GOOGLE_CLIENT_SECRET="xxxxx"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

### 3. Configuração do Google Calendar

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a Google Calendar API
4. Crie credenciais OAuth 2.0
5. Configure as URLs de redirecionamento

### 4. Configuração do Twilio

1. Crie uma conta no [Twilio](https://www.twilio.com/)
2. Obtenha o Account SID e Auth Token
3. Configure um número de telefone
4. Para WhatsApp, solicite acesso ao WhatsApp Business API

## 🛠️ Instalação

### 1. Instalar Dependências

```bash
npm install
```

### 2. Verificar Configuração

```bash
npm run integrations:init
```

### 3. Iniciar Aplicação

```bash
npm run dev
```

## 📊 Monitoramento

### Health Check

```bash
# Via script
npm run integrations:health

# Via curl
curl http://localhost:3000/api/integrations/health
```

### Estatísticas das Filas

```bash
# Via script
npm run integrations:stats

# Via curl
curl http://localhost:3000/api/integrations/queues/stats
```

### Testes de Funcionalidades

```bash
# Testar sistema de email
npm run email:test seu-email@exemplo.com

# Testar sistema de SMS
npm run sms:test +5511999999999

# Testar sistema de WhatsApp
npm run whatsapp:test +5511999999999
```

### Endpoints de Monitoramento

- `GET /api/integrations/health` - Status das integrações
- `GET /api/integrations/queues/stats` - Estatísticas das filas

## 🔧 Uso das Integrações

### Sistema de Notificações

```typescript
import { addJobToQueue, emailQueue } from '@/lib/integrations';

// Enviar email
await addJobToQueue(emailQueue, 'send-email', {
  to: 'cliente@email.com',
  subject: 'Ordem de Serviço Concluída',
  template: 'order-completed',
  data: { orderNumber: '12345', clientName: 'João' }
});
```

### SMS

```typescript
import { smsNotifications } from '@/services/sms/sms-notifications';

// Enviar SMS de ordem concluída
await smsNotifications.sendOrderCompleted({
  clientName: 'João Silva',
  clientPhone: '+5511999999999',
  orderNumber: 'ORD-001',
  serviceName: 'Manutenção'
});
```

### WhatsApp Business

```typescript
import { whatsappNotifications } from '@/services/whatsapp/whatsapp-notifications';

// Enviar WhatsApp de ordem criada
await whatsappNotifications.sendOrderCreated({
  clientName: 'João Silva',
  clientPhone: '+5511999999999',
  orderNumber: 'ORD-001',
  serviceName: 'Manutenção AC',
  status: 'PENDENTE',
  description: 'Limpeza e manutenção preventiva'
});

// Enviar mensagem personalizada
await whatsappNotifications.sendCustomMessage(
  '+5511999999999',
  'Mensagem personalizada com formatação rica',
  true // usar formatação rica
);

// Broadcast para múltiplos destinatários
await whatsappNotifications.sendBroadcastMessage(
  ['+5511999999999', '+5511888888888'],
  'Comunicado importante para todos os clientes'
);
```

#### Configuração Adicional WhatsApp

```env
# Twilio WhatsApp
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

#### Webhook WhatsApp

Configure no Twilio Console:
- **URL**: `https://seu-dominio.com/api/webhooks/whatsapp`
- **Método**: POST
- **Content-Type**: application/x-www-form-urlencoded

#### Templates Disponíveis

- `order-created` - Nova ordem de serviço
- `order-completed` - Ordem concluída  
- `order-status-changed` - Mudança de status
- `technician-assigned` - Técnico designado
- `payment-received` - Pagamento confirmado
- `payment-overdue` - Lembrete de pagamento
- `appointment-reminder` - Lembrete de agendamento
- `welcome` - Boas-vindas para novos clientes

#### Recursos WhatsApp

- ✅ Mensagens com formatação rica (negrito, emojis)
- ✅ Comunicação bidirecional com webhook
- ✅ Respostas automáticas inteligentes
- ✅ Sistema de conversas persistente
- ✅ Fallback automático para email
- ✅ Broadcast para múltiplos destinatários
- ✅ Agendamento de mensagens
- ✅ Validação de números brasileiros

### Google Calendar

```typescript
import { calendarQueue } from '@/lib/integrations';

// Criar evento no calendário
await addJobToQueue(calendarQueue, 'create-event', {
  action: 'create',
  eventData: {
    summary: 'Visita Técnica',
    start: { dateTime: '2024-01-15T10:00:00-03:00' },
    end: { dateTime: '2024-01-15T11:00:00-03:00' }
  }
});
```

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/lib/integrations/
├── config.ts          # Configurações
├── types.ts           # Tipos TypeScript
├── queues.ts          # Sistema de filas BullMQ
├── init.ts            # Inicialização
└── index.ts           # Exportações

src/services/          # Serviços de integração
├── email/
├── sms/
├── whatsapp/
├── calendar/
├── accounting/
└── backup/

src/workers/           # Workers das filas
├── email-worker.ts
├── sms-worker.ts
├── whatsapp-worker.ts
├── calendar-worker.ts
├── accounting-worker.ts
└── backup-worker.ts
```

### Sistema de Filas

- **Email Queue**: Processamento de emails
- **SMS Queue**: Envio de SMS
- **WhatsApp Queue**: Mensagens WhatsApp
- **Calendar Queue**: Sincronização de calendário
- **Accounting Queue**: Sincronização contábil
- **Backup Queue**: Backups automáticos

## 🐛 Troubleshooting

### Redis não conecta

```bash
# Verificar se Redis está rodando
redis-cli ping

# Iniciar Redis
brew services start redis  # macOS
sudo systemctl start redis # Linux
```

### Erro de autenticação Twilio

1. Verifique Account SID e Auth Token
2. Confirme se o número está verificado
3. Para WhatsApp, verifique se tem acesso aprovado

### Google Calendar não funciona

1. Verifique se a API está ativada
2. Confirme as credenciais OAuth
3. Verifique as URLs de redirecionamento

### Filas não processam

1. Verifique conexão Redis
2. Confirme se os workers estão rodando
3. Verifique logs de erro nas filas

## 📝 Logs

Os logs das integrações aparecem no console da aplicação:

```
✅ Email job 123 completed
❌ SMS job 456 failed: Invalid phone number
⏳ WhatsApp job 789 progress: 50%
```

## 🔒 Segurança

- Todas as credenciais devem estar em variáveis de ambiente
- Use HTTPS em produção
- Configure rate limiting adequado
- Monitore logs de segurança
- Mantenha dependências atualizadas

## 📚 Documentação Adicional

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Twilio API](https://www.twilio.com/docs)
- [Google Calendar API](https://developers.google.com/calendar)
- [Nodemailer](https://nodemailer.com/)

## 🆘 Suporte

Para problemas com as integrações:

1. Verifique os logs da aplicação
2. Execute o health check
3. Consulte a documentação das APIs
4. Verifique as configurações de ambiente