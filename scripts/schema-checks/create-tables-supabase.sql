-- 🗄️ Script SQL para criar tabelas no Supabase
-- InterAlpha App - Schema Atualizado para Supabase Auth

-- Limpar tabelas existentes (se necessário)
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS ordens_servico CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 👤 Tabela de Usuários (integrada com Supabase Auth)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    "supabaseId" TEXT UNIQUE NOT NULL, -- UUID do Supabase Auth
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 🏢 Tabela de Clientes
CREATE TABLE clientes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    documento TEXT UNIQUE NOT NULL,
    "tipoDocumento" TEXT NOT NULL, -- CPF ou CNPJ
    cep TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    observacoes TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- 🔧 Tabela de Ordens de Serviço
CREATE TABLE ordens_servico (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA
    prioridade TEXT NOT NULL DEFAULT 'MEDIA', -- BAIXA, MEDIA, ALTA, URGENTE
    valor DECIMAL(10,2),
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("clienteId") REFERENCES clientes(id) ON DELETE CASCADE
);

-- 💳 Tabela de Pagamentos
CREATE TABLE pagamentos (
    id TEXT PRIMARY KEY,
    valor DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, PAGO, CANCELADO, ESTORNADO
    metodo TEXT NOT NULL, -- DINHEIRO, PIX, CARTAO_CREDITO, CARTAO_DEBITO, TRANSFERENCIA, BOLETO
    "stripePaymentId" TEXT UNIQUE,
    descricao TEXT,
    "dataVencimento" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "ordemServicoId" TEXT,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY ("ordemServicoId") REFERENCES ordens_servico(id)
);

-- 📊 Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users("supabaseId");
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes("userId");
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(documento);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_user_id ON ordens_servico("userId");
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente_id ON ordens_servico("clienteId");
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_user_id ON pagamentos("userId");
CREATE INDEX IF NOT EXISTS idx_pagamentos_ordem_servico_id ON pagamentos("ordemServicoId");
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

-- ✅ Verificação das tabelas criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'clientes', 'ordens_servico', 'pagamentos')
ORDER BY table_name;