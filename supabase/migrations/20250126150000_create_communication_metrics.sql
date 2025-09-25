-- Criação da tabela de métricas de comunicação
CREATE TABLE IF NOT EXISTS communication_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service VARCHAR(20) NOT NULL CHECK (service IN ('email', 'sms', 'whatsapp', 'communication')),
  operation VARCHAR(100) NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_communication_metrics_service ON communication_metrics(service);
CREATE INDEX IF NOT EXISTS idx_communication_metrics_operation ON communication_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_communication_metrics_created_at ON communication_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_communication_metrics_success ON communication_metrics(success);
CREATE INDEX IF NOT EXISTS idx_communication_metrics_service_operation ON communication_metrics(service, operation);

-- Índice composto para consultas de performance
CREATE INDEX IF NOT EXISTS idx_communication_metrics_performance 
ON communication_metrics(service, operation, created_at, success, duration_ms);

-- Política RLS (Row Level Security)
ALTER TABLE communication_metrics ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de métricas (sistema interno)
CREATE POLICY "Allow metrics insertion" ON communication_metrics
  FOR INSERT WITH CHECK (true);

-- Política para leitura de métricas (usuários autenticados)
CREATE POLICY "Allow metrics read" ON communication_metrics
  FOR SELECT USING (true);

-- Função para limpeza automática de métricas antigas (manter apenas 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM communication_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE communication_metrics IS 'Métricas de performance dos serviços de comunicação';
COMMENT ON COLUMN communication_metrics.service IS 'Tipo de serviço: email, sms, whatsapp, communication';
COMMENT ON COLUMN communication_metrics.operation IS 'Nome da operação executada';
COMMENT ON COLUMN communication_metrics.duration_ms IS 'Duração da operação em milissegundos';
COMMENT ON COLUMN communication_metrics.success IS 'Se a operação foi bem-sucedida';
COMMENT ON COLUMN communication_metrics.error_message IS 'Mensagem de erro, se houver';
COMMENT ON COLUMN communication_metrics.metadata IS 'Dados adicionais da operação em formato JSON';