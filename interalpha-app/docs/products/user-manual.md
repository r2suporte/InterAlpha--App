# 👤 Manual do Usuário - Sistema de Gestão de Produtos

## 📋 Introdução

Bem-vindo ao Sistema de Gestão de Produtos da InterAlpha! Este manual irá guiá-lo através de todas as funcionalidades disponíveis para gerenciar produtos, estoque e integrações com ordens de serviço.

## 🚀 Primeiros Passos

### **Acessando o Sistema**

1. **Acesse** o sistema através do link: `https://app.interalpha.com`
2. **Faça login** com suas credenciais
3. **Navegue** até o módulo "Produtos" no menu principal

### **Interface Principal**

A interface do sistema é dividida em seções principais:

- **📦 Produtos**: Gerenciamento de produtos
- **📂 Categorias**: Organização por categorias
- **📊 Estoque**: Controle de estoque
- **📈 Dashboard**: Métricas e relatórios
- **🛒 Ordens**: Integração com ordens de serviço

---

## 📦 **GERENCIAMENTO DE PRODUTOS**

### **Visualizar Lista de Produtos**

1. **Acesse** "Produtos" no menu principal
2. **Visualize** a lista de produtos com informações básicas:
   - Part Number (código do produto)
   - Descrição
   - Preço de venda
   - Quantidade em estoque
   - Status (ativo/inativo)

### **Buscar Produtos**

1. **Use a barra de busca** no topo da lista
2. **Digite** o part number ou descrição do produto
3. **Os resultados** são filtrados automaticamente
4. **Use filtros avançados**:
   - Por categoria
   - Por faixa de preço
   - Por status de estoque

### **Criar Novo Produto**

1. **Clique** no botão "➕ Novo Produto"
2. **Preencha** os campos obrigatórios:
   - **Part Number**: Código único do produto
   - **Descrição**: Nome/descrição do produto
   - **Preço de Custo**: Valor de compra
   - **Preço de Venda**: Valor de venda
3. **Preencha** os campos opcionais:
   - **Categoria**: Selecione uma categoria
   - **Quantidade**: Estoque inicial
   - **Estoque Mínimo**: Alerta de estoque baixo
   - **Estoque Máximo**: Limite máximo recomendado
   - **Unidade**: Unidade de medida (UN, KG, M, etc.)
4. **Adicione uma imagem** (opcional):
   - Clique em "📷 Adicionar Imagem"
   - Selecione um arquivo JPG, PNG ou WebP
   - A imagem será redimensionada automaticamente
5. **Clique** em "💾 Salvar Produto"

> **💡 Dica**: O sistema calcula automaticamente a margem de lucro baseada nos preços de custo e venda.

### **Editar Produto Existente**

1. **Encontre** o produto na lista
2. **Clique** no produto ou no ícone "✏️ Editar"
3. **Modifique** os campos desejados
4. **Clique** em "💾 Salvar Alterações"

> **⚠️ Atenção**: O Part Number não pode ser alterado após a criação.

### **Visualizar Detalhes do Produto**

1. **Clique** em um produto na lista
2. **Visualize** informações detalhadas:
   - Dados básicos do produto
   - Histórico de movimentações de estoque
   - Uso em ordens de serviço
   - Estatísticas de vendas
   - Produtos relacionados

### **Excluir Produto**

1. **Acesse** os detalhes do produto
2. **Clique** em "🗑️ Excluir Produto"
3. **Confirme** a exclusão

> **⚠️ Atenção**: Produtos que foram usados em ordens de serviço não podem ser excluídos, apenas desativados.

---

## 📂 **CATEGORIAS**

### **Visualizar Categorias**

1. **Acesse** "Categorias" no menu
2. **Visualize** todas as categorias com:
   - Nome da categoria
   - Quantidade de produtos
   - Cor identificadora
   - Status (ativa/inativa)

### **Criar Nova Categoria**

1. **Clique** em "➕ Nova Categoria"
2. **Preencha**:
   - **Nome**: Nome da categoria
   - **Descrição**: Descrição opcional
   - **Cor**: Cor para identificação visual
   - **Ícone**: Emoji ou ícone (opcional)
3. **Clique** em "💾 Salvar Categoria"

### **Organizar Produtos por Categoria**

1. **Ao criar/editar** um produto
2. **Selecione** a categoria no campo "Categoria"
3. **O produto** será automaticamente organizado

### **Filtrar por Categoria**

1. **Na lista de produtos**
2. **Use o filtro** "Categoria"
3. **Selecione** a categoria desejada
4. **A lista** será filtrada automaticamente

---

## 📊 **CONTROLE DE ESTOQUE**

### **Visualizar Estoque Atual**

