-- Desabilitar temporariamente os triggers de email para debug

DROP TRIGGER IF EXISTS trigger_email_ordem_servico ON ordens_servico;
DROP TRIGGER IF EXISTS trigger_email_update_os ON ordens_servico;