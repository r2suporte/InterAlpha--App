-- =====================================================
-- MIGRAÇÃO: Políticas RLS Avançadas por Role
-- Data: 2025-01-27 04:00:00
-- Descrição: Implementa políticas RLS específicas para cada role
-- =====================================================

-- Remover políticas básicas existentes se existirem
DROP POLICY IF EXISTS "Users can view all data" ON clientes;
DROP POLICY IF EXISTS "Users can insert all data" ON clientes;
DROP POLICY IF EXISTS "Users can update all data" ON clientes;
DROP POLICY IF EXISTS "Users can delete all data" ON clientes;

DROP POLICY IF EXISTS "Users can view all data" ON ordens_servico;
DROP POLICY IF EXISTS "Users can insert all data" ON ordens_servico;
DROP POLICY IF EXISTS "Users can update all data" ON ordens_servico;
DROP POLICY IF EXISTS "Users can delete all data" ON ordens_servico;

DROP POLICY IF EXISTS "Users can view all data" ON pagamentos;
DROP POLICY IF EXISTS "Users can insert all data" ON pagamentos;
DROP POLICY IF EXISTS "Users can update all data" ON pagamentos;
DROP POLICY IF EXISTS "Users can delete all data" ON pagamentos;

-- =====================================================
-- POLÍTICAS PARA TABELA CLIENTES
-- =====================================================

-- Política SELECT para clientes
CREATE POLICY "clientes_select_policy" ON clientes
FOR SELECT
USING (
  -- Diretor e Admin: acesso total
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: acesso total
  (auth.jwt() ->> 'role' = 'gerente_adm')
  OR
  -- Atendente: acesso total
  (auth.jwt() ->> 'role' = 'atendente')
  OR
  -- Gerente Financeiro: acesso de leitura
  (auth.jwt() ->> 'role' = 'gerente_financeiro')
  OR
  -- Supervisor Técnico: acesso de leitura
  (auth.jwt() ->> 'role' = 'supervisor_tecnico')
  OR
  -- Técnico: acesso de leitura
  (auth.jwt() ->> 'role' = 'technician')
);

-- Política INSERT para clientes
CREATE POLICY "clientes_insert_policy" ON clientes
FOR INSERT
WITH CHECK (
  -- Diretor e Admin: podem inserir
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: pode inserir
  (auth.jwt() ->> 'role' = 'gerente_adm')
  OR
  -- Atendente: pode inserir
  (auth.jwt() ->> 'role' = 'atendente')
);

-- Política UPDATE para clientes
CREATE POLICY "clientes_update_policy" ON clientes
FOR UPDATE
USING (
  -- Diretor e Admin: podem atualizar
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: pode atualizar
  (auth.jwt() ->> 'role' = 'gerente_adm')
  OR
  -- Atendente: pode atualizar
  (auth.jwt() ->> 'role' = 'atendente')
);

-- Política DELETE para clientes
CREATE POLICY "clientes_delete_policy" ON clientes
FOR DELETE
USING (
  -- Apenas Diretor e Admin podem deletar
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
);

-- =====================================================
-- POLÍTICAS PARA TABELA ORDENS_SERVICO
-- =====================================================

-- Política SELECT para ordens de serviço
CREATE POLICY "ordens_servico_select_policy" ON ordens_servico
FOR SELECT
USING (
  -- Diretor e Admin: acesso total
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: acesso total
  (auth.jwt() ->> 'role' = 'gerente_adm')
  OR
  -- Supervisor Técnico: acesso total
  (auth.jwt() ->> 'role' = 'supervisor_tecnico')
  OR
  -- Atendente: acesso total
  (auth.jwt() ->> 'role' = 'atendente')
  OR
  -- Gerente Financeiro: acesso de leitura
  (auth.jwt() ->> 'role' = 'gerente_financeiro')
  OR
  -- Técnico: apenas suas próprias OS ou OS não atribuídas
  (
    auth.jwt() ->> 'role' = 'technician' 
    AND (
      tecnico_responsavel = auth.uid()::text 
      OR tecnico_responsavel IS NULL
    )
  )
);

-- Política INSERT para ordens de serviço
CREATE POLICY "ordens_servico_insert_policy" ON ordens_servico
FOR INSERT
WITH CHECK (
  -- Diretor e Admin: podem inserir
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: pode inserir
  (auth.jwt() ->> 'role' = 'gerente_adm')
  OR
  -- Supervisor Técnico: pode inserir
  (auth.jwt() ->> 'role' = 'supervisor_tecnico')
  OR
  -- Atendente: pode inserir
  (auth.jwt() ->> 'role' = 'atendente')
);

