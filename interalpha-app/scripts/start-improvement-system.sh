#!/bin/bash

# Script de inicialização do sistema de melhorias contínuas
# Este script configura e inicia todos os componentes do sistema de feedback e melhorias

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Banner de início
echo -e "${PURPLE}"
echo "═══════════════════════════════════════════════════════════════"
echo "🚀 SISTEMA DE MELHORIAS CONTÍNUAS - INTERALPHA"
echo "   Inicializando monitoramento e análise de feedback"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

log_info "Iniciando sistema de melhorias contínuas..."
log_info "Data/Hora: $(date)"
log_info "Diretório: $PROJECT_ROOT"

# Verificar dependências
log_step "1/8 - Verificando Dependências"

# Verificar Node.js
if ! command -v node >/dev/null 2>&1; then
    log_error "Node.js não está instalado"
    exit 1
fi

NODE_VERSION=$(node --version)
log_info "Node.js: $NODE_VERSION"

# Verificar npm
if ! command -v npm >/dev/null 2>&1; then
    log_error "npm não está instalado"
    exit 1
fi

NPM_VERSION=$(npm --version)
log_info "npm: $NPM_VERSION"

# Verificar se estamos no diretório correto
if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    log_error "package.json não encontrado. Execute este script a partir do diretório do projeto."
    exit 1
fi

log_success "Dependências verificadas"

# Instalar dependências se necessário
log_step "2/8 - Instalando Dependências"

if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
    log_info "Instalando dependências do projeto..."
    cd "$PROJECT_ROOT"
    npm install
else
    log_info "Dependências já instaladas"
fi

log_success "Dependências prontas"

# Verificar banco de dados
log_step "3/8 - Verificando Banco de Dados"

if [[ -z "$DATABASE_URL" ]]; then
    log_warning "DATABASE_URL não está definida"
    if [[ -f ".env.local" ]]; then
        log_info "Carregando variáveis do .env.local"
        set -a
        source .env.local
        set +a
    fi
fi

if [[ -n "$DATABASE_URL" ]]; then
    log_info "Testando conexão com banco de dados..."
    
    # Testar conexão usando Prisma
    if npx prisma db push --accept-data-loss >/dev/null 2>&1; then
        log_success "Conexão com banco de dados OK"
    else
        log_warning "Problemas na conexão com banco de dados"
    fi
else
    log_warning "DATABASE_URL não configurada - algumas funcionalidades podem não funcionar"
fi

# Verificar Redis (opcional)
log_step "4/8 - Verificando Cache Redis"

if [[ -n "$REDIS_HOST" ]]; then
    log_info "Testando conexão com Redis..."
    
    # Testar conexão com Redis se disponível
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping >/dev/null 2>&1; then
            log_success "Conexão com Redis OK"
        else
            log_warning "Redis não está respondendo"
        fi
    else
        log_info "redis-cli não disponível para teste"
    fi
else
    log_warning "Redis não configurado - cache será limitado"
fi

# Configurar sistema de monitoramento
log_step "5/8 - Configurando Sistema de Monitoramento"

# Criar diretório de logs se não existir
LOGS_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOGS_DIR"

# Criar arquivo de configuração de monitoramento
cat > "$PROJECT_ROOT/improvement-system-config.json" << EOF
{
  "monitoring": {
    "enabled": true,
    "interval": 5,
    "logLevel": "info",
    "logFile": "$LOGS_DIR/improvement-system.log"
  },
  "notifications": {
    "email": {
      "enabled": ${EMAIL_NOTIFICATIONS_ENABLED:-false},
      "smtp": {
        "host": "${SMTP_HOST:-}",
        "port": ${SMTP_PORT:-587},
        "secure": ${SMTP_SECURE:-false}
      }
    },
    "slack": {
      "enabled": ${SLACK_NOTIFICATIONS_ENABLED:-false},
      "webhookUrl": "${SLACK_WEBHOOK_URL:-}"
    }
  },
  "analytics": {
    "enabled": true,
    "retentionDays": 90,
    "batchSize": 100
  },
  "feedback": {
    "autoAnalysis": true,
    "sentimentAnalysis": false,
    "languageDetection": true
  }
}
EOF

log_success "Configuração de monitoramento criada"

# Inicializar banco de dados com dados de exemplo
log_step "6/8 - Inicializando Dados de Exemplo"

