-- SQL para executar no Dashboard do Supabase
-- Verificar todos os triggers na tabela ordens_servico

-- 1. Listar triggers na tabela ordens_servico
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'ordens_servico'
AND trigger_schema = 'public';

-- 2. Verificar a definição atual da função processar_emails_pendentes
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'processar_emails_pendentes';

-- 3. Listar todas as funções que podem conter cp.cliente_id
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) LIKE '%cp.cliente_id%';

-- 4. Verificar se há triggers ativos que podem estar causando o problema
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_statement,
    CASE 
        WHEN t.action_statement LIKE '%processar_emails_pendentes%' THEN 'processar_emails_pendentes'
        ELSE 'other_function'
    END as function_name
FROM information_schema.triggers t
WHERE t.trigger_schema = 'public'
AND t.event_object_table = 'ordens_servico';

-- 5. Verificar especificamente a função processar_emails_pendentes se ela existe
SELECT 
    proname,
    pg_get_functiondef(oid) as current_definition
FROM pg_proc
WHERE proname = 'processar_emails_pendentes';