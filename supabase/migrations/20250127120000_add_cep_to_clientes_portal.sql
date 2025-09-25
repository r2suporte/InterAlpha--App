-- Migração para adicionar coluna CEP à tabela clientes_portal
-- Esta migração resolve o erro "column cep of relation clientes_portal does not exist"

-- Adicionar coluna CEP à tabela clientes_portal
ALTER TABLE clientes_portal 
ADD COLUMN IF NOT EXISTS cep VARCHAR(10);

-- Adicionar comentário explicativo
COMMENT ON COLUMN clientes_portal.cep IS 'CEP do endereço do cliente (formato: 00000-000)';

-- Criar índice para performance em buscas por CEP
CREATE INDEX IF NOT EXISTS idx_clientes_portal_cep ON clientes_portal(cep);

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ COLUNA CEP ADICIONADA: clientes_portal.cep criada com sucesso';
  RAISE NOTICE '📋 Tipo: VARCHAR(10) para suportar formato 00000-000';
  RAISE NOTICE '🔧 Índice criado: idx_clientes_portal_cep para performance';
END $$;