-- Script para configurar Row Level Security (RLS) no InterAlpha App
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Habilitar RLS em todas as tabelas principais
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordemServico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamento ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para a tabela 'users'
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = supabaseId);

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = supabaseId);

-- Permitir inserção de novos usuários (para registro)
CREATE POLICY "Enable insert for authenticated users" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = supabaseId);

-- 3. Políticas para a tabela 'clientes'
-- Usuários podem ver apenas clientes que eles criaram
CREATE POLICY "Users can view own clients" ON public.clientes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = clientes.createdBy 
            AND users.supabaseId = auth.uid()
        )
    );

-- Usuários podem inserir clientes
CREATE POLICY "Users can insert clients" ON public.clientes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = clientes.createdBy 
            AND users.supabaseId = auth.uid()
        )
    );

-- Usuários podem atualizar apenas clientes que eles criaram
CREATE POLICY "Users can update own clients" ON public.clientes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = clientes.createdBy 
            AND users.supabaseId = auth.uid()
        )
    );

-- Usuários podem deletar apenas clientes que eles criaram
CREATE POLICY "Users can delete own clients" ON public.clientes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = clientes.createdBy 
            AND users.supabaseId = auth.uid()
        )
    );

-- 4. Políticas para a tabela 'ordemServico'
-- Usuários podem ver apenas ordens de serviço que eles criaram
CREATE POLICY "Users can view own service orders" ON public.ordemServico
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = ordemServico.createdBy 
            AND users.supabaseId = auth.uid()
        )
    );

-- Usuários podem inserir ordens de serviço
CREATE POLICY "Users can insert service orders" ON public.ordemServico
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = ordemServico.createdBy 
            AND users.supabaseId = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.clientes 
            WHERE clientes.id = ordemServico.clienteId 
            AND EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = clientes.createdBy 
                AND users.supabaseId = auth.uid()
            )
        )
    );

-- Usuários podem atualizar apenas ordens de serviço que eles criaram
CREATE POLICY "Users can update own service orders" ON public.ordemServico
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = ordemServico.createdBy 
            AND users.supabaseId = auth.uid()
        )
    );

-- Usuários podem deletar apenas ordens de serviço que eles criaram
CREATE POLICY "Users can delete own service orders" ON public.ordemServico
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = ordemServico.createdBy 
            AND users.supabaseId = auth.uid()
        )
    );

-- 5. Políticas para a tabela 'pagamento'
-- Usuários podem ver apenas pagamentos relacionados às suas ordens de serviço
CREATE POLICY "Users can view own payments" ON public.pagamento
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ordemServico 
            JOIN public.users ON users.id = ordemServico.createdBy
            WHERE ordemServico.id = pagamento.ordemServicoId 
            AND users.supabaseId = auth.uid()
        )
    );

-- Usuários podem inserir pagamentos para suas ordens de serviço
CREATE POLICY "Users can insert payments for own orders" ON public.pagamento
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ordemServico 
            JOIN public.users ON users.id = ordemServico.createdBy
            WHERE ordemServico.id = pagamento.ordemServicoId 
            AND users.supabaseId = auth.uid()
        )
    );

-- Usuários podem atualizar apenas pagamentos de suas ordens de serviço
CREATE POLICY "Users can update own payments" ON public.pagamento
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.ordemServico 
            JOIN public.users ON users.id = ordemServico.createdBy
            WHERE ordemServico.id = pagamento.ordemServicoId 
            AND users.supabaseId = auth.uid()
        )
    );

-- Usuários podem deletar apenas pagamentos de suas ordens de serviço
CREATE POLICY "Users can delete own payments" ON public.pagamento
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.ordemServico 
            JOIN public.users ON users.id = ordemServico.createdBy
            WHERE ordemServico.id = pagamento.ordemServicoId 
            AND users.supabaseId = auth.uid()
        )
    );

-- 6. Função auxiliar para verificar se o usuário é proprietário de um cliente
CREATE OR REPLACE FUNCTION public.is_client_owner(client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.clientes 
        JOIN public.users ON users.id = clientes.createdBy
        WHERE clientes.id = client_id 
        AND users.supabaseId = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função auxiliar para verificar se o usuário é proprietário de uma ordem de serviço
CREATE OR REPLACE FUNCTION public.is_order_owner(order_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.ordemServico 
        JOIN public.users ON users.id = ordemServico.createdBy
        WHERE ordemServico.id = order_id 
        AND users.supabaseId = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clientes', 'ordemServico', 'pagamento')
ORDER BY tablename, policyname;

-- Comentários sobre a configuração:
-- 
-- 1. RLS está habilitado em todas as tabelas principais
-- 2. Cada usuário só pode acessar seus próprios dados
-- 3. Clientes só podem ser acessados por quem os criou
-- 4. Ordens de serviço só podem ser acessadas por quem as criou
-- 5. Pagamentos só podem ser acessados através das ordens de serviço do usuário
-- 6. Funções auxiliares facilitam a verificação de propriedade
-- 
-- Para aplicar este script:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá para SQL Editor
-- 3. Cole e execute este script
-- 4. Verifique se todas as políticas foram criadas sem erros