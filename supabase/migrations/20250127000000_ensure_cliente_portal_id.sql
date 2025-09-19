-- Garantir que a coluna cliente_portal_id existe na tabela ordens_servico
-- Esta migração é idempotente e pode ser executada múltiplas vezes

-- Verificar se a tabela clientes_portal existe
CREATE TABLE IF NOT EXISTS clientes_portal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  login VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_clientes_portal_email ON clientes_portal(email);
CREATE INDEX IF NOT EXISTS idx_clientes_portal_login ON clientes_portal(login);
CREATE INDEX IF NOT EXISTS idx_clientes_portal_ativo ON clientes_portal(ativo);

-- Adicionar a coluna cliente_portal_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ordens_servico' 
      AND table_schema = 'public'
      AND column_name = 'cliente_portal_id'
  ) THEN
    ALTER TABLE ordens_servico 
    ADD COLUMN cliente_portal_id UUID REFERENCES clientes_portal(id);
    
    RAISE NOTICE 'Coluna cliente_portal_id adicionada à tabela ordens_servico';
  ELSE
    RAISE NOTICE 'Coluna cliente_portal_id já existe na tabela ordens_servico';
  END IF;
END $$;

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente_portal 
ON ordens_servico(cliente_portal_id);

-- Verificar se a constraint existe e é válida
DO $$
BEGIN
  -- Verificar se a foreign key constraint existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'ordens_servico'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'cliente_portal_id'
  ) THEN
    -- Adicionar a constraint se não existir
    ALTER TABLE ordens_servico 
    ADD CONSTRAINT fk_ordens_servico_cliente_portal 
    FOREIGN KEY (cliente_portal_id) REFERENCES clientes_portal(id);
    
    RAISE NOTICE 'Foreign key constraint adicionada para cliente_portal_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint já existe para cliente_portal_id';
  END IF;
END $$;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migração concluída: coluna cliente_portal_id garantida na tabela ordens_servico';
END $$;