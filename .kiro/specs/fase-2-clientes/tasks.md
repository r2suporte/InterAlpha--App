# Plano de Implementação - Fase 2: Gestão de Clientes

- [ ] 1. Configurar banco de dados e modelos
  - [ ] 1.1 Criar schema do Cliente no Prisma
    - Adicionar model Cliente com todos os campos necessários
    - Definir relacionamentos com User e OrdemServico
    - Criar enum TipoDocumento (CPF/CNPJ)
    - _Requisitos: 1.3, 5.5_

  - [ ] 1.2 Executar migração do banco
    - Executar prisma db push para aplicar mudanças
    - Verificar se tabelas foram criadas corretamente
    - Testar conexão com banco de dados
    - _Requisitos: 1.3_

- [ ] 2. Criar APIs de validação brasileira
  - [x] 2.1 Implementar API de validação CPF/CNPJ
    - Criar endpoint /api/validate/cpf-cnpj
    - Implementar validação matemática de CPF
    - Implementar validação matemática de CNPJ
    - Retornar tipo de documento detectado
    - _Requisitos: 5.1, 5.2, 5.3, 5.5_

  - [-] 2.2 Implementar API de busca de CEP
    - Criar endpoint /api/validate/cep
    - Integrar com API dos Correios (ViaCEP)
    - Implementar fallback para falhas de rede
    - Retornar endereço formatado
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_

- [ ] 3. Criar APIs CRUD de clientes
  - [ ] 3.1 Implementar API GET /api/clientes
    - Listar clientes com paginação
    - Implementar busca por nome, email ou documento
    - Implementar ordenação por diferentes campos
    - Filtrar apenas clientes do usuário logado
    - _Requisitos: 2.1, 2.2, 2.5_

  - [ ] 3.2 Implementar API POST /api/clientes
    - Validar dados de entrada com Zod
    - Verificar duplicação de documento
    - Salvar cliente no banco de dados
    - Retornar cliente criado com ID
    - _Requisitos: 1.2, 1.3, 1.5_

  - [ ] 3.3 Implementar API PUT /api/clientes/[id]
    - Validar dados de entrada
    - Verificar se cliente pertence ao usuário
    - Atualizar dados no banco
    - Retornar cliente atualizado
    - _Requisitos: 3.2, 3.3, 3.4_

  - [ ] 3.4 Implementar API DELETE /api/clientes/[id]
    - Verificar se cliente pertence ao usuário
    - Verificar se cliente tem ordens de serviço
    - Excluir cliente do banco se possível
    - Retornar status da operação
    - _Requisitos: 4.2, 4.4_

- [ ] 4. Criar componentes de formulário
  - [ ] 4.1 Criar componente ClienteForm
    - Implementar formulário com React Hook Form
    - Adicionar validação com Zod
    - Implementar validação de CPF/CNPJ em tempo real
    - Implementar busca automática de CEP
    - _Requisitos: 1.2, 1.5, 5.1, 5.2, 6.1, 6.2_

  - [ ] 4.2 Criar componentes de input especializados
    - DocumentoInput com formatação e validação
    - CepInput com busca automática
    - TelefoneInput com formatação brasileira
    - EmailInput com validação
    - _Requisitos: 5.1, 5.2, 6.1, 6.2_

  - [ ] 4.3 Implementar estados de loading e erro
    - Loading states durante validações
    - Mensagens de erro específicas por campo
    - Indicadores visuais de validação (verde/vermelho)
    - Feedback de sucesso após salvamento
    - _Requisitos: 1.4, 1.5, 3.3, 3.4, 5.2, 5.3_

