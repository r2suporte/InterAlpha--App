# Requirements Document

## Introduction

Este documento define os requisitos para implementar um sistema completo de gestão de produtos no InterAlpha. O sistema permitirá cadastrar, editar, visualizar e deletar produtos com informações detalhadas incluindo preços, custos, margem de lucro e imagens. Esta funcionalidade é essencial para empresas de serviços que também comercializam produtos ou precisam controlar materiais utilizados nos serviços.

O sistema deve ser intuitivo, responsivo e integrado com o sistema existente de ordens de serviço, permitindo vincular produtos aos serviços prestados.

## Requirements

### Requirement 1 - Cadastro de Produtos

**User Story:** Como um gestor de estoque, eu quero cadastrar novos produtos com todas as informações necessárias, para que eu possa manter um catálogo organizado e atualizado.

#### Acceptance Criteria

1. WHEN acessar a tela de cadastro THEN o sistema SHALL exibir formulário com campos obrigatórios e opcionais
2. WHEN inserir part number THEN o sistema SHALL validar unicidade e formato alfanumérico
3. WHEN preencher descrição THEN o sistema SHALL aceitar texto de até 500 caracteres
4. WHEN inserir preço de custo THEN o sistema SHALL aceitar valores decimais positivos
5. WHEN inserir preço de venda THEN o sistema SHALL calcular automaticamente a margem de lucro
6. WHEN fazer upload de imagem THEN o sistema SHALL aceitar formatos JPG, PNG e WebP até 5MB
7. WHEN salvar produto THEN o sistema SHALL validar todos os campos obrigatórios incluindo part number único
8. IF part number já existir THEN o sistema SHALL impedir cadastro e mostrar erro específico
9. IF preço de venda for menor que custo THEN o sistema SHALL alertar sobre margem negativa
10. WHEN produto for salvo THEN o sistema SHALL exibir mensagem de sucesso e redirecionar para listagem

### Requirement 2 - Listagem e Visualização de Produtos

**User Story:** Como um usuário do sistema, eu quero visualizar todos os produtos cadastrados de forma organizada, para que eu possa encontrar rapidamente as informações que preciso.

#### Acceptance Criteria

1. WHEN acessar a listagem THEN o sistema SHALL exibir produtos em formato de cards ou tabela
2. WHEN visualizar produto THEN o sistema SHALL mostrar part number, imagem, descrição, preços e margem de lucro
3. WHEN buscar produto THEN o sistema SHALL filtrar por part number ou descrição em tempo real
4. WHEN ordenar lista THEN o sistema SHALL permitir ordenação por part number, nome, preço ou margem
5. WHEN clicar em produto THEN o sistema SHALL abrir modal ou página com detalhes completos incluindo part number
6. WHEN lista estiver vazia THEN o sistema SHALL exibir mensagem orientativa para cadastrar
7. IF imagem não carregar THEN o sistema SHALL mostrar placeholder padrão
8. WHEN paginar resultados THEN o sistema SHALL mostrar 20 produtos por página
9. WHEN exportar lista THEN o sistema SHALL incluir part number como primeira coluna

### Requirement 3 - Edição de Produtos

**User Story:** Como um gestor de estoque, eu quero editar informações de produtos existentes, para que eu possa manter os dados sempre atualizados e corretos.

#### Acceptance Criteria

1. WHEN clicar em editar THEN o sistema SHALL abrir formulário preenchido com dados atuais
2. WHEN alterar preços THEN o sistema SHALL recalcular margem de lucro automaticamente
3. WHEN trocar imagem THEN o sistema SHALL permitir upload de nova imagem
4. WHEN salvar alterações THEN o sistema SHALL validar dados e atualizar registro
5. WHEN cancelar edição THEN o sistema SHALL descartar mudanças e voltar à visualização
6. WHEN houver erro de validação THEN o sistema SHALL destacar campos com problema
7. IF outro usuário editou simultaneamente THEN o sistema SHALL alertar sobre conflito
8. WHEN edição for concluída THEN o sistema SHALL mostrar confirmação e dados atualizados

### Requirement 4 - Exclusão de Produtos

**User Story:** Como um gestor de estoque, eu quero excluir produtos que não são mais comercializados, para que eu possa manter o catálogo limpo e organizado.

#### Acceptance Criteria

1. WHEN clicar em excluir THEN o sistema SHALL exibir modal de confirmação
2. WHEN confirmar exclusão THEN o sistema SHALL verificar se produto está sendo usado
3. WHEN produto estiver vinculado a ordens THEN o sistema SHALL impedir exclusão e mostrar aviso
4. WHEN produto não tiver vínculos THEN o sistema SHALL excluir permanentemente
5. WHEN exclusão for bem-sucedida THEN o sistema SHALL remover da listagem e mostrar confirmação
6. WHEN cancelar exclusão THEN o sistema SHALL fechar modal sem fazer alterações
7. IF houver erro na exclusão THEN o sistema SHALL mostrar mensagem de erro específica
8. WHEN produto for excluído THEN o sistema SHALL registrar ação no log de auditoria

### Requirement 5 - Cálculo Automático de Margem de Lucro

**User Story:** Como um gestor comercial, eu quero que o sistema calcule automaticamente a margem de lucro, para que eu possa avaliar rapidamente a rentabilidade dos produtos.

