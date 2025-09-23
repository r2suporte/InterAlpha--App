# 📱 Guia de Testes SMS - InterAlpha App

Este documento descreve como executar os testes SMS implementados no sistema InterAlpha.

## 🧪 Tipos de Testes Disponíveis

### 1. Testes Unitários
Localização: `__tests__/services/sms-service.test.ts`

```bash
# Executar testes unitários do serviço SMS
npm test -- __tests__/services/sms-service.test.ts
```

**Cobertura:**
- ✅ Formatação de números de telefone
- ✅ Envio de SMS simples
- ✅ Envio de SMS para ordens de serviço
- ✅ Teste de conexão com Twilio
- ✅ Tratamento de erros

### 2. Testes de Integração - APIs de Ordens de Serviço
Localização: `__tests__/integration/ordem-servico-sms.test.ts`

```bash
# Executar testes de integração das APIs
npm test -- __tests__/integration/ordem-servico-sms.test.ts
```

**Cobertura:**
- ✅ Criação de ordem de serviço com SMS
- ✅ Atualização de status com SMS
- ✅ Envio de SMS específico para ordem
- ✅ Processamento em lote de SMS
- ✅ Fluxo completo de ordem com SMS
- ✅ Tratamento de erros de SMS
- ✅ Integração com número de teste (11) 99380-4816

### 3. Testes de Integração - Webhook SMS
Localização: `__tests__/integration/webhook-sms.test.ts`

```bash
# Executar testes do webhook SMS
npm test -- __tests__/integration/webhook-sms.test.ts
```

**Cobertura:**
- ✅ Processamento de diferentes status (delivered, failed, sent, undelivered)
- ✅ Validação de dados obrigatórios
- ✅ Tratamento de erros do Supabase
- ✅ Integração com número de teste

### 4. Teste Manual
Localização: `scripts/test-sms-manual.js`

```bash
# Tornar o script executável
chmod +x scripts/test-sms-manual.js

# Executar diferentes tipos de teste
node scripts/test-sms-manual.js [tipo] [mensagem]
```

## 🎯 Número de Teste

**Número configurado:** `(11) 99380-4816` / `+5511993804816`

Este número está integrado em todos os testes para garantir consistência.

## 🚀 Como Executar Testes Manuais

### Pré-requisitos
1. Servidor rodando: `npm run dev`
2. Variáveis de ambiente configuradas no `.env`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

### Exemplos de Uso

#### 1. SMS Simples
```bash
node scripts/test-sms-manual.js simples "Teste de SMS manual"
```

#### 2. SMS de Criação de Ordem
```bash
node scripts/test-sms-manual.js ordem-criacao
```

#### 3. SMS de Atualização de Ordem
```bash
node scripts/test-sms-manual.js ordem-atualizacao
```

#### 4. SMS de Conclusão de Ordem
```bash
node scripts/test-sms-manual.js ordem-conclusao
```

#### 5. Teste de Conexão
```bash
node scripts/test-sms-manual.js teste-conexao
```

#### 6. Processar SMS Pendentes
```bash
node scripts/test-sms-manual.js processar-pendentes
```

#### 7. Exibir Ajuda
```bash
node scripts/test-sms-manual.js help
```

## 📊 Resultados dos Testes

### Testes Unitários
- **Total:** 8 testes
- **Status:** ✅ Todos passando
- **Cobertura:** Serviço SMS completo

### Testes de Integração - APIs
- **Total:** 14 testes
- **Status:** ✅ Todos passando
- **Cobertura:** APIs de ordens de serviço com SMS

### Testes de Integração - Webhook
- **Total:** 14 testes
- **Status:** ✅ Todos passando
- **Cobertura:** Webhook de status SMS do Twilio

## 🔧 Troubleshooting

### Erro: "Request is not defined"
- **Solução:** Os testes estão configurados com `@jest-environment node`
- **Verificar:** Configuração do Jest no `jest.config.js`

### Erro: "Variáveis de ambiente não configuradas"
- **Solução:** Configurar as variáveis do Twilio no arquivo `.env`
- **Verificar:** Arquivo `.env.example` para referência

### Erro: "Servidor não está rodando"
- **Solução:** Executar `npm run dev` em outro terminal
- **Verificar:** Servidor acessível em `http://localhost:3000`

### Erro: "SMS não enviado"
- **Verificar:** Credenciais do Twilio
- **Verificar:** Número de telefone verificado no Twilio
- **Verificar:** Saldo da conta Twilio

## 📝 Logs e Monitoramento

### Logs do Sistema
```bash
# Ver logs em tempo real
npm run dev

# Logs específicos do SMS
# Procurar por: 📱, ✅, ❌, ⚠️
```

### Webhook Logs
- Logs automáticos no console quando webhooks são recebidos
- Status de entrega atualizados no Supabase
- Códigos de erro registrados para falhas

## 🎯 Próximos Passos

1. **Monitoramento:** Implementar dashboard de métricas SMS
2. **Alertas:** Configurar alertas para falhas de SMS
3. **Analytics:** Adicionar análise de taxa de entrega
4. **Templates:** Expandir templates de mensagens
5. **Agendamento:** Implementar envio agendado de SMS

## 📞 Suporte

Para dúvidas ou problemas com os testes SMS:
1. Verificar logs do sistema
2. Consultar documentação do Twilio
3. Revisar configurações do Supabase
4. Testar conectividade de rede

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0