# Guia: Configurar Webhook do Clerk

## 📋 Pré-requisitos

- [ ] Aplicação deployada com URL pública (ex: `https://seu-app.vercel.app`)
- [ ] Acesso ao Clerk Dashboard
- [ ] Arquivo `.env.local` com variáveis do Clerk

---

## 🔧 Passo a Passo

### 1. Acessar Clerk Dashboard

1. Vá para: https://dashboard.clerk.com
2. Faça login na sua conta
3. Selecione seu projeto/aplicação

### 2. Navegar para Webhooks

1. No menu lateral, clique em **"Webhooks"**
2. Clique no botão **"+ Add Endpoint"**

### 3. Configurar Endpoint

**URL do Endpoint**:
```
https://seu-dominio.com/api/webhooks/clerk
```

**Exemplo**:
- Vercel: `https://interalpha-app.vercel.app/api/webhooks/clerk`
- Netlify: `https://interalpha-app.netlify.app/api/webhooks/clerk`
- Custom: `https://app.interalpha.com.br/api/webhooks/clerk`

### 4. Selecionar Eventos

Marque os seguintes eventos:

- ✅ **user.created** - Quando um novo usuário é criado
- ✅ **user.updated** - Quando dados do usuário são atualizados
- ✅ **user.deleted** - Quando um usuário é deletado

**Outros eventos** (opcional):
- `session.created` - Quando usuário faz login
- `session.ended` - Quando usuário faz logout

### 5. Copiar Signing Secret

1. Após criar o endpoint, o Clerk mostrará o **Signing Secret**
2. Copie o valor (começa com `whsec_...`)
3. **IMPORTANTE**: Guarde este valor em local seguro

### 6. Adicionar ao Ambiente

**Desenvolvimento** (`.env.local`):
```bash
CLERK_WEBHOOK_SECRET="whsec_seu_secret_aqui"
```

**Produção** (Vercel/Netlify/etc):
1. Vá para as configurações do projeto
2. Adicione variável de ambiente:
   - **Name**: `CLERK_WEBHOOK_SECRET`
   - **Value**: `whsec_seu_secret_aqui`
3. Redeploy a aplicação

### 7. Testar Webhook

#### Opção 1: Criar Usuário de Teste

1. No Clerk Dashboard → **Users**
2. Clique em **"+ Create User"**
3. Preencha:
   - Email: `teste@example.com`
   - Password: `Test123!@#`
4. Clique em **"Create"**

#### Opção 2: Usar Teste do Clerk

1. No Clerk Dashboard → **Webhooks**
2. Clique no endpoint criado
3. Clique em **"Testing"** tab
4. Selecione evento `user.created`
5. Clique em **"Send Example"**

### 8. Verificar Logs

**No Clerk Dashboard**:
1. Webhooks → Seu endpoint
2. Tab **"Logs"**
3. Verificar se há entradas com status `200 OK`

**No Banco de Dados**:
```bash
# Abrir Prisma Studio
npx prisma studio

# Verificar tabela 'users'
# Deve ter o novo usuário criado
```

**Nos Logs da Aplicação** (Vercel/Netlify):
```
✅ Webhook received: user.created
✅ User synced to database: teste@example.com
```

---

## 🔍 Troubleshooting

### Erro: "Webhook signature verification failed"

**Causa**: `CLERK_WEBHOOK_SECRET` incorreto ou não configurado

**Solução**:
1. Verificar se o secret está correto no `.env.local`
2. Verificar se a variável está configurada em produção
3. Redeploy após adicionar a variável

### Erro: "Endpoint not reachable"

**Causa**: URL do webhook incorreta ou aplicação não deployada

**Solução**:
1. Verificar se a URL está correta
2. Testar manualmente: `curl https://seu-dominio.com/api/webhooks/clerk`
3. Verificar se a aplicação está rodando

### Erro: "Database connection failed"

**Causa**: `DATABASE_URL` não configurado em produção

**Solução**:
1. Adicionar `DATABASE_URL` nas variáveis de ambiente
2. Redeploy a aplicação

### Webhook não dispara

**Verificar**:
1. Eventos corretos estão selecionados
2. Endpoint está ativo (não pausado)
3. URL está acessível publicamente

---

## ✅ Checklist de Verificação

- [ ] Webhook endpoint criado no Clerk Dashboard
- [ ] URL correta configurada
- [ ] Eventos `user.created`, `user.updated`, `user.deleted` selecionados
- [ ] Signing secret copiado
- [ ] `CLERK_WEBHOOK_SECRET` adicionado ao `.env.local`
- [ ] `CLERK_WEBHOOK_SECRET` adicionado à produção
- [ ] Aplicação redeployada
- [ ] Teste de criação de usuário realizado
- [ ] Logs do webhook verificados (status 200)
- [ ] Usuário aparece no banco de dados
- [ ] Sincronização funcionando corretamente

---

## 📊 Exemplo de Payload

Quando o webhook é disparado, este é o formato do payload:

```json
{
  "data": {
    "id": "user_2abc123def456",
    "email_addresses": [
      {
        "email_address": "joao@example.com",
        "id": "idn_abc123"
      }
    ],
    "first_name": "João",
    "last_name": "Silva",
    "public_metadata": {
      "role": "tecnico"
    },
    "created_at": 1702345678000,
    "updated_at": 1702345678000
  },
  "object": "event",
  "type": "user.created"
}
```

---

## 🔐 Segurança

**Importante**:
- ✅ Sempre verificar assinatura do webhook (já implementado)
- ✅ Nunca expor `CLERK_WEBHOOK_SECRET` publicamente
- ✅ Usar HTTPS em produção
- ✅ Validar dados recebidos antes de salvar no banco

---

## 📞 Recursos

- [Clerk Webhooks Documentation](https://clerk.com/docs/integrations/webhooks)
- [Webhook Events Reference](https://clerk.com/docs/integrations/webhooks/overview#supported-events)
- [Svix Verification](https://docs.svix.com/receiving/verifying-payloads/how)

---

**Última Atualização**: 2025-12-09  
**Status**: Pronto para configuração
