# 🔧 Guia de Resolução de Problemas - InterAlpha

Este guia ajuda a resolver os problemas mais comuns de configuração e runtime do sistema InterAlpha.

## 🚀 Início Rápido - Resolver Problemas

### 1. **Diagnóstico Automático**
```bash
# Execute o diagnóstico completo
node scripts/fix-runtime-issues.js

# Se houver problemas, o script tentará corrigi-los automaticamente
```

### 2. **Iniciar Servidor**
```bash
# Inicie o servidor com verificações automáticas
node scripts/start-server.js

# OU use o comando padrão
npm run dev
```

### 3. **Testar APIs**
```bash
# Teste rápido das APIs (execute em outro terminal)
node scripts/test-apis-quick.js
```

## 🔍 Problemas Comuns e Soluções

### ❌ **Erro: "Cannot connect to database"**

**Causa:** Problema na conexão com PostgreSQL/Neon

**Solução:**
```bash
# 1. Verificar se DATABASE_URL está correta no .env
cat .env | grep DATABASE_URL

# 2. Testar conexão
npx prisma db push

# 3. Se falhar, verificar se o banco Neon está ativo
# Acesse: https://console.neon.tech/
```

### ❌ **Erro: "Module not found" ou dependências**

**Causa:** Dependências não instaladas ou corrompidas

**Solução:**
```bash
# 1. Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# 2. Regenerar cliente Prisma
npx prisma generate

# 3. Verificar se todas as dependências estão instaladas
npm ls --depth=0
```

### ❌ **Erro: "NEXTAUTH_SECRET is not set"**

**Causa:** Variáveis de ambiente faltando

**Solução:**
```bash
# 1. Executar diagnóstico (corrige automaticamente)
node scripts/fix-runtime-issues.js

# 2. OU adicionar manualmente ao .env
echo 'NEXTAUTH_SECRET="$(openssl rand -hex 32)"' >> .env
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
```

### ❌ **Erro: APIs retornando HTTP 500**

**Causa:** Servidor não configurado corretamente ou não rodando

**Solução:**
```bash
# 1. Verificar se o servidor está rodando
curl http://localhost:3000/api/system/health

# 2. Se não estiver, iniciar servidor
npm run dev

# 3. Verificar logs no terminal para erros específicos

# 4. Testar APIs após servidor iniciar
node scripts/test-apis-quick.js
```

### ❌ **Erro: "Redis connection failed"**

**Causa:** Redis não configurado (opcional)

**Solução:**
```bash
# Redis é OPCIONAL - o sistema funciona sem ele

# Para instalar Redis localmente (macOS):
brew install redis
brew services start redis

# Para usar Redis externo, adicione ao .env:
echo 'REDIS_URL="redis://your-redis-url"' >> .env

# Para desabilitar Redis, remova REDIS_URL do .env
```

### ❌ **Erro: "Clerk authentication failed"**

**Causa:** Clerk não configurado (opcional para desenvolvimento)

**Solução:**
```bash
# Clerk é OPCIONAL para desenvolvimento local

# Para configurar Clerk:
# 1. Crie conta em https://clerk.com
# 2. Adicione as chaves ao .env:
echo 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-key"' >> .env
echo 'CLERK_SECRET_KEY="sk_test_your-key"' >> .env

# Para desenvolvimento sem Clerk, comente as linhas no código
```

## 🛠️ Comandos Úteis de Diagnóstico

### **Verificar Status Geral**
```bash
# Status do projeto
npm run lint                    # Verificar código
npx tsc --noEmit               # Verificar TypeScript
npm test                       # Executar testes

# Status do banco
npx prisma studio              # Interface visual do banco
npx prisma db push             # Sincronizar schema
npx prisma migrate status      # Status das migrations
```

### **Verificar Dependências**
```bash
# Verificar dependências desatualizadas
npm outdated

# Verificar vulnerabilidades
npm audit

# Verificar se todas as dependências estão instaladas
npm ls --depth=0
```

### **Logs e Debug**
```bash
# Executar com logs detalhados
DEBUG=* npm run dev

# Verificar logs do Prisma
DEBUG="prisma:*" npm run dev

# Verificar logs do Next.js
NEXT_DEBUG=1 npm run dev
```

## 📋 Checklist de Verificação

### ✅ **Antes de Iniciar o Servidor**
- [ ] Arquivo `.env` existe e tem DATABASE_URL
- [ ] `node_modules` instalado (`npm install`)
- [ ] Cliente Prisma gerado (`npx prisma generate`)
- [ ] Schema sincronizado (`npx prisma db push`)
- [ ] Porta 3000 disponível

### ✅ **Após Iniciar o Servidor**
- [ ] Servidor responde em http://localhost:3000
- [ ] Health check OK: http://localhost:3000/api/system/health
- [ ] APIs principais funcionando
- [ ] Sem erros críticos no console

### ✅ **Para Produção**
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build funciona (`npm run build`)
- [ ] Testes passam (`npm test`)
- [ ] Backup configurado
- [ ] Monitoramento ativo

## 🆘 Problemas Avançados

### **Erro de Memória (Out of Memory)**
```bash
# Aumentar limite de memória do Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

### **Problemas de Porta**
```bash
# Verificar se porta 3000 está em uso
lsof -i :3000

# Matar processo na porta 3000
kill -9 $(lsof -t -i:3000)

# Usar porta diferente
PORT=3001 npm run dev
```

### **Problemas de SSL/TLS**
```bash
# Para desenvolvimento, desabilitar verificação SSL
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm run dev
```

### **Cache Corrompido**
```bash
# Limpar todos os caches
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

## 📞 Suporte

### **Logs Importantes**
- Terminal do servidor (onde rodou `npm run dev`)
- Browser DevTools Console (F12)
- Network tab para erros de API

### **Informações para Suporte**
- Versão do Node.js: `node --version`
- Versão do npm: `npm --version`
- Sistema operacional
- Mensagem de erro completa
- Passos para reproduzir o problema

### **Recursos Úteis**
- 📚 [Documentação Next.js](https://nextjs.org/docs)
- 🗄️ [Documentação Prisma](https://www.prisma.io/docs)
- 🔐 [Documentação Clerk](https://clerk.com/docs)
- 🐘 [Neon Database](https://neon.tech/docs)

---

## 🎯 Resumo de Comandos Essenciais

```bash
# Diagnóstico e correção automática
node scripts/fix-runtime-issues.js

# Iniciar servidor com verificações
node scripts/start-server.js

# Testar APIs
node scripts/test-apis-quick.js

# Comandos básicos
npm install                    # Instalar dependências
npx prisma generate           # Gerar cliente Prisma
npx prisma db push           # Sincronizar banco
npm run dev                  # Iniciar servidor
npm run build               # Build para produção
npm test                    # Executar testes
```

**💡 Dica:** Execute sempre `node scripts/fix-runtime-issues.js` primeiro quando houver problemas!