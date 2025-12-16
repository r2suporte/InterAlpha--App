# Próximos Passos - Migração do Clerk

## ⚠️ AÇÃO NECESSÁRIA: Configuração do Banco de Dados

### Problema Identificado
O `DATABASE_URL` no `.env.local` parece estar com credenciais inválidas ou expiradas. O Prisma não conseguiu conectar ao banco de dados Neon.

### Solução

#### Opção 1: Atualizar Credenciais do Neon (Recomendado)

1. **Acessar Neon Dashboard**:
   - Vá para: https://console.neon.tech
   - Faça login na sua conta

2. **Obter Nova Connection String**:
   - Selecione seu projeto
   - Vá em "Connection Details"
   - Copie a connection string completa
   - **IMPORTANTE**: Use a connection string com "Pooled connection" para melhor performance

3. **Atualizar `.env.local`**:
   ```bash
   DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   ```

4. **Executar Migração**:
   ```bash
   npx prisma db push
   ```

#### Opção 2: Criar Novo Banco no Neon

Se o banco atual não estiver disponível:

1. Criar novo projeto no Neon
2. Copiar a connection string
3. Atualizar `.env.local`
4. Executar `npx prisma db push`

---

## 📋 Checklist Pós-Migração do Banco

Após conseguir conectar ao banco e executar `npx prisma db push` com sucesso:

### 1. Verificar Tabelas Criadas ✅
```bash
npx prisma studio
```

Verificar se as seguintes tabelas foram criadas:
- ✅ `comunicacoes_cliente`
- ✅ `communication_metrics`
- ✅ `application_metrics`
- ✅ `alert_rules`
- ✅ `alerts`
- ✅ `alert_notifications`

### 2. Descomentar Operações de Banco de Dados

#### A. `lib/services/sms-service.ts`

**Localizar** (linha ~261):
```typescript
// TODO: Add comunicacoes_cliente table to Prisma schema
// await prisma.comunicacoesCliente.create({
```

**Descomentar**:
```typescript
await prisma.comunicacaoCliente.create({
  data: {
    clienteTelefone: data.cliente_telefone,
    tipo: data.tipo,
    conteudo: data.conteudo,
    status: data.status,
    provider: data.provider,
    messageId: data.message_id,
    dataEnvio: new Date(),
  },
});
```

**Remover**: `console.log('📱 SMS log:', data);`

---

#### B. `lib/services/email-service.ts`

**Localizar** (linha ~344):
```typescript
// TODO: Add comunicacoes_cliente table to Prisma schema
// await prisma.comunicacoesCliente.create({
```

**Descomentar**:
```typescript
await prisma.comunicacaoCliente.create({
  data: {
    clientePortalId: dados.cliente_portal_id,
    ordemServicoId: dados.ordem_servico_id,
    tipo: dados.tipo,
    conteudo: dados.conteudo,
    destinatario: dados.destinatario,
    status: dados.status,
    messageId: dados.message_id,
    erro: dados.erro,
    enviadoEm: new Date(),
  },
});
```

**Remover**: `console.log('📧 Email log:', dados);`

---

#### C. `lib/services/metrics-service.ts`

**Localizar** (linha ~76):
```typescript
// TODO: Add communication_metrics table to Prisma schema
// await prisma.communicationMetrics.create({
```

**Descomentar**:
```typescript
await prisma.communicationMetric.create({
  data: {
    service: metric.service,
    operation: metric.operation,
    durationMs: metric.duration,
    success: metric.success,
    errorMessage: metric.error,
    metadata: metric.metadata,
    createdAt: metric.timestamp,
  },
});
```

**Remover**: `console.log('📊 Metric recorded:', ...);`

**Também atualizar** `getPerformanceStats` para usar banco de dados ao invés de memória (opcional - pode manter in-memory por performance).

---

#### D. `lib/services/alert-service.ts`

Este arquivo tem muitas operações de banco. **Recomendação**: Fazer uma revisão completa e substituir todas as referências comentadas.

**Padrão geral**:
- Todas as queries do Supabase devem ser convertidas para Prisma
- Exemplo:
  ```typescript
  // Antes (Supabase):
  const { data } = await this.supabase.from('alert_rules').select('*');
  
  // Depois (Prisma):
  const data = await prisma.alertRule.findMany();
  ```

