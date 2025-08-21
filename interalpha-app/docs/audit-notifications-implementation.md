# Sistema de Notificações - Auditoria InterAlpha

## 📧 Visão Geral

Implementei um sistema completo de notificações para o sistema de auditoria, transformando logs passivos em alertas ativos por email e SMS. O sistema processa notificações de forma assíncrona usando filas e oferece templates HTML responsivos.

## 🎯 **Funcionalidades Implementadas**

### **📧 Serviço de Email (Nodemailer)**
- ✅ **Templates HTML responsivos** para diferentes tipos de alerta
- ✅ **Priorização automática** baseada na severidade
- ✅ **Suporte a múltiplos destinatários**
- ✅ **Fallback para texto simples**
- ✅ **Headers de prioridade** para clientes de email

### **📱 Serviço de SMS (Twilio)**
- ✅ **Integração com Twilio** para SMS e WhatsApp
- ✅ **Mensagens otimizadas** para limite de caracteres
- ✅ **Suporte a WhatsApp Business**
- ✅ **Emojis contextuais** por severidade
- ✅ **Fallback gracioso** quando não configurado

### **⚡ Sistema de Filas (BullMQ + Redis)**
- ✅ **Processamento assíncrono** de notificações
- ✅ **Priorização por severidade** (crítico → baixo)
- ✅ **Retry automático** com backoff exponencial
- ✅ **Monitoramento de status** da fila
- ✅ **Controle de concorrência** (5 workers simultâneos)

### **🎛️ Orquestração Inteligente**
- ✅ **Cooldown automático** para evitar spam
- ✅ **Filtro por severidade** configurável
- ✅ **Destinatários personalizáveis** por tipo de alerta
- ✅ **Integração automática** com eventos de auditoria

## 🏗️ **Arquitetura do Sistema**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Audit Event   │───▶│ Notification     │───▶│   Queue System  │
│                 │    │ Service          │    │   (BullMQ)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Email Service  │    │  SMS Service    │
                       │   (Nodemailer)   │    │   (Twilio)      │
                       └──────────────────┘    └─────────────────┘