1. **Na lista de produtos**, a coluna "Estoque" mostra:
   - Quantidade atual
   - Status visual (🟢 Normal, 🟡 Baixo, 🔴 Zerado)
2. **Nos detalhes do produto**, veja:
   - Quantidade atual
   - Estoque mínimo
   - Estoque máximo
   - Unidade de medida

### **Registrar Entrada de Estoque**

1. **Acesse** os detalhes do produto
2. **Clique** em "📦 Movimentar Estoque"
3. **Selecione** "Entrada" no tipo
4. **Preencha**:
   - **Quantidade**: Quantidade a adicionar
   - **Motivo**: Razão da entrada (ex: "Compra", "Devolução")
   - **Referência**: Número da nota fiscal (opcional)
5. **Clique** em "✅ Confirmar Entrada"

### **Registrar Saída de Estoque**

1. **Siga** os mesmos passos da entrada
2. **Selecione** "Saída" no tipo
3. **Preencha** os motivos (ex: "Venda", "Perda", "Uso interno")

### **Ajustar Estoque**

1. **Use** quando precisar corrigir o estoque
2. **Selecione** "Ajuste" no tipo
3. **Informe** a quantidade correta final
4. **O sistema** calculará a diferença automaticamente

### **Visualizar Histórico de Movimentações**

1. **Nos detalhes do produto**
2. **Acesse** a aba "📋 Histórico"
3. **Visualize**:
   - Data e hora da movimentação
   - Tipo (entrada/saída/ajuste)
   - Quantidade
   - Motivo
   - Usuário responsável

### **Alertas de Estoque Baixo**

- **Produtos com estoque baixo** aparecem com ícone 🟡
- **Produtos sem estoque** aparecem com ícone 🔴
- **Notificações automáticas** são enviadas por email
- **No dashboard**, veja resumo de alertas

---

## 🛒 **INTEGRAÇÃO COM ORDENS DE SERVIÇO**

### **Adicionar Produtos a uma Ordem**

1. **Ao criar/editar** uma ordem de serviço
2. **Na seção "Produtos"**:
   - Use a barra de busca para encontrar produtos
   - Clique no produto desejado para adicionar
   - Ajuste a quantidade se necessário
   - Modifique o preço unitário se permitido

### **Buscar Produtos na Ordem**

1. **Digite** na barra de busca:
   - Part number do produto
   - Parte da descrição
2. **Selecione** o produto nos resultados
3. **O produto** é adicionado automaticamente

### **Gerenciar Itens da Ordem**

- **Alterar quantidade**: Use os botões ➕ ➖ ou digite diretamente
- **Alterar preço**: Modifique o campo "Preço Unitário"
- **Remover item**: Clique no ícone 🗑️
- **Ver totais**: Valores são calculados automaticamente

### **Baixa Automática de Estoque**

- **Quando a ordem é finalizada**, o estoque é baixado automaticamente
- **A movimentação** é registrada no histórico
- **Referência** da ordem aparece no histórico do produto

---

## 📈 **DASHBOARD E RELATÓRIOS**

### **Acessar Dashboard**

1. **Acesse** "Dashboard" no menu
2. **Visualize** métricas em tempo real:
   - Total de produtos ativos
   - Valor total do estoque
   - Produtos com estoque baixo
   - Margem média dos produtos

### **Produtos Mais Vendidos**

- **Visualize** ranking dos produtos mais vendidos
- **Período** configurável (7, 30, 90 dias)
- **Métricas**: Quantidade vendida e receita gerada

### **Produtos com Maior Margem**

- **Ranking** por percentual de margem
- **Identifique** produtos mais lucrativos
- **Otimize** estratégias de venda

### **Alertas de Estoque**

- **Lista** de produtos com estoque crítico
- **Ação rápida** para movimentar estoque
- **Priorização** por criticidade

### **Gráficos de Performance**

- **Evolução** de vendas por período
- **Distribuição** por categoria
- **Tendências** de estoque

---

## 📁 **IMPORTAÇÃO E EXPORTAÇÃO**

### **Exportar Produtos**

1. **Na lista de produtos**, clique em "📤 Exportar"
2. **Escolha o formato**:
   - CSV (para Excel/Planilhas)
   - Excel (XLSX)
3. **Configure opções**:
   - ✅ Incluir dados de estoque
   - ✅ Incluir categorias
   - ✅ Apenas produtos ativos
4. **Clique** em "⬇️ Baixar Arquivo"

### **Importar Produtos**

1. **Clique** em "📥 Importar Produtos"
2. **Baixe o template** se for a primeira vez
3. **Preencha** o arquivo com os dados:
   - Part Number (obrigatório)
   - Descrição (obrigatório)
   - Preço de Custo (obrigatório)
   - Preço de Venda (obrigatório)
   - Categoria (opcional)
   - Quantidade (opcional)
