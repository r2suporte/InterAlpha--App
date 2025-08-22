# Componentes UI

## Biblioteca de Componentes

O InterAlpha utiliza uma combinação de bibliotecas e componentes personalizados para a interface do usuário:

1. **Componentes Personalizados** - Na pasta `src/components/`
2. **Radix UI** - Para componentes acessíveis e primitivos
3. **Lucide React** - Para ícones
4. **Tailwind CSS** - Para estilização

## Estrutura de Componentes

### Organização
```
src/components/
├── ui/                 # Componentes reutilizáveis genéricos
├── layout/             # Componentes de layout (Header, Sidebar, etc.)
├── dashboard/          # Componentes específicos do dashboard
├── client/             # Componentes para área do cliente
├── employee/           # Componentes para área de funcionários
└── ...                 # Outros componentes específicos por funcionalidade
```

### Componentes UI Genéricos
Os componentes na pasta `ui/` são reutilizáveis em toda a aplicação:

- `button.tsx` - Botões com diferentes variantes
- `card.tsx` - Cards para agrupar conteúdo
- `input.tsx` - Campos de entrada
- `select.tsx` - Seletores
- `textarea.tsx` - Áreas de texto
- `badge.tsx` - Indicadores visuais
- `avatar.tsx` - Avatares de usuários
- `dialog.tsx` - Modais e diálogos
- `alert-dialog.tsx` - Diálogos de confirmação
- `toast.tsx` - Notificações
- `tabs.tsx` - Abas
- `dropdown-menu.tsx` - Menus dropdown

## Criação de Novos Componentes

### Estrutura Básica
```tsx
// src/components/ui/nome-componente.tsx
import * as React from 'react';

interface NomeComponenteProps {
  // Definir props com tipos TypeScript
}

const NomeComponente = React.forwardRef<
  HTMLDivElement, // Tipo do elemento HTML
  NomeComponenteProps
>(({ ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {/* Conteúdo do componente */}
    </div>
  );
});

NomeComponente.displayName = 'NomeComponente';

export { NomeComponente };
```

### Estilização com Tailwind
- Utilizar classes do Tailwind para estilização
- Criar variantes com `class-variance-authority` (cva)
- Evitar estilos inline complexos

### Acessibilidade
- Utilizar componentes primitivos do Radix UI quando disponível
- Implementar corretamente ARIA attributes
- Garantir contraste adequado de cores
- Testar navegação por teclado

## Variantes e Personalização

### Class Variance Authority (cva)
Utilizamos cva para criar componentes com variantes:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

## Composição de Componentes

### Componentes Compostos
Para componentes complexos, utilizar a técnica de componentes compostos:

```tsx
// Card composto
<Card>
  <Card.Header>
    <Card.Title>Titulo</Card.Title>
    <Card.Description>Descrição</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Conteúdo */}
  </Card.Content>
  <Card.Footer>
    {/* Rodapé */}
  </Card.Footer>
</Card>
```

## Ícones

### Lucide React
- Utilizar ícones do Lucide React
- Importar apenas os ícones necessários
- Ajustar tamanho com classes Tailwind

```tsx
import { Users, Wrench, CreditCard } from 'lucide-react';

<Users className="h-4 w-4" />
```

## Formulários

### React Hook Form + Zod
- Utilizar React Hook Form para gerenciamento de formulários
- Validar dados com Zod
- Integrar com componentes UI personalizados

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
});

const FormComponent = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Processar dados do formulário
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enviar</Button>
      </form>
    </Form>
  );
};
```

## Notificações

### Sonner
- Utilizar Sonner para notificações toast
- Configurar em `AppProviders`
- Utilizar para feedback de ações do usuário

```tsx
import { toast } from 'sonner';

toast.success('Operação realizada com sucesso!');
toast.error('Ocorreu um erro. Tente novamente.');
```

## Tabelas

### Componentes Personalizados
- Criar componentes de tabela reutilizáveis
- Utilizar para exibir listas de dados
- Implementar paginação, ordenação e filtros

## Boas Práticas

### 1. Reutilização
- Criar componentes genéricos para padrões repetidos
- Evitar duplicação de código
- Documentar props de componentes complexos

### 2. Tipagem
- Definir interfaces para todas as props
- Utilizar tipos genéricos quando apropriado
- Validar props com PropTypes em desenvolvimento

### 3. Acessibilidade
- Sempre implementar rótulos adequados
- Garantir navegação por teclado
- Utilizar roles ARIA quando necessário

### 4. Performance
- Utilizar React.memo para componentes que renderizam frequentemente
- Memoizar valores e funções com useMemo e useCallback
- Dividir componentes grandes em partes menores

### 5. Estilização
- Utilizar Tailwind CSS para todos os estilos
- Criar utilitários para padrões de estilo repetidos
- Evitar estilos inline complexos

### 6. Testes
- Criar stories para componentes com Storybook
- Escrever testes unitários para componentes complexos
- Testar diferentes estados e variantes