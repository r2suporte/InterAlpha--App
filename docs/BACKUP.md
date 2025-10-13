# 🗄️ Sistema de Backup Automatizado - InterAlpha App

## 📋 Visão Geral

O sistema de backup automatizado do InterAlpha App garante a segurança e integridade dos dados através de backups regulares e automáticos do banco de dados Supabase.

## 🚀 Funcionalidades

### ✅ Backup Completo
- **Schema do banco**: Estrutura das tabelas, índices e relacionamentos
- **Dados das tabelas**: Todos os registros do banco de dados
- **Configurações**: Metadados do projeto e configurações
- **Compactação**: Arquivos compactados para economia de espaço

### ✅ Agendamento Automático
- **Backup diário**: Execução automática às 2h da manhã
- **Backup semanal**: Opção para backups semanais
- **Backup mensal**: Opção para backups mensais
- **Limpeza automática**: Remove backups antigos (>7 dias)

### ✅ Monitoramento
- **Logs detalhados**: Registro de todas as operações
- **Relatórios**: Relatórios automáticos de cada backup
- **Status**: Verificação do status do sistema

## 📦 Comandos Disponíveis

### Backup Manual
```bash
# Executar backup imediatamente
npm run backup:run
```

### Configuração Automática
```bash
# Instalar backup diário (padrão)
npm run backup:install

# Instalar backup com frequência específica
npm run backup:install daily    # Diário às 2h
npm run backup:install weekly   # Semanal (domingo às 2h)
npm run backup:install monthly  # Mensal (dia 1 às 2h)
npm run backup:install hourly   # A cada hora
```

### Gerenciamento
```bash
# Ver status do backup automático
npm run backup:status

# Testar sistema de backup
npm run backup:test

# Remover backup automático
npm run backup:uninstall
```

## 📁 Estrutura de Arquivos

```
backups/
├── schema_2025-01-27.sql          # Schema do banco
├── data_2025-01-27.sql            # Dados das tabelas
├── complete_2025-01-27.sql        # Backup completo
├── config_2025-01-27.json         # Configurações
├── backup_2025-01-27.tar.gz       # Arquivo compactado final
└── report_2025-01-27.md           # Relatório do backup

logs/
└── backup.log                     # Logs do sistema
```

## ⚙️ Configuração

### Pré-requisitos

1. **PostgreSQL Client**: Necessário para `pg_dump`
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Baixar do site oficial do PostgreSQL
```

2. **Variáveis de Ambiente**: Configurar no `.env.local`
```env
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Primeira Configuração

1. **Testar backup manual**:
```bash
npm run backup:test
```

2. **Configurar backup automático**:
```bash
npm run backup:install
```

3. **Verificar status**:
```bash
npm run backup:status
```

## 🔍 Monitoramento

### Logs do Sistema
```bash
# Ver logs em tempo real
tail -f logs/backup.log

# Ver últimos logs
cat logs/backup.log | tail -20
```

### Verificar Cron Jobs
```bash
# Listar cron jobs ativos
crontab -l

# Ver logs do sistema (macOS)
log show --predicate 'process == "cron"' --last 1h
```

## 🛠️ Restauração de Backup

### Restaurar Schema
```bash
psql "$DATABASE_URL" < backups/schema_2025-01-27.sql
```

### Restaurar Dados
```bash
psql "$DATABASE_URL" < backups/data_2025-01-27.sql
```

### Restaurar Completo
```bash
# Extrair backup compactado
cd backups
tar -xzf backup_2025-01-27.tar.gz

# Restaurar banco completo
psql "$DATABASE_URL" < complete_2025-01-27.sql
```

## 🚨 Solução de Problemas

### Erro: "pg_dump: command not found"
```bash
# Instalar PostgreSQL client
brew install postgresql  # macOS
sudo apt-get install postgresql-client  # Linux
```

### Erro: "Permission denied"
```bash
# Dar permissão de execução aos scripts
chmod +x scripts/backup-database.js
chmod +x scripts/setup-backup-cron.js
```

### Erro: "DATABASE_URL not configured"
```bash
# Verificar arquivo .env.local
cat .env.local | grep DATABASE_URL

# Configurar se necessário
echo 'DATABASE_URL="your-database-url"' >> .env.local
```

### Backup não executa automaticamente
```bash
# Verificar se cron está rodando
sudo launchctl list | grep cron  # macOS
systemctl status cron  # Linux

# Verificar logs do cron
npm run backup:status
```

## 📊 Métricas e Relatórios

### Informações do Backup
- **Tamanho dos arquivos**: Monitoramento do crescimento
- **Tempo de execução**: Performance do backup
- **Taxa de sucesso**: Confiabilidade do sistema
- **Espaço em disco**: Uso do armazenamento

### Relatório Automático
Cada backup gera um relatório em Markdown com:
- Data e hora da execução
- Arquivos gerados
- Status das verificações
- Estatísticas do backup
- Próximo backup agendado

## 🔐 Segurança

### Boas Práticas
- ✅ **Não incluir chaves sensíveis** nos backups
- ✅ **Criptografar backups** para armazenamento externo
- ✅ **Testar restauração** regularmente
- ✅ **Monitorar logs** para detectar falhas
- ✅ **Backup offsite** para redundância

### Configurações Recomendadas
```bash
# Backup diário com retenção de 7 dias
npm run backup:install daily

# Verificação semanal do sistema
npm run backup:test
```

## 📞 Suporte

### Comandos de Diagnóstico
```bash
# Status completo do sistema
npm run backup:status

# Teste completo
npm run backup:test

# Logs detalhados
tail -f logs/backup.log
```

### Contato
Em caso de problemas persistentes:
1. Verificar logs em `logs/backup.log`
2. Executar `npm run backup:test`
3. Consultar documentação do Supabase
4. Verificar conectividade com o banco

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0  
**Status**: ✅ Ativo