# Deploy e CI/CD

## Visão Geral

Esta documentação descreve o processo de deploy e a pipeline de CI/CD do InterAlpha, garantindo entregas consistentes, seguras e automatizadas.

## Ambientes

### 1. Ambientes de Deploy
- **Desenvolvimento** - Ambiente local para desenvolvimento
- **Staging** - Ambiente de pré-produção para testes
- **Produção** - Ambiente público acessado pelos usuários

### 2. Configuração por Ambiente
```
interalpha-app/
├── .env.local          # Desenvolvimento (não versionado)
├── .env.development    # Desenvolvimento (versionado)
├── .env.staging        # Staging
├── .env.production     # Produção
└── ...
```

## Pipeline de CI/CD

### 1. Ferramentas
- **GitHub Actions** - Para CI/CD
- **Docker** - Para containerização
- **Vercel** - Para deploy frontend (se aplicável)
- **Railway/Render** - Para deploy backend

### 2. Workflow do GitHub Actions
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci
      - run: npm run lint
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifact
          path: .next/
  
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build-artifact
      - name: Deploy to Staging
        run: |
          # Comandos para deploy no ambiente de staging
          echo "Deploying to staging..."
  
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production
        run: |
          # Comandos para deploy no ambiente de produção
          echo "Deploying to production..."
```

## Processo de Deploy

### 1. Deploy Manual
Para deploy manual em ambientes específicos:

```bash
# Deploy para staging
npm run deploy:staging

# Deploy para produção
npm run deploy:production
```

### 2. Deploy Automático
- Commits na branch `main` disparam deploy para staging
- Releases tagged disparam deploy para produção

### 3. Rollback
- Utilizar versionamento de releases para rollback rápido
- Manter backups de versões anteriores
- Processo automatizado de rollback via CI/CD

## Containerização

### 1. Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --gid 1001 -S nodejs
RUN adduser --uid 1001 -S nextjs nodejs
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### 2. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: interalpha
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Configuração de Ambientes

### 1. Variáveis de Ambiente
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://interalpha.com
DATABASE_URL=postgresql://user:password@db:5432/interalpha
REDIS_URL=redis://redis:6379
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. Configuração por Ambiente
- Desenvolvimento: Valores locais e de teste
- Staging: Valores espelhando produção, mas com dados de teste
- Produção: Valores reais para serviços externos

## Monitoramento e Logging

### 1. Health Checks
```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Verificar conexão com banco de dados
    await prisma.$queryRaw`SELECT 1`;
    
    // Verificar conexão com Redis
    await redis.ping();
    
    // Verificar integrações críticas
    // ...
    
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
```

### 2. Logging de Deploy
- Registrar todos os deploys com timestamp e versão
- Monitorar sucesso/fracasso de deploys
- Alertar sobre falhas de deploy

## Estratégias de Deploy

### 1. Blue-Green Deployment
- Manter duas versões idênticas do ambiente
- Roteamento de tráfego entre ambientes
- Rollback instantâneo em caso de problemas

### 2. Canary Deployment
- Roteamento progressivo de tráfego para nova versão
- Monitoramento de métricas durante rollout
- Rollback automático em caso de degradação

### 3. Feature Flags
- Utilizar flags para habilitar/desabilitar funcionalidades
- Deploy de código sem ativar funcionalidades
- Rollout gradual de features

## Backup e Recuperação

### 1. Backup de Dados
- Backups diários do banco de dados
- Backups criptografados
- Retenção de backups por 30 dias

### 2. Recuperação
- Processo documentado de recuperação de dados
- Testes regulares de restore
- RTO (Recovery Time Objective) e RPO (Recovery Point Objective) definidos

## Segurança no Deploy

### 1. Secrets Management
- Utilizar secrets do GitHub Actions
- Não versionar secrets
- Rotacionar secrets regularmente

### 2. Image Security
- Scanning de vulnerabilidades em imagens Docker
- Utilizar imagens base mínimas
- Atualizar dependências regularmente

### 3. Access Control
- Deploy restrito a usuários autorizados
- Revisão obrigatória para deploys em produção
- Auditing de todas as operações de deploy

## Métricas e Observabilidade

### 1. Métricas de Deploy
- Tempo de deploy
- Taxa de sucesso de deploys
- Frequência de deploys

### 2. Observabilidade
- Integração com ferramentas de monitoring (Datadog, New Relic)
- Tracing distribuído
- Correlação de logs

## Rollback Procedures

### 1. Quando Realizar Rollback
- Erros críticos em produção
- Degradação significativa de performance
- Problemas de segurança

### 2. Processo de Rollback
1. Identificar versão estável anterior
2. Executar rollback via CI/CD ou manualmente
3. Verificar funcionamento do sistema
4. Notificar equipe e usuários afetados

### 3. Rollback Automático
- Configurar rollback automático para certos tipos de falha
- Monitorar métricas críticas
- Alertas para rollback automático

## Boas Práticas

### 1. Versionamento
- SemVer para versionamento da aplicação
- Tags Git para releases
- Changelogs detalhados

### 2. Testes
- Testes automatizados em pipeline de CI
- Testes de integração em staging
- Testes manuais em staging antes de produção

### 3. Documentação
- Documentar processo de deploy
- Manter runbooks para operações comuns
- Documentar troubleshooting

### 4. Comunicação
- Notificar equipe sobre deploys
- Comunicar manutenimentos programados
- Post-mortems para incidents significativos