# Portal de Acesso com Sistema de Roles - Requisitos

## Introdução

Sistema completo de portal de acesso para clientes e funcionários com controle granular de permissões, chaves temporárias para clientes e hierarquia de roles para funcionários com capacidade de gerenciar usuários e permissões.

## Requisitos

### Requisito 1: Portal de Acesso para Clientes

**User Story:** Como cliente, quero receber uma chave de acesso temporária para acessar meu portal personalizado, para que eu possa visualizar meus dados sem precisar criar uma conta permanente.

#### Acceptance Criteria

1. WHEN um cliente solicita acesso THEN o sistema SHALL gerar uma chave única com validade de 24 horas
2. WHEN a chave é gerada THEN o sistema SHALL enviar por email/SMS com link de acesso direto
3. WHEN o cliente acessa com a chave THEN o sistema SHALL validar a expiração e autenticar automaticamente
4. WHEN a chave expira THEN o sistema SHALL bloquear o acesso e solicitar nova chave
5. WHEN o cliente está logado THEN o sistema SHALL mostrar apenas seus dados (ordens de serviço, pagamentos, histórico)

### Requisito 2: Sistema de Cadastro de Funcionários

**User Story:** Como administrador, quero cadastrar funcionários com funções específicas e regras de acesso, para que cada pessoa tenha acesso apenas às funcionalidades necessárias para seu trabalho.

#### Acceptance Criteria

1. WHEN cadastro um funcionário THEN o sistema SHALL permitir selecionar uma das 5 funções: Atendente, Técnico, Supervisor Técnico, Gerente ADM, Gerente Financeiro
2. WHEN seleciono uma função THEN o sistema SHALL aplicar automaticamente as permissões padrão da função
3. WHEN o funcionário é criado THEN o sistema SHALL enviar credenciais de acesso por email
4. WHEN um funcionário tenta acessar uma funcionalidade THEN o sistema SHALL verificar suas permissões antes de permitir
5. WHEN um funcionário é desativado THEN o sistema SHALL bloquear imediatamente todos os acessos

### Requisito 3: Hierarquia de Funções e Permissões

**User Story:** Como sistema, quero implementar uma hierarquia clara de funções com permissões específicas, para que cada nível tenha acesso apropriado às funcionalidades.

#### Acceptance Criteria

1. **ATENDENTE:**
   - WHEN acessa o sistema THEN SHALL ver apenas: clientes, ordens de serviço (visualizar/criar), chat de suporte
   - WHEN tenta acessar relatórios financeiros THEN SHALL ser bloqueado
   - WHEN cria ordem de serviço THEN SHALL poder atribuir apenas a técnicos disponíveis

2. **TÉCNICO:**
   - WHEN acessa o sistema THEN SHALL ver: ordens de serviço atribuídas, histórico de serviços, relatórios técnicos
   - WHEN finaliza serviço THEN SHALL poder atualizar status e adicionar relatório técnico
   - WHEN tenta acessar dados financeiros THEN SHALL ser bloqueado

3. **SUPERVISOR TÉCNICO:**
   - WHEN acessa o sistema THEN SHALL ter todas as permissões de Técnico PLUS gerenciar equipe técnica
   - WHEN visualiza ordens THEN SHALL ver todas as ordens da equipe técnica
   - WHEN necessário THEN SHALL poder reatribuir ordens entre técnicos
   - WHEN acessa relatórios THEN SHALL ver relatórios de performance da equipe

4. **GERENTE ADM:**
   - WHEN acessa o sistema THEN SHALL ter acesso total exceto área financeira
   - WHEN gerencia usuários THEN SHALL poder criar/editar/desativar funcionários (exceto Gerente Financeiro)
   - WHEN configura sistema THEN SHALL poder alterar configurações gerais e integrações
   - WHEN acessa relatórios THEN SHALL ver todos os relatórios operacionais

5. **GERENTE FINANCEIRO:**
   - WHEN acessa o sistema THEN SHALL ter acesso total à área financeira PLUS visualização geral
   - WHEN gerencia pagamentos THEN SHALL poder aprovar/rejeitar pagamentos
   - WHEN acessa relatórios THEN SHALL ver todos os relatórios financeiros e operacionais
   - WHEN necessário THEN SHALL poder criar usuários financeiros

