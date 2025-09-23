-- Migração: Criar tabela para mensagens WhatsApp de números não identificados
-- Data: 2024-12-19
-- Descrição: Armazena mensagens recebidas via WhatsApp de números que não estão cadastrados como clientes

-- Criar tabela para mensagens WhatsApp de números não identificados
CREATE TABLE IF NOT EXISTS mensagens_whatsapp_nao_identificadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telefone VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    whatsapp_message_id VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    processada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_nao_identificadas_telefone 
ON mensagens_whatsapp_nao_identificadas(telefone);

CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_nao_identificadas_processada 
ON mensagens_whatsapp_nao_identificadas(processada);

CREATE INDEX IF NOT EXISTS idx_mensagens_whatsapp_nao_identificadas_timestamp 
ON mensagens_whatsapp_nao_identificadas(timestamp);

-- Adicionar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mensagens_whatsapp_nao_identificadas_updated_at 
    BEFORE UPDATE ON mensagens_whatsapp_nao_identificadas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE mensagens_whatsapp_nao_identificadas IS 'Armazena mensagens recebidas via WhatsApp de números não cadastrados como clientes';
COMMENT ON COLUMN mensagens_whatsapp_nao_identificadas.telefone IS 'Número de telefone que enviou a mensagem';
COMMENT ON COLUMN mensagens_whatsapp_nao_identificadas.mensagem IS 'Conteúdo da mensagem recebida';
COMMENT ON COLUMN mensagens_whatsapp_nao_identificadas.whatsapp_message_id IS 'ID único da mensagem no WhatsApp';
COMMENT ON COLUMN mensagens_whatsapp_nao_identificadas.timestamp IS 'Timestamp de quando a mensagem foi enviada';
COMMENT ON COLUMN mensagens_whatsapp_nao_identificadas.metadata IS 'Metadados adicionais da mensagem em formato JSON';
COMMENT ON COLUMN mensagens_whatsapp_nao_identificadas.processada IS 'Indica se a mensagem foi processada pela equipe';