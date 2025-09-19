-- Migração definitiva para resolver o problema do cliente_id
-- Esta migração força a remoção da constraint NOT NULL

-- 1. Remover constraint NOT NULL na coluna cliente_id
ALTER TABLE public.ordens_servico 
ALTER COLUMN cliente_id DROP NOT NULL;

-- 2. Recriar a constraint de foreign key permitindo NULL
ALTER TABLE public.ordens_servico 
DROP CONSTRAINT IF EXISTS ordens_servico_cliente_id_fkey;

ALTER TABLE public.ordens_servico 
ADD CONSTRAINT ordens_servico_cliente_id_fkey 
FOREIGN KEY (cliente_id) 
REFERENCES public.clientes(id) 
ON DELETE SET NULL;