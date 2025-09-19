-- Migração para sistema de equipamentos Apple
-- Data: 2025-01-16 13:00:00

-- Tabela de equipamentos Apple
CREATE TABLE IF NOT EXISTS equipamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informações básicas do equipamento
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN (
        'macbook_air', 'macbook_pro', 'mac_mini', 'imac', 
        'mac_studio', 'mac_pro', 'ipad', 'ipad_air', 
        'ipad_pro', 'ipad_mini'
    )),
    modelo VARCHAR(255) NOT NULL,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    ano_fabricacao INTEGER,
    cor VARCHAR(50),
    configuracao TEXT, -- Ex: "M2, 8GB RAM, 256GB SSD"
    
    -- Informações de garantia
    status_garantia VARCHAR(20) NOT NULL DEFAULT 'fora_garantia' CHECK (status_garantia IN (
        'garantia_apple', 'garantia_loja', 'fora_garantia', 'garantia_expirada'
    )),
    data_compra DATE,
    data_vencimento_garantia_apple DATE,
    data_vencimento_garantia_loja DATE,
    numero_nota_fiscal VARCHAR(100),
    loja_compra VARCHAR(255),
    
    -- Estado do equipamento
    condicao_geral VARCHAR(20) DEFAULT 'bom' CHECK (condicao_geral IN (
        'excelente', 'bom', 'regular', 'ruim'
    )),
    danos_visiveis TEXT[], -- Array de tipos de danos
    descricao_danos TEXT,
    acessorios_inclusos TEXT[], -- Array de acessórios
    
    -- Dados técnicos
    versao_sistema VARCHAR(50),
    senha_desbloqueio VARCHAR(255),
    icloud_removido BOOLEAN DEFAULT false,
    find_my_desabilitado BOOLEAN DEFAULT false,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Tabela de problemas reportados
CREATE TABLE IF NOT EXISTS problemas_equipamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipamento_id UUID NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN (
        'hardware', 'software', 'performance', 'conectividade', 'outros'
    )),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    sintomas TEXT[],
    reproducao_problema TEXT,
    frequencia VARCHAR(20) DEFAULT 'ocasional' CHECK (frequencia IN (
        'sempre', 'frequente', 'ocasional', 'raro'
    )),
    impacto VARCHAR(20) DEFAULT 'medio' CHECK (impacto IN (
        'critico', 'alto', 'medio', 'baixo'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de reparos
CREATE TABLE IF NOT EXISTS historico_reparos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipamento_id UUID NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
    ordem_servico_id UUID REFERENCES ordens_servico(id),
    data_reparo DATE NOT NULL,
    tipo_reparo VARCHAR(255) NOT NULL,
    pecas_trocadas TEXT[],
    tecnico_responsavel VARCHAR(255),
    observacoes TEXT,
    garantia_reparo_dias INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atualizar tabela de ordens de serviço para incluir equipamentos
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS equipamento_id UUID REFERENCES equipamentos(id),
ADD COLUMN IF NOT EXISTS tipo_servico VARCHAR(20) DEFAULT 'reparo' CHECK (tipo_servico IN (
    'reparo', 'manutencao', 'upgrade', 'diagnostico', 
    'instalacao', 'recuperacao_dados', 'limpeza', 'configuracao'
)),
ADD COLUMN IF NOT EXISTS problema_reportado TEXT,
ADD COLUMN IF NOT EXISTS diagnostico_inicial TEXT,
ADD COLUMN IF NOT EXISTS diagnostico_final TEXT,
ADD COLUMN IF NOT EXISTS solucao_aplicada TEXT,
ADD COLUMN IF NOT EXISTS aprovacao_cliente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_aprovacao_cliente TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assinatura_cliente TEXT,
ADD COLUMN IF NOT EXISTS garantia_servico_dias INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS garantia_pecas_dias INTEGER DEFAULT 365,
ADD COLUMN IF NOT EXISTS observacoes_cliente TEXT,
ADD COLUMN IF NOT EXISTS observacoes_tecnico TEXT,
ADD COLUMN IF NOT EXISTS observacoes_internas TEXT;

-- Atualizar status da tabela ordens_servico
ALTER TABLE ordens_servico 
DROP CONSTRAINT IF EXISTS ordens_servico_status_check;

ALTER TABLE ordens_servico 
ADD CONSTRAINT ordens_servico_status_check 
CHECK (status IN (
    'aberta', 'em_andamento', 'aguardando_peca', 'aguardando_aprovacao',
    'aguardando_cliente', 'em_teste', 'concluida', 'entregue', 'cancelada'
));

-- Tabela de peças utilizadas
CREATE TABLE IF NOT EXISTS pecas_utilizadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo_peca VARCHAR(100),
    quantidade INTEGER NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    fornecedor VARCHAR(255),
    numero_serie VARCHAR(100),
    garantia_dias INTEGER DEFAULT 365,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de status
CREATE TABLE IF NOT EXISTS status_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    status_anterior VARCHAR(20),
    status_novo VARCHAR(20) NOT NULL,
    motivo VARCHAR(255),
    observacoes TEXT,
    usuario_id UUID REFERENCES users(id),
    usuario_nome VARCHAR(255),
    data_mudanca TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de comunicação com cliente
CREATE TABLE IF NOT EXISTS comunicacao_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN (
        'email', 'sms', 'whatsapp', 'telefone', 'presencial'
    )),
    assunto VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    enviado_por VARCHAR(255) NOT NULL,
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lida BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP WITH TIME ZONE,
    resposta_cliente TEXT,
    anexos TEXT[]
);

