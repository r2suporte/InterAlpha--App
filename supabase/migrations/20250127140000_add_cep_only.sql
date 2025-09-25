-- Migração isolada para adicionar apenas a coluna CEP
-- Evita conflitos com outras migrações

-- Adicionar coluna CEP se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes_portal' 
        AND column_name = 'cep'
    ) THEN
        ALTER TABLE clientes_portal ADD COLUMN cep VARCHAR(10);
        RAISE NOTICE '✅ Coluna CEP adicionada à tabela clientes_portal';
    ELSE
        RAISE NOTICE '⚠️  Coluna CEP já existe na tabela clientes_portal';
    END IF;
END $$;

-- Adicionar comentário à coluna
COMMENT ON COLUMN clientes_portal.cep IS 'CEP do endereço do cliente';

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_clientes_portal_cep ON clientes_portal(cep);