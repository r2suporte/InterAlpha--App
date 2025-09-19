-- Corrigir função de geração de número de OS
CREATE OR REPLACE FUNCTION generate_os_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    year_suffix VARCHAR(4);
BEGIN
    -- Pegar o ano atual
    year_suffix := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    -- Buscar o próximo número sequencial para o ano
    -- Formato: OS2025000001 - extrair os últimos 6 dígitos
    SELECT COALESCE(MAX(CAST(RIGHT(numero_os, 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM ordens_servico
    WHERE numero_os LIKE 'OS' || year_suffix || '%';
    
    -- Gerar o número da OS no formato OS2025000001
    NEW.numero_os := 'OS' || year_suffix || LPAD(next_number::VARCHAR, 6, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';