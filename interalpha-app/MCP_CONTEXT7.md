# MCP Context7 para Supabase - InterAlpha

## O que é MCP (Model Context Protocol)?

O Model Context Protocol (MCP) é um padrão para conectar Modelos de Linguagem Grande (LLMs) a plataformas como o Supabase. Ele permite que assistentes de IA interajam e consultem seus projetos Supabase em seu nome.

## O que foi implementado

Foram adicionados arquivos de configuração MCP para permitir que ferramentas de IA como Cursor, VS Code (Copilot) e outras possam interagir diretamente com o projeto Supabase do InterAlpha.

### Arquivos criados:

1. `.cursor/mcp.json` - Configuração para o editor Cursor
2. `.vscode/mcp.json` - Configuração para o Visual Studio Code

## Ferramentas disponíveis

O servidor MCP do Supabase oferece mais de 20 ferramentas, incluindo:

- Design de tabelas e rastreamento usando migrações
- Busca de dados e execução de relatórios usando consultas SQL
- Criação de branches de banco de dados para desenvolvimento (experimental)
- Busca de configuração do projeto
- Criação de novos projetos Supabase
- Pausar e restaurar projetos
- Recuperação de logs para depurar problemas
- Geração de tipos TypeScript baseados no schema do banco de dados

## Como usar

### Requisitos

1. Você precisa criar um token de acesso pessoal (PAT) no Supabase:
   - Acesse: https://supabase.com/dashboard/account/tokens
   - Crie um novo token com um nome descritivo (ex: "InterAlpha MCP")

2. Ao usar uma ferramenta compatível com MCP, você será solicitado a fornecer este token.

### Ferramentas compatíveis

- **Cursor**: Já configurado através do arquivo `.cursor/mcp.json`
- **VS Code com Copilot**: Configurado através do arquivo `.vscode/mcp.json`
- **Claude Desktop**: Pode ser configurado manualmente
- **Windsurf (Codium)**: Pode ser configurado manualmente
- **Cline (extensão VS Code)**: Pode ser configurado manualmente

## Segurança

Por padrão, a configuração usa o modo somente leitura (`--read-only`) para evitar que o agente faça alterações não intencionais no banco de dados. Observe que o modo somente leitura se aplica apenas às operações de banco de dados. Operações de gerenciamento de projeto, como `create_project`, ainda estão disponíveis.

## Benefícios

- Facilita o desenvolvimento com assistência de IA
- Permite que ferramentas de IA entendam a estrutura do seu banco de dados
- Automatiza tarefas comuns de desenvolvimento
- Melhora a produtividade ao trabalhar com Supabase

## Próximos passos

1. Obtenha seu token de acesso pessoal do Supabase
2. Use ferramentas compatíveis com MCP para interagir com seu projeto
3. Explore as capacidades do MCP para melhorar seu fluxo de trabalho

---

**Nota**: Mantenha seu token de acesso pessoal seguro e não o compartilhe. Considere usar variáveis de ambiente ou gerenciadores de segredos para armazenar o token em ambientes de produção.