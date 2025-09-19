-- Corrigir funções que referenciam cp.cliente_id incorretamente
-- O problema é que as funções estão tentando fazer JOIN com clientes usando cp.cliente_id
-- mas essa coluna não existe mais. Vamos remover esse JOIN desnecessário.

-- Recriar a função processar_emails_pendentes sem o JOIN problemático
CREATE OR REPLACE FUNCTION processar_emails_pendentes()
RETURNS INTEGER AS $$
DECLARE
  email_record RECORD;
  emails_processados INTEGER := 0;
BEGIN
  -- Buscar emails pendentes (removendo o JOIN problemático com clientes)
  FOR email_record IN 
    SELECT 
      cc.*,
      os.numero_os,
      os.descricao,
      os.valor_servico,
      os.data_inicio,
      os.status,
      cp.nome as cliente_nome  -- Usar o nome do cliente_portal diretamente
    FROM comunicacoes_cliente cc
    JOIN ordens_servico os ON cc.ordem_servico_id = os.id
    JOIN clientes_portal cp ON cc.cliente_portal_id = cp.id
    -- Removido: JOIN clientes c ON cp.cliente_id = c.id (coluna não existe)
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

-- Atualizar comentário da função
COMMENT ON FUNCTION processar_emails_pendentes() IS 'Função para processar emails pendentes na fila. Corrigida para não referenciar cp.cliente_id que não existe mais.';