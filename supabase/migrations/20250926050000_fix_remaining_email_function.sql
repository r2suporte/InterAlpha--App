-- Corrigir a função processar_emails_pendentes restante que ainda referencia cp.cliente_id
-- Esta função está na migração 20250126140000_fix_email_triggers.sql linha 62

CREATE OR REPLACE FUNCTION processar_emails_pendentes()
RETURNS INTEGER AS $$
DECLARE
  email_record RECORD;
  emails_processados INTEGER := 0;
BEGIN
  -- Loop através dos emails pendentes
  FOR email_record IN
    SELECT 
      cc.id,
      cc.mensagem,
      cc.destinatario,
      cc.assunto,
      os.titulo as ordem_titulo,
      os.descricao as ordem_descricao,
      os.valor_servico,
      os.data_inicio,
      os.status,
      cp.nome as cliente_nome,
      cp.email as cliente_email
    FROM comunicacoes_cliente cc
    JOIN ordens_servico os ON cc.ordem_servico_id = os.id
    JOIN clientes_portal cp ON cc.cliente_portal_id = cp.id
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

-- Adicionar comentário explicativo
COMMENT ON FUNCTION processar_emails_pendentes() IS 'Função para processar emails pendentes na fila. Corrigida para usar dados diretamente de clientes_portal em vez de fazer JOIN com clientes via cp.cliente_id que não existe mais.';