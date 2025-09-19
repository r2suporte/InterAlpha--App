-- Migração final para garantir que cliente_id seja opcional
-- Esta migração deve ser aplicada por último

-- Remover todas as constraints relacionadas
ALTER TABLE ordens_servico 
DROP CONSTRAINT IF EXISTS check_cliente_reference;

-- Forçar cliente_id como opcional
ALTER TABLE ordens_servico 
ALTER COLUMN cliente_id DROP NOT NULL;

-- Adicionar constraint mais flexível
ALTER TABLE ordens_servico 
ADD CONSTRAINT check_cliente_reference 
CHECK (cliente_id IS NOT NULL OR cliente_portal_id IS NOT NULL);

-- Log para confirmar
DO $$
BEGIN
    RAISE NOTICE 'Migração final aplicada - cliente_id agora é opcional';
END $$;