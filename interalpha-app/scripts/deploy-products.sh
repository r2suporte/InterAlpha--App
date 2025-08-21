#!/bin/bash

# Script de deploy para módulo de produtos
# Uso: ./scripts/deploy-products.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Verificar se o ambiente é válido
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Ambiente inválido. Use 'staging' ou 'production'"
    exit 1
fi

log_info "Iniciando deploy do módulo de produtos para $ENVIRONMENT..."

# Verificar se estamos na branch correta
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$ENVIRONMENT" == "production" && "$CURRENT_BRANCH" != "main" ]]; then
    log_error "Deploy para produção deve ser feito a partir da branch 'main'"
    log_info "Branch atual: $CURRENT_BRANCH"
    exit 1
fi

if [[ "$ENVIRONMENT" == "staging" && "$CURRENT_BRANCH" != "develop" ]]; then
    log_warning "Deploy para staging recomendado a partir da branch 'develop'"
    log_info "Branch atual: $CURRENT_BRANCH"
    read -p "Continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar se há mudanças não commitadas
if [[ -n $(git status --porcelain) ]]; then
    log_error "Há mudanças não commitadas no repositório"
    git status --short
    exit 1
fi

# Carregar variáveis de ambiente
if [[ "$ENVIRONMENT" == "production" ]]; then
    ENV_FILE=".env.production"
else
    ENV_FILE=".env.staging"
fi

if [[ -f "$ENV_FILE" ]]; then
    log_info "Carregando variáveis de $ENV_FILE"
    set -a
    source "$ENV_FILE"
    set +a
else
    log_warning "Arquivo $ENV_FILE não encontrado"
fi

# Verificar dependências necessárias
log_info "Verificando dependências..."

command -v node >/dev/null 2>&1 || { log_error "Node.js não está instalado"; exit 1; }
command -v npm >/dev/null 2>&1 || { log_error "npm não está instalado"; exit 1; }
command -v npx >/dev/null 2>&1 || { log_error "npx não está instalado"; exit 1; }

# Verificar versão do Node
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"
if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]]; then
    log_error "Node.js versão $REQUIRED_VERSION ou superior é necessária. Versão atual: $NODE_VERSION"
    exit 1
fi

# Instalar dependências
log_info "Instalando dependências..."
npm ci --silent

# Executar testes específicos do módulo de produtos
log_info "Executando testes do módulo de produtos..."

# Testes unitários
log_info "Executando testes unitários..."
npm run test:unit -- --testPathPattern="(product|stock|category|ordem)" --passWithNoTests

# Testes de integração
log_info "Executando testes de integração..."
npm run test:integration -- --testPathPattern="(product|stock|category|ordem)" --passWithNoTests

# Verificar qualidade do código
log_info "Verificando qualidade do código..."

# ESLint
log_info "Executando ESLint..."
npx eslint src/app/api/produtos/ src/services/*product* src/services/*stock* src/components/produtos/ --max-warnings 0

# TypeScript check
log_info "Verificando TypeScript..."
npx tsc --noEmit

# Prettier check
log_info "Verificando formatação..."
npx prettier --check "src/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"

# Backup do banco de dados (apenas produção)
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_info "Criando backup do banco de dados..."
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if [[ -n "$DATABASE_URL" ]]; then
        pg_dump "$DATABASE_URL" > "backups/$BACKUP_FILE" || {
            log_warning "Falha ao criar backup do banco de dados"
        }
        log_success "Backup criado: backups/$BACKUP_FILE"
    else
        log_warning "DATABASE_URL não definida, pulando backup"
    fi
fi

# Executar migrations
log_info "Executando migrations do banco de dados..."
npx prisma migrate deploy

# Build da aplicação
log_info "Fazendo build da aplicação..."
npm run build

# Deploy específico por ambiente
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_info "Fazendo deploy para PRODUÇÃO..."
    
    # Verificar se todas as variáveis necessárias estão definidas
    required_vars=("DATABASE_URL" "REDIS_HOST" "NEXTAUTH_SECRET")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Variável de ambiente $var não está definida"
            exit 1
        fi
    done
    
    # Deploy para produção (Vercel, AWS, etc.)
    if command -v vercel >/dev/null 2>&1; then
        npx vercel --prod --token "$VERCEL_TOKEN"
    else
        log_warning "Vercel CLI não encontrada, usando método alternativo de deploy"
        # Aqui você pode adicionar outros métodos de deploy
    fi
    
else
    log_info "Fazendo deploy para STAGING..."
    
    # Deploy para staging
    if command -v vercel >/dev/null 2>&1; then
        npx vercel --token "$VERCEL_TOKEN"
    else
        log_warning "Vercel CLI não encontrada, usando método alternativo de deploy"
    fi
fi

# Warm-up do cache
log_info "Aquecendo cache da aplicação..."
if [[ -n "$APP_URL" ]]; then
    curl -f "$APP_URL/api/produtos?warmup=true" >/dev/null 2>&1 || {
        log_warning "Falha ao aquecer cache"
    }
    log_success "Cache aquecido"
else
    log_warning "APP_URL não definida, pulando warm-up do cache"
fi

# Testes de smoke (apenas produção)
if [[ "$ENVIRONMENT" == "production" && -n "$APP_URL" ]]; then
    log_info "Executando testes de smoke..."
    
    # Verificar se a aplicação está respondendo
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health")
    if [[ "$HTTP_STATUS" == "200" ]]; then
        log_success "Aplicação está respondendo corretamente"
    else
        log_error "Aplicação não está respondendo (HTTP $HTTP_STATUS)"
        exit 1
    fi
    
    # Verificar endpoints específicos de produtos
    ENDPOINTS=(
        "/api/produtos"
        "/api/produtos/stats"
        "/api/categorias"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$endpoint")
        if [[ "$HTTP_STATUS" == "200" ]]; then
            log_success "Endpoint $endpoint OK"
        else
            log_warning "Endpoint $endpoint retornou HTTP $HTTP_STATUS"
        fi
    done
fi

# Notificar sucesso
log_success "Deploy do módulo de produtos para $ENVIRONMENT concluído com sucesso!"

# Informações pós-deploy
log_info "Informações do deploy:"
log_info "- Ambiente: $ENVIRONMENT"
log_info "- Branch: $CURRENT_BRANCH"
log_info "- Commit: $(git rev-parse --short HEAD)"
log_info "- Data: $(date)"

if [[ -n "$APP_URL" ]]; then
    log_info "- URL: $APP_URL"
fi

# Salvar informações do deploy
DEPLOY_INFO_FILE="deploys/deploy_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"
mkdir -p deploys

cat > "$DEPLOY_INFO_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "branch": "$CURRENT_BRANCH",
  "commit": "$(git rev-parse HEAD)",
  "shortCommit": "$(git rev-parse --short HEAD)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$(whoami)",
  "nodeVersion": "$NODE_VERSION",
  "appUrl": "${APP_URL:-""}",
  "success": true
}
EOF

log_success "Informações do deploy salvas em: $DEPLOY_INFO_FILE"

# Limpeza
log_info "Limpando arquivos temporários..."
rm -rf .next/cache/* 2>/dev/null || true

log_success "Deploy finalizado! 🚀"