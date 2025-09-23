# Guia de Migração - Sistema de Roles

Este documento descreve como migrar usuários existentes para o novo sistema de roles hierárquico do InterAlpha.

## 📋 Visão Geral

O novo sistema de roles introduz uma hierarquia clara de permissões:

- **Diretor**: Acesso total ao sistema e visão estratégica
- **Admin**: Acesso total ao sistema
- **Gerente Administrativo**: Gerenciamento de operações e recursos humanos
- **Gerente Financeiro**: Gerenciamento financeiro e relatórios
- **Supervisor Técnico**: Supervisão de técnicos e ordens de serviço
- **Technician**: Execução de serviços técnicos
- **Atendente**: Atendimento ao cliente e operações básicas

## 🔄 Mapeamento de Roles

O script de migração mapeia automaticamente as roles antigas para as novas:

| Role Antiga | Role Nova | Descrição |
|-------------|-----------|-----------|
| `admin` | `admin` | Mantém privilégios administrativos |
| `user` | `user` | Usuários básicos mantêm role |
| `technician` / `tecnico` | `technician` | Normaliza variações de técnico |
| `manager` | `gerente_adm` | Managers viram gerentes administrativos |
| `supervisor` | `supervisor_tecnico` | Supervisors viram supervisores técnicos |
| `diretor` | `diretor` | Mantém role de diretor |
| `gerente_adm` | `gerente_adm` | Mantém role de gerente administrativo |
| `gerente_financeiro` | `gerente_financeiro` | Mantém role de gerente financeiro |
| `supervisor_tecnico` | `supervisor_tecnico` | Mantém role de supervisor técnico |
| `atendente` | `atendente` | Mantém role de atendente |

## 🚀 Como Executar a Migração

### Pré-requisitos

1. **Backup do Banco de Dados**: Sempre faça backup antes da migração
2. **Variáveis de Ambiente**: Configure no `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_service_key
   ```

### Comandos Disponíveis

#### 1. Migrar Usuários Existentes

```bash
node scripts/migrate-existing-users.js migrate
```

Este comando:
- Busca todos os usuários existentes
- Mostra estatísticas das roles atuais
- Executa a migração conforme o mapeamento
- Gera relatório de resultados
- Salva log detalhado da migração

#### 2. Criar Usuários de Teste

```bash
node scripts/migrate-existing-users.js test-users
```

Cria usuários de teste para cada role:
- `admin@interalpha.com` (admin)
- `diretor@interalpha.com` (diretor)
- `gerente.adm@interalpha.com` (gerente_adm)
- `gerente.financeiro@interalpha.com` (gerente_financeiro)
- `supervisor.tecnico@interalpha.com` (supervisor_tecnico)
- `tecnico@interalpha.com` (technician)
- `atendente@interalpha.com` (atendente)

Senha padrão: `{role}123`

#### 3. Reverter Migração (Rollback)

```bash
node scripts/migrate-existing-users.js rollback caminho/para/migration-log.json
```

Reverte a migração usando o arquivo de log gerado.

## 📊 Exemplo de Execução

```bash
$ node scripts/migrate-existing-users.js migrate

🔄 Iniciando migração de usuários existentes...

📋 Buscando usuários existentes...
✅ Encontrados 15 usuários para migrar

📊 Estatísticas de roles atuais:
   admin (2 usuários) → admin
   user (8 usuários) → user
   technician (3 usuários) → technician
   manager (2 usuários) → gerente_adm
   supervisor (1 usuário) → supervisor_tecnico

🔄 Executando migração...

✅ admin@empresa.com: admin → admin
✅ user1@empresa.com: user → user
✅ gerente.adm@empresa.com: manager → gerente_adm
✅ supervisor.tecnico@empresa.com: supervisor → supervisor_tecnico
✅ tecnico1@empresa.com: technician → technician
...

📊 Relatório de Migração:
   ✅ Sucessos: 14
   ❌ Erros: 0
   ⏭️ Inalterados: 1

🔍 Verificando integridade após migração...
✅ Todas as roles estão válidas após migração

📝 Log de migração salvo em: scripts/migration-log-1706123456789.json

🎉 Migração concluída!
```

## 🔍 Verificação Pós-Migração

Após a migração, verifique:

1. **Roles Válidas**: Todas as roles devem estar no conjunto válido
2. **Funcionalidades**: Teste login e permissões para cada role
3. **Logs**: Revise o arquivo de log para identificar problemas

### Consultas SQL Úteis

```sql
-- Verificar distribuição de roles após migração
SELECT role, COUNT(*) as total 
FROM users 
GROUP BY role 
ORDER BY total DESC;

-- Verificar roles inválidas
SELECT * FROM users 
WHERE role NOT IN ('admin', 'diretor', 'gerente_adm', 'gerente_financeiro', 'supervisor_tecnico', 'technician', 'atendente', 'user');

-- Verificar usuários sem role
SELECT * FROM users WHERE role IS NULL;
```

## 🛡️ Segurança e Boas Práticas

### Antes da Migração

1. **Backup Completo**: Faça backup do banco de dados
2. **Ambiente de Teste**: Execute primeiro em ambiente de desenvolvimento
3. **Horário de Baixo Tráfego**: Execute durante manutenção programada
4. **Comunicação**: Informe usuários sobre possível indisponibilidade

### Durante a Migração

1. **Monitoramento**: Acompanhe logs em tempo real
2. **Rollback Preparado**: Tenha plano de rollback pronto
3. **Verificação Contínua**: Monitore integridade dos dados

### Após a Migração

1. **Testes Funcionais**: Teste todas as funcionalidades críticas
2. **Verificação de Permissões**: Confirme que permissões estão corretas
3. **Monitoramento**: Monitore logs de erro por 24-48h
4. **Feedback dos Usuários**: Colete feedback sobre problemas

## 🚨 Troubleshooting

### Problemas Comuns

#### Erro de Conexão com Supabase
```
❌ Variáveis de ambiente do Supabase não encontradas!
```
**Solução**: Verifique se `.env.local` contém as variáveis corretas.

#### Usuários com Roles Inválidas
```
❌ Encontradas 3 roles inválidas após migração!
```
**Solução**: Execute novamente a migração ou corrija manualmente.

#### Erro de Permissão
```
❌ Erro ao atualizar usuário: insufficient_privilege
```
**Solução**: Verifique se está usando `SUPABASE_SERVICE_ROLE_KEY` e não a chave anônima.

### Logs de Debug

Para debug detalhado, adicione logs extras:

```javascript
// No script, adicione antes da migração:
console.log('Debug - Supabase URL:', supabaseUrl);
console.log('Debug - Service Key presente:', !!supabaseServiceKey);
```

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs de migração
2. Consulte este guia de troubleshooting
3. Execute rollback se necessário
4. Entre em contato com a equipe de desenvolvimento

## 📝 Changelog

- **v1.0.0**: Versão inicial do script de migração
- **v1.1.0**: Adicionado suporte a rollback
- **v1.2.0**: Criação de usuários de teste
- **v1.3.0**: Melhorias na verificação de integridade