-- Tabela de anexos (fotos, documentos)
CREATE TABLE IF NOT EXISTS anexos_ordem_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN (
        'foto_equipamento', 'foto_dano', 'documento', 'comprovante', 'laudo'
    )),
    nome_arquivo VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    descricao TEXT,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by VARCHAR(255) NOT NULL
);

-- Tabela de checklist de entrega
CREATE TABLE IF NOT EXISTS checklist_entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    equipamento_funcionando BOOLEAN DEFAULT false,
    todos_acessorios_inclusos BOOLEAN DEFAULT false,
    cliente_satisfeito BOOLEAN DEFAULT false,
    garantia_explicada BOOLEAN DEFAULT false,
    forma_pagamento_definida BOOLEAN DEFAULT false,
    observacoes TEXT,
    responsavel_entrega VARCHAR(255) NOT NULL,
    data_checklist TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_equipamentos_serial ON equipamentos(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipamentos_tipo ON equipamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_equipamentos_status_garantia ON equipamentos(status_garantia);
CREATE INDEX IF NOT EXISTS idx_problemas_equipamento_id ON problemas_equipamento(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_historico_reparos_equipamento ON historico_reparos(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_historico_reparos_ordem_servico ON historico_reparos(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_equipamento ON ordens_servico(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_tipo_servico ON ordens_servico(tipo_servico);
CREATE INDEX IF NOT EXISTS idx_pecas_utilizadas_ordem_servico ON pecas_utilizadas(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_status_historico_ordem_servico ON status_historico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_comunicacao_cliente_ordem_servico ON comunicacao_cliente(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_anexos_ordem_servico_id ON anexos_ordem_servico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_checklist_entrega_ordem_servico ON checklist_entrega(ordem_servico_id);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_equipamentos_updated_at 
    BEFORE UPDATE ON equipamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar histórico de status automaticamente
CREATE OR REPLACE FUNCTION create_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO status_historico (
            ordem_servico_id, 
            status_anterior, 
            status_novo, 
            usuario_nome
        ) VALUES (
            NEW.id, 
            OLD.status, 
            NEW.status, 
            COALESCE(current_setting('app.current_user_name', true), 'Sistema')
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_status_history_trigger
    AFTER UPDATE ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION create_status_history();

-- Comentários nas tabelas
COMMENT ON TABLE equipamentos IS 'Tabela para armazenar informações dos equipamentos Apple';
COMMENT ON TABLE problemas_equipamento IS 'Tabela para registrar problemas reportados nos equipamentos';
COMMENT ON TABLE historico_reparos IS 'Tabela para manter histórico de reparos realizados';
COMMENT ON TABLE pecas_utilizadas IS 'Tabela para registrar peças utilizadas em cada ordem de serviço';
COMMENT ON TABLE status_historico IS 'Tabela para rastrear mudanças de status das ordens de serviço';
COMMENT ON TABLE comunicacao_cliente IS 'Tabela para registrar comunicações com o cliente';
COMMENT ON TABLE anexos_ordem_servico IS 'Tabela para armazenar anexos das ordens de serviço';
COMMENT ON TABLE checklist_entrega IS 'Tabela para checklist de entrega do equipamento';

-- Inserir alguns dados de exemplo para tipos de equipamentos (opcional)
-- Isso pode ser útil para validação e testes iniciais