-- Criar função para executar SQL dinamicamente (apenas para debug)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS TABLE(result jsonb) AS $$
BEGIN
  RETURN QUERY EXECUTE 'SELECT to_jsonb(t) FROM (' || query || ') t';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;