-- Migração inicial para criar todas as tabelas do sistema InterAlpha

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'technician')),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    cpf_cnpj VARCHAR(20),
    tipo_pessoa VARCHAR(10) DEFAULT 'fisica' CHECK (tipo_pessoa IN ('fisica', 'juridica')),
    observacoes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_os VARCHAR(20) UNIQUE NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'aguardando_peca', 'concluida', 'cancelada')),
    prioridade VARCHAR(10) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    tecnico_id UUID REFERENCES users(id),
    valor_servico DECIMAL(10,2) DEFAULT 0,
    valor_pecas DECIMAL(10,2) DEFAULT 0,
    valor_total DECIMAL(10,2) GENERATED ALWAYS AS (valor_servico + valor_pecas) STORED,
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id),
    valor DECIMAL(10,2) NOT NULL,
    metodo_pagamento VARCHAR(20) DEFAULT 'dinheiro' CHECK (metodo_pagamento IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto')),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'aprovado', 'rejeitado', 'cancelado')),
    data_pagamento TIMESTAMP WITH TIME ZONE,
    data_vencimento TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_numero ON ordens_servico(numero_os);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente ON ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_tecnico ON ordens_servico(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_ordem_servico ON pagamentos(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON pagamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de OS automaticamente
CREATE OR REPLACE FUNCTION generate_os_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    year_suffix VARCHAR(4);
BEGIN
    -- Pegar o ano atual
    year_suffix := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    -- Buscar o próximo número sequencial para o ano
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_os FROM 3 FOR 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM ordens_servico
    WHERE numero_os LIKE 'OS' || year_suffix || '%';
    
    -- Gerar o número da OS no formato OS2025000001
    NEW.numero_os := 'OS' || year_suffix || LPAD(next_number::VARCHAR, 6, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_os_number_trigger BEFORE INSERT ON ordens_servico
    FOR EACH ROW 
    WHEN (NEW.numero_os IS NULL OR NEW.numero_os = '')
    EXECUTE FUNCTION generate_os_number();

-- Políticas de RLS (Row Level Security) - básicas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Política básica: usuários podem ver todos os dados (ajustar conforme necessário)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can view all clientes" ON clientes FOR SELECT USING (true);
CREATE POLICY "Users can view all ordens_servico" ON ordens_servico FOR SELECT USING (true);
CREATE POLICY "Users can view all pagamentos" ON pagamentos FOR SELECT USING (true);

-- Políticas de inserção/atualização (ajustar conforme necessário)
CREATE POLICY "Users can insert clientes" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update clientes" ON clientes FOR UPDATE USING (true);
CREATE POLICY "Users can insert ordens_servico" ON ordens_servico FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update ordens_servico" ON ordens_servico FOR UPDATE USING (true);
CREATE POLICY "Users can insert pagamentos" ON pagamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update pagamentos" ON pagamentos FOR UPDATE USING (true);