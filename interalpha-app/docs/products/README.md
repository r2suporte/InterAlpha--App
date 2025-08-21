# 📦 Sistema de Gestão de Produtos - InterAlpha

## 📋 Visão Geral

O Sistema de Gestão de Produtos é um módulo completo para gerenciamento de produtos, estoque e integração com ordens de serviço. Desenvolvido com Next.js, TypeScript, Prisma e Redis.

## 🚀 Funcionalidades Principais

### ✅ **Gestão de Produtos**
- ✅ CRUD completo de produtos
- ✅ Validação de part number único
- ✅ Upload e gerenciamento de imagens
- ✅ Cálculo automático de margem de lucro
- ✅ Busca avançada com full-text search
- ✅ Filtros por categoria, preço, status

### ✅ **Controle de Estoque**
- ✅ Movimentações de entrada/saída
- ✅ Ajustes manuais de estoque
- ✅ Histórico completo de movimentações
- ✅ Alertas automáticos de estoque baixo
- ✅ Relatórios de estoque em tempo real

### ✅ **Sistema de Categorias**
- ✅ Organização hierárquica de produtos
- ✅ Filtros e relatórios por categoria
- ✅ Estatísticas por categoria
- ✅ Cores e ícones personalizáveis

### ✅ **Integração com Ordens de Serviço**
- ✅ Seleção de produtos em ordens
- ✅ Cálculo automático de totais
- ✅ Baixa automática de estoque
- ✅ Histórico de uso em ordens

### ✅ **Dashboard e Métricas**
- ✅ KPIs em tempo real
- ✅ Top produtos por diferentes critérios
- ✅ Gráficos de performance
- ✅ Alertas visuais de estoque

### ✅ **Importação e Exportação**
- ✅ Suporte a CSV e Excel
- ✅ Validação robusta de dados
- ✅ Preview antes da importação
- ✅ Relatórios de erros detalhados

### ✅ **Performance e Cache**
- ✅ Cache Redis avançado
- ✅ Índices otimizados de banco
- ✅ Virtualização de listas
- ✅ Monitoramento de performance

## 🏗️ Arquitetura

### **Stack Tecnológica**
- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL 15
- **Cache**: Redis 7
- **Testes**: Jest, Playwright
- **CI/CD**: GitHub Actions
- **Deploy**: Vercel

### **Estrutura de Diretórios**
```
src/
├── app/api/produtos/          # APIs REST de produtos
├── components/produtos/       # Componentes de UI
├── components/ordens/         # Componentes de ordens
├── services/                  # Lógica de negócio
│   ├── product-service.ts
│   ├── stock-service.ts
│   ├── category-service.ts
│   ├── cache-service.ts
│   └── monitoring-service.ts
├── lib/
│   ├── prisma.ts             # Cliente Prisma
│   └── redis.ts              # Cliente Redis
└── types/                    # Definições TypeScript
```

## 📚 Documentação

### **Para Desenvolvedores**
- [🔧 API Reference](./api-reference.md)
- [🏗️ Arquitetura](./architecture.md)
- [🧪 Guia de Testes](./testing-guide.md)
- [🚀 Deploy Guide](./deployment-guide.md)
- [🔍 Troubleshooting](./troubleshooting.md)

### **Para Usuários**
- [👤 Manual do Usuário](./user-manual.md)
- [📖 Guia de Início Rápido](./quick-start.md)
- [❓ FAQ](./faq.md)

## 🚀 Início Rápido

### **Pré-requisitos**
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm ou yarn

### **Instalação**
```bash
# Clonar repositório
git clone https://github.com/interalpha/sistema-gestao.git
cd sistema-gestao

# Instalar dependências
npm install

# Configurar banco de dados
cp .env.example .env.local
# Editar .env.local com suas configurações

# Executar migrations
npx prisma migrate dev

# Iniciar aplicação
npm run dev
```

### **Configuração Mínima**
```env
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/interalpha"
REDIS_HOST="localhost"
REDIS_PORT="6379"
NEXTAUTH_SECRET="your-secret-key"
```

## 📊 Métricas e Monitoramento

### **KPIs Principais**
- **Performance**: < 200ms response time
- **Disponibilidade**: > 99.9% uptime
- **Cache Hit Rate**: > 80%
- **Cobertura de Testes**: > 90%

### **Alertas Configurados**
- Estoque baixo/zerado
- Performance degradada
- Erros de API
- Falhas de cache

## 🧪 Testes

### **Executar Testes**
```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Todos os testes
npm run test
```

### **Cobertura de Testes**
- **Unitários**: 95%+
- **Integração**: 90%+
- **E2E**: 85%+

## 🚀 Deploy

### **Ambientes**
- **Development**: `npm run dev`
- **Staging**: `./scripts/deploy-products.sh staging`
- **Production**: `./scripts/deploy-products.sh production`

### **CI/CD**
- Testes automáticos em PRs
- Deploy automático na branch main
- Rollback automático em falhas
- Notificações no Slack

## 🔧 Configuração Avançada

### **Cache Redis**
```typescript
// Configuração de cache
export const CacheTTL = {
  SHORT: 60,      // 1 minuto
  MEDIUM: 300,    // 5 minutos
  LONG: 1800,     // 30 minutos
  VERY_LONG: 3600 // 1 hora
}
```

### **Índices de Performance**
```sql
-- Índices otimizados
CREATE INDEX idx_products_fulltext ON products 
USING gin(to_tsvector('portuguese', "partNumber" || ' ' || description));

CREATE INDEX idx_products_low_stock ON products 
("quantity", "minStock", "isActive") 
WHERE "isActive" = true AND "quantity" <= "minStock";
```

## 🔍 Troubleshooting

### **Problemas Comuns**

#### **Performance Lenta**
```bash
# Verificar cache Redis
redis-cli ping

# Verificar índices do banco
EXPLAIN ANALYZE SELECT * FROM products WHERE ...

# Verificar logs de performance
tail -f logs/performance.log
```

#### **Erros de Cache**
```bash
# Limpar cache
redis-cli FLUSHALL

# Verificar conexão
redis-cli INFO replication
```

#### **Problemas de Estoque**
```bash
# Verificar movimentações
SELECT * FROM stock_movements 
WHERE "productId" = 'xxx' 
ORDER BY "createdAt" DESC;

# Recalcular estoque
UPDATE products SET quantity = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('IN', 'RETURN') THEN quantity
      WHEN type IN ('OUT', 'LOSS') THEN -quantity
      ELSE 0
    END
  ), 0)
  FROM stock_movements 
  WHERE "productId" = products.id
);
```

## 📞 Suporte

### **Contatos**
- **Desenvolvimento**: dev@interalpha.com
- **Suporte**: suporte@interalpha.com
- **Emergência**: +55 11 99999-9999

### **Links Úteis**
- [🐛 Reportar Bug](https://github.com/interalpha/sistema-gestao/issues)
- [💡 Sugerir Feature](https://github.com/interalpha/sistema-gestao/discussions)
- [📖 Documentação Completa](https://docs.interalpha.com)
- [🎯 Roadmap](https://github.com/interalpha/sistema-gestao/projects)

## 📄 Licença

Copyright © 2024 InterAlpha. Todos os direitos reservados.

---

**Versão**: 1.0.0  
**Última Atualização**: $(date)  
**Mantenedores**: Equipe de Desenvolvimento InterAlpha