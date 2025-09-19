-- Migração para forçar cliente_id como opcional na tabela ordens_servico
-- Remove qualquer constraint NOT NULL que possa existir

-- Primeiro, remover a constraint check se existir
ALTER TABLE ordens_servico 
DROP CONSTRAINT IF EXISTS check_cliente_reference;

-- Forçar cliente_id como opcional
ALTER TABLE ordens_servico 
ALTER COLUMN cliente_id DROP NOT NULL;

-- Recriar a constraint para garantir que pelo menos um dos dois campos esteja preenchido
ALTER TABLE ordens_servico 
ADD CONSTRAINT check_cliente_reference 
CHECK (cliente_id IS NOT NULL OR cliente_portal_id IS NOT NULL);

-- Verificar se a alteração foi aplicada
DO $$
BEGIN
    -- Tentar inserir um registro de teste para verificar se funciona
    INSERT INTO ordens_servico (
        numero_os, 
        titulo, 
        descricao, 
        cliente_portal_id
    ) VALUES (
        'TEST-001', 
        'Teste', 
        'Teste de inserção sem cliente_id',
        (SELECT id FROM clientes_portal LIMIT 1)
    );
    
    -- Remover o registro de teste
    DELETE FROM ordens_servico WHERE numero_os = 'TEST-001';
    
    RAISE NOTICE 'Migração aplicada com sucesso - cliente_id agora é opcional';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro na migração: %', SQLERRM;
END $$;