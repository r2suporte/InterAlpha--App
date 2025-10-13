# Guia de Segurança - InterAlpha App

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Segurança](#arquitetura-de-segurança)
3. [Autenticação e Autorização](#autenticação-e-autorização)
4. [Middleware de Segurança](#middleware-de-segurança)
5. [Monitoramento e Auditoria](#monitoramento-e-auditoria)
6. [Boas Práticas de Desenvolvimento](#boas-práticas-de-desenvolvimento)
7. [Configurações de Segurança](#configurações-de-segurança)
8. [Resposta a Incidentes](#resposta-a-incidentes)
9. [Checklist de Segurança](#checklist-de-segurança)

## Visão Geral

Este documento descreve as práticas de segurança implementadas no InterAlpha App, incluindo medidas
preventivas, monitoramento e procedimentos de resposta a incidentes.

### Princípios de Segurança

- **Defesa em Profundidade**: Múltiplas camadas de segurança
- **Princípio do Menor Privilégio**: Acesso mínimo necessário
- **Segurança por Design**: Segurança integrada desde o desenvolvimento
- **Transparência**: Logs e auditoria completos
- **Resposta Rápida**: Detecção e resposta automatizada

## Arquitetura de Segurança

### Camadas de Proteção

```
┌─────────────────────────────────────┐
│           WAF / CDN                 │
├─────────────────────────────────────┤
│       Rate Limiting                 │
├─────────────────────────────────────┤
│    Security Audit Middleware       │
├─────────────────────────────────────┤
│      JWT Authentication             │
├─────────────────────────────────────┤
│    Authorization & Permissions      │
├─────────────────────────────────────┤
│         Application Logic           │
├─────────────────────────────────────┤
│      Database Security (RLS)        │
└─────────────────────────────────────┘
```

### Componentes de Segurança

1. **Middleware de Auditoria**: `lib/middleware/security-audit.ts`
2. **Rate Limiting**: `lib/middleware/rate-limit.ts`
3. **Autenticação JWT**: `lib/auth/jwt.ts`
4. **Permissões**: `lib/auth/permissions.ts`
5. **Dashboard de Segurança**: `components/admin/SecurityDashboard.tsx`

## Autenticação e Autorização

### JWT (JSON Web Tokens)

```typescript
// Configuração JWT
const JWT_CONFIG = {
  algorithm: "HS256",
  expiresIn: "1h",
  refreshExpiresIn: "7d",
  issuer: "interalpha-app",
  audience: "interalpha-users"
}
```

### Níveis de Permissão

- **ADMIN**: Acesso total ao sistema
- **MANAGER**: Gestão de equipes e relatórios
- **TECHNICIAN**: Operações técnicas
- **CLIENT**: Acesso limitado ao portal

### Implementação de Autorização

```typescript
// Exemplo de verificação de permissão
const hasPermission = await checkUserPermission(
  userId,
  'equipamentos:read'
);

if (!hasPermission) {
  return new Response('Forbidden', { status: 403 });
}
```

## Middleware de Segurança

### Security Audit Middleware

O middleware de auditoria monitora e registra:

- **SQL Injection**: Padrões suspeitos em parâmetros
- **XSS**: Tentativas de script injection
- **User-Agents Suspeitos**: Bots e scanners
- **Acesso a Arquivos Sensíveis**: Tentativas de acesso não autorizado
- **Padrões de Ataque**: Comportamentos anômalos

### Rate Limiting

Configurações por endpoint:

```typescript
const RATE_LIMITS = {
  "/api/auth/login": { requests: 5, window: "15m" },
  "/api/auth/register": { requests: 3, window: "1h" },
  "/api/": { requests: 100, window: "15m" },
  default: { requests: 60, window: "1m" }
}
```

## Monitoramento e Auditoria

### Eventos de Segurança Monitorados

1. **Tentativas de Login**
   - Sucessos e falhas
   - IPs e user-agents
   - Padrões de força bruta

2. **Acessos Não Autorizados**
   - Tentativas sem token
   - Tokens inválidos/expirados
   - Escalação de privilégios

3. **Atividades Suspeitas**
   - SQL injection attempts
   - XSS attempts
   - File traversal attempts
   - Unusual request patterns

### Dashboard de Segurança

Acesse `/admin/security` para visualizar:

- Eventos de segurança em tempo real
- Estatísticas de ameaças
- IPs suspeitos
- Métricas de rate limiting

### APIs de Monitoramento

```bash
# Obter eventos de segurança
GET /api/admin/security?action=events&limit=50

# Obter estatísticas
GET /api/admin/security?action=stats

# Limpar eventos antigos
POST /api/admin/security
{
  "action": "cleanup",
  "olderThan": "7d"
}
```

## Boas Práticas de Desenvolvimento

### 1. Validação de Entrada

```typescript
// Sempre validar dados de entrada
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const result = schema.safeParse(data);
if (!result.success) {
  return { error: 'Dados inválidos' };
}
```

### 2. Sanitização de Dados

```typescript
// Sanitizar dados antes de usar
const sanitizedInput = input
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  .trim()
```

### 3. Queries Parametrizadas

```typescript
// CORRETO: Query parametrizada
const result = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// INCORRETO: Concatenação de string
const result = await db.query(
  `SELECT * FROM users WHERE id = ${userId}`
);
```

### 4. Headers de Segurança

```typescript
// Headers implementados no next.config.js
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on"
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin"
  }
]
```

## Configurações de Segurança

### Variáveis de Ambiente

```bash
# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Rate Limiting
REDIS_URL=redis://...

# Monitoring
SECURITY_WEBHOOK_URL=...
ALERT_EMAIL=security@interalpha.com
```

### Configuração do Banco de Dados

```sql
-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política de acesso
CREATE POLICY "Users can only see their own data" ON users
  FOR ALL USING (auth.uid() = id);
```

## Resposta a Incidentes

### Procedimentos Automatizados

1. **Detecção de Ameaça**
   - Log do evento
   - Incremento de contador
   - Verificação de threshold

2. **Resposta Automática**
   - Rate limiting agressivo
   - Bloqueio temporário de IP
   - Alerta para administradores

3. **Escalação**
   - Webhook para sistema de alertas
   - Email para equipe de segurança
   - Notificação no dashboard

### Procedimentos Manuais

1. **Investigação**
   - Análise de logs
   - Identificação do vetor de ataque
   - Avaliação do impacto

2. **Contenção**
   - Bloqueio de IPs maliciosos
   - Revogação de tokens comprometidos
   - Isolamento de recursos afetados

3. **Recuperação**
   - Correção de vulnerabilidades
   - Restauração de dados (se necessário)
   - Atualização de políticas

4. **Lições Aprendidas**
   - Documentação do incidente
   - Melhoria dos controles
   - Treinamento da equipe

## Checklist de Segurança

### Desenvolvimento

- [ ] Validação de entrada implementada
- [ ] Queries parametrizadas utilizadas
- [ ] Headers de segurança configurados
- [ ] Autenticação e autorização implementadas
- [ ] Logs de segurança adicionados
- [ ] Testes de segurança executados

### Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] HTTPS habilitado
- [ ] Rate limiting ativo
- [ ] Monitoramento configurado
- [ ] Backup de segurança realizado
- [ ] Políticas RLS aplicadas

### Monitoramento

- [ ] Dashboard de segurança acessível
- [ ] Alertas configurados
- [ ] Logs sendo coletados
- [ ] Métricas sendo monitoradas
- [ ] Procedimentos de resposta testados

### Manutenção

- [ ] Dependências atualizadas
- [ ] Patches de segurança aplicados
- [ ] Logs antigos limpos
- [ ] Políticas revisadas
- [ ] Treinamento da equipe atualizado

## Contatos de Emergência

- **Equipe de Segurança**: security@interalpha.com
- **Administrador do Sistema**: admin@interalpha.com
- **Suporte Técnico**: support@interalpha.com

## Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Última atualização**: $(date) **Versão**: 1.0 **Responsável**: Equipe de Desenvolvimento
InterAlpha