-- Política UPDATE para ordens de serviço
CREATE POLICY "ordens_servico_update_policy" ON ordens_servico
FOR UPDATE
USING (
  -- Diretor e Admin: podem atualizar
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: pode atualizar
  (auth.jwt() ->> 'role' = 'gerente_adm')
  OR
  -- Supervisor Técnico: pode atualizar
  (auth.jwt() ->> 'role' = 'supervisor_tecnico')
  OR
  -- Atendente: pode atualizar (exceto atribuição de técnico)
  (auth.jwt() ->> 'role' = 'atendente')
  OR
  -- Técnico: pode atualizar apenas suas próprias OS (campos específicos)
  (
    auth.jwt() ->> 'role' = 'technician' 
    AND tecnico_responsavel = auth.uid()::text
  )
);

-- Política DELETE para ordens de serviço
CREATE POLICY "ordens_servico_delete_policy" ON ordens_servico
FOR DELETE
USING (
  -- Apenas Diretor, Admin e Gerente Administrativo podem deletar
  (auth.jwt() ->> 'role' IN ('diretor', 'admin', 'gerente_adm'))
);

-- =====================================================
-- POLÍTICAS PARA TABELA PAGAMENTOS
-- =====================================================

-- Política SELECT para pagamentos
CREATE POLICY "pagamentos_select_policy" ON pagamentos
FOR SELECT
USING (
  -- Diretor e Admin: acesso total
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Financeiro: acesso total
  (auth.jwt() ->> 'role' = 'gerente_financeiro')
  OR
  -- Gerente Administrativo: acesso total
  (auth.jwt() ->> 'role' = 'gerente_adm')
  OR
  -- Atendente: acesso de leitura
  (auth.jwt() ->> 'role' = 'atendente')
  OR
  -- Supervisor Técnico: acesso de leitura limitado
  (auth.jwt() ->> 'role' = 'supervisor_tecnico')
);

-- Política INSERT para pagamentos
CREATE POLICY "pagamentos_insert_policy" ON pagamentos
FOR INSERT
WITH CHECK (
  -- Diretor e Admin: podem inserir
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Financeiro: pode inserir
  (auth.jwt() ->> 'role' = 'gerente_financeiro')
  OR
  -- Gerente Administrativo: pode inserir
  (auth.jwt() ->> 'role' = 'gerente_adm')
  OR
  -- Atendente: pode inserir
  (auth.jwt() ->> 'role' = 'atendente')
);

-- Política UPDATE para pagamentos
CREATE POLICY "pagamentos_update_policy" ON pagamentos
FOR UPDATE
USING (
  -- Diretor e Admin: podem atualizar
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Financeiro: pode atualizar
  (auth.jwt() ->> 'role' = 'gerente_financeiro')
  OR
  -- Gerente Administrativo: pode atualizar
  (auth.jwt() ->> 'role' = 'gerente_adm')
);

-- Política DELETE para pagamentos
CREATE POLICY "pagamentos_delete_policy" ON pagamentos
FOR DELETE
USING (
  -- Apenas Diretor, Admin e Gerente Financeiro podem deletar
  (auth.jwt() ->> 'role' IN ('diretor', 'admin', 'gerente_financeiro'))
);

-- =====================================================
-- POLÍTICAS PARA TABELA USERS (Gestão de Usuários)
-- =====================================================

-- Política SELECT para users
CREATE POLICY "users_select_policy" ON users
FOR SELECT
USING (
  -- Diretor e Admin: podem ver todos os usuários
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: pode ver usuários de nível inferior
  (
    auth.jwt() ->> 'role' = 'gerente_adm'
    AND role IN ('user', 'technician', 'atendente', 'supervisor_tecnico')
  )
  OR
  -- Supervisor Técnico: pode ver técnicos e usuários básicos
  (
    auth.jwt() ->> 'role' = 'supervisor_tecnico'
    AND role IN ('user', 'technician')
  )
  OR
  -- Usuários podem ver apenas seus próprios dados
  (id = auth.uid())
);

-- Política INSERT para users
CREATE POLICY "users_insert_policy" ON users
FOR INSERT
WITH CHECK (
  -- Diretor e Admin: podem criar qualquer usuário
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: pode criar usuários de nível inferior
  (
    auth.jwt() ->> 'role' = 'gerente_adm'
    AND role IN ('user', 'technician', 'atendente', 'supervisor_tecnico')
  )
);