---

#### E. `lib/services/communication-service.ts` e `application-metrics.ts`

Similar ao alert-service, fazer revisão completa das operações de banco.

---

### 3. Testar Compilação

Após descomentar as operações:

```bash
npm run build
```

Verificar se não há erros de TypeScript.

---

### 4. Configurar Webhook do Clerk

#### Passo 1: Deploy da Aplicação

Primeiro, faça deploy da aplicação para obter uma URL pública:

```bash
# Exemplo com Vercel:
vercel --prod

# Ou outro serviço de hosting
```

#### Passo 2: Configurar no Clerk Dashboard

1. **Acessar**: https://dashboard.clerk.com
2. **Ir para**: Webhooks → Add Endpoint
3. **Configurar**:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/clerk`
   - **Subscribe to events**:
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
   - **Signing Secret**: Copiar o secret gerado

4. **Adicionar ao `.env.local` e produção**:
   ```bash
   CLERK_WEBHOOK_SECRET="whsec_..."
   ```

5. **Testar Webhook**:
   - Criar um usuário de teste no Clerk Dashboard
   - Verificar logs do webhook
   - Confirmar que usuário foi criado no banco de dados

---

### 5. Configurar Roles dos Usuários

Para cada usuário no Clerk Dashboard:

1. **Acessar**: Users → Selecionar usuário
2. **Ir para**: Metadata tab
3. **Adicionar em Public Metadata**:
   ```json
   {
     "role": "tecnico"
   }
   ```

**Roles disponíveis**:
- `diretor` - Acesso total
- `gerente_administrativo` - Gestão administrativa
- `gerente_financeiro` - Gestão financeira
- `supervisor_tecnico` - Supervisão técnica
- `tecnico` - Execução de reparos
- `atendente` - Atendimento ao cliente
- `user` - Usuário padrão (default)

---

### 6. Testes Finais

#### Teste 1: Autenticação
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Testar:
# 1. Login em http://localhost:3000/sign-in
# 2. Verificar redirecionamento para /dashboard
# 3. Verificar nome do usuário no header
# 4. Fazer logout
```

#### Teste 2: Webhook
```bash
# Criar usuário no Clerk Dashboard
# Verificar no banco de dados:
npx prisma studio

# Procurar na tabela 'users' pelo novo usuário
```

#### Teste 3: Roles
```bash
# Login com usuário de role 'tecnico'
# Tentar acessar /admin/users (deve ser bloqueado)

# Login com usuário de role 'gerente_administrativo'
# Acessar /admin/users (deve funcionar)
```

---

## 🚨 Troubleshooting

### Erro: "DATABASE_URL not found"
**Solução**: Verificar se `.env.local` existe e contém DATABASE_URL

### Erro: "Authentication failed"
**Solução**: Verificar credenciais do Neon, gerar nova connection string

### Erro: "Table does not exist"
**Solução**: Executar `npx prisma db push` novamente

### Webhook não funciona
**Solução**: 
1. Verificar se URL está acessível publicamente
2. Verificar se CLERK_WEBHOOK_SECRET está configurado
3. Verificar logs do webhook no Clerk Dashboard

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs**: `npm run dev` e observar console
2. **Verificar Prisma Studio**: `npx prisma studio`
3. **Verificar Clerk Dashboard**: Logs de webhooks
4. **Documentação**:
   - Neon: https://neon.tech/docs
   - Clerk: https://clerk.com/docs
   - Prisma: https://www.prisma.io/docs

---

## ✅ Checklist Final

- [ ] DATABASE_URL configurado corretamente
- [ ] `npx prisma db push` executado com sucesso
- [ ] Tabelas verificadas no Prisma Studio
- [ ] Operações de banco descomentadas nos serviços
- [ ] `npm run build` executado sem erros
- [ ] Aplicação deployada
- [ ] Webhook configurado no Clerk Dashboard
- [ ] CLERK_WEBHOOK_SECRET adicionado ao ambiente
- [ ] Roles configurados para usuários
- [ ] Testes de autenticação realizados
- [ ] Teste de webhook realizado
- [ ] Teste de roles realizado

---

**Status**: ⏳ **Aguardando configuração do banco de dados**

**Próxima Ação**: Atualizar DATABASE_URL com credenciais válidas do Neon