### Requisito 4: Sistema de Gerenciamento de Usuários e Permissões

**User Story:** Como gerente, quero poder criar novos usuários, definir funções e personalizar regras de acesso, para que eu possa adaptar o sistema às necessidades da empresa.

#### Acceptance Criteria

1. WHEN sou Gerente ADM ou Financeiro THEN o sistema SHALL permitir acessar módulo de gerenciamento de usuários
2. WHEN crio novo usuário THEN o sistema SHALL permitir:
   - Definir informações pessoais (nome, email, telefone)
   - Selecionar função base
   - Personalizar permissões específicas
   - Definir data de expiração do acesso (opcional)
   - Configurar notificações
3. WHEN edito usuário existente THEN o sistema SHALL permitir alterar função e permissões (respeitando hierarquia)
4. WHEN desativo usuário THEN o sistema SHALL:
   - Bloquear acesso imediatamente
   - Manter histórico de ações
   - Transferir responsabilidades ativas para outro usuário
5. WHEN configuro permissões customizadas THEN o sistema SHALL permitir:
   - Habilitar/desabilitar módulos específicos
   - Definir permissões de leitura/escrita por seção
   - Configurar limites de ação (ex: valor máximo de aprovação)

### Requisito 5: Controle de Acesso e Auditoria

**User Story:** Como administrador, quero monitorar todos os acessos e ações no sistema, para que eu possa garantir segurança e compliance.

#### Acceptance Criteria

1. WHEN qualquer usuário faz login THEN o sistema SHALL registrar: IP, horário, dispositivo, localização
2. WHEN usuário executa ação crítica THEN o sistema SHALL registrar: ação, dados alterados, justificativa (se aplicável)
3. WHEN acesso é negado THEN o sistema SHALL registrar tentativa e motivo
4. WHEN gerente acessa auditoria THEN o sistema SHALL mostrar:
   - Log de acessos por usuário/período
   - Relatório de ações por módulo
   - Alertas de segurança
   - Tentativas de acesso negado
5. WHEN detecta atividade suspeita THEN o sistema SHALL:
   - Bloquear usuário temporariamente
   - Notificar administradores
   - Registrar incidente para investigação

### Requisito 6: Interface de Portal Personalizada

**User Story:** Como usuário (cliente ou funcionário), quero ter uma interface personalizada baseada no meu perfil, para que eu tenha uma experiência otimizada e intuitiva.

#### Acceptance Criteria

1. WHEN cliente acessa portal THEN o sistema SHALL mostrar:
   - Dashboard com resumo de serviços
   - Histórico de ordens de serviço
   - Status de pagamentos
   - Canal de comunicação direto
   - Documentos e relatórios disponíveis
2. WHEN funcionário acessa portal THEN o sistema SHALL mostrar:
   - Dashboard personalizado por função
   - Menu com apenas funcionalidades permitidas
   - Notificações relevantes ao cargo
   - Atalhos para ações frequentes
3. WHEN usuário navega THEN o sistema SHALL:
   - Ocultar funcionalidades não permitidas
   - Mostrar indicadores de permissão
   - Fornecer feedback claro sobre limitações
4. WHEN usuário tenta ação não permitida THEN o sistema SHALL:
   - Mostrar mensagem explicativa
   - Sugerir alternativas quando possível
   - Registrar tentativa para auditoria

### Requisito 7: Notificações e Comunicação

**User Story:** Como usuário, quero receber notificações relevantes ao meu perfil e poder me comunicar através do portal, para que eu esteja sempre informado e possa resolver questões rapidamente.

#### Acceptance Criteria

1. WHEN há atualização relevante THEN o sistema SHALL notificar usuário via:
   - Notificação in-app
   - Email (configurável)
   - SMS para clientes (chave de acesso)
2. WHEN cliente tem nova ordem de serviço THEN o sistema SHALL notificar sobre status
3. WHEN funcionário recebe nova atribuição THEN o sistema SHALL notificar imediatamente
4. WHEN gerente precisa aprovar algo THEN o sistema SHALL enviar notificação prioritária
5. WHEN usuário acessa portal THEN o sistema SHALL mostrar:
   - Centro de notificações
   - Chat/mensagens internas (funcionários)
   - Canal de suporte (clientes)