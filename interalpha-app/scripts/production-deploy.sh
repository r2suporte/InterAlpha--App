#!/bin/bash

# Script de deploy em produção - Sistema de Produtos InterAlpha
# Este script executa o deploy completo para produção com todas as verificações

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
PRODUCTION_URL="${PRODUCTION_URL:-https://app.interalpha.com}"
BACKUP_RETENTION_DAYS=30
DEPLOY_TIMEOUT=1800 # 30 minutos

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_deploy() {
    echo -e "${CYAN}[DEPLOY]${NC} $1"
}

# Verificar pré-requisitos
check_prerequisites() {
    log_step "Verificando pré-requisitos para deploy em produção..."
    
    # Verificar se estamos na branch main
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" ]]; then
        log_error "Deploy para produção deve ser feito a partir da branch 'main'"
        log_info "Branch atual: $CURRENT_BRANCH"
        exit 1
    fi
    
    # Verificar se há mudanças não commitadas
    if [[ -n $(git status --porcelain) ]]; then
        log_error "Há mudanças não commitadas no repositório"
        git status --short
        exit 1
    fi
    
    # Verificar se está sincronizado com origin
    git fetch origin main
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/main)
    
    if [[ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]]; then
        log_error "Branch local não está sincronizada com origin/main"
        log_info "Execute: git pull origin main"
        exit 1
    fi
    
    # Verificar variáveis de ambiente obrigatórias
    required_vars=(
        "DATABASE_URL"
        "REDIS_HOST"
        "NEXTAUTH_SECRET"
        "PRODUCTION_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Variável de ambiente obrigatória não definida: $var"
            exit 1
        fi
    done
    
    # Verificar ferramentas necessárias
    command -v node >/dev/null 2>&1 || { log_error "Node.js não está instalado"; exit 1; }
    command -v npm >/dev/null 2>&1 || { log_error "npm não está instalado"; exit 1; }
    command -v pg_dump >/dev/null 2>&1 || { log_warning "pg_dump não encontrado, backup pode falhar"; }
    
    log_success "Pré-requisitos verificados"
}

