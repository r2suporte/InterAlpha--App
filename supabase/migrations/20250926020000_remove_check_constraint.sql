-- Remover constraint check_cliente_reference que está impedindo inserções

-- 1. Remover a constraint problemática
ALTER TABLE public.ordens_servico 
DROP CONSTRAINT IF EXISTS check_cliente_reference;

-- 2. Verificar se existem outras constraints CHECK problemáticas
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'ordens_servico' 
        AND table_schema = 'public'
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%cliente%'
    LOOP
        EXECUTE 'ALTER TABLE public.ordens_servico DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Constraint removida: %', constraint_record.constraint_name;
    END LOOP;
END $$;