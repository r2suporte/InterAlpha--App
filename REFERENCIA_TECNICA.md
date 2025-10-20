# 📚 Referência Técnica - Padrões Corrigidos

## Problema: DialogTrigger asChild + open/onOpenChange Conflito

### ❌ PADRÃO ERRADO

```typescript
// Isto NÃO funciona - DialogTrigger entra em conflito com open/onOpenChange
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Abrir Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <p>Conteúdo do Dialog</p>
  </DialogContent>
</Dialog>
```

**Por que falha:**
- `DialogTrigger` tenta gerenciar o estado internamente
- `open` e `onOpenChange` tentam gerenciar externamente
- Há conflito entre os dois mecanismos
- Botão fica "preso" - não responde aos cliques

---

### ✅ PADRÃO CORRETO - Opção 1: Button Separado

```typescript
// ✅ CORRETO - Button com onClick separado do Dialog
const [isOpen, setIsOpen] = useState(false);

<Button onClick={(e) => {
  e.preventDefault();
  console.log('🔵 Clique em Abrir Dialog');
  setIsOpen(true);
}}>
  Abrir Dialog
</Button>

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <p>Conteúdo do Dialog</p>
  </DialogContent>
</Dialog>
```

**Por que funciona:**
- Apenas um mecanismo de controle: `open/onOpenChange`
- Button com onClick limpo e direto
- preventDefault() evita comportamentos inesperados
- Console.log para debug

---

### ✅ PADRÃO CORRETO - Opção 2: DialogTrigger Apenas

```typescript
// ✅ ALTERNATIVA - Usar APENAS DialogTrigger (sem open/onOpenChange)
<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <p>Conteúdo do Dialog</p>
  </DialogContent>
</Dialog>
```

**Quando usar:**
- Quando NÃO precisa de controle programático
- Quando está OK que o Dialog feche automaticamente
- Mais simples e menos propenso a erros

---

## Problema: Input type="text" com Regex

### ❌ PADRÃO ERRADO

```typescript
// Isto é problemático - regex pode bloquear entrada válida
<Input
  type="text"
  inputMode="decimal"
  placeholder="0.00"
  value={valor}
  onChange={e => {
    // Este regex é agressivo demais
    const value = e.target.value.replace(/[^0-9.,]/g, '');
    setValor(value);
  }}
/>
```

**Problemas:**
- Type "text" não é semanticamente correto
- Regex pode filtrar caracteres necessários
- Difícil de editar valores com separadores
- Teclado de input numérico em mobile não é acionado
- Usuario pode ver um comportamento estranho

---

### ✅ PADRÃO CORRETO - Input Numérico

```typescript
// ✅ CORRETO - Type number com step
<Input
  type="number"
  step="0.01"
  placeholder="0.00"
  value={valor}
  onChange={e => {
    console.log('🔵 Alterando Valor:', e.target.value);
    setValor(e.target.value);
  }}
  onBlur={validarValor}
/>
```

**Benefícios:**
- ✅ Type "number" é semanticamente correto
- ✅ Browser trata validação nativamente
- ✅ Step="0.01" garante precisão decimal
- ✅ Teclado numérico em mobile é acionado automaticamente
- ✅ Incremento/decremento com botões ↑↓
- ✅ Sem regex complexa

---

## Padrão: Dialogs com Exportação

### Padrão Correto para Export Button

```typescript
// ✅ CORRETO - Export com handler separado
const handleExportar = () => {
  console.log('🔵 Iniciando exportação...');
  
  try {
    // 1. Preparar dados
    const dados = items.map(item => ({
      id: item.id,
      nome: item.nome,
      valor: item.valor,
      data: item.data,
      status: item.status,
    }));

    // 2. Criar Blob
    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: 'application/json',
    });

    // 3. Criar URL
    const url = URL.createObjectURL(blob);

    // 4. Criar link e clicar
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();

    // 5. Limpeza
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Exportação concluída');
  } catch (error) {
    console.error('❌ Erro ao exportar:', error);
  }
};

// Uso:
<Button onClick={(e) => {
  e.preventDefault();
  handleExportar();
}}>
  Exportar
</Button>
```

