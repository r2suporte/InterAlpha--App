# Guia: Configurar Roles dos Usuários no Clerk

## 📋 Visão Geral

O sistema InterAlpha usa 7 níveis de roles hierárquicas para controle de acesso:

| Role | Nível | Descrição | Acesso |
|------|-------|-----------|--------|
| **diretor** | 7 | Diretor | Acesso total ao sistema |
| **gerente_administrativo** | 6 | Gerente Administrativo | Gestão de usuários e operações |
| **gerente_financeiro** | 5 | Gerente Financeiro | Gestão financeira e relatórios |
| **supervisor_tecnico** | 4 | Supervisor Técnico | Supervisão de técnicos |
| **tecnico** | 3 | Técnico | Execução de reparos |
| **atendente** | 2 | Atendente | Atendimento ao cliente |
| **user** | 1 | Usuário Padrão | Acesso básico |

---

## 🔧 Configurar Role para Usuário

### Método 1: Via Clerk Dashboard (Recomendado)

#### Passo 1: Acessar Usuário

1. Vá para: https://dashboard.clerk.com
2. Clique em **"Users"** no menu lateral
3. Encontre e clique no usuário desejado

#### Passo 2: Editar Public Metadata

1. Na página do usuário, clique na aba **"Metadata"**
2. Localize a seção **"Public metadata"**
3. Clique em **"Edit"**

#### Passo 3: Adicionar Role

Adicione o seguinte JSON:

```json
{
  "role": "tecnico"
}
```

**Exemplos para cada role**:

**Diretor**:
```json
{
  "role": "diretor"
}
```

**Gerente Administrativo**:
```json
{
  "role": "gerente_administrativo"
}
```

**Gerente Financeiro**:
```json
{
  "role": "gerente_financeiro"
}
```

**Supervisor Técnico**:
```json
{
  "role": "supervisor_tecnico"
}
```

**Técnico**:
```json
{
  "role": "tecnico"
}
```

**Atendente**:
```json
{
  "role": "atendente"
}
```

**Usuário Padrão** (opcional, é o default):
```json
{
  "role": "user"
}
```

#### Passo 4: Salvar

1. Clique em **"Save"**
2. A role será aplicada imediatamente
3. No próximo login, o usuário terá as novas permissões

---

### Método 2: Via API (Programático)

Para configurar roles em massa ou via script:

```typescript
import { clerkClient } from '@clerk/nextjs/server';

async function setUserRole(userId: string, role: string) {
  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      role: role
    }
  });
}

// Exemplo de uso
await setUserRole('user_2abc123def456', 'tecnico');
```

---

## 👥 Configuração Inicial Recomendada

### Usuário Administrador Principal

1. **Criar primeiro usuário** (você mesmo)
2. **Definir como diretor**:
   ```json
   {
     "role": "diretor"
   }
   ```

### Equipe Inicial

**Gerente Administrativo**:
- Responsável por gestão de usuários
- Pode criar e editar ordens de serviço
- Acesso a relatórios administrativos

**Técnicos**:
- Executam reparos
- Atualizam status de OS
- Registram peças utilizadas

**Atendentes**:
- Criam ordens de serviço
- Atendem clientes
- Agendam serviços

---

## 🔍 Verificar Role do Usuário

### No Código

```typescript
import { getCurrentUserRole, hasMinimumRole } from '@/lib/auth/clerk-roles';

// Obter role atual
const role = await getCurrentUserRole();
console.log('Role:', role); // 'tecnico'

// Verificar permissão
const isManager = await hasMinimumRole('gerente_administrativo');
console.log('É gerente?', isManager); // true/false
```

### No Clerk Dashboard

1. Users → Selecionar usuário
2. Tab "Metadata"
3. Ver "Public metadata" → campo "role"

### No Banco de Dados

```bash
# Abrir Prisma Studio
npx prisma studio

# Verificar tabela 'users'
# Coluna 'role' deve mostrar a role do usuário
```

---

## 🎯 Casos de Uso por Role

### Diretor
**Pode fazer**:
- ✅ Tudo no sistema
- ✅ Gerenciar todos os usuários
- ✅ Acessar relatórios financeiros
- ✅ Configurar sistema

**Exemplo de uso**:
```typescript
// Rota protegida apenas para diretor
import { requireRole } from '@/lib/auth/clerk-roles';

export async function DELETE() {
  await requireRole(['diretor']);
  // Apenas diretor pode deletar
}
```

