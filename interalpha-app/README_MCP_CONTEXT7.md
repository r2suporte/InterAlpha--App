# Guia de Implementação do MCP Context7 para Supabase

## Visão Geral

Este documento fornece instruções detalhadas sobre a implementação do Model Context Protocol (MCP) Context7 para Supabase no projeto InterAlpha. O MCP permite que ferramentas de IA como Cursor, VS Code Copilot e outras interajam diretamente com seu projeto Supabase.

## O que foi implementado

1. **Arquivos de configuração MCP**:
   - `.cursor/mcp.json` - Para o editor Cursor
   - `.vscode/mcp.json` - Para o Visual Studio Code

2. **Utilitários Supabase**:
   - `src/lib/supabase.ts` - Cliente Supabase principal
   - `src/utils/supabase/server.ts` - Cliente para o lado do servidor
   - `src/utils/supabase/client.ts` - Cliente para o lado do cliente
   - `src/types/supabase.ts` - Tipos TypeScript para o Supabase

3. **Migração do banco de dados**:
   - Atualização do `schema.prisma` para usar PostgreSQL em vez de SQLite

## Configuração necessária

### 1. Obter token de acesso pessoal do Supabase

1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em "Generate new token"
3. Dê um nome descritivo (ex: "InterAlpha MCP")
4. Copie o token gerado

### 2. Configurar o token nos arquivos MCP

#### Para Cursor (`.cursor/mcp.json`):

Substitua a string vazia no campo `SUPABASE_ACCESS_TOKEN` pelo seu token:

```json
"env": {
  "SUPABASE_ACCESS_TOKEN": "seu-token-aqui"
}
```

#### Para VS Code:

O token será solicitado quando você usar o Copilot pela primeira vez com o MCP.

### 3. Verificar variáveis de ambiente

Certifique-se de que as seguintes variáveis estão configuradas no arquivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://unhbhshmxswyhatigzsi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
DATABASE_URL=postgresql://postgres:sua-senha-aqui@db.unhbhshmxswyhatigzsi.supabase.co:5432/postgres
```

## Como usar

### Com Cursor

1. Abra o projeto no Cursor
2. Navegue até Settings/MCP
3. Você deve ver um status verde ativo após o servidor ser conectado com sucesso

### Com VS Code + Copilot

1. Abra o projeto no VS Code
2. Abra o chat do Copilot e mude para o modo "Agent"
3. Você deve ver um ícone de ferramenta que pode ser tocado para confirmar que as ferramentas MCP estão disponíveis
4. Quando solicitado, insira seu token de acesso pessoal

## Exemplos de uso

### Consultar dados

Você pode pedir ao assistente de IA para consultar dados do seu banco de dados Supabase:

```
"Mostre-me os últimos 5 clientes cadastrados"
```

### Gerar tipos TypeScript

Você pode pedir ao assistente para gerar tipos TypeScript baseados no seu schema:

```
"Gere tipos TypeScript para a tabela de ordens de serviço"
```

### Obter informações do projeto

Você pode pedir informações sobre seu projeto Supabase:

```
"Quais são as configurações atuais do meu projeto Supabase?"
```

## Solução de problemas

### Erro de conexão

Se você encontrar erros de conexão:

1. Verifique se o token de acesso pessoal está correto
2. Confirme se o projeto Supabase está ativo (não pausado)
3. Verifique se o `project-ref` nos arquivos MCP corresponde ao seu projeto

### Erro de permissão

Se você encontrar erros de permissão:

1. Verifique se o token tem as permissões necessárias
2. Considere remover a flag `--read-only` se precisar fazer operações de escrita

## Recursos adicionais

- [Documentação oficial do MCP Supabase](https://supabase.com/docs/guides/getting-started/mcp)
- [Repositório do servidor MCP Supabase](https://github.com/supabase/mcp-server-supabase)
- [Documentação do Model Context Protocol](https://modelcontextprotocol.github.io/)

---

**Nota de segurança**: Nunca compartilhe seu token de acesso pessoal ou o inclua em repositórios públicos. Use variáveis de ambiente ou gerenciadores de segredos para armazenar tokens em ambientes compartilhados.