---

## Padrão: BackButton (Navegação)

### ✅ CORRETO - BackButton com useState

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function BackButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('🔵 Clicando em Voltar...');
    
    try {
      setIsLoading(true);
      console.log('⏳ Navegando para página anterior...');
      router.back();
      
      // Aguardar um pouco para garantir navegação
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ Navegação concluída');
    } catch (error) {
      console.error('❌ Erro ao voltar:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoBack}
      disabled={isLoading}
      variant="ghost"
      size="icon"
      title="Voltar para página anterior"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowLeft className="h-4 w-4" />
      )}
    </Button>
  );
}
```

---

## Checklist: Ao Corrigir Dialogs

```
ANTES de implementar qualquer Dialog:

[ ] Decidir: Usar DialogTrigger OU open/onOpenChange?
    - Se precisa controle programático → open/onOpenChange SEM DialogTrigger
    - Se é simples → DialogTrigger SEM open/onOpenChange

[ ] NUNCA usar ambos simultaneamente

[ ] Se usar open/onOpenChange:
    [ ] Button tem onClick separado?
    [ ] onClick faz preventDefault()?
    [ ] onClick seta o estado corretamente?
    [ ] Há console.log para debug?

[ ] Estrutura correta:
    [ ] Button
    [ ] Dialog com open/onOpenChange
    [ ] DialogContent

[ ] Testes:
    [ ] Clique no botão → Dialog abre?
    [ ] Clique em "X" ou "Cancelar" → Dialog fecha?
    [ ] Clique em "Salvar" → Dialog fecha e dados salvos?
    [ ] Console mostra "🔵..." logs?
```

---

## Checklist: Ao Corrigir Inputs Numéricos

```
ANTES de criar inputs para números:

[ ] Use type="number" (não type="text")

[ ] Se precisa decimais:
    [ ] Adicionar step="0.01"
    [ ] Remover inputMode
    [ ] Remover regex de validação

[ ] onChange handler:
    [ ] Simples: `setValor(e.target.value)`
    [ ] Sem regex agressiva
    [ ] Com console.log para debug

[ ] Testes:
    [ ] Digitar inteiro (ex: 100) → Funciona?
    [ ] Digitar decimal (ex: 100.50) → Funciona?
    [ ] Usar botões ↑↓ do navegador → Incrementa corretamente?
    [ ] Deletar caracteres → Funciona?
    [ ] Tentar digitar letras → Browser bloqueia automaticamente?
```

---

## Padrão: Console Logging para Debug

### ✅ CORRETO - Logs com Emoji e Contexto

```typescript
// 🔵 = Ação do usuário iniciada
console.log('🔵 Clique em Nova Receita');

// ⏳ = Processamento em andamento
console.log('⏳ Salvando receita...');

// ✅ = Sucesso
console.log('✅ Receita salva com sucesso');

// ❌ = Erro
console.error('❌ Erro ao salvar:', error);

// 📊 = Dados
console.log('📊 Dados:', dados);

// 🔍 = Debug/Investigação
console.log('🔍 Value atual:', e.target.value);
```

### Razão dos Emojis:
- Fácil de filtrar visualmente no Console
- Identifica fase da execução rapidamente
- Facilita debugging em produção (se deixar logs temporariamente)

---

## Resumo Rápido

| Problema | ❌ Errado | ✅ Certo |
|----------|----------|----------|
| Dialog com botão | `<DialogTrigger asChild>` + `open` | `Button` com `onClick` |
| Input numérico | `type="text"` + regex | `type="number"` + `step` |
| Export | Button sem handler | Button + `onClick` + `handleExportar` |
| Navigation | Link direto | Button + `onClick` + `router.back()` |
| Debug | Sem logs | Logs com 🔵✅❌⏳ |

---

## Referências

- [Shadcn UI Dialog](https://ui.shadcn.com/docs/components/dialog)
- [React useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [MDN Input type=number](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number)
- [Blob API](https://developer.mozilla.org/en-US/docs/Web/API/Blob)

---

**Data**: 20 de Outubro de 2025  
**Versão**: 1.0  
**Status**: Production Ready
