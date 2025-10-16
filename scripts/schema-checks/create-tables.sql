-- 🗄️ Script SQL para criar tabelas no Supabase
-- InterAlpha App - Schema Principal

-- 👤 Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    "clerkId" TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 🏢 Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    documento TEXT UNIQUE NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
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
CREATE TABLE IF NOT EXISTS ordens_servico (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    prioridade TEXT NOT NULL DEFAULT 'MEDIA',
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
CREATE TABLE IF NOT EXISTS pagamentos (
    id TEXT PRIMARY KEY,
    valor DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    metodo TEXT NOT NULL,
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

-- 🔐 Configuração de RLS (Row Level Security)
-- Habilitando RLS para todas as tabelas

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- 📋 Políticas RLS para Users
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = "clerkId");

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = "clerkId");

-- 📋 Políticas RLS para Clientes
-- Usuários podem ver apenas seus próprios clientes
CREATE POLICY "Users can view own clients" ON clientes
    FOR SELECT USING (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can insert own clients" ON clientes
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can update own clients" ON clientes
    FOR UPDATE USING (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can delete own clients" ON clientes
    FOR DELETE USING (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

-- 📋 Políticas RLS para Ordens de Serviço
CREATE POLICY "Users can view own service orders" ON ordens_servico
    FOR SELECT USING (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can insert own service orders" ON ordens_servico
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can update own service orders" ON ordens_servico
    FOR UPDATE USING (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can delete own service orders" ON ordens_servico
    FOR DELETE USING (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

-- 📋 Políticas RLS para Pagamentos
CREATE POLICY "Users can view own payments" ON pagamentos
    FOR SELECT USING (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can insert own payments" ON pagamentos
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can update own payments" ON pagamentos
    FOR UPDATE USING (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

CREATE POLICY "Users can delete own payments" ON pagamentos
    FOR DELETE USING (auth.uid()::text = (SELECT "clerkId" FROM users WHERE id = "userId"));

-- 🔧 Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users("clerkId");
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes("userId");
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(documento);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_user_id ON ordens_servico("userId");
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente_id ON ordens_servico("clienteId");
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_user_id ON pagamentos("userId");
CREATE INDEX IF NOT EXISTS idx_pagamentos_ordem_servico_id ON pagamentos("ordemServicoId");
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

-- ✅ Script concluído
SELECT 'Tabelas e políticas RLS criadas com sucesso!' as resultado;