-- Corrigir função trigger que ainda referencia NEW.cliente_id
-- O problema é que a função está tentando buscar email em clientes usando NEW.cliente_id
-- mas deveria buscar no cliente_portal usando NEW.cliente_portal_id

-- Recriar função de trigger para email corrigida
CREATE OR REPLACE FUNCTION trigger_criar_comunicacao_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir comunicação de email para o cliente portal
  -- Só inserir se cliente_portal_id estiver preenchido
  IF NEW.cliente_portal_id IS NOT NULL THEN
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
      cp.email,  -- Buscar email do cliente_portal
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
    FROM clientes_portal cp
    WHERE cp.id = NEW.cliente_portal_id  -- Usar cliente_portal_id em vez de cliente_id
      AND cp.email IS NOT NULL
      AND cp.email != '';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atualizar comentário da função
COMMENT ON FUNCTION trigger_criar_comunicacao_email() IS 'Trigger para criar comunicação de email. Corrigido para usar cliente_portal_id em vez de cliente_id.';