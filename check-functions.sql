-- Verificar triggers ativos na tabela ordens_servico
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  CASE 
    WHEN p.prosrc ILIKE '%cp.cliente_id%' THEN 'PROBLEMA: Contém cp.cliente_id'
    ELSE 'OK'
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'ordens_servico'
  AND NOT t.tgisinternal;

-- Verificar todas as funções que contêm cp.cliente_id
SELECT 
  proname as function_name,
  SUBSTRING(prosrc, 1, 200) as function_preview
FROM pg_proc 
WHERE prosrc ILIKE '%cp.cliente_id%';

-- Verificar se há views que usam cp.cliente_id
SELECT 
  schemaname,
  viewname,
  CASE 
    WHEN definition ILIKE '%cp.cliente_id%' THEN 'PROBLEMA: Contém cp.cliente_id'
    ELSE 'OK'
  END as status
FROM pg_views 
WHERE definition ILIKE '%cp.cliente_id%';