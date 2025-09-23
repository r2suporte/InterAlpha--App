-- Migração para corrigir a função generate_cliente_number

-- Corrigir a função para gerar número de cliente automaticamente
CREATE OR REPLACE FUNCTION generate_cliente_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    year_suffix VARCHAR(4);
BEGIN
    -- Pegar o ano atual
    year_suffix := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    -- Buscar o próximo número sequencial para o ano
    -- Formato: CL2025000001 - extrair os últimos 6 dígitos (posição 7 em diante)
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_cliente FROM 7) AS INTEGER)), 0) + 1
    INTO next_number
    FROM clientes
    WHERE numero_cliente LIKE 'CL' || year_suffix || '%';
    
    -- Gerar o número do cliente no formato CL2025000001
    NEW.numero_cliente := 'CL' || year_suffix || LPAD(next_number::VARCHAR, 6, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Comentário para documentação
COMMENT ON FUNCTION generate_cliente_number() IS 'Função corrigida para gerar número sequencial de cliente no formato CL2025000001';