4. **Faça upload** do arquivo
5. **Revise** o preview dos dados
6. **Configure opções**:
   - ✅ Atualizar produtos existentes
   - ✅ Criar categorias automaticamente
7. **Clique** em "📥 Importar"

### **Validação de Importação**

- **Erros** são mostrados antes da importação
- **Preview** dos primeiros registros
- **Relatório detalhado** após importação:
  - Produtos criados com sucesso
  - Produtos atualizados
  - Erros encontrados com detalhes

---

## 🔍 **BUSCA AVANÇADA**

### **Busca por Texto**

- **Digite** qualquer parte do part number ou descrição
- **Resultados** aparecem em tempo real
- **Busca inteligente** com tolerância a erros

### **Filtros Disponíveis**

1. **Categoria**: Filtre por uma ou múltiplas categorias
2. **Faixa de Preço**: Defina preço mínimo e máximo
3. **Status de Estoque**:
   - Todos os produtos
   - Apenas com estoque
   - Apenas estoque baixo
   - Apenas sem estoque
4. **Status do Produto**:
   - Ativos
   - Inativos
   - Todos

### **Ordenação**

- **Part Number** (A-Z ou Z-A)
- **Descrição** (A-Z ou Z-A)
- **Preço** (menor para maior ou maior para menor)
- **Estoque** (menor para maior ou maior para menor)
- **Data de Criação** (mais recente ou mais antigo)

---

## ⚙️ **CONFIGURAÇÕES**

### **Preferências de Notificação**

1. **Acesse** "Configurações" → "Notificações"
2. **Configure**:
   - ✅ Alertas de estoque baixo por email
   - ✅ Relatórios semanais
   - ✅ Notificações de produtos usados em ordens

### **Configurações de Estoque**

1. **Defina** alertas padrão:
   - Estoque mínimo padrão
   - Unidade de medida padrão
2. **Configure** regras de baixa automática

---

## 🔧 **DICAS E TRUQUES**

### **Organização Eficiente**

1. **Use categorias** para organizar produtos similares
2. **Defina part numbers** seguindo um padrão consistente
3. **Mantenha descrições** claras e padronizadas
4. **Configure estoques mínimos** realistas

### **Controle de Estoque**

1. **Faça contagens** regulares e ajustes quando necessário
2. **Use referências** nas movimentações para rastreabilidade
3. **Configure alertas** adequados ao seu negócio
4. **Monitore** produtos com alta rotatividade

### **Performance**

1. **Use filtros** para encontrar produtos rapidamente
2. **Favorite** produtos mais usados
3. **Configure** a quantidade de itens por página
4. **Use atalhos** de teclado quando disponíveis

### **Relatórios**

1. **Exporte dados** regularmente para backup
2. **Use gráficos** para identificar tendências
3. **Monitore** produtos com baixa rotatividade
4. **Analise margens** para otimizar preços

---

## ❓ **PERGUNTAS FREQUENTES**

### **Posso alterar o Part Number de um produto?**
Não, o Part Number não pode ser alterado após a criação para manter a integridade dos dados históricos.

### **O que acontece se eu excluir um produto usado em ordens?**
Produtos usados em ordens não podem ser excluídos, apenas desativados.

### **Como funciona a baixa automática de estoque?**
Quando uma ordem de serviço é finalizada, o estoque dos produtos é automaticamente reduzido.

### **Posso importar produtos com categorias que não existem?**
Sim, se a opção "Criar categorias automaticamente" estiver marcada.

### **Como são calculadas as margens?**
Margem = ((Preço de Venda - Preço de Custo) / Preço de Custo) × 100

### **Posso ter produtos com o mesmo nome?**
Sim, mas o Part Number deve ser único.

### **Como funciona o cache do sistema?**
O sistema usa cache inteligente para melhorar a performance, atualizando automaticamente quando há mudanças.

---

## 📞 **SUPORTE**

### **Precisa de Ajuda?**

- **📧 Email**: suporte@interalpha.com
- **📱 WhatsApp**: +55 11 99999-9999
- **🕐 Horário**: Segunda a Sexta, 8h às 18h

### **Reportar Problemas**

1. **Descreva** o problema detalhadamente
2. **Inclua** prints de tela se possível
3. **Informe** o que você estava fazendo quando ocorreu
4. **Mencione** seu navegador e sistema operacional

### **Sugestões de Melhoria**

Sua opinião é importante! Envie sugestões para: melhorias@interalpha.com

---

**Versão do Manual**: 1.0.0  
**Última Atualização**: $(date)  
**Sistema**: InterAlpha Gestão de Produtos v1.0