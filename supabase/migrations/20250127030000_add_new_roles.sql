-- Migração para adicionar novas roles e sistema de permissões
-- Fase 1.1: Estrutura base para o sistema de roles hierárquico

-- 1. Atualizar a constraint de roles na tabela users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Adicionar as novas roles: atendente, gerente_adm, gerente_financeiro, supervisor_tecnico, diretor
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'user', 'technician', 'atendente', 'gerente_adm', 'gerente_financeiro', 'supervisor_tecnico', 'diretor'));

-- 2. Criar tabela de permissões
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- clientes, ordens_servico, pagamentos, etc.
    action VARCHAR(50) NOT NULL,   -- create, read, update, delete, manage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de relacionamento role-permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- 4. Inserir permissões básicas do sistema
INSERT INTO permissions (name, description, resource, action) VALUES
-- Permissões de Clientes
('clientes.create', 'Criar novos clientes', 'clientes', 'create'),
('clientes.read', 'Visualizar clientes', 'clientes', 'read'),
('clientes.update', 'Editar informações de clientes', 'clientes', 'update'),
('clientes.delete', 'Excluir clientes', 'clientes', 'delete'),
('clientes.manage', 'Gerenciar todos os aspectos de clientes', 'clientes', 'manage'),

-- Permissões de Ordens de Serviço
('ordens_servico.create', 'Criar novas ordens de serviço', 'ordens_servico', 'create'),
('ordens_servico.read', 'Visualizar ordens de serviço', 'ordens_servico', 'read'),
('ordens_servico.update', 'Editar ordens de serviço', 'ordens_servico', 'update'),
('ordens_servico.delete', 'Excluir ordens de serviço', 'ordens_servico', 'delete'),
('ordens_servico.assign_technician', 'Atribuir técnico à ordem de serviço', 'ordens_servico', 'assign_technician'),
('ordens_servico.change_status', 'Alterar status da ordem de serviço', 'ordens_servico', 'change_status'),
('ordens_servico.manage', 'Gerenciar todos os aspectos de ordens de serviço', 'ordens_servico', 'manage'),

-- Permissões de Pagamentos
('pagamentos.create', 'Criar registros de pagamento', 'pagamentos', 'create'),
('pagamentos.read', 'Visualizar pagamentos', 'pagamentos', 'read'),
('pagamentos.update', 'Editar informações de pagamento', 'pagamentos', 'update'),
('pagamentos.delete', 'Excluir registros de pagamento', 'pagamentos', 'delete'),
('pagamentos.approve', 'Aprovar pagamentos', 'pagamentos', 'approve'),
('pagamentos.manage', 'Gerenciar todos os aspectos de pagamentos', 'pagamentos', 'manage'),

-- Permissões de Relatórios
('relatorios.view_basic', 'Visualizar relatórios básicos', 'relatorios', 'view_basic'),
('relatorios.view_financial', 'Visualizar relatórios financeiros', 'relatorios', 'view_financial'),
('relatorios.view_technical', 'Visualizar relatórios técnicos', 'relatorios', 'view_technical'),
('relatorios.view_all', 'Visualizar todos os relatórios', 'relatorios', 'view_all'),
('relatorios.export', 'Exportar relatórios', 'relatorios', 'export'),

-- Permissões de Administração
('admin.users.create', 'Criar usuários', 'admin', 'users_create'),
('admin.users.read', 'Visualizar usuários', 'admin', 'users_read'),
('admin.users.update', 'Editar usuários', 'admin', 'users_update'),
('admin.users.delete', 'Excluir usuários', 'admin', 'users_delete'),
('admin.roles.manage', 'Gerenciar roles de usuários', 'admin', 'roles_manage'),
('admin.system.config', 'Configurar sistema', 'admin', 'system_config'),

