-- Atualizar tabela de clientes com novos campos
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(10) DEFAULT 'CPF',
ADD COLUMN IF NOT EXISTS logradouro TEXT,
ADD COLUMN IF NOT EXISTS numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS bairro VARCHAR(100),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
ADD COLUMN IF NOT EXISTS pais VARCHAR(50) DEFAULT 'Brasil';

-- Atualizar comentários das colunas
COMMENT ON COLUMN clientes.tipo_documento IS 'Tipo do documento: CPF ou CNPJ';
COMMENT ON COLUMN clientes.cpf_cnpj IS 'Número do CPF ou CNPJ do cliente';
COMMENT ON COLUMN clientes.logradouro IS 'Logradouro do endereço (rua, avenida, etc.)';
COMMENT ON COLUMN clientes.numero IS 'Número do endereço';
COMMENT ON COLUMN clientes.complemento IS 'Complemento do endereço (apartamento, sala, etc.)';
COMMENT ON COLUMN clientes.bairro IS 'Bairro do endereço';
COMMENT ON COLUMN clientes.cidade IS 'Cidade do endereço';
COMMENT ON COLUMN clientes.estado IS 'Estado (UF) do endereço';
COMMENT ON COLUMN clientes.cep IS 'CEP do endereço';
COMMENT ON COLUMN clientes.pais IS 'País do endereço';

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_cidade ON clientes(cidade);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);

-- Adicionar constraint para validar tipo de documento
ALTER TABLE clientes 
ADD CONSTRAINT chk_tipo_documento 
CHECK (tipo_documento IN ('CPF', 'CNPJ'));

-- Adicionar constraint para validar estado (UF)
ALTER TABLE clientes 
ADD CONSTRAINT chk_estado 
CHECK (estado IN ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'));