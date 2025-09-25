-- Migração para adicionar coluna CEP à tabela clientes_portal
-- Esta migração resolve o erro "column cep of relation clientes_portal does not exist"

-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    -- Adicionar coluna CEP se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes_portal' 
        AND column_name = 'cep'
    ) THEN
        ALTER TABLE clientes_portal ADD COLUMN cep VARCHAR(10);
        RAISE NOTICE '✅ Coluna CEP adicionada à tabela clientes_portal';
    ELSE
        RAISE NOTICE '⚠️  Coluna CEP já existe na tabela clientes_portal';
    END IF;

    -- Adicionar comentário explicativo
    EXECUTE 'COMMENT ON COLUMN clientes_portal.cep IS ''CEP do endereço do cliente (formato: 00000-000)''';

    -- Criar índice para performance se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'clientes_portal' 
        AND indexname = 'idx_clientes_portal_cep'
    ) THEN
        CREATE INDEX idx_clientes_portal_cep ON clientes_portal(cep);
        RAISE NOTICE '🔧 Índice idx_clientes_portal_cep criado';
    ELSE
        RAISE NOTICE '⚠️  Índice idx_clientes_portal_cep já existe';
    END IF;

    RAISE NOTICE '🎉 Migração concluída com sucesso!';
END $$;