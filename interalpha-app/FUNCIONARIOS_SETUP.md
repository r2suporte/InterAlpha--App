# 👥 Sistema de Gestão de Funcionários

## 📋 Visão Geral

O sistema de gestão de funcionários permite criar, editar e gerenciar usuários do sistema com diferentes níveis de permissão. Integra com o Clerk para autenticação e usa o banco de dados para armazenar informações adicionais.

## 🚀 Funcionalidades Implementadas

### ✅ Gestão de Funcionários
- ✅ **Criação de funcionários** com integração Clerk
- ✅ **Edição de dados** (nome, email, cargo, departamento)
- ✅ **Exclusão segura** (não permite excluir último admin)
- ✅ **Listagem com filtros** (busca, cargo, status, departamento)
- ✅ **Estatísticas completas** (total, ativos, por cargo, por departamento)

### ✅ Sistema de Permissões
- ✅ **Roles hierárquicos**: Admin, Gerente Adm, Gerente Financeiro, Supervisor Técnico, Técnico, Atendente
- ✅ **Permissões granulares** por módulo do sistema
- ✅ **Middleware de autorização** para proteger APIs
- ✅ **Verificação automática** de permissões

### ✅ Interface Administrativa
- ✅ **Dashboard de funcionários** com estatísticas
- ✅ **Formulários de criação/edição** com validação
- ✅ **Filtros avançados** e busca em tempo real
- ✅ **Design responsivo** e moderno

## 🏗️ Arquitetura

### Modelos de Dados
```typescript
// Prisma Schema
model Employee {
  id          String       @id @default(cuid())
  clerkId     String       @unique // ID do Clerk
  email       String       @unique
  name        String
  role        EmployeeRole // Enum com os cargos
  department  String?
  phone       String?
  isActive    Boolean      @default(true)
  permissions Json         @default("[]")
  metadata    Json         @default("{}")
  createdBy   String?
  lastLoginAt DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

enum EmployeeRole {
  ATENDENTE
  TECNICO
  SUPERVISOR_TECNICO
  GERENTE_ADM
  GERENTE_FINANCEIRO
  ADMIN
}
```

### Estrutura de Permissões
```typescript
const PERMISSIONS = {
  'ADMIN': ['all'],
  'GERENTE_ADM': ['clientes', 'relatorios', 'ordens', 'funcionarios'],
  'GERENTE_FINANCEIRO': ['pagamentos', 'relatorios', 'clientes'],
  'SUPERVISOR_TECNICO': ['ordens', 'produtos', 'relatorios'],
  'TECNICO': ['ordens', 'produtos'],
  'ATENDENTE': ['clientes', 'ordens']
}
```

## 🔧 Configuração

### 1. Variáveis de Ambiente
```env
# Clerk (obrigatório)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (obrigatório)
DATABASE_URL="postgresql://..."
```

### 2. Banco de Dados
```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar migrações (se necessário)
npx prisma db push

# Ou criar migração
npx prisma migrate dev --name add_employee_system
```

### 3. Primeiro Administrador
Para criar o primeiro administrador do sistema, você pode:

1. **Via Clerk Dashboard**: Criar usuário manualmente
2. **Via Script**: Usar o script de setup (recomendado)

```bash
npm run create:admin
```

## 📁 Estrutura de Arquivos

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── admin/
│   │       └── funcionarios/
│   │           └── page.tsx          # Página principal
│   └── api/
│       └── admin/
│           └── funcionarios/
│               ├── route.ts          # CRUD funcionários
│               ├── [id]/route.ts     # Operações por ID
│               └── stats/route.ts    # Estatísticas
├── components/
│   └── admin/
│       └── EmployeeStats.tsx         # Componente de estatísticas
├── lib/
│   ├── services/
│   │   └── employee-service.ts       # Serviço principal
│   └── middleware/
│       └── employee-middleware.ts    # Middleware de permissões
└── types/
    └── employee.ts                   # Tipos TypeScript
```

## 🔐 Sistema de Segurança

### Autenticação
- **Clerk**: Gerencia autenticação e sessões
- **JWT**: Tokens seguros para APIs
- **Middleware**: Proteção automática de rotas

### Autorização
- **Permissões granulares** por módulo
- **Verificação em tempo real** nas APIs
- **Middleware de proteção** automático

### Auditoria
- **Log de criação/edição** de funcionários
- **Rastreamento de último login**
- **Histórico de alterações** (futuro)

## 🎯 Como Usar

### 1. Acessar Gestão de Funcionários
1. Faça login como administrador
2. Acesse **Funcionários** no menu lateral
3. Visualize estatísticas e lista de funcionários

### 2. Criar Novo Funcionário
1. Clique em **"Novo Funcionário"**
2. Preencha os dados obrigatórios:
   - Nome completo
   - Email corporativo
   - Cargo (role)
   - Senha temporária
3. Opcionalmente:
   - Telefone
   - Departamento
4. Clique em **"Criar Funcionário"**

### 3. Editar Funcionário
1. Clique no menu de ações (⋯) do funcionário
2. Selecione **"Editar"**
3. Modifique os dados necessários
4. Clique em **"Atualizar Funcionário"**

### 4. Gerenciar Permissões
As permissões são definidas automaticamente pelo cargo, mas podem ser customizadas:
- **Admin**: Acesso total ao sistema
- **Gerente**: Acesso a módulos específicos
- **Técnico**: Acesso a ordens e produtos
- **Atendente**: Acesso a clientes e ordens

## 🚨 Importantes

### Segurança
- ⚠️ **Nunca exclua o último administrador**
- ⚠️ **Use senhas fortes** para funcionários
- ⚠️ **Revise permissões** regularmente

### Manutenção
- 🔄 **Desative funcionários** em vez de excluir
- 📊 **Monitore estatísticas** regularmente
- 🔍 **Audite acessos** periodicamente

## 🐛 Troubleshooting

### Erro: "Não é possível excluir o último administrador"
**Solução**: Promova outro funcionário a administrador antes de excluir.

### Erro: "Email já está em uso"
**Solução**: Verifique se o email não está sendo usado por outro funcionário ou no Clerk.

### Erro: "Sem permissão para acessar funcionários"
**Solução**: Verifique se o usuário logado tem permissão de administrador.

### Erro de conexão com Clerk
**Solução**: Verifique as chaves de API do Clerk nas variáveis de ambiente.

## 🔄 Próximos Passos

### Funcionalidades Futuras
- [ ] **Convites por email** para novos funcionários
- [ ] **Redefinição de senha** automática
- [ ] **Grupos de permissões** customizáveis
- [ ] **Auditoria completa** de ações
- [ ] **Integração com RH** (férias, ponto, etc.)
- [ ] **Dashboard individual** para funcionários
- [ ] **Notificações** de sistema
- [ ] **Relatórios avançados** de uso

### Melhorias Técnicas
- [ ] **Cache de permissões** para performance
- [ ] **Sincronização automática** com Clerk
- [ ] **Backup automático** de dados
- [ ] **Testes automatizados** completos
- [ ] **Documentação da API** (Swagger)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este documento primeiro
2. Consulte os logs do sistema
3. Entre em contato com a equipe de TI

---

**Sistema InterAlpha - Gestão de Funcionários v1.0**
*Desenvolvido com Next.js, Clerk, Prisma e TypeScript*