-- Permissões de Peças
('pecas.create', 'Criar registros de peças', 'pecas', 'create'),
('pecas.read', 'Visualizar peças', 'pecas', 'read'),
('pecas.update', 'Editar informações de peças', 'pecas', 'update'),
('pecas.delete', 'Excluir registros de peças', 'pecas', 'delete'),
('pecas.manage', 'Gerenciar estoque de peças', 'pecas', 'manage');

-- 5. Configurar permissões por role
-- ATENDENTE: Foco em clientes e criação de OS
INSERT INTO role_permissions (role, permission_id) 
SELECT 'atendente', id FROM permissions WHERE name IN (
    'clientes.create', 'clientes.read', 'clientes.update',
    'ordens_servico.create', 'ordens_servico.read', 'ordens_servico.update',
    'relatorios.view_basic'
);

-- GERENTE_ADM: Gerenciamento administrativo completo
INSERT INTO role_permissions (role, permission_id) 
SELECT 'gerente_adm', id FROM permissions WHERE name IN (
    'clientes.manage',
    'ordens_servico.manage',
    'admin.users.create', 'admin.users.read', 'admin.users.update',
    'admin.roles.manage',
    'relatorios.view_all', 'relatorios.export',
    'pecas.read', 'pecas.update'
);

-- GERENTE_FINANCEIRO: Foco em aspectos financeiros
INSERT INTO role_permissions (role, permission_id) 
SELECT 'gerente_financeiro', id FROM permissions WHERE name IN (
    'clientes.read',
    'ordens_servico.read', 'ordens_servico.update',
    'pagamentos.manage',
    'relatorios.view_financial', 'relatorios.view_basic', 'relatorios.export'
);

-- SUPERVISOR_TECNICO: Gerenciamento técnico e operacional
INSERT INTO role_permissions (role, permission_id) 
SELECT 'supervisor_tecnico', id FROM permissions WHERE name IN (
    'clientes.read',
    'ordens_servico.manage',
    'ordens_servico.assign_technician', 'ordens_servico.change_status',
    'relatorios.view_technical', 'relatorios.view_basic',
    'pecas.manage'
);

-- TECHNICIAN: Foco em execução técnica e atualização de OS
INSERT INTO role_permissions (role, permission_id) 
SELECT 'technician', id FROM permissions WHERE name IN (
    'clientes.read',
    'ordens_servico.read', 'ordens_servico.update', 'ordens_servico.change_status',
    'pecas.read', 'pecas.update',
    'relatorios.view_basic'
);

-- DIRETOR: Acesso total ao sistema
INSERT INTO role_permissions (role, permission_id) 
SELECT 'diretor', id FROM permissions;

-- ADMIN: Manter acesso total (compatibilidade)
INSERT INTO role_permissions (role, permission_id) 
SELECT 'admin', id FROM permissions;

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para as tabelas de permissões
-- Apenas admins e diretores podem gerenciar permissões
CREATE POLICY "Admins and directors can manage permissions" ON permissions
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'diretor')
    );

CREATE POLICY "Admins and directors can manage role permissions" ON role_permissions
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'diretor')
    );

-- Todos os usuários autenticados podem ler suas próprias permissões
CREATE POLICY "Users can read their own permissions" ON role_permissions
    FOR SELECT USING (
        role = auth.jwt() ->> 'role'
    );

-- 8. Criar função para verificar permissões
CREATE OR REPLACE FUNCTION check_user_permission(
    user_role TEXT,
    required_permission TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = user_role 
        AND p.name = required_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar função para obter todas as permissões de uma role
CREATE OR REPLACE FUNCTION get_role_permissions(user_role TEXT)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.name, p.resource, p.action
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role = user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Atualizar trigger para updated_at nas novas tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Comentários para documentação
COMMENT ON TABLE permissions IS 'Tabela de permissões do sistema';
COMMENT ON TABLE role_permissions IS 'Relacionamento entre roles e permissões';
COMMENT ON FUNCTION check_user_permission IS 'Verifica se uma role possui uma permissão específica';
COMMENT ON FUNCTION get_role_permissions IS 'Retorna todas as permissões de uma role específica';