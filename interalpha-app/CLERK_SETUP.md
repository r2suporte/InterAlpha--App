# 🔐 Configuração do Clerk - Guia Completo

## 📋 Passo a Passo

### 1. **Criar Conta no Clerk**
1. Acesse: https://clerk.com
2. Clique em **"Sign up"**
3. Crie sua conta gratuita

### 2. **Criar Aplicação**
1. No dashboard, clique em **"Add application"**
2. Nome da aplicação: **"InterAlpha System"**
3. Selecione as opções de login:
   - ✅ **Email address**
   - ✅ **Password**
   - ✅ **Google** (opcional)
4. Clique em **"Create application"**

### 3. **Obter as Chaves**
Após criar a aplicação, você verá duas chaves importantes:

#### 🔑 **Chave Pública (Publishable Key)**
- Formato: `pk_test_xxxxxxxxxx`
- Esta chave é segura para usar no frontend

#### 🔐 **Chave Secreta (Secret Key)**
- Formato: `sk_test_xxxxxxxxxx`
- Esta chave deve ser mantida em segredo

### 4. **Configurar Variáveis de Ambiente**

Abra o arquivo `.env` e substitua as chaves:

```env
# Substitua pelas suas chaves reais do Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_PUBLICA_AQUI
CLERK_SECRET_KEY=sk_test_SUA_CHAVE_SECRETA_AQUI
```

### 5. **Configurar URLs no Clerk Dashboard**

No dashboard do Clerk, vá em **Settings > Paths** e configure:

#### 🌐 **URLs de Desenvolvimento**
- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in URL**: `/dashboard`
- **After sign-up URL**: `/dashboard`

#### 🌐 **Allowed Origins**
Adicione estas URLs na seção **Allowed Origins**:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

### 6. **Criar Primeiro Usuário Administrador**

#### Opção A: Via Clerk Dashboard (Recomendado)
1. No dashboard do Clerk, vá em **Users**
2. Clique em **"Create user"**
3. Preencha os dados:
   - **Email**: `admin@interalpha.com`
   - **Password**: `Admin123!` (ou sua senha segura)
   - **First name**: `Administrador`
   - **Last name**: `Sistema`
4. Clique em **"Create user"**

#### Opção B: Via Interface do Sistema
1. Acesse: `http://localhost:3000/sign-up`
2. Crie a conta do administrador
3. Faça login normalmente

### 7. **Testar a Configuração**

1. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

2. **Teste o acesso**:
   - Acesse: `http://localhost:3000`
   - Deve redirecionar para `/sign-in`
   - Faça login com as credenciais criadas
   - Deve redirecionar para `/dashboard`

### 8. **Configurar Permissões de Usuário**

Após criar o primeiro usuário no Clerk, você precisa associá-lo ao sistema de funcionários:

1. **Obter o Clerk ID do usuário**:
   - No dashboard do Clerk, clique no usuário criado
   - Copie o **User ID** (formato: `user_xxxxxxxxxx`)

2. **Atualizar no banco de dados**:
   ```sql
   UPDATE employees 
   SET clerkId = 'user_xxxxxxxxxx' 
   WHERE email = 'admin@interalpha.com';
   ```

   Ou use o script:
   ```bash
   npm run seed:employees
   ```

## 🔧 **Configurações Avançadas**

### **Personalizar Aparência**
No dashboard do Clerk, vá em **Customization > Appearance** para:
- Adicionar logo da empresa
- Personalizar cores
- Customizar textos

### **Configurar Webhooks** (Opcional)
Para sincronizar automaticamente usuários:
1. Vá em **Webhooks** no dashboard
2. Adicione endpoint: `https://seudominio.com/api/webhooks/clerk`
3. Selecione eventos: `user.created`, `user.updated`, `user.deleted`

### **Configurar Organizações** (Opcional)
Para empresas com múltiplas organizações:
1. Ative **Organizations** nas configurações
2. Configure permissões por organização

## ⚠️ **Problemas Comuns**

### **Erro: "Clerk keys not found"**
**Solução**: Verifique se as variáveis estão corretas no `.env`

### **Erro: "Invalid publishable key"**
**Solução**: Certifique-se de usar a chave que começa com `pk_test_`

### **Erro: "Unauthorized"**
**Solução**: Verifique se o usuário existe no banco de dados `employees`

### **Redirecionamento infinito**
**Solução**: Verifique as URLs configuradas no Clerk Dashboard

## 📞 **Suporte**

Se tiver problemas:
1. Verifique a documentação: https://clerk.com/docs
2. Consulte os logs do console do navegador
3. Verifique os logs do servidor Next.js

---

## ✅ **Checklist de Configuração**

- [ ] Conta criada no Clerk
- [ ] Aplicação criada no dashboard
- [ ] Chaves copiadas para `.env`
- [ ] URLs configuradas no dashboard
- [ ] Primeiro usuário criado
- [ ] Servidor reiniciado
- [ ] Login testado com sucesso
- [ ] Usuário associado ao sistema de funcionários

**Após completar todos os itens, o sistema estará funcionando com autenticação completa!** 🎉