#### Acceptance Criteria

1. WHEN inserir preço de custo THEN o sistema SHALL aguardar preço de venda para calcular margem
2. WHEN inserir preço de venda THEN o sistema SHALL calcular margem percentual automaticamente
3. WHEN margem for positiva THEN o sistema SHALL exibir em cor verde
4. WHEN margem for negativa THEN o sistema SHALL exibir em cor vermelha com alerta
5. WHEN margem for zero THEN o sistema SHALL exibir em cor amarela
6. WHEN alterar qualquer preço THEN o sistema SHALL recalcular margem em tempo real
7. IF preços forem inválidos THEN o sistema SHALL mostrar "N/A" na margem
8. WHEN exibir na listagem THEN o sistema SHALL mostrar margem formatada com 2 casas decimais

### Requirement 6 - Upload e Gerenciamento de Imagens

**User Story:** Como um usuário do sistema, eu quero fazer upload de imagens dos produtos de forma fácil e visualizá-las adequadamente, para que eu possa identificar produtos visualmente.

#### Acceptance Criteria

1. WHEN fazer upload THEN o sistema SHALL aceitar apenas JPG, PNG e WebP
2. WHEN arquivo for muito grande THEN o sistema SHALL redimensionar automaticamente
3. WHEN imagem for carregada THEN o sistema SHALL mostrar preview antes de salvar
4. WHEN salvar produto THEN o sistema SHALL armazenar imagem em storage otimizado
5. WHEN exibir imagem THEN o sistema SHALL usar lazy loading para performance
6. WHEN remover imagem THEN o sistema SHALL permitir exclusão e usar placeholder
7. IF upload falhar THEN o sistema SHALL mostrar erro específico e manter formulário
8. WHEN produto tiver imagem THEN o sistema SHALL mostrar thumbnail na listagem

### Requirement 7 - Validações e Regras de Negócio

**User Story:** Como um administrador do sistema, eu quero que todas as entradas sejam validadas adequadamente, para que eu possa manter a integridade dos dados.

#### Acceptance Criteria

1. WHEN campo obrigatório estiver vazio THEN o sistema SHALL destacar campo e mostrar mensagem
2. WHEN part number for inválido THEN o sistema SHALL aceitar apenas letras, números e hífens
3. WHEN part number for duplicado THEN o sistema SHALL impedir cadastro e sugerir alternativas
4. WHEN descrição for muito longa THEN o sistema SHALL limitar a 500 caracteres
5. WHEN preço for negativo THEN o sistema SHALL impedir entrada e mostrar erro
6. WHEN preço tiver mais de 2 decimais THEN o sistema SHALL arredondar automaticamente
7. WHEN descrição for duplicada THEN o sistema SHALL alertar sobre possível duplicação
8. WHEN salvar sem imagem THEN o sistema SHALL permitir mas usar placeholder
9. IF dados estiverem inválidos THEN o sistema SHALL impedir salvamento
10. WHEN validação passar THEN o sistema SHALL habilitar botão de salvar

### Requirement 8 - Integração com Sistema Existente

**User Story:** Como um técnico, eu quero vincular produtos às ordens de serviço usando part number, para que eu possa registrar materiais utilizados de forma precisa e gerar cobranças adequadas.

#### Acceptance Criteria

1. WHEN criar ordem de serviço THEN o sistema SHALL permitir buscar produtos por part number ou descrição
2. WHEN adicionar produto à ordem THEN o sistema SHALL mostrar part number, preço e permitir alterar quantidade
3. WHEN escanear código de barras THEN o sistema SHALL buscar produto pelo part number automaticamente
4. WHEN finalizar ordem THEN o sistema SHALL calcular total incluindo produtos com part numbers
5. WHEN produto for usado em ordem THEN o sistema SHALL impedir exclusão e mostrar onde está sendo usado
6. WHEN consultar histórico THEN o sistema SHALL mostrar part numbers dos produtos usados em cada ordem
7. WHEN gerar relatório THEN o sistema SHALL incluir part numbers e produtos utilizados por período
8. IF produto não estiver disponível THEN o sistema SHALL alertar mostrando part number na ordem de serviço
9. WHEN sincronizar estoque THEN o sistema SHALL atualizar disponibilidade por part number em tempo real

### Requirement 9 - Gestão de Part Numbers

**User Story:** Como um gestor de estoque, eu quero que cada produto tenha um part number único, para que eu possa identificar e rastrear produtos de forma inequívoca.

#### Acceptance Criteria

1. WHEN cadastrar produto THEN o sistema SHALL exigir part number único e obrigatório
2. WHEN part number for inserido THEN o sistema SHALL validar formato alfanumérico com hífens
3. WHEN part number já existir THEN o sistema SHALL mostrar erro e sugerir próximo número disponível
4. WHEN buscar produto THEN o sistema SHALL priorizar busca por part number
5. WHEN importar produtos THEN o sistema SHALL validar unicidade de part numbers
6. WHEN gerar código de barras THEN o sistema SHALL usar part number como base
7. WHEN exportar dados THEN o sistema SHALL incluir part number como identificador principal
8. IF part number for alterado THEN o sistema SHALL manter histórico da alteração para auditoria