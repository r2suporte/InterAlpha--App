-- Investigar referências a cliente_id

-- 1. Verificar views que podem estar usando cp.cliente_id
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%cliente_id%';

-- 2. Verificar triggers na tabela ordens_servico
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
AND event_object_table = 'ordens_servico';

-- 3. Verificar funções que podem estar sendo chamadas
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE prosrc ILIKE '%cp.cliente_id%' 
OR prosrc ILIKE '%cliente_portal%';

-- 4. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'ordens_servico';

-- 5. Testar inserção direta
INSERT INTO public.ordens_servico (
  cliente_portal_id,
  titulo,
  descricao,
  status,
  prioridade,
  valor_servico
) VALUES (
  (SELECT id FROM public.clientes_portal LIMIT 1),
  'Teste SQL direto',
  'Teste de inserção via SQL',
  'aberta',
  'media',
  100.00
) RETURNING *;