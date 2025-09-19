-- Migração para criar tabela de peças/estoque
-- Data: 2025-01-27 01:00:00

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    contato_responsavel VARCHAR(255),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias de peças
CREATE TABLE IF NOT EXISTS categorias_pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela principal de peças
CREATE TABLE IF NOT EXISTS pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação da peça
    part_number VARCHAR(100) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria_id UUID REFERENCES categorias_pecas(id),
    
    -- Preços e margem
    preco_custo DECIMAL(10,2) NOT NULL,
    preco_venda DECIMAL(10,2) NOT NULL,
    margem_lucro DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN preco_custo > 0 THEN ((preco_venda - preco_custo) / preco_custo * 100)
            ELSE 0
        END
    ) STORED,
    
    -- Estoque
    quantidade_estoque INTEGER NOT NULL DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 5,
    localizacao_estoque VARCHAR(100),
    
    -- Fornecedor
    fornecedor_id UUID REFERENCES fornecedores(id),
    
    -- Informações técnicas
    compatibilidade TEXT[], -- Array de modelos compatíveis
    garantia_meses INTEGER DEFAULT 12,
    peso_gramas INTEGER,
    dimensoes VARCHAR(100),
    
    -- Status e controle
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN (
        'disponivel', 'indisponivel', 'descontinuado', 'em_falta'
    )),
    ativo BOOLEAN DEFAULT true,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    peca_id UUID NOT NULL REFERENCES pecas(id) ON DELETE CASCADE,
    tipo_movimentacao VARCHAR(20) NOT NULL CHECK (tipo_movimentacao IN (
        'entrada', 'saida', 'ajuste', 'transferencia'
    )),
    quantidade INTEGER NOT NULL,
    quantidade_anterior INTEGER NOT NULL,
    quantidade_nova INTEGER NOT NULL,
    motivo VARCHAR(255),
    observacoes TEXT,
    ordem_servico_id UUID REFERENCES ordens_servico(id),
    usuario_id UUID REFERENCES users(id),
    usuario_nome VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atualizar tabela pecas_utilizadas para referenciar a tabela de peças
ALTER TABLE pecas_utilizadas 
ADD COLUMN IF NOT EXISTS peca_id UUID REFERENCES pecas(id),
ADD COLUMN IF NOT EXISTS codigo_apple VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo_peca VARCHAR(20) DEFAULT 'original_apple' CHECK (tipo_peca IN (
    'original_apple', 'compativel', 'usado', 'recondicionado'
));

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pecas_part_number ON pecas(part_number);
CREATE INDEX IF NOT EXISTS idx_pecas_categoria ON pecas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pecas_fornecedor ON pecas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_pecas_status ON pecas(status);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_peca ON movimentacoes_estoque(peca_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes_estoque(tipo_movimentacao);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX IF NOT EXISTS idx_categorias_nome ON categorias_pecas(nome);

-- Trigger para atualizar updated_at nas peças
CREATE TRIGGER update_pecas_updated_at 
    BEFORE UPDATE ON pecas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at 
    BEFORE UPDATE ON fornecedores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar movimentação de estoque automaticamente
CREATE OR REPLACE FUNCTION create_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Só criar movimentação se a quantidade mudou
    IF OLD.quantidade_estoque IS DISTINCT FROM NEW.quantidade_estoque THEN
        INSERT INTO movimentacoes_estoque (
            peca_id,
            tipo_movimentacao,
            quantidade,
            quantidade_anterior,
            quantidade_nova,
            motivo,
            usuario_nome
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.quantidade_estoque > OLD.quantidade_estoque THEN 'entrada'
                ELSE 'saida'
            END,
            ABS(NEW.quantidade_estoque - OLD.quantidade_estoque),
            OLD.quantidade_estoque,
            NEW.quantidade_estoque,
            'Atualização automática',
            COALESCE(current_setting('app.current_user_name', true), 'Sistema')
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_stock_movement_trigger
    AFTER UPDATE ON pecas
    FOR EACH ROW EXECUTE FUNCTION create_stock_movement();

-- Inserir categorias padrão
INSERT INTO categorias_pecas (nome, descricao) VALUES
('tela', 'Telas e displays'),
('bateria', 'Baterias e componentes de energia'),
('camera', 'Câmeras e sensores'),
('alto_falante', 'Alto-falantes e componentes de áudio'),
('conector', 'Conectores e cabos'),
('placa_mae', 'Placas-mãe e componentes principais'),
('memoria', 'Memórias e armazenamento'),
('carcaca', 'Carcaças e estruturas'),
('acessorio', 'Acessórios diversos'),
('ferramenta', 'Ferramentas e equipamentos')
ON CONFLICT (nome) DO NOTHING;

-- Inserir fornecedor padrão
INSERT INTO fornecedores (nome, email, telefone, contato_responsavel) VALUES
('Fornecedor Principal', 'contato@fornecedor.com', '(11) 99999-9999', 'João Silva')
ON CONFLICT (cnpj) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE pecas IS 'Tabela principal para controle de estoque de peças';
COMMENT ON TABLE categorias_pecas IS 'Categorias para organização das peças';
COMMENT ON TABLE fornecedores IS 'Fornecedores de peças e componentes';
COMMENT ON TABLE movimentacoes_estoque IS 'Histórico de movimentações do estoque';