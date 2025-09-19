-- Migração para corrigir funções com joins incorretos

-- Recriar função de trigger para email com join correto
CREATE OR REPLACE FUNCTION trigger_criar_comunicacao_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir comunicação de email para o cliente
  INSERT INTO comunicacoes_cliente (
    ordem_servico_id,
    cliente_portal_id,
    tipo,
    destinatario,
    assunto,
    mensagem,
    status
  )
  SELECT 
    NEW.id,
    NEW.cliente_portal_id,
    'email',
    c.email,
    'Email automático de ' || CASE 
      WHEN TG_OP = 'INSERT' THEN 'criação'
      WHEN NEW.status = 'concluido' THEN 'conclusão'
      ELSE 'atualização'
    END || ' da OS #' || NEW.numero_os,
    'Sua ordem de serviço #' || NEW.numero_os || ' foi ' || CASE 
      WHEN TG_OP = 'INSERT' THEN 'criada'
      WHEN NEW.status = 'concluido' THEN 'concluída'
      ELSE 'atualizada'
    END || '. Acesse o portal para mais detalhes.',
    'pendente'
  FROM clientes c
  WHERE c.id = NEW.cliente_id
    AND c.email IS NOT NULL
    AND c.email != '';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar função para processar emails pendentes com join correto
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
      os.valor_servico,
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