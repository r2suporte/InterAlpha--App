-- Verificar triggers ativos na tabela ordens_servico
SELECT 
    t.tgname AS trigger_name,
    c.relname AS table_name,
    p.proname AS function_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'ordens_servico'
  AND NOT t.tgisinternal;

-- Verificar também todas as funções que podem estar relacionadas
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc 
WHERE prosrc LIKE '%cliente_id%'
  AND prosrc LIKE '%cp.%';