-- Correção final da função processar_emails_pendentes
-- Remove definitivamente qualquer referência a cp.cliente_id

-- Dropar a função existente para garantir que não há conflitos
DROP FUNCTION IF EXISTS processar_emails_pendentes();

-- Recriar a função sem qualquer referência a cp.cliente_id
CREATE OR REPLACE FUNCTION processar_emails_pendentes()
RETURNS INTEGER AS $$
DECLARE
  email_record RECORD;
  emails_processados INTEGER := 0;
BEGIN
  -- Processar emails pendentes
  FOR email_record IN
    SELECT 
      cc.*,
      os.numero_os,
      os.descricao,
      os.valor,
      os.data_inicio,
      os.status,
      cp.nome as cliente_nome,
      cp.email as cliente_email
    FROM comunicacoes_cliente cc
    JOIN ordens_servico os ON cc.ordem_servico_id = os.id
    JOIN clientes_portal cp ON cc.cliente_portal_id = cp.id
    WHERE cc.tipo = 'email' 
      AND cc.status = 'pendente'
      AND cp.email IS NOT NULL
      AND cp.email != ''
    ORDER BY cc.created_at
    LIMIT 10 -- Processar até 10 emails por vez
  LOOP
    -- Marcar como processado
    UPDATE comunicacoes_cliente 
    SET 
      status = 'enviado',
      data_envio = NOW(),
      updated_at = NOW()
    WHERE id = email_record.id;
    
    emails_processados := emails_processados + 1;
  END LOOP;
  
  RETURN emails_processados;
END;
$$ LANGUAGE plpgsql;

-- Comentário explicativo
COMMENT ON FUNCTION processar_emails_pendentes() IS 'Função para processar emails pendentes na fila. Versão final sem referências a cp.cliente_id.';