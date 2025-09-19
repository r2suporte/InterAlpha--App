-- Migração para adicionar campos específicos para autorizada Apple

-- Adicionar campos específicos do equipamento na tabela ordens_servico
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS serial_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS imei VARCHAR(20),
ADD COLUMN IF NOT EXISTS descricao_defeito TEXT,
ADD COLUMN IF NOT EXISTS estado_equipamento TEXT,
ADD COLUMN IF NOT EXISTS analise_tecnica TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN ordens_servico.serial_number IS 'Número de série do equipamento Apple';
COMMENT ON COLUMN ordens_servico.imei IS 'IMEI para iPads com conectividade celular';
COMMENT ON COLUMN ordens_servico.descricao_defeito IS 'Descrição detalhada do defeito reportado';
COMMENT ON COLUMN ordens_servico.estado_equipamento IS 'Descrição do estado físico do equipamento';
COMMENT ON COLUMN ordens_servico.analise_tecnica IS 'Análise técnica detalhada do problema';

-- Atualizar tabela pecas_utilizadas para incluir campos específicos Apple
ALTER TABLE pecas_utilizadas 
ADD COLUMN IF NOT EXISTS codigo_apple VARCHAR(50),
ADD COLUMN IF NOT EXISTS tipo_peca VARCHAR(20) DEFAULT 'original_apple';

-- Adicionar constraint para tipo_peca
ALTER TABLE pecas_utilizadas 
ADD CONSTRAINT check_tipo_peca 
CHECK (tipo_peca IN ('original_apple', 'compativel', 'recondicionada'));

-- Comentários para pecas_utilizadas
COMMENT ON COLUMN pecas_utilizadas.codigo_apple IS 'Código oficial Apple da peça';
COMMENT ON COLUMN pecas_utilizadas.tipo_peca IS 'Tipo da peça: original_apple, compativel ou recondicionada';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_serial_number ON ordens_servico(serial_number);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_imei ON ordens_servico(imei);
CREATE INDEX IF NOT EXISTS idx_pecas_utilizadas_codigo_apple ON pecas_utilizadas(codigo_apple);
CREATE INDEX IF NOT EXISTS idx_pecas_utilizadas_tipo_peca ON pecas_utilizadas(tipo_peca);

-- Função para validar IMEI (apenas números, 15 dígitos)
CREATE OR REPLACE FUNCTION validate_imei(imei_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- IMEI deve ter exatamente 15 dígitos numéricos
    RETURN imei_value ~ '^[0-9]{15}$';
END;
$$ LANGUAGE plpgsql;

-- Função para validar serial number Apple (formato básico)
CREATE OR REPLACE FUNCTION validate_apple_serial(serial_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Serial Apple geralmente tem 10-12 caracteres alfanuméricos
    RETURN serial_value ~ '^[A-Z0-9]{8,12}$';
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar IMEI antes de inserir/atualizar
CREATE OR REPLACE FUNCTION check_imei_format()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.imei IS NOT NULL AND NEW.imei != '' THEN
        IF NOT validate_imei(NEW.imei) THEN
            RAISE EXCEPTION 'IMEI deve conter exatamente 15 dígitos numéricos';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar serial number antes de inserir/atualizar
CREATE OR REPLACE FUNCTION check_serial_format()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.serial_number IS NOT NULL AND NEW.serial_number != '' THEN
        IF NOT validate_apple_serial(NEW.serial_number) THEN
            RAISE EXCEPTION 'Serial number deve conter 8-12 caracteres alfanuméricos';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER validate_imei_trigger 
    BEFORE INSERT OR UPDATE ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION check_imei_format();

CREATE TRIGGER validate_serial_trigger 
    BEFORE INSERT OR UPDATE ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION check_serial_format();

-- Atualizar RLS policies se necessário (manter as existentes)
-- As policies existentes já cobrem as novas colunas