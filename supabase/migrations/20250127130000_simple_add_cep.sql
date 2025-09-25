-- Migração simples para adicionar coluna CEP à tabela clientes_portal
-- Resolve o erro: column "cep" of relation "clientes_portal" does not exist

-- Adicionar coluna CEP se não existir
ALTER TABLE clientes_portal 
ADD COLUMN IF NOT EXISTS cep VARCHAR(10);

-- Comentário na coluna
COMMENT ON COLUMN clientes_portal.cep IS 'CEP do endereço do cliente';

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_clientes_portal_cep ON clientes_portal(cep);