- [ ] 5. Criar páginas de gestão de clientes
  - [ ] 5.1 Implementar página de listagem (/clientes)
    - Criar layout com header e botão "Novo Cliente"
    - Implementar tabela responsiva de clientes
    - Adicionar paginação com navegação
    - Implementar busca em tempo real
    - _Requisitos: 2.1, 2.2, 2.3, 2.5_

  - [ ] 5.2 Implementar página de novo cliente (/clientes/novo)
    - Criar layout com formulário de cadastro
    - Implementar navegação de volta para lista
    - Adicionar validações e feedback visual
    - Implementar redirecionamento após sucesso
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_

  - [ ] 5.3 Implementar página de detalhes (/clientes/[id])
    - Exibir todas as informações do cliente
    - Mostrar histórico de ordens de serviço
    - Adicionar botões de ação (editar, excluir)
    - Implementar estado vazio para histórico
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 5.4 Implementar página de edição (/clientes/[id]/editar)
    - Carregar dados existentes no formulário
    - Implementar validações e atualizações
    - Adicionar confirmação de cancelamento
    - Redirecionar após sucesso
    - _Requisitos: 3.1, 3.2, 3.3, 3.5_

- [ ] 6. Implementar componentes de interface
  - [ ] 6.1 Criar componente ClienteCard
    - Layout com avatar, nome e informações
    - Menu de ações (ver, editar, excluir)
    - Estados hover e loading
    - Responsividade para mobile
    - _Requisitos: 2.2, 4.1_

  - [ ] 6.2 Criar componente SearchBar
    - Input de busca com debounce
    - Ícones e placeholder apropriados
    - Clear button funcional
    - Integração com estado da página
    - _Requisitos: 2.5_

  - [ ] 6.3 Criar componente ConfirmDialog
    - Modal de confirmação para exclusões
    - Botões de confirmar e cancelar
    - Texto explicativo sobre a ação
    - Integração com ações de cliente
    - _Requisitos: 4.1, 4.5_

- [ ] 7. Implementar funcionalidades avançadas
  - [ ] 7.1 Adicionar paginação inteligente
    - Navegação por páginas
    - Indicador de página atual
    - Controle de itens por página
    - URL state para bookmarking
    - _Requisitos: 2.4_

  - [ ] 7.2 Implementar busca e filtros
    - Busca por nome, email ou documento
    - Filtros por tipo de documento
    - Ordenação por diferentes campos
    - Persistência de filtros na URL
    - _Requisitos: 2.5_

  - [ ] 7.3 Adicionar estados vazios e loading
    - Estado vazio quando não há clientes
    - Loading skeletons durante carregamento
    - Estados de erro com retry
    - Mensagens motivacionais para primeiros passos
    - _Requisitos: 2.3_

- [ ] 8. Testes e validação
  - [ ] 8.1 Testar validações brasileiras
    - Testar CPFs válidos e inválidos
    - Testar CNPJs válidos e inválidos
    - Testar busca de CEP com diferentes códigos
    - Verificar formatação automática de campos
    - _Requisitos: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

  - [ ] 8.2 Testar fluxos CRUD completos
    - Criar cliente com dados válidos
    - Editar cliente existente
    - Excluir cliente sem dependências
    - Tentar excluir cliente com O.S. (deve falhar)
    - _Requisitos: 1.1, 1.2, 1.3, 3.1, 3.2, 4.1, 4.2, 4.4_

  - [ ] 8.3 Testar responsividade e UX
    - Testar em dispositivos móveis
    - Verificar acessibilidade básica
    - Testar navegação por teclado
    - Validar tempos de resposta
    - _Requisitos: 2.1, 2.2, 7.1, 7.2_

- [ ] 9. Polimento e otimização
  - [ ] 9.1 Otimizar performance
    - Implementar debounce na busca
    - Adicionar loading states apropriados
    - Otimizar queries do banco de dados
    - Implementar cache quando necessário
    - _Requisitos: 2.5_

  - [ ] 9.2 Melhorar experiência do usuário
    - Adicionar tooltips explicativos
    - Implementar atalhos de teclado
    - Melhorar mensagens de feedback
    - Adicionar animações sutis
    - _Requisitos: 1.4, 3.3, 4.3_

  - [ ] 9.3 Documentar funcionalidades
    - Criar documentação de uso
    - Adicionar comentários no código
    - Documentar APIs criadas
    - Criar guia de troubleshooting
    - _Requisitos: Todos_