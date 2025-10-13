# 🚀 Configuração do Supabase Database

## 📋 Resumo da Configuração

Este documento detalha a configuração completa do banco de dados **Supabase PostgreSQL**, incluindo
a configuração do MCP Context7.

## ✅ Status da Configuração

- [x] **Configuração do Projeto Supabase**
- [x] **Atualização das Variáveis de Ambiente**
- [x] **Criação do Schema Prisma Compatível**
- [x] **Vinculação do Projeto Local**
- [ ] **Execução do Schema no Banco**
- [ ] **Teste de Conectividade**
- [ ] **Configuração do MCP Context7**

## 🔧 Configurações Realizadas

### 1. Variáveis de Ambiente (`.env.local`)

```env
# 🌐 NOVA CONFIGURAÇÃO - SUPABASE
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 🌐 Supabase MCP Context7
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-SUPABASE-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SUPABASE-SERVICE-ROLE-KEY]"
```

### 2. Schema Prisma Atualizado

O schema foi otimizado para Supabase com:

- ✅ Configuração do datasource PostgreSQL
- ✅ Suporte a `directUrl` para conexões diretas
- ✅ Modelos: User, Cliente, OrdemServico, Pagamento
- ✅ Relacionamentos e constraints
- ✅ Comentários sobre extensões do Supabase

## 🎯 Próximos Passos

### 1. Configurar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote as credenciais:
   - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
   - **Anon Key**: Chave pública para frontend
   - **Service Role Key**: Chave privada para backend
   - **Database Password**: Senha do banco PostgreSQL

### 2. Atualizar Credenciais

Substitua os placeholders no `.env.local`:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@db.SEU_PROJECT_REF.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://SEU_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="SUA_ANON_KEY_AQUI"
SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY_AQUI"
```

### 3. Executar Migração

```bash
# Gerar cliente Prisma
npm run db:generate

# Aplicar schema ao Supabase
npm run db:push

# Verificar no Prisma Studio
npm run db:studio
```

### 4. Verificar Migração

- [ ] Tabelas criadas no Supabase
- [ ] Relacionamentos funcionando
- [ ] Aplicação conectando corretamente
- [ ] MCP Context7 operacional

## 🔍 Verificações de Segurança

### Extensões Recomendadas no Supabase

1. **uuid-ossp**: Para geração de UUIDs
2. **pgcrypto**: Para criptografia
3. **pg_stat_statements**: Para análise de performance

### Configurações de Segurança

1. **RLS (Row Level Security)**: Configurar políticas de acesso
2. **API Keys**: Usar chaves apropriadas (anon vs service_role)
3. **CORS**: Configurar domínios permitidos

## 🚨 Backup e Rollback

### Backup dos Dados

```bash
# Fazer backup do banco atual
pg_dump $DATABASE_URL > backup_supabase_$(date +%Y%m%d).sql
```

### Rollback (se necessário)

```bash
# Restaurar configuração anterior
cp .env.local.backup .env.local
npm run db:push
```

## 📊 Vantagens do Supabase

### Recursos do Supabase

- ✅ **Interface Visual**: Dashboard completo
- ✅ **Real-time**: Subscriptions automáticas
- ✅ **Auth Integrado**: Sistema de autenticação nativo
- ✅ **Storage**: Armazenamento de arquivos
- ✅ **Edge Functions**: Serverless functions
- ✅ **MCP Context7**: Integração nativa

## 🔗 Links Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Prisma + Supabase](https://supabase.com/docs/guides/integrations/prisma)
- [MCP Context7 Guide](https://supabase.com/docs/guides/ai/mcp)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

**Data da Configuração**: Janeiro 2025  
**Responsável**: Sistema InterAlpha  
**Status**: Configurado ✅
