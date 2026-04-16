# InterAlpha--App

Sistema de gestão empresarial completo com integrações avançadas.

## 🚀 Funcionalidades

- **Autenticação** - Sistema completo de login e registro
- **Gestão de Clientes** - CRUD completo para clientes
- **Ordens de Serviço** - Controle de serviços prestados
- **Pagamentos** - Gestão financeira integrada
- **Integrações** - WhatsApp, SMS, Email
- **Dashboard** - Relatórios e analytics
- **Workflows** - Automação de processos

## 🛠️ Tecnologias

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Neon PostgreSQL
- **Autenticação**: Clerk + JWT para portal de cliente
- **Pagamentos**: Stripe
- **Integrações**: WhatsApp Business API, SMS, Email

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/r2suporte/InterAlpha--App.git

# Entre no diretório
cd InterAlpha--App/interalpha-app

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute em desenvolvimento
npm run dev
```

## 🔧 Configuração

1. Configure as variáveis de ambiente no arquivo `.env.local`
2. Configure o banco de dados Neon
3. Configure as integrações (WhatsApp, SMS, Email)
4. Configure o Stripe para pagamentos

## ✅ Qualidade e Validação

```bash
npm run lint:check
npm run type:check
npm run test:ci
npm run build
```

## 📚 Documentação

A documentação completa está disponível na pasta `.kiro/specs/` com especificações detalhadas de cada funcionalidade.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
