# Integrações Externas

## Visão Geral

O InterAlpha se integra com diversos serviços externos para fornecer funcionalidades completas de gestão empresarial. Esta documentação descreve as integrações atuais e como elas são implementadas.

## Integrações Principais

### 1. Autenticação - Clerk
- **Propósito**: Gerenciamento de usuários e autenticação
- **Implementação**: `@clerk/nextjs` com middleware de autenticação
- **Configuração**: Variáveis de ambiente `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`

### 2. Pagamentos - Stripe
- **Propósito**: Processamento de pagamentos
- **Implementação**: `@stripe/react-stripe-js` e `@stripe/stripe-js`
- **Configuração**: `STRIPE_SECRET_KEY` e `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 3. Mensagens - WhatsApp Business API
- **Propósito**: Comunicação com clientes via WhatsApp
- **Implementação**: Integração direta com a API do WhatsApp Business
- **Configuração**: Credenciais da conta Business e tokens de acesso

### 4. Mensagens - SMS (Twilio)
- **Propósito**: Envio de mensagens SMS
- **Implementação**: Biblioteca `twilio`
- **Configuração**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, e `TWILIO_PHONE_NUMBER`

### 5. E-mails - Nodemailer
- **Propósito**: Envio de e-mails transacionais
- **Implementação**: Biblioteca `nodemailer`
- **Configuração**: Credenciais do servidor SMTP

### 6. Banco de Dados - Neon PostgreSQL
- **Propósito**: Armazenamento de dados principais
- **Implementação**: Prisma ORM com conexão PostgreSQL
- **Configuração**: `DATABASE_URL`

### 7. Caching - Redis
- **Propósito**: Cache de dados e gerenciamento de filas
- **Implementação**: Biblioteca `ioredis`
- **Configuração**: `REDIS_URL`

### 8. Filas - BullMQ
- **Propósito**: Processamento assíncrono de tarefas
- **Implementação**: Biblioteca `bullmq`
- **Configuração**: Conexão com Redis

## Estrutura de Integrações

### Services
As integrações são implementadas como serviços na pasta `src/services/`:

- `services/whatsapp-service.ts` - Integração com WhatsApp
- `services/sms-service.ts` - Integração com Twilio
- `services/email-service.ts` - Envio de e-mails
- `services/payment-service.ts` - Processamento de pagamentos
- `services/calendar-service.ts` - Integração com Google Calendar

### Configuração
As credenciais das integrações são armazenadas em variáveis de ambiente e validadas no startup da aplicação.

## Implementação de Novas Integrações

### 1. Criar Service
Criar um novo service na pasta `src/services/`:

```typescript
// src/services/nova-integracao-service.ts
import axios from 'axios';

class NovaIntegracaoService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NOVA_INTEGRACAO_API_KEY || '';
    this.baseUrl = process.env.NOVA_INTEGRACAO_BASE_URL || '';
  }

  async fetchData(id: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/data/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Erro na integração: ${error}`);
    }
  }
}

export const novaIntegracaoService = new NovaIntegracaoService();
```

### 2. Adicionar Validação de Configuração
Adicionar validação das variáveis de ambiente em `scripts/check-integrations.js`:

```javascript
// Verificar configuração da nova integração
if (!process.env.NOVA_INTEGRACAO_API_KEY) {
  console.warn('⚠️  NOVA_INTEGRACAO_API_KEY não configurada');
  configErrors.push('NOVA_INTEGRACAO_API_KEY');
}
```

### 3. Criar API Route
Criar uma API route para expor a integração:

```typescript
// src/app/api/nova-integracao/route.ts
import { novaIntegracaoService } from '@/services/nova-integracao-service';

export async function GET(request: Request) {
  try {
    const data = await novaIntegracaoService.fetchData('123');
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## Gerenciamento de Credenciais

### Variáveis de Ambiente
Todas as credenciais são armazenadas em variáveis de ambiente:

- `.env.local` - Credenciais locais (não versionado)
- `.env.example` - Template para credenciais (versionado)

### Segurança
- Nunca commitar credenciais reais
- Utilizar credenciais com permissões mínimas necessárias
- Rotacionar credenciais regularmente
- Monitorar uso de credenciais

## Monitoramento e Logging

### Logging
Todas as integrações devem implementar logging adequado:

```typescript
import { logger } from '@/lib/logger';

class IntegrationService {
  async performAction() {
    try {
      logger.info('Iniciando integração XYZ');
      // Lógica da integração
      logger.info('Integração XYZ concluída com sucesso');
    } catch (error) {
      logger.error('Erro na integração XYZ', { error });
      throw error;
    }
  }
}
```

### Monitoramento
- Implementar health checks para integrações críticas
- Monitorar tempos de resposta
- Alertar sobre falhas de integração

## Tratamento de Erros

### Estratégia
- Implementar retry logic para integrações que podem falhar temporariamente
- Ter fallbacks quando possível
- Notificar sobre falhas críticas

### Exemplo
```typescript
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}
```

## Testes de Integração

### Testes Automatizados
- Criar testes para os services de integração
- Utilizar mocks para evitar chamadas reais em testes
- Testar cenários de sucesso e falha

### Testes Manuais
- Criar scripts de teste para verificar integrações manualmente
- Adicionar comandos npm para testar integrações específicas

```json
{
  "scripts": {
    "test:whatsapp": "node scripts/test-whatsapp.js",
    "test:sms": "node scripts/test-sms.js",
    "test:email": "node scripts/test-email.js"
  }
}
```

## Boas Práticas

### 1. Resiliência
- Implementar timeouts para chamadas externas
- Ter estratégias de fallback para integrações críticas
- Monitorar saúde das integrações

### 2. Performance
- Utilizar caching quando apropriado
- Implementar paginação para grandes volumes de dados
- Otimizar chamadas de API

### 3. Segurança
- Validar todos os dados recebidos de integrações externas
- Utilizar HTTPS para todas as comunicações
- Proteger credenciais adequadamente

### 4. Manutenção
- Documentar todas as integrações
- Ter planos de contingência para falhas de integração
- Manter dependências atualizadas