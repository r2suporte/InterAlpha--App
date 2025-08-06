# Neon PostgreSQL no InterAlpha

## Visão Geral

O InterAlpha utiliza o Neon PostgreSQL como banco de dados principal. O Neon é um serviço de banco de dados PostgreSQL serverless e escalável na nuvem, oferecendo alta disponibilidade, escalabilidade automática e recursos avançados de segurança.

## Configuração

### Variáveis de Ambiente

A conexão com o banco de dados Neon é configurada através da variável de ambiente `DATABASE_URL` no arquivo `.env`:

```
DATABASE_URL="postgresql://seu-usuario:sua-senha@seu-host:5432/seu-banco-de-dados"
```

## Acesso ao Banco de Dados

### Prisma ORM

O InterAlpha utiliza o Prisma ORM para interagir com o banco de dados Neon PostgreSQL. O Prisma oferece uma camada de abstração segura e tipada para operações de banco de dados.

#### Cliente Prisma

O cliente Prisma está configurado em `src/lib/prisma.ts` e é utilizado em toda a aplicação para operações de banco de dados:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Exemplos de Uso

#### Consulta de Dados

```typescript
import { prisma } from '@/lib/prisma';

// Buscar todos os clientes
async function getAllClientes() {
  const clientes = await prisma.cliente.findMany();
  return clientes;
}

// Buscar cliente por ID
async function getClienteById(id: string) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
  });
  return cliente;
}
```

#### Inserção de Dados

```typescript
import { prisma } from '@/lib/prisma';

async function createCliente(data: any) {
  const cliente = await prisma.cliente.create({
    data,
  });
  return cliente;
}
```

#### Atualização de Dados

```typescript
import { prisma } from '@/lib/prisma';

async function updateCliente(id: string, data: any) {
  const cliente = await prisma.cliente.update({
    where: { id },
    data,
  });
  return cliente;
}
```

#### Exclusão de Dados

```typescript
import { prisma } from '@/lib/prisma';

async function deleteCliente(id: string) {
  await prisma.cliente.delete({
    where: { id },
  });
  return { success: true };
}
```

## Migrações e Gerenciamento de Schema

### Comandos Prisma

- **Sincronizar o schema com o banco de dados**: `npm run db:push`
- **Abrir o Prisma Studio**: `npm run db:studio`
- **Gerar o cliente Prisma**: `npm run db:generate`

## Boas Práticas

1. **Transações**: Use transações para operações que envolvem múltiplas alterações no banco de dados.

```typescript
import { prisma } from '@/lib/prisma';

async function criarOrdemComPagamento(clienteId: string, ordemData: any, pagamentoData: any) {
  const result = await prisma.$transaction(async (tx) => {
    const ordem = await tx.ordemServico.create({
      data: {
        ...ordemData,
        clienteId,
      },
    });

    const pagamento = await tx.pagamento.create({
      data: {
        ...pagamentoData,
        ordemServicoId: ordem.id,
      },
    });

    return { ordem, pagamento };
  });

  return result;
}
```

2. **Consultas Otimizadas**: Use `select` e `include` para buscar apenas os dados necessários.

```typescript
import { prisma } from '@/lib/prisma';

async function getOrdemComCliente(ordemId: string) {
  const ordem = await prisma.ordemServico.findUnique({
    where: { id: ordemId },
    include: {
      cliente: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
        },
      },
    },
  });
  return ordem;
}
```

## Recursos Adicionais

- [Documentação do Neon PostgreSQL](https://neon.tech/docs/)
- [Documentação do Prisma](https://www.prisma.io/docs/)
- [Melhores práticas do Prisma](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)