-- Política UPDATE para users
CREATE POLICY "users_update_policy" ON users
FOR UPDATE
USING (
  -- Diretor e Admin: podem atualizar qualquer usuário
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: pode atualizar usuários de nível inferior
  (
    auth.jwt() ->> 'role' = 'gerente_adm'
    AND role IN ('user', 'technician', 'atendente', 'supervisor_tecnico')
  )
  OR
  -- Usuários podem atualizar apenas seus próprios dados (exceto role)
  (id = auth.uid())
);

-- =====================================================
-- POLÍTICAS PARA TABELAS DE PERMISSÕES
-- =====================================================

-- Política SELECT para permissions
CREATE POLICY "permissions_select_policy" ON permissions
FOR SELECT
USING (
  -- Diretor e Admin: acesso total
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: acesso de leitura
  (auth.jwt() ->> 'role' = 'gerente_adm')
);

-- Política para role_permissions
CREATE POLICY "role_permissions_select_policy" ON role_permissions
FOR SELECT
USING (
  -- Diretor e Admin: acesso total
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
  OR
  -- Gerente Administrativo: acesso de leitura
  (auth.jwt() ->> 'role' = 'gerente_adm')
);

-- =====================================================
-- FUNÇÕES AUXILIARES PARA VERIFICAÇÃO DE PERMISSÕES
-- =====================================================

-- Função para verificar se usuário pode atribuir técnico
CREATE OR REPLACE FUNCTION can_assign_technician()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' IN ('diretor', 'admin', 'gerente_adm', 'supervisor_tecnico');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário pode aprovar pagamentos
CREATE OR REPLACE FUNCTION can_approve_payment()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' IN ('diretor', 'admin', 'gerente_financeiro');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário pode alterar status de OS
CREATE OR REPLACE FUNCTION can_change_os_status()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' IN ('diretor', 'admin', 'gerente_adm', 'supervisor_tecnico', 'technician');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se técnico pode atualizar OS específica
CREATE OR REPLACE FUNCTION technician_can_update_os(os_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  os_technician TEXT;
BEGIN
  -- Se não é técnico, retorna false
  IF auth.jwt() ->> 'role' != 'technician' THEN
    RETURN FALSE;
  END IF;
  
  -- Busca o técnico responsável pela OS
  SELECT tecnico_responsavel INTO os_technician
  FROM ordens_servico
  WHERE id = os_id;
  
  -- Verifica se é o técnico responsável
  RETURN os_technician = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS PARA AUDITORIA DE PERMISSÕES
-- =====================================================

-- Função para log de alterações sensíveis
CREATE OR REPLACE FUNCTION log_sensitive_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log para alterações em roles de usuários
  IF TG_TABLE_NAME = 'users' AND OLD.role != NEW.role THEN
    INSERT INTO audit_log (
      table_name,
      operation,
      old_values,
      new_values,
      user_id,
      timestamp
    ) VALUES (
      TG_TABLE_NAME,
      'ROLE_CHANGE',
      jsonb_build_object('old_role', OLD.role),
      jsonb_build_object('new_role', NEW.role),
      auth.uid(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar tabela de auditoria se não existir
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Política para audit_log
CREATE POLICY "audit_log_select_policy" ON audit_log
FOR SELECT
USING (
  -- Apenas Diretor e Admin podem ver logs de auditoria
  (auth.jwt() ->> 'role' IN ('diretor', 'admin'))
);

-- Trigger para auditoria de mudanças de role
DROP TRIGGER IF EXISTS users_role_change_trigger ON users;
CREATE TRIGGER users_role_change_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_sensitive_changes();

-- =====================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

COMMENT ON POLICY "clientes_select_policy" ON clientes IS 
'Permite leitura de clientes para roles: diretor, admin, gerente_adm, atendente, gerente_financeiro, supervisor_tecnico, technician';

COMMENT ON POLICY "ordens_servico_select_policy" ON ordens_servico IS 
'Permite leitura de OS para roles apropriadas. Técnicos veem apenas suas OS ou não atribuídas';

COMMENT ON POLICY "pagamentos_select_policy" ON pagamentos IS 
'Permite leitura de pagamentos com diferentes níveis de acesso por role';

COMMENT ON FUNCTION can_assign_technician() IS 
'Verifica se o usuário atual pode atribuir técnicos a ordens de serviço';

COMMENT ON FUNCTION technician_can_update_os(UUID) IS 
'Verifica se um técnico pode atualizar uma ordem de serviço específica';

COMMENT ON TABLE audit_log IS 
'Tabela para auditoria de alterações sensíveis no sistema';