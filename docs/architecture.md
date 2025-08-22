# Arquitetura do Projeto

## Visão Geral

O InterAlpha é uma aplicação web full-stack construída com Next.js 15, React, TypeScript e Tailwind CSS no frontend, e Next.js API Routes no backend. O banco de dados utilizado é o PostgreSQL (via Neon) com Prisma ORM para mapeamento objeto-relacional.

## Estrutura de Pastas

```
interalpha-app/
├── src/
│   ├── app/                 # App Router do Next.js 15
│   │   ├── (dashboard)/     # Rotas do dashboard principal
│   │   ├── (employee)/      # Rotas específicas para diferentes tipos de funcionários
│   │   ├── api/             # API Routes do Next.js
│   │   ├── client/          # Rotas para área do cliente
│   │   └── ...              # Outras rotas públicas
│   ├── components/          # Componentes React reutilizáveis
│   ├── contexts/            # Context Providers do React
│   ├── lib/                 # Funções utilitárias e configurações
│   ├── services/            # Lógica de negócio e serviços
│   ├── types/               # Definições de tipos TypeScript
│   └── ...
├── prisma/                  # Schema do banco de dados e migrations
├── public/                  # Arquivos estáticos
└── ...
```

## Camadas da Aplicação

### 1. Camada de Apresentação (Frontend)
- Construída com React e Next.js App Router
- Utiliza Server Components e Client Components adequadamente
- Componentes reutilizáveis na pasta `components/`
- Gerenciamento de estado com React Context e hooks

### 2. Camada de Lógica de Negócio (Services)
- Implementada na pasta `services/`
- Contém a lógica de negócio da aplicação
- Interage com a camada de dados e APIs externas
- Encapsula regras de negócio complexas

### 3. Camada de Dados
- Banco de dados PostgreSQL com Prisma ORM
- Definição do schema em `prisma/schema.prisma`
- Acesso aos dados através de services
- Caching com Redis onde apropriado

### 4. Camada de API
- API Routes do Next.js em `src/app/api/`
- Serve como interface entre frontend e serviços
- Implementa autenticação e autorização
- Validação de dados com Zod

## Fluxo de Dados

1. **Requisição do Cliente**: O usuário interage com a interface
2. **Server Components**: Carregam dados iniciais do servidor
3. **API Routes**: Processam requisições e chamam serviços
4. **Services**: Executam lógica de negócio e acessam dados
5. **Prisma ORM**: Interage com o banco de dados
6. **Resposta**: Dados retornam para o cliente através de Server Components ou API
7. **Client Components**: Atualizam a interface com base nos dados recebidos

## Padrões Arquiteturais

### Separation of Concerns
- Lógica de apresentação separada da lógica de negócio
- Componentes reutilizáveis e com responsabilidades bem definidas
- Services encapsulam regras de negócio

### Component-Based Architecture
- Componentes React modulares e reutilizáveis
- Hierarquia clara de componentes
- Props bem definidas e tipadas

### API-First Approach
- API Routes como interface padronizada para comunicação
- Validação de dados em todas as entradas
- Documentação clara das APIs

## Tecnologias Principais

- **Next.js 15**: Framework React com App Router
- **React**: Biblioteca para interfaces de usuário
- **TypeScript**: Tipagem estática para JavaScript
- **Tailwind CSS**: Framework CSS utilitário
- **Prisma**: ORM para Node.js e TypeScript
- **PostgreSQL**: Banco de dados relacional
- **Clerk**: Autenticação e gerenciamento de usuários
- **Redis**: Caching e gerenciamento de sessões
- **Stripe**: Processamento de pagamentos