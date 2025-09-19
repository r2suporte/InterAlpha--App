-- Migração para tornar cliente_id opcional na tabela ordens_servico
-- Isso permite que ordens de serviço sejam criadas apenas com cliente_portal_id

-- Tornar cliente_id opcional (permitir NULL)
ALTER TABLE ordens_servico 
ALTER COLUMN cliente_id DROP NOT NULL;

-- Adicionar constraint para garantir que pelo menos um dos dois campos esteja preenchido
ALTER TABLE ordens_servico 
ADD CONSTRAINT check_cliente_reference 
CHECK (cliente_id IS NOT NULL OR cliente_portal_id IS NOT NULL);

-- Comentário explicativo
COMMENT ON CONSTRAINT check_cliente_reference ON ordens_servico IS 
'Garante que pelo menos um dos campos cliente_id ou cliente_portal_id esteja preenchido';