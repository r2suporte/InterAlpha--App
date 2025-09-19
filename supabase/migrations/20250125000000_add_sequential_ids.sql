-- Migração para adicionar sistema de IDs sequenciais para clientes

-- Adicionar coluna numero_cliente na tabela clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS numero_cliente VARCHAR(20) UNIQUE;

-- Função para gerar número de cliente automaticamente
CREATE OR REPLACE FUNCTION generate_cliente_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    year_suffix VARCHAR(4);
BEGIN
    -- Pegar o ano atual
    year_suffix := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    -- Buscar o próximo número sequencial para o ano
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_cliente FROM 3 FOR 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM clientes
    WHERE numero_cliente LIKE 'CL' || year_suffix || '%';
    
    -- Gerar o número do cliente no formato CL2025000001
    NEW.numero_cliente := 'CL' || year_suffix || LPAD(next_number::VARCHAR, 6, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para gerar número de cliente automaticamente
CREATE TRIGGER generate_cliente_number_trigger BEFORE INSERT ON clientes
    FOR EACH ROW 
    WHEN (NEW.numero_cliente IS NULL OR NEW.numero_cliente = '')
    EXECUTE FUNCTION generate_cliente_number();

-- Atualizar clientes existentes com números sequenciais
DO $$
DECLARE
    cliente_record RECORD;
    counter INTEGER := 1;
    year_suffix VARCHAR(4);
BEGIN
    year_suffix := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    FOR cliente_record IN 
        SELECT id FROM clientes WHERE numero_cliente IS NULL ORDER BY created_at
    LOOP
        UPDATE clientes 
        SET numero_cliente = 'CL' || year_suffix || LPAD(counter::VARCHAR, 6, '0')
        WHERE id = cliente_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_numero_cliente ON clientes(numero_cliente);

-- Comentários para documentação
COMMENT ON COLUMN clientes.numero_cliente IS 'Número sequencial do cliente no formato CL2025000001';