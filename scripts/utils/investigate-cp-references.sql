-- Investigar referências a cp.cliente_id

-- 1. Buscar views que referenciam cp.cliente_id
SELECT 'VIEWS' as type, schemaname, viewname as name, definition as content
FROM pg_views 
WHERE definition ILIKE '%cp.cliente_id%';

-- 2. Buscar triggers que referenciam cp.cliente_id  
SELECT 'TRIGGERS' as type, n.nspname as schemaname, t.tgname as name, p.prosrc as content
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.prosrc ILIKE '%cp.cliente_id%';

-- 3. Buscar funções que referenciam cp.cliente_id
SELECT 'FUNCTIONS' as type, n.nspname as schemaname, p.proname as name, p.prosrc as content
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc ILIKE '%cp.cliente_id%';

-- 4. Buscar políticas RLS que referenciam cp.cliente_id
SELECT 'POLICIES' as type, schemaname, tablename as name, policyname, qual as content
FROM pg_policies 
WHERE qual ILIKE '%cp.cliente_id%';

-- 5. Verificar se existe alguma tabela com alias cp ou coluna relacionada
SELECT 'TABLES' as type, table_schema as schemaname, table_name as name, column_name as content
FROM information_schema.columns 
WHERE table_name ILIKE '%cp%' OR column_name ILIKE '%cp%' OR column_name ILIKE '%cliente_portal%';

-- 6. Buscar por qualquer referência a cp. em todo o banco
SELECT 'ALL_OBJECTS' as type, 'search' as schemaname, 'cp_references' as name, 'Found cp. references' as content
WHERE EXISTS (
  SELECT 1 FROM pg_views WHERE definition ILIKE '%cp.%'
  UNION
  SELECT 1 FROM pg_proc WHERE prosrc ILIKE '%cp.%'
  UNION  
  SELECT 1 FROM pg_policies WHERE qual ILIKE '%cp.%'
);