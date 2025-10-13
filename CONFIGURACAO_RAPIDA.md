# 🚀 Configuração Rápida - InterAlpha App

## ✅ Status Atual

**Credenciais do Supabase**: ✅ Configuradas  
**Arquivo .env.local**: ✅ Presente  
**Schema do Prisma**: ⚠️ Precisa ser aplicado  
**Usuários**: ⚠️ Precisam ser criados  

## 🔧 Configuração Automática

### Opção 1: Script Automático (Recomendado)

```bash
# Execute o script de configuração completa
node setup-production-environment.js
```

Este script irá:
- ✅ Verificar as credenciais do Supabase
- ✅ Aplicar o schema do Prisma no banco
- ✅ Criar usuário administrador
- ✅ Criar usuários de teste
- ✅ Verificar a configuração

### Opção 2: Configuração Manual

```bash
# 1. Gerar cliente Prisma
npx prisma generate

# 2. Aplicar schema no banco
npx prisma db push

# 3. Criar usuários (execute um dos scripts abaixo)
node create-admin-user-sqlite.js  # Para SQLite local
# OU
node scripts/create-admin-user.js  # Para Supabase
```

## 🔑 Credenciais de Acesso

### Usuário Administrador
- **Email**: `adm@interalpha.com.br`
- **Senha**: `InterAlpha2024!`
- **Role**: `ADMIN`

### Usuários de Teste
- **Diretor**: `diretor@interalpha.com.br` (DIRETOR)
- **Gerente**: `gerente@interalpha.com.br` (GERENTE)
- **Técnico**: `tecnico@interalpha.com.br` (TECNICO)
- **Atendente**: `atendente@interalpha.com.br` (ATENDENTE)

**Senha para todos**: `InterAlpha2024!`

## 🌐 URLs de Acesso

- **Aplicação**: http://localhost:3000
- **Login**: http://localhost:3000/auth/login
- **Dashboard**: http://localhost:3000/dashboard
- **Prisma Studio**: `npx prisma studio`

## 📋 Configuração do Supabase

### Credenciais Atuais (Configuradas)
```env
NEXT_PUBLIC_SUPABASE_URL="https://qwbtqlkvooguijchbuxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Projeto Supabase
- **ID do Projeto**: `qwbtqlkvooguijchbuxx`
- **Região**: Não especificada
- **Status**: ⚠️ Precisa ser verificado

## 🔍 Verificação de Problemas

### Teste de Conectividade
```bash
# Testar conexão com Supabase
node test-supabase-connection.js
```

### Comandos de Diagnóstico
```bash
# Verificar usuários no banco
node check-users.js

# Verificar tabelas
node check-tables.js

# Verificar schema
node check-schema-sync.js
```

## 🚨 Problemas Comuns

### 1. Erro de Autenticação (401)
- Verificar se as chaves do Supabase estão corretas
- Confirmar se o projeto está ativo
- Regenerar chaves se necessário

### 2. Tabela não encontrada (404)
```bash
npx prisma db push
```

### 3. Usuário não encontrado
```bash
node setup-production-environment.js
```

### 4. Erro de conexão
- Verificar conexão com internet
- Confirmar URL do projeto Supabase
- Verificar se o projeto não foi pausado/deletado

## 📦 Dependências Necessárias

```json
{
  "@prisma/client": "^6.16.2",
  "@supabase/supabase-js": "^2.57.4",
  "bcryptjs": "^3.0.2",
  "prisma": "^6.16.2"
}
```

## 🔄 Próximos Passos

1. ✅ Execute: `node setup-production-environment.js`
2. ✅ Inicie o servidor: `npm run dev`
3. ✅ Acesse: http://localhost:3000/auth/login
4. ✅ Faça login com: `adm@interalpha.com.br` / `InterAlpha2024!`

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do terminal
2. Execute os comandos de diagnóstico
3. Consulte a documentação do Supabase
4. Verifique se todas as dependências estão instaladas

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0