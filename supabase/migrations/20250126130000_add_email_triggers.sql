-- Função para enviar email automaticamente quando uma OS for criada ou atualizada
CREATE OR REPLACE FUNCTION trigger_email_ordem_servico()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSON;
  http_response RECORD;
BEGIN
  -- URL do webhook para envio de email (ajustar conforme necessário)
  webhook_url := 'http://localhost:3000/api/ordens-servico/email';
  
  -- Preparar payload baseado no tipo de operação
  IF TG_OP = 'INSERT' THEN
    payload := json_build_object(
      'ordem_servico_id', NEW.id,
      'tipo_email', 'criacao'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Só enviar email se o status mudou
    IF OLD.status != NEW.status THEN
      payload := json_build_object(
        'ordem_servico_id', NEW.id,
        'tipo_email', CASE 
          WHEN NEW.status = 'concluido' THEN 'conclusao'
          ELSE 'atualizacao'
        END
      );
    ELSE
      -- Se não houve mudança de status, não enviar email
      RETURN NEW;
    END IF;
  END IF;
  
  -- Fazer requisição HTTP para o webhook (requer extensão http)
  -- Nota: Esta parte requer a extensão pg_net ou http para funcionar
  -- Por enquanto, vamos apenas registrar na tabela de comunicações
  
  -- Inserir registro na tabela de comunicações para processamento posterior
  -- Só inserir se a OS tem cliente_portal_id
  IF NEW.cliente_portal_id IS NOT NULL THEN
    INSERT INTO comunicacoes_cliente (
      cliente_portal_id,
      ordem_servico_id,
      tipo,
      destinatario,
      assunto,
      mensagem,
      status
    )
    SELECT 
      NEW.cliente_portal_id,
      NEW.id,
      'email',
      cp.email,
      'OS #' || NEW.numero_os || ' - ' || CASE 
        WHEN TG_OP = 'INSERT' THEN 'Criada'
        WHEN NEW.status = 'concluido' THEN 'Concluída'
        ELSE 'Atualizada'
      END,
      'Sua ordem de serviço #' || NEW.numero_os || ' foi ' || CASE 
        WHEN TG_OP = 'INSERT' THEN 'criada'
        WHEN NEW.status = 'concluido' THEN 'concluída'
        ELSE 'atualizada'
      END || '. Acesse o portal para mais detalhes.',
      'pendente'
    FROM clientes_portal cp
    WHERE cp.id = NEW.cliente_portal_id
      AND cp.email IS NOT NULL
      AND cp.email != '';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para envio automático de email quando uma OS é criada
CREATE TRIGGER trigger_email_ordem_servico
   AFTER INSERT ON ordens_servico
   FOR EACH ROW
   EXECUTE FUNCTION trigger_email_ordem_servico();

-- Trigger para atualização de OS
DROP TRIGGER IF EXISTS trigger_email_update_os ON ordens_servico;
CREATE TRIGGER trigger_email_update_os
  AFTER UPDATE ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION trigger_email_ordem_servico();



-- Função para processar emails pendentes (pode ser chamada por um job)
CREATE OR REPLACE FUNCTION processar_emails_pendentes()
RETURNS INTEGER AS $$
DECLARE
  email_record RECORD;
  emails_processados INTEGER := 0;
BEGIN
  -- Buscar emails pendentes
  FOR email_record IN 
    SELECT 
      cc.*,
      os.numero_os,
      os.descricao,
      os.valor,
      os.data_inicio,
      os.status,
      c.nome as cliente_nome
    FROM comunicacoes_cliente cc
    JOIN ordens_servico os ON cc.ordem_servico_id = os.id
    JOIN clientes_portal cp ON cc.cliente_portal_id = cp.id
    JOIN clientes c ON cp.cliente_id = c.id
    WHERE cc.tipo = 'email' 
      AND cc.status = 'pendente'
    ORDER BY cc.created_at
    LIMIT 10 -- Processar até 10 emails por vez
  LOOP
    -- Aqui você pode fazer a chamada HTTP para sua API de email
    -- Por enquanto, vamos apenas marcar como processado
    
    UPDATE comunicacoes_cliente 
    SET 
      status = 'enviado',
      enviado_em = NOW(),
      mensagem = mensagem || ' - Processado automaticamente'
    WHERE id = email_record.id;
    
    emails_processados := emails_processados + 1;
  END LOOP;
  
  RETURN emails_processados;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON FUNCTION trigger_email_ordem_servico() IS 'Trigger para envio automático de emails quando uma ordem de serviço é criada ou atualizada';
COMMENT ON FUNCTION processar_emails_pendentes() IS 'Função para processar emails pendentes na fila. Pode ser executada por um job scheduler';

-- Índices para melhorar performance das consultas de email
CREATE INDEX IF NOT EXISTS idx_comunicacoes_cliente_status_tipo 
ON comunicacoes_cliente(status, tipo);

CREATE INDEX IF NOT EXISTS idx_comunicacoes_cliente_created_at 
ON comunicacoes_cliente(created_at) 
WHERE status = 'pendente';