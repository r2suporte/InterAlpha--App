# 🚀 Guia Rápido de Testes - Botões e Inputs

## Status: ✅ TODOS CORRIGIDOS - PRONTO PARA TESTAR

---

## 📋 Checklist de Testes

### ✅ Pré-requisitos
- [ ] Terminal: `npm run dev` (running)
- [ ] Browser: `http://localhost:3000`
- [ ] DevTools aberto (F12 → Console)

---

## 🧪 Testes por Página

### 1. Dashboard Financeiro
**URL**: `http://localhost:3000/dashboard/financeiro`

| Elemento | Ação | Resultado Esperado | Status |
|----------|------|-------------------|--------|
| Botão Período | Clique | Dialog abre + Console: "🔵 Clique em Período" | [ ] |
| Botão Filtros | Clique | Dialog abre + Console: "🔵 Clique em Filtros" | [ ] |
| Botão Exportar | Clique | Download de arquivo JSON + Console: "✅ Dados exportados" | [ ] |

---

### 2. Receitas
**URL**: `http://localhost:3000/dashboard/financeiro/receitas`

| Elemento | Ação | Resultado Esperado | Status |
|----------|------|-------------------|--------|
| Botão Nova Receita | Clique | Dialog abre + Console: "🔵 Clique em Nova Receita" | [ ] |
| Dialog: Preencher formulário | Input text | Aceita entrada normalmente | [ ] |
| Botão Salvar (no Dialog) | Clique | Receita salva + Dialog fecha | [ ] |
| Botão Exportar | Clique | Download JSON + Console: "🔵 Exportando receitas..." | [ ] |

---

### 3. Despesas
**URL**: `http://localhost:3000/dashboard/financeiro/despesas`

| Elemento | Ação | Resultado Esperado | Status |
|----------|------|-------------------|--------|
| Botão Nova Despesa | Clique | Dialog abre + Console: "🔵 Clique em Nova Despesa" | [ ] |
| Dialog: Preencher formulário | Input text | Aceita entrada normalmente | [ ] |
| Botão Salvar (no Dialog) | Clique | Despesa salva + Dialog fecha | [ ] |
| Botão Exportar | Clique | Download JSON + Console: "🔵 Exportando despesas..." | [ ] |

---

### 4. Calculadora
**URL**: `http://localhost:3000/dashboard/calculadora`

| Elemento | Ação | Resultado Esperado | Status |
|----------|------|-------------------|--------|
| Input Valor de Custo | Clique | Input focado (borda azul) | [ ] |
| Input Valor de Custo | Digite "100" | Mostra "100" | [ ] |
| Input Valor de Custo | Digite "100.50" | Mostra "100.50" (casas decimais) | [ ] |
| Input Valor de Custo | Delete/Backspace | Remove caracteres normalmente | [ ] |
| Input Valor de Custo | Any change | Console: "🔵 Alterando Valor de Custo: ..." | [ ] |
| Botão Calcular | Clique | Resultado aparece abaixo | [ ] |

---

### 5. Relatórios
**URL**: `http://localhost:3000/dashboard/relatorios`

| Elemento | Ação | Resultado Esperado | Status |
|----------|------|-------------------|--------|
| Botão Filtros Avançados | Clique | Dialog abre + Console: "🔵 Clique em Filtros Avançados" | [ ] |
| Input Data Início | Clique | Calendar picker abre (se houver) | [ ] |
| Input Data Início | Selecione data | Data aparece no input | [ ] |
| Input Data Fim | Clique | Calendar picker abre | [ ] |
| Input Data Fim | Selecione data | Data aparece no input | [ ] |
| Botão Salvar (Dialog) | Clique | Filtros aplicados + Dialog fecha | [ ] |
| Tipo de Relatório | Clique em qualquer | Seleciona o tipo (radio/checkbox) | [ ] |

---

### 6. Peças (Verificação)
**URL**: `http://localhost:3000/dashboard/pecas`

| Elemento | Ação | Resultado Esperado | Status |
|----------|------|-------------------|--------|
| Botão Voltar | Clique | Navega para página anterior | [ ] |
| Botão Nova Peça | Clique | Dialog abre OU navega para formulário | [ ] |

---

