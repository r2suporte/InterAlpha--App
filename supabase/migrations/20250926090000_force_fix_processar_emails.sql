-- Forçar correção definitiva da função processar_emails_pendentes
-- Dropar e recriar completamente para garantir que não há referências a cp.cliente_id

-- Primeiro, dropar a função existente
DROP FUNCTION IF EXISTS processar_emails_pendentes() CASCADE;

-- Recriar a função corrigida sem qualquer referência a cp.cliente_id
CREATE OR REPLACE FUNCTION processar_emails_pendentes()
RETURNS void AS $$
DECLARE
  email_record RECORD;
BEGIN
  -- Processar emails pendentes na fila
  FOR email_record IN
    SELECT 
      cc.id,
      cc.cliente_portal_id,
      cc.ordem_servico_id,
      cc.destinatario,
      cc.assunto,
      cc.mensagem,
      os.numero_os,
      os.titulo,
      os.data_inicio,
      os.status,
      cp.nome as cliente_nome  -- Usar diretamente o nome do cliente_portal
    FROM comunicacoes_cliente cc
    JOIN ordens_servico os ON cc.ordem_servico_id = os.id
    JOIN clientes_portal cp ON cc.cliente_portal_id = cp.id
    -- REMOVIDO: JOIN clientes c ON cp.cliente_id = c.id (esta coluna não existe)
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
      data_envio = NOW(),
      updated_at = NOW()
    WHERE id = email_record.id;
    
    -- Log do processamento
    RAISE NOTICE 'Email processado para OS #% - Cliente: %', 
      email_record.numero_os, 
      email_record.cliente_nome;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Adicionar comentário explicativo
COMMENT ON FUNCTION processar_emails_pendentes() IS 'Função para processar emails pendentes na fila. Versão corrigida que usa apenas dados de clientes_portal sem referências a cp.cliente_id.';