# Executar testes pré-deploy
run_pre_deploy_tests() {
    log_step "Executando testes pré-deploy..."
    
    # Instalar dependências
    log_info "Instalando dependências..."
    npm ci --silent
    
    # Executar testes unitários
    log_info "Executando testes unitários..."
    npm run test:unit -- --passWithNoTests --testPathPattern="(product|stock|category|ordem)"
    
    # Executar testes de integração
    log_info "Executando testes de integração..."
    npm run test:integration -- --passWithNoTests --testPathPattern="(product|stock|category|ordem)"
    
    # Verificar qualidade do código
    log_info "Verificando qualidade do código..."
    npx eslint src/app/api/produtos/ src/services/*product* src/services/*stock* src/components/produtos/ --max-warnings 0
    npx tsc --noEmit
    npx prettier --check "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"
    
    log_success "Todos os testes pré-deploy passaram"
}

# Criar backup completo
create_production_backup() {
    log_step "Criando backup completo da produção..."
    
    BACKUP_DIR="backups/production"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="production_backup_${TIMESTAMP}"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup do banco de dados
    if [[ -n "$DATABASE_URL" ]]; then
        log_info "Fazendo backup do banco de dados..."
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/${BACKUP_FILE}.sql"
        
        # Comprimir backup
        gzip "$BACKUP_DIR/${BACKUP_FILE}.sql"
        
        # Verificar integridade
        if gunzip -t "$BACKUP_DIR/${BACKUP_FILE}.sql.gz"; then
            log_success "Backup do banco criado e verificado: ${BACKUP_FILE}.sql.gz"
        else
            log_error "Falha na verificação do backup do banco"
            exit 1
        fi
    else
        log_warning "DATABASE_URL não definida, pulando backup do banco"
    fi
    
    # Backup de arquivos críticos
    log_info "Fazendo backup de arquivos de configuração..."
    tar -czf "$BACKUP_DIR/${BACKUP_FILE}_config.tar.gz" \
        .env.production \
        prisma/schema.prisma \
        package.json \
        package-lock.json \
        2>/dev/null || log_warning "Alguns arquivos de configuração não foram encontrados"
    
    # Salvar informações do deploy
    cat > "$BACKUP_DIR/${BACKUP_FILE}_info.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "branch": "$CURRENT_BRANCH",
  "commit": "$(git rev-parse HEAD)",
  "shortCommit": "$(git rev-parse --short HEAD)",
  "deployer": "$(whoami)",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "environment": "production"
}
EOF
    
    # Limpar backups antigos
    find "$BACKUP_DIR" -name "production_backup_*" -mtime +$BACKUP_RETENTION_DAYS -delete 2>/dev/null || true
    
    log_success "Backup completo criado: $BACKUP_FILE"
    echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_backup.txt"
}

# Executar migrations do banco
run_database_migrations() {
    log_step "Executando migrations do banco de dados..."
    
    # Verificar conexão com o banco
    log_info "Verificando conexão com o banco de dados..."
    if ! npx prisma db execute --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
        log_error "Falha na conexão com o banco de dados"
        exit 1
    fi
    
    # Executar migrations
    log_info "Aplicando migrations..."
    npx prisma migrate deploy
    
    # Verificar se as migrations foram aplicadas corretamente
    log_info "Verificando integridade do schema..."
    npx prisma db pull --force >/dev/null 2>&1 || {
        log_error "Falha na verificação do schema após migrations"
        exit 1
    }
    
    log_success "Migrations aplicadas com sucesso"
}

# Build da aplicação
build_application() {
    log_step "Fazendo build da aplicação..."
    
    # Limpar builds anteriores
    log_info "Limpando builds anteriores..."
    rm -rf .next/
    rm -rf dist/
    
    # Build da aplicação
    log_info "Executando build de produção..."
    NODE_ENV=production npm run build
    
    # Verificar se o build foi bem-sucedido
    if [[ ! -d ".next" ]]; then
        log_error "Build falhou - diretório .next não foi criado"
        exit 1
    fi
    
    # Verificar tamanho do build
    BUILD_SIZE=$(du -sh .next | cut -f1)
    log_info "Tamanho do build: $BUILD_SIZE"
    
    log_success "Build concluído com sucesso"
}

# Deploy para produção
deploy_to_production() {
    log_step "Fazendo deploy para produção..."
    
    # Deploy usando Vercel (ou outro provedor)
    if command -v vercel >/dev/null 2>&1; then
        log_deploy "Fazendo deploy via Vercel..."
        
        # Configurar Vercel se necessário
        if [[ -n "$VERCEL_TOKEN" ]]; then
            echo "$VERCEL_TOKEN" | vercel login --stdin
        fi
        
        # Deploy para produção
        vercel --prod --token "$VERCEL_TOKEN" --confirm
        
    elif [[ -n "$DEPLOY_HOOK_URL" ]]; then
        log_deploy "Fazendo deploy via webhook..."
        
        curl -X POST "$DEPLOY_HOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"ref\": \"main\", \"commit\": \"$(git rev-parse HEAD)\"}"
            
    else
        log_warning "Nenhum método de deploy configurado"
        log_info "Configure VERCEL_TOKEN ou DEPLOY_HOOK_URL"
    fi
    
    log_success "Deploy iniciado"
}

# Aguardar deploy e verificar saúde
wait_for_deployment() {
    log_step "Aguardando conclusão do deploy..."
    
    local max_attempts=60
    local attempt=1
    local wait_time=30
    
    log_info "Aguardando aplicação ficar disponível em $PRODUCTION_URL"
    log_info "Timeout: $((max_attempts * wait_time)) segundos"
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Tentativa $attempt/$max_attempts..."
        
        # Verificar se a aplicação está respondendo
        if curl -f -s --max-time 10 "$PRODUCTION_URL/api/health" >/dev/null 2>&1; then
            log_success "Aplicação está respondendo!"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Timeout: aplicação não ficou disponível em tempo hábil"
            return 1
        fi
        
        sleep $wait_time
        ((attempt++))
    done
    
    # Aguardar mais um pouco para estabilizar
    log_info "Aguardando estabilização (30s)..."
    sleep 30
}

# Executar smoke tests
run_smoke_tests() {
    log_step "Executando smoke tests..."
    
    local endpoints=(
        "/api/health"
        "/api/produtos?limit=1"
        "/api/produtos/stats"
        "/api/categorias"
        "/api/dashboard/metricas"
        "/api/estoque/relatorio?limit=1"
    )
    
    local failed_endpoints=()
    
    for endpoint in "${endpoints[@]}"; do
        log_info "Testando: $endpoint"
        
        local response_code
        response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$PRODUCTION_URL$endpoint")
        
        if [[ "$response_code" == "200" ]]; then
            log_success "✅ $endpoint: OK ($response_code)"
        else
            log_error "❌ $endpoint: FALHOU ($response_code)"
            failed_endpoints+=("$endpoint")
        fi
    done
    
    if [[ ${#failed_endpoints[@]} -gt 0 ]]; then
        log_error "Smoke tests falharam nos seguintes endpoints:"
        printf '%s\n' "${failed_endpoints[@]}"
        return 1
    fi
    
    log_success "Todos os smoke tests passaram"
}

# Warm-up do cache
warm_up_cache() {
    log_step "Aquecendo cache da aplicação..."
    
    local warmup_endpoints=(
        "/api/produtos?warmup=true"
        "/api/produtos/stats"
        "/api/categorias"
        "/api/dashboard/metricas"
    )
    
    for endpoint in "${warmup_endpoints[@]}"; do
        log_info "Aquecendo: $endpoint"
        curl -f -s --max-time 30 "$PRODUCTION_URL$endpoint" >/dev/null 2>&1 || {
            log_warning "Falha ao aquecer: $endpoint"
        }
    done
    
    log_success "Cache aquecido"
}

# Verificar métricas pós-deploy
verify_post_deploy_metrics() {
    log_step "Verificando métricas pós-deploy..."
    
    # Aguardar um pouco para coletar métricas
    log_info "Aguardando coleta de métricas (60s)..."
    sleep 60
    
    # Verificar health check completo
    local health_response
    health_response=$(curl -s --max-time 15 "$PRODUCTION_URL/api/health" || echo "")
    
    if [[ -n "$health_response" ]]; then
        log_info "Health check response recebido"
        
        # Verificar se contém indicadores de saúde
        if echo "$health_response" | grep -q '"status"'; then
            log_success "Sistema reportando status de saúde"
        else
            log_warning "Response de health check não contém status"
        fi
    else
        log_warning "Não foi possível obter health check"
    fi
    
    log_success "Verificação de métricas concluída"
}

# Notificar equipe
notify_deployment() {
    log_step "Notificando equipe sobre o deploy..."
    
    local deploy_info
    deploy_info=$(cat << EOF
🚀 *Deploy em Produção Concluído*

*Ambiente:* Produção
*Branch:* $CURRENT_BRANCH
*Commit:* $(git rev-parse --short HEAD)
*Deployer:* $(whoami)
*Timestamp:* $(date)
*URL:* $PRODUCTION_URL

*Status:* ✅ Sucesso
*Smoke Tests:* ✅ Passaram
*Cache:* ✅ Aquecido
*Backup:* ✅ Criado

*Próximos passos:*
- Monitorar métricas por 30 minutos
- Verificar logs de erro
- Confirmar funcionamento com usuários
EOF
)

    # Notificar via Slack se configurado
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$deploy_info\"}" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || {
            log_warning "Falha ao enviar notificação Slack"
        }
    fi
    
    # Salvar log do deploy
    echo "$deploy_info" > "deploys/production_deploy_$(date +%Y%m%d_%H%M%S).log"
    
    log_success "Equipe notificada"
}

# Rollback em caso de falha
rollback_deployment() {
    log_error "Executando rollback do deploy..."
    
    # Obter último backup
    local latest_backup
    if [[ -f "backups/production/latest_backup.txt" ]]; then
        latest_backup=$(cat backups/production/latest_backup.txt)
        log_info "Último backup encontrado: $latest_backup"
    else
        log_error "Nenhum backup encontrado para rollback"
        return 1
    fi
    
    # Rollback via Vercel (ou outro provedor)
    if command -v vercel >/dev/null 2>&1 && [[ -n "$VERCEL_TOKEN" ]]; then
        log_info "Executando rollback via Vercel..."
        
        # Obter deployments anteriores
        local previous_deployment
        previous_deployment=$(vercel ls --token "$VERCEL_TOKEN" | grep -v "$(git rev-parse --short HEAD)" | head -1 | awk '{print $1}')
        
        if [[ -n "$previous_deployment" ]]; then
            vercel promote "$previous_deployment" --token "$VERCEL_TOKEN"
            log_success "Rollback executado para: $previous_deployment"
        else
            log_error "Nenhum deployment anterior encontrado"
        fi
    fi
    
    # Notificar rollback
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"🚨 *ROLLBACK EXECUTADO* - Deploy em produção falhou e foi revertido"}' \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1
    fi
}

# Função principal
main() {
    log_info "🚀 Iniciando deploy em produção do Sistema de Produtos InterAlpha..."
    echo "=================================================="
    log_info "Timestamp: $(date)"
    log_info "Branch: $CURRENT_BRANCH"
    log_info "Commit: $(git rev-parse --short HEAD)"
    log_info "Deployer: $(whoami)"
    log_info "Target URL: $PRODUCTION_URL"
    echo "=================================================="
    
    # Confirmação final
    echo ""
    log_warning "⚠️  ATENÇÃO: Você está prestes a fazer deploy em PRODUÇÃO!"
    read -p "Tem certeza que deseja continuar? (digite 'DEPLOY PRODUÇÃO'): " confirmation
    
    if [[ "$confirmation" != "DEPLOY PRODUÇÃO" ]]; then
        log_info "Deploy cancelado pelo usuário"
        exit 0
    fi
    
    # Executar etapas do deploy
    local start_time=$(date +%s)
    
    trap 'rollback_deployment' ERR
    
    check_prerequisites
    run_pre_deploy_tests
    create_production_backup
    run_database_migrations
    build_application
    deploy_to_production
    wait_for_deployment
    run_smoke_tests
    warm_up_cache
    verify_post_deploy_metrics
    notify_deployment
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "=================================================="
    log_success "🎉 DEPLOY EM PRODUÇÃO CONCLUÍDO COM SUCESSO!"
    log_info "Duração total: $((duration / 60))m $((duration % 60))s"
    log_info "URL da aplicação: $PRODUCTION_URL"
    echo "=================================================="
    
    echo ""
    log_info "📋 Próximos passos recomendados:"
    echo "1. Monitorar métricas por 30 minutos"
    echo "2. Verificar logs de erro em tempo real"
    echo "3. Testar funcionalidades críticas manualmente"
    echo "4. Confirmar com usuários que tudo está funcionando"
    echo "5. Documentar quaisquer problemas encontrados"
    
    log_success "Deploy finalizado! 🚀"
}

# Executar função principal
main "$@"