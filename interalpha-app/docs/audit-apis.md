# APIs do Sistema de Auditoria

Este documento descreve todas as APIs criadas para o sistema de auditoria do InterAlpha.

## Estrutura das APIs

### 1. Logs de Auditoria
- **GET/POST** `/api/audit/logs` - Obter/criar logs de auditoria
- **GET** `/api/audit/access-logs` - Obter logs de acesso
- **GET** `/api/audit/security-events` - Obter eventos de segurança

### 2. Eventos de Segurança
- **GET/POST** `/api/audit/security-events` - Listar/criar eventos de segurança
- **POST** `/api/audit/security-events/[eventId]/resolve` - Resolver evento de segurança

### 3. Relatórios
- **GET/POST** `/api/audit/reports` - Listar/gerar relatórios de auditoria
- **GET/DELETE** `/api/audit/reports/[reportId]` - Obter/deletar relatório específico

### 4. Compliance
- **GET/POST** `/api/audit/compliance` - Listar/gerar relatórios de compliance

### 5. Regras de Alerta
- **GET/POST** `/api/audit/alert-rules` - Listar/criar regras de alerta
- **GET/PUT/DELETE** `/api/audit/alert-rules/[ruleId]` - Gerenciar regra específica
- **POST** `/api/audit/alert-rules/[ruleId]/test` - Testar regra de alerta

### 6. Políticas de Retenção
- **GET/POST** `/api/audit/retention-policies` - Listar/criar políticas de retenção
- **GET/PUT/DELETE** `/api/audit/retention-policies/[policyId]` - Gerenciar política específica
- **POST** `/api/audit/retention-policies/[policyId]/execute` - Executar política de retenção

### 7. Estatísticas e Dashboard
- **GET** `/api/audit/stats` - Obter estatísticas de auditoria
- **GET** `/api/audit/dashboard` - Obter dados do dashboard

### 8. Busca e Exportação
- **POST** `/api/audit/search` - Busca avançada em logs
- **GET/POST** `/api/audit/export` - Listar/iniciar exportações
- **GET** `/api/audit/export/[exportId]/download` - Download de exportação

### 9. Configurações
- **GET/PUT** `/api/audit/config` - Obter/atualizar configurações do sistema

## Funcionalidades Implementadas

### ✅ Logs de Auditoria
- Criação automática de logs de ações
- Filtragem por usuário, tipo, ação, recurso, resultado
- Paginação e ordenação
- Criação manual de entradas

### ✅ Logs de Acesso
- Registro de logins, logouts, tentativas falhadas
- Detecção de atividades suspeitas
- Análise de padrões de acesso
- Geolocalização e análise temporal

### ✅ Eventos de Segurança
- Diferentes tipos de eventos (brute force, acesso suspeito, etc.)
- Níveis de severidade (low, medium, high, critical)
- Ações automáticas baseadas na severidade
- Sistema de resolução de eventos

### ✅ Relatórios de Auditoria
- Geração de relatórios personalizados
- Múltiplos formatos (JSON, CSV, PDF)
- Resumos estatísticos
- Filtros avançados por período e critérios

### ✅ Compliance
- Relatórios para diferentes padrões (LGPD, SOX, ISO27001, GDPR)
- Análise automática de conformidade
- Identificação de não conformidades
- Recomendações de correção

### ✅ Sistema de Alertas
- Regras configuráveis de alerta
- Condições complexas com operadores
- Ações automáticas (email, SMS, bloqueio)
- Sistema de cooldown para evitar spam

### ✅ Políticas de Retenção
- Configuração de períodos de retenção
- Arquivamento automático
- Exclusão programada de dados antigos
- Simulação (dry run) antes da execução

### ✅ Dashboard e Estatísticas
- Métricas em tempo real
- Gráficos e visualizações
- Top usuários e ações
- Status de compliance

### ✅ Busca Avançada
- Busca textual em todos os tipos de logs
- Filtros combinados
- Ordenação personalizada
- Resultados paginados

### ✅ Exportação de Dados
- Múltiplos formatos de exportação
- Compressão opcional
- Status de progresso
- Download seguro

### ✅ Configurações
- Habilitação/desabilitação de funcionalidades
- Configuração de períodos de retenção
- Configuração de alertas
- Configuração de compliance

## Recursos de Segurança

### 🔒 Autenticação
- Todas as APIs requerem autenticação
- Header `x-user-id` obrigatório
- Validação de permissões por endpoint

### 🔒 Auditoria das Próprias APIs
- Todas as ações são logadas automaticamente
- Rastreamento de quem fez o quê e quando
- Logs de configurações alteradas

### 🔒 Detecção de Ameaças
- Detecção automática de tentativas de brute force
- Análise de padrões de acesso incomuns
- Alertas em tempo real para eventos críticos

### 🔒 Proteção de Dados
- Anonimização opcional de dados antigos
- Controle de acesso baseado em roles
- Logs imutáveis com integridade verificável

## Próximos Passos

### 🚧 Implementações Pendentes
- Conexão com banco de dados real
- Implementação dos métodos de persistência
- Sistema de notificações (email/SMS)
- Interface web para administração
- Integração com sistemas externos
- Backup e recuperação de dados

### 🚧 Melhorias Futuras
- Machine learning para detecção de anomalias
- Análise comportamental de usuários
- Integração com SIEM externos
- API webhooks para eventos
- Relatórios automatizados por email
- Dashboard em tempo real com WebSockets

## Estrutura de Arquivos

```
interalpha-app/src/app/api/audit/
├── logs/route.ts                           # Logs de auditoria
├── access-logs/route.ts                    # Logs de acesso
├── security-events/
│   ├── route.ts                           # Eventos de segurança
│   └── [eventId]/resolve/route.ts         # Resolver eventos
├── reports/
│   ├── route.ts                           # Relatórios
│   └── [reportId]/route.ts                # Relatório específico
├── compliance/route.ts                     # Compliance
├── alert-rules/
│   ├── route.ts                           # Regras de alerta
│   └── [ruleId]/
│       ├── route.ts                       # Regra específica
│       └── test/route.ts                  # Testar regra
├── retention-policies/
│   ├── route.ts                           # Políticas de retenção
│   └── [policyId]/
│       ├── route.ts                       # Política específica
│       └── execute/route.ts               # Executar política
├── stats/route.ts                          # Estatísticas
├── dashboard/route.ts                      # Dashboard
├── search/route.ts                         # Busca avançada
├── export/
│   ├── route.ts                           # Exportação
│   └── [exportId]/download/route.ts       # Download
└── config/route.ts                         # Configurações
```

## Tipos e Interfaces

Todos os tipos estão definidos em `src/types/audit.ts`:
- `AuditEntry` - Entrada de log de auditoria
- `AccessLogEntry` - Entrada de log de acesso
- `SecurityEventEntry` - Evento de segurança
- `AuditReport` - Relatório de auditoria
- `ComplianceReport` - Relatório de compliance
- `AlertRule` - Regra de alerta
- `DataRetentionPolicy` - Política de retenção

## Serviços

O serviço principal está em `src/services/audit/audit-service.ts` e inclui:
- Métodos para todos os tipos de logs
- Geração de relatórios
- Análise de compliance
- Detecção de ameaças
- Exportação de dados
- Configurações do sistema