```

## 📋 **Tipos de Notificação**

### **1. Alertas de Segurança**
```typescript
// Enviado automaticamente quando eventos críticos ocorrem
- Tentativas de login suspeitas
- Múltiplas falhas de autenticação
- Ataques de força bruta
- Escalação de privilégios
- Violações de dados
```

### **2. Relatórios de Auditoria**
```typescript
// Enviado quando relatórios são gerados
- Relatórios mensais/semanais
- Relatórios sob demanda
- Relatórios críticos (com SMS)
- Links para download
```

### **3. Alertas de Compliance**
```typescript
// Enviado quando não conformidades são detectadas
- Violações LGPD
- Problemas SOX
- Falhas ISO27001
- Recomendações de correção
```

### **4. Alertas Críticos**
```typescript
// Enviado imediatamente para situações críticas
- Sistema comprometido
- Falhas de segurança graves
- Indisponibilidade de serviços
- Emergências operacionais
```

## 🔧 **Configuração**

### **Variáveis de Ambiente**
```bash
# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@interalpha.com"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Redis (Filas)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Configurações de Notificação
AUDIT_ALERT_EMAILS="admin@interalpha.com,security@interalpha.com"
AUDIT_ALERT_PHONES="+5511999999999"
NOTIFICATION_COOLDOWN_MINUTES="60"
NOTIFICATION_SEVERITY_THRESHOLD="medium"
```

### **Configuração do Gmail**
Para usar Gmail como SMTP:
1. Ativar autenticação de 2 fatores
2. Gerar senha de aplicativo
3. Usar a senha de aplicativo no `SMTP_PASS`

### **Configuração do Twilio**
1. Criar conta no Twilio
2. Obter Account SID e Auth Token
3. Comprar número de telefone
4. (Opcional) Configurar WhatsApp Business

## 📊 **APIs Implementadas**

### **1. Configurações de Notificação**
```typescript
GET  /api/audit/notifications      // Obter configurações
PUT  /api/audit/notifications      // Atualizar configurações
```

### **2. Testes de Notificação**
```typescript
POST /api/audit/notifications/test // Testar sistema
```

### **3. Envio Manual**
```typescript
POST /api/audit/notifications/send // Enviar notificação manual
```

### **4. Estatísticas da Fila**
```typescript
GET    /api/audit/notifications/stats // Obter estatísticas
DELETE /api/audit/notifications/stats // Limpar fila
```

## 🎨 **Templates de Email**

### **Template de Alerta de Segurança**
- **Header colorido** baseado na severidade
- **Detalhes técnicos** organizados
- **Ações automáticas** executadas
- **Link direto** para o dashboard
- **Design responsivo** para mobile

### **Template de Relatório**
- **Resumo visual** com estatísticas
- **Gráficos de dados** principais
- **Link de download** do relatório
- **Período de análise** destacado

### **Template de Compliance**
- **Status de conformidade** visual
- **Lista de achados** organizados
- **Recomendações** de correção
- **Priorização** por severidade

## 📱 **Interface de Administração**

### **Componente NotificationSettings**
- ✅ **4 abas organizadas**: Configurações, Destinatários, Estatísticas, Testes
- ✅ **Configuração visual** de todos os parâmetros
- ✅ **Gerenciamento de destinatários** (adicionar/remover)
- ✅ **Estatísticas em tempo real** da fila
- ✅ **Testes integrados** de email e SMS
- ✅ **Status dos serviços** (configurado/não configurado)

### **Integração no Dashboard**
- ✅ **Nova aba** "Notificações" nas configurações
- ✅ **Acesso direto** via `/auditoria/configuracoes`
- ✅ **Interface intuitiva** para administradores

## 🔄 **Fluxo de Processamento**

### **1. Evento de Segurança Detectado**
```
Audit Service → Security Event → Notification Service → Queue → Email/SMS
```

### **2. Processamento da Fila**
```
1. Job recebido na fila
2. Worker processa baseado na prioridade
3. Serviços de email/SMS executam envio
4. Retry automático em caso de falha
5. Status atualizado (sucesso/falha)
```

### **3. Controle de Cooldown**
```
1. Verificar se evento similar foi enviado recentemente
2. Se em cooldown, pular notificação
3. Se não, enviar e atualizar timestamp
4. Cooldown configurável por tipo de evento
```

## 🧪 **Sistema de Testes**

### **Script de Teste Automatizado**
```bash
npm run notifications:test
```

**O que testa:**
- ✅ Configuração dos serviços (email/SMS)
- ✅ Criação de eventos mock
- ✅ Envio de alertas de segurança
- ✅ Alertas críticos
- ✅ Notificações de relatório
- ✅ Alertas de compliance
- ✅ Estatísticas do sistema
- ✅ Teste completo end-to-end

### **Testes via Interface**
- ✅ **Teste individual** (email ou SMS)
- ✅ **Teste completo** (todos os serviços)
- ✅ **Feedback visual** dos resultados
- ✅ **Logs detalhados** no console

## 📈 **Monitoramento e Estatísticas**

### **Métricas Disponíveis**
- **Fila de espera**: Notificações pendentes
- **Processando**: Notificações sendo enviadas
- **Enviadas**: Notificações com sucesso
- **Falharam**: Notificações com erro
- **Status dos serviços**: Email/SMS configurados
- **Contadores de destinatários**: Emails/telefones cadastrados

### **Dashboard de Monitoramento**
- ✅ **Cards visuais** com métricas principais
- ✅ **Status em tempo real** dos serviços
- ✅ **Histórico de envios** (sucesso/falha)
- ✅ **Alertas de configuração** quando serviços não estão configurados

## 🔒 **Segurança e Privacidade**

### **Proteção de Dados**
- ✅ **Credenciais criptografadas** em variáveis de ambiente
- ✅ **Logs sanitizados** (sem dados sensíveis)
- ✅ **Timeout de conexão** para evitar travamentos
- ✅ **Rate limiting** implícito via cooldown

### **Controle de Acesso**
- ✅ **Autenticação obrigatória** para todas as APIs
- ✅ **Logs de configuração** (quem alterou o quê)
- ✅ **Validação de destinatários** (formato de email/telefone)
- ✅ **Sanitização de conteúdo** das mensagens

## 🚀 **Performance e Escalabilidade**

### **Otimizações Implementadas**
- ✅ **Processamento assíncrono** via filas
- ✅ **Workers concorrentes** (5 simultâneos)
- ✅ **Retry com backoff** exponencial
- ✅ **Cleanup automático** de jobs antigos
- ✅ **Conexão persistente** com Redis

### **Limites e Capacidade**
- **Email**: Sem limite (depende do SMTP)
- **SMS**: Limitado pelo plano Twilio
- **Fila**: 100 jobs completos + 50 falhas mantidos
- **Retry**: 3 tentativas com delay exponencial
- **Cooldown**: Configurável (padrão 60 minutos)

## 🔧 **Troubleshooting**

### **Problemas Comuns**

#### **Email não enviando**
```bash
# Verificar configuração SMTP
npm run notifications:test

