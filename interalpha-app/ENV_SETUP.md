# 🔧 Configuração de Variáveis de Ambiente

## 📁 Estrutura de Arquivos

- **`.env.example`** - Template com todas as variáveis disponíveis
- **`.env.local`** - Configurações de desenvolvimento (não commitado)
- **`.env.backup`** - Backup do arquivo .env original
- **`.env.local.backup`** - Backup do arquivo .env.local original

## 🚀 Setup Inicial

1. **Copie o template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure suas credenciais:**
   - Edite `.env.local` com suas chaves reais
   - Nunca commite arquivos `.env.local` ou `.env`

## 🔑 Configurações Principais

### 🗄️ Database (Obrigatório)
```env
DATABASE_URL="postgresql://..."
```

### 🔐 Autenticação - Clerk (Obrigatório)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### 💳 Pagamentos - Stripe (Opcional)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
```

### 📱 SMS/WhatsApp - Twilio (Opcional)
```env
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+..."
```

### 📧 Email - Nodemailer (Opcional)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 🔄 Redis - Filas (Opcional)
```env
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

## ⚠️ Importante

- **Nunca** commite arquivos com credenciais reais
- Use `.env.local` para desenvolvimento
- Use variáveis de ambiente do servidor para produção
- Mantenha `.env.example` atualizado como template

## 🔄 Migração Realizada

- ✅ Removido `.env` duplicado
- ✅ Consolidado configurações em `.env.local`
- ✅ Organizado por categorias
- ✅ Comentado configurações não utilizadas
- ✅ Criado backups dos arquivos originais