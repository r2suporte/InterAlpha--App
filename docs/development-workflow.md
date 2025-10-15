<!-- agent-update:start:development-workflow -->

# Development Workflow

Este documento descreve o processo de desenvolvimento diário para o **InterAlpha App**.

## Branching & Releases

### Modelo de Branching
- **Trunk-based Development** com feature branches de curta duração
- **Branch Principal**: `main` - sempre deployável
- **Feature Branches**: `feature/nome-da-funcionalidade`
- **Hotfix Branches**: `hotfix/descricao-do-fix`

### Convenções de Commit
Seguimos **Conventional Commits**:
```
feat: adiciona nova funcionalidade de relatórios
fix: corrige bug na validação de CPF
docs: atualiza documentação da API
test: adiciona testes para módulo de clientes
refactor: melhora estrutura do componente Dashboard
```

### Release Process
- **Cadência**: Releases semanais ou conforme necessidade
- **Tagging**: Semantic Versioning (`v1.2.3`)
- **Deploy**: Automático via CI/CD após merge na `main`

## Local Development

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- PostgreSQL (via Supabase)
- Git

### Setup Inicial
```bash
# 1. Clone do repositório
git clone <repository-url>
cd interalpha-app

# 2. Instalação de dependências
npm install

# 3. Configuração do ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 4. Setup do banco de dados
npx prisma db push
npx prisma db seed

# 5. Executar em modo desenvolvimento
npm run dev
```

### Comandos Principais
```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento (localhost:3000)
npm run build           # Build para produção
npm run start           # Executa build de produção
npm run lint            # Executa ESLint
npm run lint:fix        # Corrige problemas de lint automaticamente

# Testes
npm run test            # Executa todos os testes
npm run test:watch      # Executa testes em modo watch
npm run test:coverage   # Gera relatório de cobertura
npm run test:e2e        # Executa testes end-to-end com Cypress

# Banco de Dados
npx prisma studio       # Interface visual do banco
npx prisma db push      # Aplica mudanças no schema
npx prisma generate     # Gera cliente Prisma
npx prisma db seed      # Popula banco com dados de teste

# Qualidade de Código
npm run type-check      # Verificação de tipos TypeScript
npm run format          # Formata código com Prettier
```

### Estrutura de Desenvolvimento
```
app/
├── api/                # API Routes (Next.js)
├── dashboard/          # Interface principal
├── auth/              # Autenticação
├── portal/            # Portal do cliente
└── globals.css        # Estilos globais

components/
├── ui/                # Componentes base (shadcn/ui)
├── dashboard/         # Componentes específicos
└── auth/              # Componentes de autenticação

lib/
├── services/          # Lógica de negócio
├── utils/             # Utilitários
├── validations/       # Schemas de validação
└── auth.ts           # Configuração de autenticação
```

## Code Review Expectations

### Checklist de Review
- [ ] **Funcionalidade**: O código faz o que deveria fazer?
- [ ] **Testes**: Cobertura adequada (>70%) e testes passando?
- [ ] **Segurança**: Validação de entrada, autorização adequada?
- [ ] **Performance**: Código otimizado, sem vazamentos de memória?
- [ ] **Padrões**: Segue convenções do projeto e ESLint?
- [ ] **Documentação**: Código complexo está documentado?
- [ ] **Acessibilidade**: Componentes UI são acessíveis?

### Processo de Review
1. **Criar PR** com descrição clara e screenshots (se UI)
2. **Executar testes** localmente antes do PR
3. **Solicitar review** de pelo menos 1 desenvolvedor
4. **Endereçar feedback** e re-solicitar review se necessário
5. **Merge** após aprovação e CI verde

### Aprovações Necessárias
- **Features**: 1 aprovação de desenvolvedor sênior
- **Hotfixes**: 1 aprovação + teste manual
- **Mudanças de arquitetura**: 2 aprovações + discussão

Referência: [AGENTS.md](../../AGENTS.md) para dicas de colaboração com IA.

## Onboarding Tasks

### Para Novos Desenvolvedores

#### Semana 1: Setup e Familiarização
- [ ] Configurar ambiente de desenvolvimento local
- [ ] Executar todos os testes e garantir que passam
- [ ] Explorar a aplicação em modo desenvolvimento
- [ ] Ler documentação completa em `.context/docs/`
- [ ] Revisar PRD.md para entender o negócio

#### Semana 2: Primeiras Contribuições
- [ ] Corrigir issues marcadas como `good-first-issue`
- [ ] Implementar melhorias em testes existentes
- [ ] Contribuir com documentação ou comentários
- [ ] Participar de code reviews como observador

#### Semana 3: Desenvolvimento Ativo
- [ ] Implementar feature pequena end-to-end
- [ ] Criar testes para funcionalidade existente
- [ ] Otimizar performance de componente específico
- [ ] Contribuir com melhorias de UX/UI

### Recursos de Onboarding
- **Documentação**: `.context/docs/` (leitura obrigatória)
- **Arquitetura**: `architecture.md` para entender o sistema
- **Testes**: `testing-strategy.md` para padrões de qualidade
- **Segurança**: `security.md` para práticas seguras
- **Fluxo de Dados**: `data-flow.md` para integrações

### Issues para Iniciantes
Procure por labels:
- `good-first-issue` - Ideal para primeiro PR
- `documentation` - Melhorias na documentação
- `testing` - Adição ou melhoria de testes
- `refactoring` - Melhorias de código existente

<!-- agent-readonly:guidance -->

## AI Update Checklist

1. Confirm branching/release steps with CI configuration and recent tags.
2. Verify local commands against `package.json`; ensure flags and scripts still exist.
3. Capture review requirements (approvers, checks) from contributing docs or repository settings.
4. Refresh onboarding links (boards, dashboards) to their latest URLs.
5. Highlight any manual steps that should become automation follow-ups.

<!-- agent-readonly:sources -->

## Acceptable Sources

- CONTRIBUTING guidelines and `AGENTS.md`.
- Build pipelines, branch protection rules, or release scripts.
- Issue tracker boards used for onboarding or triage.

<!-- agent-update:end -->