# Logs comuns:
- "Authentication failed" → Verificar SMTP_USER/SMTP_PASS
- "Connection timeout" → Verificar SMTP_HOST/SMTP_PORT
- "Invalid recipients" → Verificar formato dos emails
```

#### **SMS não enviando**
```bash
# Verificar configuração Twilio
# Logs comuns:
- "Account not configured" → Verificar TWILIO_ACCOUNT_SID/AUTH_TOKEN
- "Invalid phone number" → Verificar formato (+5511999999999)
- "Insufficient funds" → Verificar saldo da conta Twilio
```

#### **Fila travada**
```bash
# Limpar fila via API
DELETE /api/audit/notifications/stats

# Ou reiniciar Redis
redis-cli FLUSHALL
```

## 📚 **Próximos Passos**

### **Melhorias Planejadas**
1. **Templates customizáveis** via interface
2. **Agendamento de notificações** (relatórios periódicos)
3. **Integração com Slack/Teams** para alertas
4. **Dashboard em tempo real** com WebSockets
5. **Análise de entregabilidade** (bounce rate, open rate)
6. **Notificações push** para aplicativo mobile

### **Integrações Futuras**
- **PagerDuty** para alertas críticos
- **Webhook endpoints** para sistemas externos
- **Microsoft Teams** para notificações corporativas
- **Telegram Bot** para alertas instantâneos

## 🎯 **Conclusão**

O sistema de notificações está **100% funcional** e pronto para produção! 

### **Recursos Implementados**
- ✅ **Email HTML responsivo** com templates profissionais
- ✅ **SMS/WhatsApp** via Twilio com mensagens otimizadas
- ✅ **Sistema de filas** robusto com retry automático
- ✅ **Interface administrativa** completa
- ✅ **4 APIs** para gerenciamento completo
- ✅ **Testes automatizados** e manuais
- ✅ **Monitoramento em tempo real** com estatísticas
- ✅ **Integração automática** com sistema de auditoria
- ✅ **Configuração flexível** via interface e variáveis

### **Impacto no Sistema**
- **Alertas passivos** → **Notificações ativas**
- **Logs ignorados** → **Ações imediatas**
- **Problemas descobertos tarde** → **Detecção em tempo real**
- **Administração manual** → **Automação inteligente**

O sistema agora transforma eventos de auditoria em ações concretas, garantindo que problemas de segurança sejam comunicados imediatamente aos responsáveis! 🚀