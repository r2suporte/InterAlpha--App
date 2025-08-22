# Padrões de Codificação

## TypeScript

### Tipagem
- Utilizar tipagem estática em todos os componentes, funções e variáveis
- Criar interfaces para props de componentes e objetos complexos
- Utilizar tipos genéricos quando apropriado
- Evitar o uso de `any` - preferir tipos específicos ou `unknown`

### Interfaces vs Types
- Utilizar `interface` para definir a forma de objetos
- Utilizar `type` para aliases de tipos primitivos, unions e tuples

```typescript
// ✅ Bom
interface User {
  id: number;
  name: string;
  email: string;
}

type Status = 'active' | 'inactive' | 'pending';
```

## React

### Componentes
- Nomear componentes usando PascalCase
- Utilizar componentes funcionais com hooks
- Extrair componentes pequenos e reutilizáveis
- Utilizar React.memo para componentes que renderizam frequentemente

### Hooks
- Seguir a ordem das regras dos hooks
- Criar hooks customizados para lógica reutilizável
- Utilizar useCallback para funções passadas como props

### Props
- Definir interfaces para props de componentes
- Utilizar destructuring para acessar props
- Definir valores padrão para props opcionais

```typescript
// ✅ Bom
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  onClick 
}) => {
  // ...
}
```

## Estrutura de Componentes

### Organização
- Um componente por arquivo (exceto componentes muito pequenos e relacionados)
- Nome do arquivo igual ao nome do componente
- Componentes relacionados podem ser agrupados em pastas

### Estilos
- Utilizar Tailwind CSS para estilização
- Evitar estilos inline complexos
- Criar componentes utilitários para padrões de estilo repetidos

## Funções e Variáveis

### Nomenclatura
- Utilizar camelCase para variáveis e funções
- Utilizar nomes descritivos e significativos
- Funções devem ter nomes que descrevem o que fazem

### Funções
- Manter funções pequenas e com responsabilidade única
- Utilizar funções puras quando possível
- Evitar funções muito longas - considerar refatoração

## Comentários e Documentação

### Código
- Escrever código autoexplicativo quando possível
- Adicionar comentários para lógica complexa
- Utilizar JSDoc para funções e componentes exportados

### Commits
- Escrever mensagens de commit claras e concisas
- Utilizar o padrão: "Tipo: Descrição" (ex: "feat: add user login component")

## Importações

### Ordem
1. Módulos externos (react, next, bibliotecas de terceiros)
2. Módulos internos (@/*)
3. Módulos locais (./, ../)

### Alias
- Utilizar aliases (@/) para imports de src/
- Evitar imports relativos longos - considerar reestruturação

```typescript
// ✅ Bom
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
```

## Erros e Tratamento de Exceções

### Tratamento
- Tratar erros de forma apropriada em chamadas assíncronas
- Utilizar try/catch para operações que podem falhar
- Mostrar mensagens amigáveis ao usuário em caso de erro

### Logging
- Utilizar console.error para erros
- Adicionar contexto útil nas mensagens de erro
- Considerar integração com ferramentas de logging em produção

## Performance

### Otimizações
- Utilizar React.memo para componentes que renderizam frequentemente
- Utilizar useMemo e useCallback para valores e funções memorizados
- Dividir componentes grandes em partes menores
- Utilizar lazy loading para rotas e componentes pesados

## Testes

### Cobertura
- Escrever testes unitários para funções utilitárias
- Escrever testes para componentes complexos
- Utilizar React Testing Library para testes de componentes
- Utilizar Jest para testes unitários e de integração