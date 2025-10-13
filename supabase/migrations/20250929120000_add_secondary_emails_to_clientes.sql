-- Adicionar colunas opcionais para e-mails adicionais em clientes
-- Cobre clientes pessoa física e jurídica (empresas)

-- Adicionar colunas email2 e email3 se não existirem
ALTER TABLE clientes 
  ADD COLUMN IF NOT EXISTS email2 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email3 VARCHAR(255);

-- Constraints simples de formato (opcional, não bloqueiam nulos)
ALTER TABLE clientes 
  ADD CONSTRAINT IF NOT EXISTS chk_clientes_email2_format 
  CHECK (email2 IS NULL OR email2 ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

ALTER TABLE clientes 
  ADD CONSTRAINT IF NOT EXISTS chk_clientes_email3_format 
  CHECK (email3 IS NULL OR email3 ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

-- Índices para busca por e-mails adicionais
CREATE INDEX IF NOT EXISTS idx_clientes_email2 ON clientes(email2);
CREATE INDEX IF NOT EXISTS idx_clientes_email3 ON clientes(email3);

-- Comentários
COMMENT ON COLUMN clientes.email2 IS 'E-mail secundário do cliente (opcional)';
COMMENT ON COLUMN clientes.email3 IS 'E-mail terciário do cliente (opcional)';