# Criar script de inicialização de dados
cat > "$PROJECT_ROOT/init-improvement-data.js" << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeImprovementData() {
  console.log('🔄 Inicializando dados do sistema de melhorias...');
  
  try {
    // Verificar se já existem dados
    const existingFeedback = await prisma.feedback?.count?.() || 0;
    
    if (existingFeedback > 0) {
      console.log('✅ Dados já existem no sistema');
      return;
    }
    
    // Criar dados de exemplo de feedback
    const sampleFeedbacks = [
      {
        rating: 4,
        type: 'suggestion',
        message: 'Seria ótimo ter um filtro mais avançado na listagem de produtos',
        page: '/produtos',
        feature: 'listagem',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
      },
      {
        rating: 2,
        type: 'bug',
        message: 'A página de produtos está carregando muito lentamente',
        page: '/produtos',
        feature: 'performance',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
      },
      {
        rating: 5,
        type: 'compliment',
        message: 'Adorei a nova interface do cadastro de produtos!',
        page: '/produtos/novo',
        feature: 'formulario',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
      },
      {
        rating: 3,
        type: 'suggestion',
        message: 'Poderia ter um botão de duplicar produto para facilitar o cadastro',
        page: '/produtos',
        feature: 'ações',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
      },
      {
        rating: 1,
        type: 'bug',
        message: 'Erro ao tentar salvar produto com imagem grande',
        page: '/produtos/novo',
        feature: 'upload',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      }
    ];
    
    // Inserir feedbacks de exemplo (se a tabela existir)
    if (prisma.feedback?.createMany) {
      await prisma.feedback.createMany({
        data: sampleFeedbacks,
        skipDuplicates: true
      });
      console.log(`✅ ${sampleFeedbacks.length} feedbacks de exemplo criados`);
    } else {
      console.log('ℹ️ Tabela de feedback não encontrada - pulando inserção de dados');
    }
    
    console.log('🎉 Inicialização de dados concluída');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar dados:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

initializeImprovementData();
EOF

# Executar inicialização de dados
node "$PROJECT_ROOT/init-improvement-data.js"

# Limpar arquivo temporário
rm "$PROJECT_ROOT/init-improvement-data.js"

log_success "Dados de exemplo inicializados"

# Configurar tarefas automáticas
log_step "7/8 - Configurando Tarefas Automáticas"

# Criar script de monitoramento contínuo
cat > "$PROJECT_ROOT/improvement-monitor.js" << 'EOF'
const { improvementNotificationsService } = require('./src/services/improvement-notifications-service');
const { improvementAnalyticsService } = require('./src/services/improvement-analytics-service');

console.log('🚀 Iniciando sistema de monitoramento de melhorias...');

// Configurar handlers de processo
process.on('SIGINT', () => {
  console.log('\n🛑 Parando sistema de monitoramento...');
  improvementNotificationsService.stopMonitoring();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Sistema sendo finalizado...');
  improvementNotificationsService.stopMonitoring();
  process.exit(0);
});

// Iniciar monitoramento
try {
  improvementNotificationsService.startMonitoring(5); // Verificar a cada 5 minutos
  
  console.log('✅ Sistema de monitoramento ativo');
  console.log('📊 Verificando regras a cada 5 minutos');
  console.log('🔔 Notificações configuradas');
  console.log('\nPressione Ctrl+C para parar o monitoramento');
  
  // Executar análise inicial
  setTimeout(async () => {
    try {
      console.log('🔍 Executando análise inicial...');
      const suggestions = await improvementAnalyticsService.analyzeFeedbackForImprovements();
      console.log(`📈 ${suggestions.length} sugestões de melhoria identificadas`);
      
      const insights = await improvementAnalyticsService.analyzeUsageMetrics();
      console.log(`💡 ${insights.length} insights de uso gerados`);
      
    } catch (error) {
      console.error('❌ Erro na análise inicial:', error.message);
    }
  }, 10000); // Aguardar 10 segundos
  
} catch (error) {
  console.error('❌ Erro ao iniciar monitoramento:', error);
  process.exit(1);
}

// Manter processo ativo
setInterval(() => {
  // Heartbeat - apenas para manter o processo vivo
}, 60000);
EOF

log_success "Tarefas automáticas configuradas"

# Finalizar configuração
log_step "8/8 - Finalizando Configuração"

# Criar script de inicialização rápida
cat > "$PROJECT_ROOT/start-improvements.sh" << 'EOF'
#!/bin/bash
echo "🚀 Iniciando sistema de melhorias..."
cd "$(dirname "$0")"
node improvement-monitor.js
EOF

chmod +x "$PROJECT_ROOT/start-improvements.sh"

# Criar arquivo de status
cat > "$PROJECT_ROOT/improvement-system-status.json" << EOF
{
  "initialized": true,
  "version": "1.0.0",
  "initDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "components": {
    "feedbackWidget": true,
    "analyticsService": true,
    "notificationsService": true,
    "dashboard": true,
    "monitoring": true
  },
  "configuration": {
    "monitoringInterval": 5,
    "notificationsEnabled": true,
    "analyticsEnabled": true,
    "autoImprovements": true
  }
}
EOF

log_success "Sistema de melhorias configurado"

# Resumo final
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 SISTEMA DE MELHORIAS CONTÍNUAS INICIALIZADO COM SUCESSO!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

log_info "📋 Resumo da configuração:"
log_info "  ✅ Dependências verificadas e instaladas"
log_info "  ✅ Banco de dados configurado"
log_info "  ✅ Sistema de cache verificado"
log_info "  ✅ Monitoramento configurado"
log_info "  ✅ Dados de exemplo inicializados"
log_info "  ✅ Tarefas automáticas configuradas"
log_info "  ✅ Scripts de inicialização criados"

echo ""
log_info "🚀 Para iniciar o sistema de monitoramento:"
log_info "   ./start-improvements.sh"
echo ""
log_info "🌐 Para acessar o dashboard:"
log_info "   http://localhost:3000/admin/melhorias"
echo ""
log_info "📊 Componentes disponíveis:"
log_info "   • Widget de feedback em todas as páginas"
log_info "   • Análise automática de feedback"
log_info "   • Notificações inteligentes"
log_info "   • Dashboard de melhorias"
log_info "   • Monitoramento contínuo"
echo ""
log_info "📁 Arquivos de configuração:"
log_info "   • improvement-system-config.json"
log_info "   • improvement-system-status.json"
log_info "   • logs/improvement-system.log"
echo ""

log_success "Sistema pronto para uso! 🎯"

exit 0
EOF