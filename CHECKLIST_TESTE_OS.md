# ✅ CHECKLIST DE TESTE - FLUXO COMPLETO DE ORDEM DE SERVIÇO

## 🎯 Objetivo
Validar que PDF, Email e WhatsApp são enviados automaticamente ao criar uma OS.

---

## 📋 PRÉ-REQUISITOS

- [x] Servidor rodando em http://localhost:3000 ✅
- [x] Cliente cadastrado com email e telefone ✅
  - Nome: **Empresa Teste Ltda**
  - Email: **cliente-1759512827070@empresa.com**
  - Telefone: **(11) 3333-4444**
  - ID: **55b594cb-653c-41c0-acb0-5d0ed328ec03**

---

## 🧪 PASSOS DO TESTE

### 1️⃣ Acessar Dashboard
- [ ] Abrir: http://localhost:3000/dashboard/ordens-servico
- [ ] Clicar em "Nova Ordem de Serviço" (ou botão similar)

### 2️⃣ Preencher Formulário
- [ ] **Cliente:** Selecionar "Empresa Teste Ltda"
- [ ] **Equipamento:**
  - [ ] Tipo: (ex: MacBook, iPhone, iPad, etc)
  - [ ] Modelo: (ex: MacBook Pro 13")
  - [ ] Serial Number: (qualquer texto)
  - [ ] Problema reportado: (ex: "Tela não liga")
- [ ] **Serviço:**
  - [ ] Tipo de serviço: (ex: Reparo)
  - [ ] Descrição: (ex: "Diagnóstico e reparo de display")
  - [ ] Prioridade: (ex: Normal)
  - [ ] Valor do serviço: (ex: 500.00)
  - [ ] Valor das peças: (ex: 200.00)
  - [ ] Data prevista de entrega: (qualquer data futura)

### 3️⃣ Criar Ordem de Serviço
- [ ] Clicar em "Salvar" ou "Criar Ordem de Serviço"
- [ ] Aguardar mensagem de sucesso

---

## 🔍 VALIDAÇÃO DOS LOGS

### No terminal do servidor Next.js, você deve ver:

#### ✅ Criação da OS
```
✅ Ordem de Serviço OS-XXX criada com sucesso
```

#### ✅ Geração de PDF
```
📄 Gerando PDF para ordem OS-XXX...
✅ PDF gerado com sucesso para ordem OS-XXX
```

#### ✅ Envio de Email
```
📧 Enviando email para cliente-1759512827070@empresa.com...
✅ Email enviado com sucesso para ordem OS-XXX
```

#### ✅ Envio de WhatsApp
```
📱 Enviando WhatsApp para (11) 3333-4444...
✅ WhatsApp enviado com sucesso para ordem OS-XXX
```

#### ✅ Envio de SMS
```
📲 SMS enviado para (11) 3333-4444
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

### Logs do Servidor
- [ ] ✅ Mensagem "PDF gerado com sucesso"
- [ ] ✅ Mensagem "Email enviado com sucesso"
- [ ] ✅ Mensagem "WhatsApp enviado com sucesso"
- [ ] ✅ Mensagem "SMS enviado"
- [ ] ❌ Nenhum erro de "Failed to" ou "Erro ao"

### Recebimento (se configurado)
- [ ] Email chegou na caixa de entrada do cliente
- [ ] PDF está anexado no email
- [ ] PDF abre corretamente e está formatado
- [ ] WhatsApp recebeu a mensagem
- [ ] SMS recebido (se configurado)

---

## ❌ POSSÍVEIS ERROS E SOLUÇÕES

### "Erro ao gerar PDF"
**Causa:** Problema com jsPDF ou dados faltando  
**Solução:** Verificar logs detalhados e tipos de dados

### "Erro ao enviar email"
**Causa:** Configuração SMTP incorreta ou email inválido  
**Solução:** 
- Verificar variáveis de ambiente (.env.local):
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`

### "Erro ao enviar WhatsApp"
**Causa:** API do WhatsApp não configurada  
**Solução:** 
- Verificar variáveis de ambiente:
  - `WHATSAPP_API_KEY`
  - `WHATSAPP_PHONE_NUMBER`
- Se não tiver API, é esperado ver erro (não bloqueia criação da OS)

### "Erro ao enviar SMS"
**Causa:** API de SMS não configurada  
**Solução:** Similar ao WhatsApp

---

## 📝 RESULTADO ESPERADO

### ✅ Cenário de Sucesso Completo:
1. OS criada no banco ✅
2. PDF gerado automaticamente ✅
3. Email enviado com PDF anexo ✅
4. WhatsApp enviado ✅
5. SMS enviado ✅
6. Cliente recebe em 4 canais ✅

### ⚠️ Cenário de Sucesso Parcial:
1. OS criada no banco ✅
2. PDF gerado automaticamente ✅
3. Email enviado com PDF anexo ✅
4. WhatsApp falhou ⚠️ (API não configurada - esperado)
5. SMS falhou ⚠️ (API não configurada - esperado)
6. **Importante:** OS foi criada mesmo com falhas nas notificações ✅

---

## 🚀 APÓS O TESTE

### Verificar no Banco de Dados
Execute novamente:
```bash
node test-os-flow.js
```

Você deve ver:
- ✅ Nova OS listada
- ✅ Comunicações registradas (se tabela existir)

### Verificar PDF Gerado
1. Abrir o email recebido
2. Baixar o anexo `OS_XXX.pdf`
3. Verificar se contém:
   - Cabeçalho da empresa
   - Dados do cliente
   - Dados do equipamento
   - Valores formatados em R$
   - Termos e condições
   - Área de assinatura

---

## 📞 SUPORTE

Se encontrar problemas:
1. Copie os logs de erro do terminal
2. Verifique o arquivo de documentação: `docs/IMPLEMENTACAO_OS_COMPLETA.md`
3. Execute: `npx tsc --noEmit` para verificar erros TypeScript

---

## ✅ STATUS FINAL

Após completar todos os itens acima, marque:

- [ ] **TESTE COMPLETO** - Todas as notificações enviadas com sucesso
- [ ] **TESTE PARCIAL** - OS criada, mas algumas notificações falharam (esperado se APIs não configuradas)
- [ ] **TESTE FALHOU** - OS não foi criada ou erro crítico

---

**Data do teste:** _______________  
**Testado por:** _______________  
**Resultado:** _______________  
**Observações:** _______________