### Gerente Administrativo
**Pode fazer**:
- ✅ Gerenciar usuários (exceto diretores)
- ✅ Criar/editar ordens de serviço
- ✅ Atribuir técnicos
- ✅ Ver relatórios operacionais

**Exemplo de uso**:
```typescript
import { requireMinimumRole } from '@/lib/auth/clerk-roles';

export async function POST() {
  await requireMinimumRole('gerente_administrativo');
  // Gerentes e acima podem acessar
}
```

### Técnico
**Pode fazer**:
- ✅ Ver ordens atribuídas
- ✅ Atualizar status de OS
- ✅ Registrar peças utilizadas
- ✅ Adicionar observações técnicas

**Não pode**:
- ❌ Criar usuários
- ❌ Deletar ordens de serviço
- ❌ Acessar relatórios financeiros

### Atendente
**Pode fazer**:
- ✅ Criar ordens de serviço
- ✅ Cadastrar clientes
- ✅ Agendar serviços
- ✅ Ver status de OS

**Não pode**:
- ❌ Atribuir técnicos
- ❌ Editar valores
- ❌ Acessar relatórios

---

## 🔄 Migração de Usuários Existentes

Se você tem usuários sem role definida:

### Script de Migração

```typescript
import { clerkClient } from '@clerk/nextjs/server';

async function migrateUsers() {
  const users = await clerkClient.users.getUserList();
  
  for (const user of users.data) {
    // Se não tem role, definir como 'user'
    if (!user.publicMetadata.role) {
      await clerkClient.users.updateUser(user.id, {
        publicMetadata: {
          role: 'user'
        }
      });
      console.log(`✅ Role 'user' definida para: ${user.emailAddresses[0]?.emailAddress}`);
    }
  }
}

// Executar
migrateUsers();
```

---

## ⚠️ Boas Práticas

### Segurança
- ✅ Sempre usar `requireRole` ou `requireMinimumRole` em rotas protegidas
- ✅ Validar permissões no backend, não apenas no frontend
- ✅ Usar hierarquia de roles para simplificar verificações
- ✅ Auditar mudanças de roles

### Organização
- ✅ Documentar quem tem acesso a quê
- ✅ Revisar roles periodicamente
- ✅ Remover acessos desnecessários
- ✅ Usar role mínima necessária (princípio do menor privilégio)

### Manutenção
- ✅ Manter lista atualizada de usuários e roles
- ✅ Treinar equipe sobre permissões
- ✅ Ter processo para solicitar mudança de role
- ✅ Backup de configurações importantes

---

## 📊 Matriz de Permissões

| Funcionalidade | Diretor | Ger. Adm | Ger. Fin | Sup. Téc | Técnico | Atendente |
|----------------|---------|----------|----------|----------|---------|-----------|
| Criar OS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar OS | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Deletar OS | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Atribuir Técnico | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Gerenciar Usuários | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Relatórios Financeiros | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Configurar Sistema | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## ✅ Checklist de Configuração

- [ ] Primeiro usuário criado como diretor
- [ ] Gerentes administrativos configurados
- [ ] Técnicos configurados com role correta
- [ ] Atendentes configurados
- [ ] Roles testadas (login com cada tipo)
- [ ] Permissões verificadas (acesso a rotas)
- [ ] Documentação de roles compartilhada com equipe
- [ ] Processo de mudança de role definido

---

## 🔧 Troubleshooting

### Usuário não tem permissão após configurar role

**Solução**:
1. Fazer logout e login novamente
2. Verificar se role está em `publicMetadata` (não `privateMetadata`)
3. Verificar se nome da role está correto (sem typos)

### Role não aparece no banco de dados

**Solução**:
1. Verificar se webhook está configurado
2. Criar/atualizar usuário no Clerk para disparar webhook
3. Verificar logs do webhook

### Erro "Unauthorized" mesmo com role correta

**Solução**:
1. Verificar se `requireRole` está usando array: `['tecnico']`
2. Verificar se role está exatamente como definida (case-sensitive)
3. Verificar logs do servidor

---

## 📞 Recursos

- [Clerk User Metadata](https://clerk.com/docs/users/metadata)
- [Clerk User Management](https://clerk.com/docs/users/overview)
- Código: `lib/auth/clerk-roles.ts`

---

**Última Atualização**: 2025-12-09  
**Status**: Pronto para configuração