### 7. Pagamentos (Verificação)
**URL**: `http://localhost:3000/dashboard/pagamentos`

| Elemento | Ação | Resultado Esperado | Status |
|----------|------|-------------------|--------|
| Botão Voltar | Clique | Navega para página anterior | [ ] |
| Botão Novo Pagamento | Clique | Dialog abre OU navega para formulário | [ ] |

---

## 🔍 Console Debug Messages

Ao executar os testes, você deve ver estas mensagens no Console:

```
✅ ESPERADO VER:
🔵 Clique em Período
🔵 Clique em Filtros
🔵 Clique em Nova Receita
🔵 Clique em Nova Despesa
🔵 Clique em Filtros Avançados
🔵 Alterando Valor de Custo: 100
🔵 Alterando Valor de Custo: 100.50
✅ Receitas exportadas
✅ Despesas exportadas
```

---

## 📥 Teste de Download (Export)

### Financeiro - Exportar
```
Expected: arquivo-financeiro-2025-10-20.json
Size: ~2-5 KB (depende de dados)
Content: Array de objetos JSON
```

### Receitas - Exportar
```
Expected: receitas-2025-10-20.json
Size: ~1-3 KB (depende de receitas)
Content: Array de receitas com campos:
  - descricao
  - valor
  - data
  - categoria
  - status
  - cliente
  - ordem_servico
```

### Despesas - Exportar
```
Expected: despesas-2025-10-20.json
Size: ~1-3 KB (depende de despesas)
Content: Array de despesas com campos:
  - descricao
  - valor
  - data
  - categoria
  - status
  - fornecedor
  - nota_fiscal
```

---

## ⚙️ Resolução de Problemas

### Botão não responde
1. Abra DevTools (F12)
2. Vá para Console tab
3. Clique no botão de novo
4. Procure por mensagens de erro em vermelho
5. Se não houver mensagem "🔵...", há um problema

### Input não aceita valores
1. Clique no input
2. Verifique se está focado (borda azul/ativa)
3. Tente digitar números simples (ex: "5")
4. Se não funcionar, há erro de tipo/validação

### Dialog não abre
1. Verifique Console para erros (aba "Console")
2. Procure por "Cannot read property" ou "ReferenceError"
3. Se houver erro, página pode ter código quebrado

### Export não funciona
1. Verifique se há bloqueador de pop-ups
2. Verifique aba "Downloads" do navegador
3. Se nada baixou, há erro no handler

---

## 🎯 Critério de Aceitação

**SUCESSO**: Todos os itens com ✓ na coluna Status  
**FALHA**: Qualquer item sem ✓ indicando problema

---

## 📱 Testes em Mobile (Opcional)

Se quiser testar em dispositivo mobile:

```bash
# Terminal 1: npm run dev (continua rodando)

# Terminal 2: descobrir IP local
ipconfig getifaddr en0  # macOS
# ou
hostname -I  # Linux

# Depois, no mobile:
http://<seu-ip>:3000/dashboard/financeiro
```

---

## ✨ Resumo

| Página | Botões/Inputs Testados | Esperado | Resultado |
|--------|------------------------|----------|-----------|
| Financeiro | 3 | ✓ Todos funcionam | [ ] PASS / [ ] FAIL |
| Receitas | 4 | ✓ Todos funcionam | [ ] PASS / [ ] FAIL |
| Despesas | 4 | ✓ Todos funcionam | [ ] PASS / [ ] FAIL |
| Calculadora | 1 | ✓ Funciona | [ ] PASS / [ ] FAIL |
| Relatórios | 5 | ✓ Todos funcionam | [ ] PASS / [ ] FAIL |
| Peças | 2 | ✓ Ambos funcionam | [ ] PASS / [ ] FAIL |
| Pagamentos | 2 | ✓ Ambos funcionam | [ ] PASS / [ ] FAIL |

---

## 📝 Notas

- Se houver dados para testar Export, use-os. Se não houver, o botão ainda funcionará (download de JSON vazio).
- Os console.log com 🔵 são apenas para desenvolvimento. Remover antes de deployment.
- Todos os testes devem ser feitos em sequence (um por um, não paralelos).

---

**Status**: Pronto para testes ✅  
**Data**: 20 de Outubro de 2025  
**Responsável**: GitHub Copilot
