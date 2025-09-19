-- Migração para criar sistema de portal do cliente

-- Criar tabela de clientes do portal (separada da autenticação principal)
CREATE TABLE IF NOT EXISTS clientes_portal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  login VARCHAR(50) NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  senha_temporaria VARCHAR(20), -- Senha temporária para primeiro acesso
  primeiro_acesso BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_portal_email ON clientes_portal(email);
CREATE INDEX IF NOT EXISTS idx_clientes_portal_login ON clientes_portal(login);
CREATE INDEX IF NOT EXISTS idx_clientes_portal_ativo ON clientes_portal(ativo);

-- Adicionar campo cliente_portal_id na tabela ordens_servico
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS cliente_portal_id UUID REFERENCES clientes_portal(id);

-- Criar índice para a referência
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente_portal ON ordens_servico(cliente_portal_id);

-- Criar tabela de sessões do portal do cliente
CREATE TABLE IF NOT EXISTS cliente_portal_sessoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_portal_id UUID NOT NULL REFERENCES clientes_portal(id) ON DELETE CASCADE,
  token_sessao TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para sessões
CREATE INDEX IF NOT EXISTS idx_cliente_portal_sessoes_cliente ON cliente_portal_sessoes(cliente_portal_id);
CREATE INDEX IF NOT EXISTS idx_cliente_portal_sessoes_token ON cliente_portal_sessoes(token_sessao);
CREATE INDEX IF NOT EXISTS idx_cliente_portal_sessoes_expires ON cliente_portal_sessoes(expires_at);

-- Criar tabela de comunicações com o cliente
CREATE TABLE IF NOT EXISTS comunicacoes_cliente (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  cliente_portal_id UUID REFERENCES clientes_portal(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('email', 'whatsapp', 'sms', 'sistema')),
  assunto VARCHAR(255),
  mensagem TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'entregue', 'lido', 'erro')),
  tentativas INTEGER DEFAULT 0,
  erro_detalhes TEXT,
  enviado_em TIMESTAMP WITH TIME ZONE,
  lido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para comunicações
CREATE INDEX IF NOT EXISTS idx_comunicacoes_ordem_servico ON comunicacoes_cliente(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_comunicacoes_cliente_portal ON comunicacoes_cliente(cliente_portal_id);
CREATE INDEX IF NOT EXISTS idx_comunicacoes_tipo ON comunicacoes_cliente(tipo);
CREATE INDEX IF NOT EXISTS idx_comunicacoes_status ON comunicacoes_cliente(status);

-- Criar tabela de aprovações/interações do cliente
CREATE TABLE IF NOT EXISTS cliente_aprovacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  cliente_portal_id UUID NOT NULL REFERENCES clientes_portal(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('orcamento', 'servico_adicional', 'forma_pagamento', 'prazo_entrega')),
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'expirado')),
  observacoes_cliente TEXT,
  aprovado_em TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para aprovações
CREATE INDEX IF NOT EXISTS idx_aprovacoes_ordem_servico ON cliente_aprovacoes(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_cliente_portal ON cliente_aprovacoes(cliente_portal_id);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_tipo ON cliente_aprovacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_status ON cliente_aprovacoes(status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_clientes_portal_updated_at 
  BEFORE UPDATE ON clientes_portal 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comunicacoes_cliente_updated_at 
  BEFORE UPDATE ON comunicacoes_cliente 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cliente_aprovacoes_updated_at 
  BEFORE UPDATE ON cliente_aprovacoes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE clientes_portal IS 'Clientes com acesso ao portal (autenticação separada)';
COMMENT ON TABLE cliente_portal_sessoes IS 'Sessões ativas do portal do cliente';
COMMENT ON TABLE comunicacoes_cliente IS 'Histórico de comunicações enviadas ao cliente';
COMMENT ON TABLE cliente_aprovacoes IS 'Aprovações e interações do cliente com ordens de serviço';

COMMENT ON COLUMN clientes_portal.senha_temporaria IS 'Senha temporária para primeiro acesso (removida após alteração)';
COMMENT ON COLUMN clientes_portal.primeiro_acesso IS 'Indica se o cliente ainda não alterou a senha temporária';
COMMENT ON COLUMN comunicacoes_cliente.tentativas IS 'Número de tentativas de envio';
COMMENT ON COLUMN cliente_aprovacoes.expires_at IS 'Data de expiração da solicitação de aprovação';